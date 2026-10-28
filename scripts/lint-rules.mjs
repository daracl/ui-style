// 저장소 규칙 점검 (yarn lint:rules, yarn test 에 포함)
// verify.mjs 가 "동작"을 검증한다면, 여기서는 이 라이브러리를 유지하기 위한 "규칙"을 검증한다.
//  1) src 에서 @import 를 쓰지 않는다 (@use / @forward 만 사용)
//  2) 클래스 기반 테마 선택자(body.dark, .dark, .dui-theme-*)를 쓰지 않는다 (data-daracl-theme + OS 설정만 지원)
//  3) src 안에서 접두사 없는 CSS 변수를 선언하지 않는다 (호스트 페이지와 충돌)
//  4) light 와 dark 가 같은 키를 가진다
//  5) hover / hover-accent / selected / active 는 배경(-bg)과 글자색(-color) 쌍이 모두 있다
//  6) 테마 키는 kebab-case 이다
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const errors = [];
const fail = (rule, detail) => errors.push(`[${rule}] ${detail}`);

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.scss')) out.push(p);
  }
  return out;
};

// 주석(// 와 /* */)을 제거해 코드만 검사한다. 문자열 안의 // 는 거의 없으므로 단순 처리한다.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const code = stripComments(readFileSync(file, 'utf8'));

  if (/^\s*@import\b/m.test(code)) fail('no-import', `${rel}: @import 대신 @use / @forward 를 사용하세요`);
  if (/body\.dark\b|[^\w-]\.dark\b(?![\w-])|dui-theme-/.test(code)) fail('no-class-theme', `${rel}: 클래스 기반 테마 선택자는 지원하지 않습니다 (data-daracl-theme 사용)`);

  // 선언 위치의 접두사 없는 custom property (보간 #{...} 으로 접두사를 붙이는 경우는 제외)
  for (const m of code.matchAll(/^\s*(--[a-z][a-z0-9-]*)\s*:/gm)) fail('no-unprefixed-var', `${rel}: ${m[1]} 선언 — 접두사(--dui- 등)를 붙이세요`);
}

// 테마 키 점검 (빌드된 theme-vars.css 기준)
const themeCssPath = join(root, 'dist/theme-vars.css');
if (!existsSync(themeCssPath)) {
  fail('build-required', 'dist/theme-vars.css 가 없습니다. 먼저 yarn build:css 를 실행하세요');
} else {
  const lines = readFileSync(themeCssPath, 'utf8').split('\n');
  const read = (start) => {
    const i = lines.findIndex((l) => l.startsWith(start));
    const keys = new Set();
    for (let j = i + 1; i >= 0 && j < lines.length && lines[j] !== '}'; j += 1) {
      const m = /^\s+--dui-([a-z0-9-]+):/.exec(lines[j]);
      if (m) keys.add(m[1]);
    }
    return keys;
  };
  const light = read(':root, [data-daracl-theme=light]');
  const dark = read('[data-daracl-theme=dark]');
  if (light.size === 0) fail('theme-keys', 'light 테마 블록을 찾지 못했습니다');

  for (const k of light) if (!dark.has(k)) fail('theme-parity', `--dui-${k}: dark 값이 없습니다`);
  for (const k of dark) if (!light.has(k)) fail('theme-parity', `--dui-${k}: light 값이 없습니다`);
  for (const k of light) if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(k)) fail('theme-key-name', `--dui-${k}: kebab-case 가 아닙니다`);

  for (const name of ['hover', 'hover-accent', 'selected', 'active']) {
    for (const part of ['bg', 'color']) {
      if (!light.has(`${name}-${part}`)) fail('pair', `--dui-${name}-${part}: 배경 / 글자색 쌍이 불완전합니다`);
    }
  }
}

if (errors.length) {
  console.error(`규칙 위반 ${errors.length}건\n${errors.map((e) => `  ✖ ${e}`).join('\n')}`);
  process.exit(1);
}
console.log('규칙 점검 통과 (no-import, no-class-theme, no-unprefixed-var, theme-parity, pair)');
