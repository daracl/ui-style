// ui-style 검증 스크립트 (yarn test = yarn build && node scripts/verify.mjs)
//  1) 빌드된 dist 산출물의 핵심 내용을 확인한다.
//  2) package.json exports 의 sass 경로가 실제로 존재하는지 확인한다.
//  3) node_modules/@daracl/ui-style 로 설치된 것처럼 `pkg:` 임포터로 공개 API 를 @use 해 컴파일한다.
//  4) Sass 경고(deprecation 포함)가 하나라도 있으면 실패한다.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as sass from 'sass';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const warnings = [];
const logger = {
  warn: (message) => warnings.push(`warn: ${message}`),
  debug: () => {},
};

let failed = 0;
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${name}${detail ? `\n       ${detail}` : ''}`);
  }
}

// ---- 1. exports 경로 ----
// 빌드 산출물(.css)은 아래 dist 단계에서 확인한다.
console.log('package exports');
for (const [key, target] of Object.entries(pkg.exports)) {
  if (key.endsWith('.css')) check(`${key} -> ${target}`, existsSync(join(root, target)));
}
for (const [key, target] of Object.entries(pkg.exports)) {
  const path = typeof target === 'string' ? target : target.sass;
  if (key.endsWith('.css')) continue; // 빌드 산출물은 아래에서 확인
  check(`${key} -> ${path}`, existsSync(join(root, path)));
}

// ---- 2. 산출물 ----
console.log('dist');
for (const file of ['dist/style.css', 'dist/theme-vars.css', 'dist/style.min.css', 'dist/theme-vars.min.css']) {
  check(file, existsSync(join(root, file)));
}
const css = readFileSync(join(root, 'dist/style.css'), 'utf8');
const themesCss = readFileSync(join(root, 'dist/theme-vars.css'), 'utf8');
check('light 변수가 :root 에 출력된다', /:root[^{]*\{[^}]*--dui-body-bg: #ffffff/s.test(css));
check('dark 변수가 [data-daracl-theme=dark] 에 출력된다', /\[data-daracl-theme=dark\][^{]*\{[^}]*--dui-body-bg: #1f2836/s.test(css));
// hover / selected / active 는 배경과 글자색이 항상 쌍으로 존재해야 한다.
for (const name of ['hover', 'hover-accent', 'selected', 'active']) {
  const bg = new RegExp(`--dui-${name}-bg:`, 'g');
  const color = new RegExp(`--dui-${name}-color:`, 'g');
  check(`${name} 쌍 토큰(bg/color)이 light·dark 모두 존재`, (css.match(bg) ?? []).length >= 2 && (css.match(color) ?? []).length >= 2);
}
check('font-disable-color 가 #ebebeb(grid 원본, 대비 부족)가 아니다', !/--dui-font-disable-color: #ebebeb/.test(css));
check('알림 상태색은 alert-* 로 분리', css.includes('--dui-alert-success-color: #0abf30') && css.includes('--dui-alert-error-color: #e24d4c') && !css.includes('--dui-success-color'));
check('prefers-color-scheme 대응', css.includes('prefers-color-scheme: dark'));
check('테마 클래스 선택자(.dui-theme-*)는 출력되지 않는다', !css.includes('theme-light') && !css.includes('theme-dark'));
check('keyframes 는 접두사가 붙는다', css.includes('@keyframes dui-fade-in') && !/@keyframes fadeIn/.test(css));
check('helpers 클래스가 출력된다', css.includes('.dui-hide'));
check('전역 요소 선택자를 출력하지 않는다', !/(^|\n)(\*|body|html)\s*[,{]/.test(css));
check('theme-vars.css 에는 클래스/키프레임이 없다', !themesCss.includes('@keyframes') && !themesCss.includes('.dui-hide'));

// ---- 3. 패키지로 설치된 것처럼 @use ----
console.log('public API (pkg: importer)');
const sandbox = mkdtempSync(join(tmpdir(), 'ui-style-verify-'));
try {
  mkdirSync(join(sandbox, 'node_modules/@daracl'), { recursive: true });
  symlinkSync(root, join(sandbox, 'node_modules/@daracl/ui-style'), 'junction');

  // Node 패키지 임포터는 `pkg:` 스킴이 필요하다. (Vite / webpack 은 접두사 없이 '@daracl/ui-style/...' 로 해석한다.)
  const compile = (source) =>
    sass.compileString(source.replaceAll("'@daracl/", "'pkg:@daracl/"), {
      importers: [new sass.NodePackageImporter(sandbox)],
      url: pathToFileURL(join(sandbox, 'entry.scss')),
      logger,
      silenceDeprecations: [],
    }).css;

  const abstracts = compile(`
    @use '@daracl/ui-style/abstracts' as style;
    .example {
      padding: style.$spacing-md;
      margin: style.space(lg);
      border-radius: style.radius(md);
      z-index: style.z(modal, 1);
      color: style.token(font-color);
      font-size: style.rem(14px);
      box-shadow: style.shadow(sm);
      @include style.flex-center;
      @include style.ellipsis;
      @include style.respond-below(md) { display: none; }
    }
    .ctrl { @include style.form-control; }
    .btn { @include style.form-button('drs'); }
    .prim { @include style.solid-variant(#0d6efd); }
    .t { @include style.transition((color, background-color), 0.1s); }
  `);
  check('abstracts: 변수/함수/믹스인', /padding: 12px/.test(abstracts) && /margin: 16px/.test(abstracts) && /border-radius: 4px/.test(abstracts) && /z-index: 10001/.test(abstracts));
  check('abstracts: token() 이 var() 로 변환', abstracts.includes('color: var(--dui-font-color)'));
  check('abstracts: rem() / respond-below()', abstracts.includes('font-size: 0.875rem') && abstracts.includes('max-width: 959.98px'));
  check('abstracts: 접두사 변경 form-button', abstracts.includes('var(--drs-button-hover-bg, #e3e3e3)'));
  check('abstracts: 가져오기만 해서는 CSS 가 나오지 않는다', compile(`@use '@daracl/ui-style/abstracts'; @use '@daracl/ui-style/tokens'; @use '@daracl/ui-style/themes'; @use '@daracl/ui-style/base'; @use '@daracl/ui-style/utilities';`).trim() === '');

  const tokens = compile(`@use '@daracl/ui-style/tokens' as tokens; .a { border-radius: tokens.$radius-md; color: tokens.$gray-600; }`);
  check('tokens', tokens.includes('border-radius: 4px') && tokens.includes('color: #686868'));

  const themes = compile(`
    @use '@daracl/ui-style/themes' as themes;
    .grid { @include themes.theme-vars(themes.get-theme(dark), $prefix: ''); }
    @include themes.define-themes('.daracl-grid');
  `);
  check('themes: 접두사 없는 호환 변수 출력', themes.includes('--border-color: #3a4456'));
  check('themes: 컴포넌트 스코프 선택자', themes.includes('[data-daracl-theme=dark] .daracl-grid') && themes.includes('.daracl-grid[data-daracl-theme=dark]'));

  const multi = compile(`
    @use '@daracl/ui-style/themes' as themes;
    @include themes.define-themes('.daracl-grid, .dg-hidden-layers', $auto-dark: true);
  `);
  const ruleSelectors = multi.split('\n').filter((line) => line.endsWith('{') && !line.startsWith(' ') && !line.startsWith('@'));
  check(
    'themes: 쉼표로 이어진 scope 를 항목별로 처리 (dark)',
    ruleSelectors.includes(
      '[data-daracl-theme=dark] .daracl-grid, .daracl-grid[data-daracl-theme=dark], [data-daracl-theme=dark] .dg-hidden-layers, .dg-hidden-layers[data-daracl-theme=dark] {'
    ),
    ruleSelectors.join('\n')
  );
  check(
    'themes: 기본 테마(light)는 항목 각각에 적용',
    ruleSelectors.includes(
      '.daracl-grid, [data-daracl-theme=light] .daracl-grid, .daracl-grid[data-daracl-theme=light], .dg-hidden-layers, [data-daracl-theme=light] .dg-hidden-layers, .dg-hidden-layers[data-daracl-theme=light] {'
    ),
    ruleSelectors.join('\n')
  );
  check(
    'themes: scope + OS 다크는 :where 로 특이도를 낮춰 명시 값이 이긴다',
    multi.includes(':where(:root:not([data-daracl-theme])) .daracl-grid, :where(:root:not([data-daracl-theme])) .dg-hidden-layers') &&
      multi.indexOf('prefers-color-scheme') < multi.indexOf('[data-daracl-theme=dark] .daracl-grid')
  );

  const custom = compile(`
    @use 'sass:map';
    @use '@daracl/ui-style/themes' as themes;
    $brand: map.merge(themes.get-theme(light), (primary-color: #ff00aa));
    @include themes.define-theme(brand, $themes: map.merge(themes.$themes, (brand: $brand)));
  `);
  check('themes: 사용자 정의 테마', custom.includes('--dui-primary-color: #ff00aa'));

  const themedOut = compile(`
    @use '@daracl/ui-style/themes' as themes;
    .a { border-color: themes.themed(border-color); box-shadow: themes.themed(shadow); }
    .b { color: themes.themed(font-color, $prefix: 'drs'); }
  `);
  check('themes: themed() 는 light 값을 fallback 으로 출력', themedOut.includes('border-color: var(--dui-border-color, #d9dde3)') && themedOut.includes('var(--dui-shadow, 0 2px 8px rgba(0, 0, 0, 0.15))') && themedOut.includes('var(--drs-font-color, #222222)'));

  const configured = compile(`
    @use '@daracl/ui-style/abstracts' as style with ($prefix: 'xyz');
    .a { color: style.token(font-color); }
  `);
  check('with ($prefix) 설정', configured.includes('var(--xyz-font-color)'));

  const root_ = compile(`
    @use '@daracl/ui-style' as ui;
    .a { padding: ui.$spacing-sm; @include ui.flex-center; }
    @include ui.base-keyframes;
    @include ui.util-helpers;
    @include ui.theme-define-themes;
  `);
  check('루트 진입점(@use "@daracl/ui-style")', root_.includes('padding: 8px') && root_.includes('@keyframes dui-spin') && root_.includes('.dui-ellipsis'));

  const base = compile(`
    @use '@daracl/ui-style/base' as base;
    .box { @include base.reset; @include base.root-typography; }
    .spin { @include base.spinner; }
    .fade { @include base.animate(fade-in); }
  `);
  check('base: reset / spinner / animate', base.includes('box-sizing: border-box') && base.includes('animation: dui-spin 1s infinite linear') && base.includes('dui-fade-in 0.3s'));

  // exports 를 읽지 못하는 도구(sass CLI --load-path=node_modules 등)에서도 루트 진입 파일로 풀려야 한다.
  const loadPathOut = sass.compileString(`@use '@daracl/ui-style/abstracts' as style; @use '@daracl/ui-style/themes' as themes; .a { padding: style.$spacing-md; color: themes.themed(font-color); }`, { loadPaths: [join(sandbox, 'node_modules')], logger }).css;
  check('load-path 방식(sass CLI)으로 @daracl/ui-style/* 해석', loadPathOut.includes('padding: 12px') && loadPathOut.includes('var(--dui-font-color, #222222)'));

  const fade = compile(`@use '@daracl/ui-style/base' as base; @include base.keyframes-fade('ddtp');`);
  check('base: keyframes-fade 는 fade 만 접두사와 함께 출력', fade.includes('@keyframes ddtp-fade-in') && fade.includes('@keyframes ddtp-fade-out') && !fade.includes('spin'));

  const util = compile(`
    @use '@daracl/ui-style/utilities' as util;
    .s { @include util.scrollbar; }
  `);
  check('utilities: scrollbar', util.includes('::-webkit-scrollbar-thumb') && util.includes('scrollbar-color'));
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}

// ---- 4. 경고 ----
console.log('sass warnings');
check('경고 없음', warnings.length === 0, warnings.join('\n'));

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
