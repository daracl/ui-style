// docs/guide.html 생성 스크립트 (yarn build:guide)
//  - 테마 토큰 값 : dist/theme-vars.css (빌드 결과)에서 읽는다.
//  - 디자인 토큰 : src/tokens/*.scss 에서 읽는다.
//  - API 목록 : 아래 API 배열이 소스(@mixin / @function)에 실제로 있는지 검증한다.
//  문서와 코드가 어긋나면 빌드가 실패하도록 해서 가이드가 낡지 않게 한다.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------------------
// 1. 테마 토큰 (dist/theme-vars.css)
// ---------------------------------------------------------------------------
const themeCssPath = join(root, 'dist/theme-vars.css');
if (!existsSync(themeCssPath)) throw new Error('dist/theme-vars.css 가 없습니다. 먼저 `yarn build:css` 를 실행하세요.');
const themeCss = readFileSync(themeCssPath, 'utf8');

const readBlock = (css, selectorStart) => {
  const lines = css.split('\n');
  const start = lines.findIndex((l) => l.startsWith(selectorStart));
  if (start < 0) throw new Error(`theme block not found: ${selectorStart}`);
  const map = new Map();
  for (let i = start + 1; i < lines.length && lines[i] !== '}'; i += 1) {
    const m = /^\s+--dui-([a-z0-9-]+):\s*(.+);$/.exec(lines[i]);
    if (m) map.set(m[1], m[2]);
  }
  return map;
};
const light = readBlock(themeCss, ':root, [data-daracl-theme=light]');
const dark = readBlock(themeCss, '[data-daracl-theme=dark]');

// 키 설명. 새 키가 추가됐는데 설명이 없으면 경고한다.
const DESC = {
  'font-color': '기본 글자색', 'label-color': '라벨 / 헤더 글자색 (기본보다 약간 연함)', 'font-hover-color': 'hover 시 글자색',
  'font-disable-color': '비활성 글자색', 'muted-color': '보조 설명 글자색',
  'border-color': '패널 / 표 / 탭의 기본 테두리', 'border-thick-color': '강조 테두리 (입력 요소 hover 등)', 'border-light-color': '연한 구분 테두리 (카드, 섹션)',
  'divider-color': '구분선',
  'body-bg': '기본 바탕 (패널, 팝업, 본문)', 'body-bg-thin': '한 단계 구분되는 바탕 (그룹, 줄무늬)', 'body-bg-deep': '두 단계 구분되는 바탕 (중첩 그룹)',
  'body-bg-hover': '바탕 hover', 'disabled-bg': '비활성 바탕', 'panel-header-bg': '패널 / 표 / 대화상자 헤더 바탕',
  'input-bg': '입력 요소 바탕', 'input-color': '입력 요소 글자색', 'input-border-color': '입력 요소 / 버튼 테두리', 'input-border-hover-color': '입력 요소 hover / focus 테두리',
  'input-disabled-bg': '비활성 입력 바탕',
  'button-bg': '버튼 바탕', 'button-border-color': '버튼 테두리 (에디터 계열)', 'button-hover-bg': '버튼 hover 바탕', 'button-bg-active': '버튼 눌림 바탕',
  'tab-bg': '탭 바탕', 'tab-bg-hover': '탭 hover 바탕', 'tooltip-bg': '툴팁 바탕', 'tooltip-color': '툴팁 글자색',
  'hover-bg': '목록 / 셀 hover 바탕 (중립)', 'hover-color': 'hover-bg 위의 글자색', 'hover-accent-bg': 'hover 바탕 (파란 강조)', 'hover-accent-color': 'hover-accent-bg 위의 글자색',
  'selected-bg': '선택 바탕', 'selected-color': 'selected-bg 위의 글자색', 'active-bg': '눌림 / 활성 바탕 (페이지네이션 등)', 'active-color': 'active-bg 위의 글자색',
  'selected-border-color': '선택 셀 테두리', 'item-check-color': '체크된 항목 / 링크 강조색', 'search-match-color': '검색 일치 글자색', 'accent-text-color': '강조 글자색 (추가 항목 등)',
  'today-bg': '오늘 날짜 바탕', 'sunday-color': '일요일 글자색',
  'primary-color': '브랜드 색', 'primary-hover-color': '브랜드 색 hover', 'primary-font-color': 'primary 바탕 위의 글자색', 'primary-soft-bg': '브랜드 색의 연한 바탕',
  'danger-color': '위험 동작의 채움 색 (삭제 버튼 등)',
  'error-color': '오류 글자색', 'error-bg': '오류 바탕', 'error-border-color': '오류 테두리', 'required-color': '필수 표시 색',
  'invalid-font-color': '유효성 오류 글자색', 'invalid-border-color': '유효성 오류 테두리', 'invalid-bg': '유효성 오류 바탕',
  'alert-success-color': '알림 성공', 'alert-error-color': '알림 오류', 'alert-warning-color': '알림 경고', 'alert-info-color': '알림 정보',
  'check-bg': '체크 / 스위치 꺼짐 바탕', 'check-active-bg': '체크 / 스위치 켜짐 바탕', 'check-mark-color': '체크 표시 색', 'check-indeterminate-bg': '중간 상태 표시 색',
  'scroll-bg': '스크롤 영역 바탕', 'scroll-track-bg': '스크롤 트랙', 'scroll-thumb-bg': '스크롤 막대', 'scroll-thumb-hover-bg': '스크롤 막대 hover', 'scroll-button-bg': '스크롤 버튼',
  'icon-stroke-color': '아이콘 선 색 (바탕 없음)', 'icon-fill-stroke-color': '아이콘 선 색 (채워진 바탕 위)', 'icon-stroke-on-color': '색 버튼 위 아이콘 선', 'icon-fill-stroke-on-color': '색 버튼 위 아이콘 채움',
  'empty-icon-color': '빈 상태 아이콘',
  'overlay-bg': '모달 오버레이', shadow: '일반 그림자', 'page-shadow': '페이지 / 카드 그림자',
  'bar-positive-bg': '막대 차트 양수', 'bar-negative-bg': '막대 차트 음수',
};

const GROUPS = [
  ['글자', ['font-color', 'label-color', 'font-hover-color', 'font-disable-color', 'muted-color']],
  ['테두리 · 구분선', ['border-color', 'border-thick-color', 'border-light-color', 'divider-color']],
  ['배경', ['body-bg', 'body-bg-thin', 'body-bg-deep', 'body-bg-hover', 'disabled-bg', 'panel-header-bg']],
  ['입력 요소', ['input-bg', 'input-color', 'input-border-color', 'input-border-hover-color', 'input-disabled-bg']],
  ['버튼 · 탭 · 툴팁', ['button-bg', 'button-border-color', 'button-hover-bg', 'button-bg-active', 'tab-bg', 'tab-bg-hover', 'tooltip-bg', 'tooltip-color']],
  ['선택 · 강조 보조', ['selected-border-color', 'item-check-color', 'search-match-color', 'accent-text-color', 'today-bg', 'sunday-color']],
  ['브랜드', ['primary-color', 'primary-hover-color', 'primary-font-color', 'primary-soft-bg', 'danger-color']],
  ['오류 · 검증', ['error-color', 'error-bg', 'error-border-color', 'required-color', 'invalid-font-color', 'invalid-border-color', 'invalid-bg']],
  ['알림 상태', ['alert-success-color', 'alert-error-color', 'alert-warning-color', 'alert-info-color']],
  ['체크 · 스위치', ['check-bg', 'check-active-bg', 'check-mark-color', 'check-indeterminate-bg']],
  ['스크롤', ['scroll-bg', 'scroll-track-bg', 'scroll-thumb-bg', 'scroll-thumb-hover-bg', 'scroll-button-bg']],
  ['아이콘', ['icon-stroke-color', 'icon-fill-stroke-color', 'icon-stroke-on-color', 'icon-fill-stroke-on-color', 'empty-icon-color']],
  ['오버레이 · 그림자', ['overlay-bg', 'shadow', 'page-shadow']],
  ['차트 · 막대', ['bar-positive-bg', 'bar-negative-bg']],
];
const PAIRS = [
  ['hover', 'hover-bg', 'hover-color'],
  ['hover-accent', 'hover-accent-bg', 'hover-accent-color'],
  ['selected', 'selected-bg', 'selected-color'],
  ['active', 'active-bg', 'active-color'],
];

const grouped = new Set([...GROUPS.flatMap(([, k]) => k), ...PAIRS.flatMap(([, a, b]) => [a, b])]);
const ungrouped = [...light.keys()].filter((k) => !grouped.has(k));
const missingDark = [...light.keys()].filter((k) => !dark.has(k));
const missingDesc = [...light.keys()].filter((k) => !(k in DESC));
const unknownInGroups = [...grouped].filter((k) => !light.has(k));
if (unknownInGroups.length) throw new Error(`가이드 그룹에 있지만 테마에 없는 키: ${unknownInGroups.join(', ')}`);
if (ungrouped.length) throw new Error(`가이드 그룹에 없는 테마 키: ${ungrouped.join(', ')} (scripts/build-guide.mjs 의 GROUPS 에 추가하세요)`);
if (missingDesc.length) console.warn(`[guide] 설명이 없는 테마 키: ${missingDesc.join(', ')}`);
if (missingDark.length) console.warn(`[guide] dark 값이 없는 키: ${missingDark.join(', ')}`);

const isColor = (v) => /^(#|rgb|hsl|transparent)/i.test(v.trim());
const swatch = (v) => (isColor(v) ? `<span class="sw" style="background:${esc(v)}"></span>` : /\d+px/.test(v) && /rgba?\(/.test(v) ? `<span class="sw sh" style="box-shadow:${esc(v)}"></span>` : '');
const themeRow = (k) =>
  `<tr><td><code>--dui-${k}</code><div class="d">${esc(DESC[k] ?? '')}</div></td>` +
  `<td><div class="v">${swatch(light.get(k) ?? '')}<code>${esc(light.get(k) ?? '-')}</code></div></td>` +
  `<td><div class="v">${swatch(dark.get(k) ?? '')}<code>${esc(dark.get(k) ?? '-')}</code></div></td></tr>`;

const themeTables = GROUPS.map(([title, keys]) => `<h4>${esc(title)}</h4><div class="tw"><table class="tt"><thead><tr><th>변수</th><th>light</th><th>dark</th></tr></thead><tbody>${keys.map(themeRow).join('')}</tbody></table></div>`).join('\n');
const pairCards = PAIRS.map(
  ([name, bg, fg]) =>
    `<div class="pair"><div class="chip" style="background:var(--dui-${bg});color:var(--dui-${fg})">${esc(name)} · 가나다 ABC 123</div>` +
    `<div class="d"><code>${bg}</code> + <code>${fg}</code><br>${esc(DESC[bg])}</div></div>`
).join('\n');

// ---------------------------------------------------------------------------
// 2. 디자인 토큰 (src/tokens/*.scss)
// ---------------------------------------------------------------------------
const tokenFiles = readdirSync(join(root, 'src/tokens')).filter((f) => f.startsWith('_') && f !== '_index.scss');
const tokens = {};
for (const f of tokenFiles) {
  const name = f.replace(/^_|\.scss$/g, '');
  const rows = [];
  for (const line of readFileSync(join(root, 'src/tokens', f), 'utf8').split('\n')) {
    const m = /^\$([a-z0-9-]+):\s*(.+?)\s*(?:!default)?;\s*(?:\/\/\s*(.*))?$/.exec(line);
    if (m && !m[2].startsWith('(')) rows.push({ name: m[1], value: m[2].replace(/\s*!default$/, ''), note: m[3] ?? '' });
  }
  tokens[name] = rows;
}
const tokenTable = (rows, visual) =>
  `<div class="tw"><table class="tt"><thead><tr><th>SCSS 변수</th><th>값</th>${visual ? '<th>미리보기</th>' : ''}<th>출처 / 용도</th></tr></thead><tbody>${rows
    .map((r) => `<tr><td><code>$${esc(r.name)}</code></td><td><code>${esc(r.value)}</code></td>${visual ? `<td>${visual(r)}</td>` : ''}<td class="d">${esc(r.note)}</td></tr>`)
    .join('')}</tbody></table></div>`;

const px = (v) => (/^-?[\d.]+px$/.test(v) ? v : null);
const colorTokens = tokens.colors.filter((r) => isColor(r.value));

const tokenSections = [
  ['colors', '색상 팔레트', '원시 색상 값입니다. 컴포넌트에서는 가능하면 위의 테마 변수(<code>themed()</code>)를 쓰고, 팔레트는 테마를 정의하거나 테마와 무관한 고정 색이 필요할 때만 씁니다.', (r) => (isColor(r.value) ? swatch(r.value) : ''), colorTokens.length ? tokens.colors : tokens.colors],
  ['spacing', '간격', '4px 단위 스케일. <code>style.space(md)</code> 함수로도 조회할 수 있습니다.', (r) => (px(r.value) ? `<span class="bar" style="width:${r.value}"></span>` : ''), tokens.spacing],
  ['typography', '타이포그래피', '', (r) => (px(r.value) && r.name.startsWith('font-size') ? `<span style="font-size:${r.value}">가나다 Abc</span>` : ''), tokens.typography],
  ['borders', '테두리 · 모서리', '', (r) => (/radius/.test(r.name) ? `<span class="rad" style="border-radius:${r.value}"></span>` : ''), tokens.borders],
  ['shadows', '그림자', '', (r) => `<span class="sw sh" style="box-shadow:${esc(r.value)}"></span>`, tokens.shadows],
  ['z-index', 'z-index 레이어', '값이 같은 기존 숫자(1 / 10 / 100 / 1000 / 10000)를 의미 단위로 정리했습니다. <code>style.z(modal)</code> 로도 조회합니다.', null, tokens['z-index']],
  ['sizes', '크기', '', null, tokens.sizes],
  ['motion', '모션', '', null, tokens.motion],
]
  .map(([id, title, desc, visual, rows]) => `<h4 id="tok-${id}">${esc(title)}</h4>${desc ? `<p>${desc}</p>` : ''}${tokenTable(rows, visual)}`)
  .join('\n');

// ---------------------------------------------------------------------------
// 3. API 레퍼런스 (소스에 실제로 존재하는지 검증)
// ---------------------------------------------------------------------------
// [모듈 폴더, 종류, 이름, 시그니처, 설명]
const API = [
  ['abstracts', 'function', 'space', 'space($key)', '간격 토큰 조회. <code>space(md)</code> → 12px'],
  ['abstracts', 'function', 'radius', 'radius($key)', '모서리 토큰 조회. <code>radius(md)</code> → 4px'],
  ['abstracts', 'function', 'shadow', 'shadow($key)', '그림자 토큰 조회'],
  ['abstracts', 'function', 'font-size', 'font-size($key)', '글자 크기 토큰 조회'],
  ['abstracts', 'function', 'z', 'z($layer, $offset: 0)', 'z-index 조회. <code>z(modal, 1)</code> → 10001'],
  ['abstracts', 'function', 'token', 'token($name, $fallback: null, $prefix)', '테마 변수 참조 <code>var(--dui-…)</code>. fallback 이 없으므로 컴포넌트에는 <code>themed()</code> 를 권장'],
  ['abstracts', 'function', 'css-var-name', 'css-var-name($name, $prefix)', '<code>--dui-border-color</code> 같은 변수 이름 생성'],
  ['abstracts', 'function', 'rem', 'rem($px, $base: 16px)', 'px → rem'],
  ['abstracts', 'function', 'strip-unit', 'strip-unit($number)', '단위 제거'],
  ['abstracts', 'function', 'breakpoint', 'breakpoint($name)', '브레이크포인트 값 (sm 720 / md 960 / lg 1280)'],
  ['abstracts', 'mixin', 'respond-above', 'respond-above($name)', '지정 너비 이상 미디어쿼리'],
  ['abstracts', 'mixin', 'respond-below', 'respond-below($name)', '지정 너비 미만 미디어쿼리'],
  ['abstracts', 'mixin', 'flex-center', 'flex-center($inline: false)', '가운데 정렬 flex'],
  ['abstracts', 'mixin', 'flex-between', 'flex-between', '양끝 정렬 flex'],
  ['abstracts', 'mixin', 'flex-column', 'flex-column', '세로 flex'],
  ['abstracts', 'mixin', 'absolute-fill', 'absolute-fill', '부모를 가득 채우는 absolute'],
  ['abstracts', 'mixin', 'ellipsis', 'ellipsis', '한 줄 말줄임 (flex 자식에서도 동작하도록 min-width: 0 포함)'],
  ['abstracts', 'mixin', 'line-clamp', 'line-clamp($lines: 2)', '여러 줄 말줄임'],
  ['abstracts', 'mixin', 'user-select', 'user-select($value: none)', '텍스트 선택 제어 (vendor prefix 포함)'],
  ['abstracts', 'mixin', 'reduced-motion', 'reduced-motion { … }', '<code>prefers-reduced-motion: reduce</code> 에서만 적용'],
  ['abstracts', 'mixin', 'coarse-pointer', 'coarse-pointer { … }', '터치 환경에서만 적용'],
  ['abstracts', 'mixin', 'transition', 'transition($properties, $duration, $easing)', 'transition + reduced-motion 대응'],
  ['abstracts', 'mixin', 'form-control', 'form-control($prefix: dui)', '입력 요소 공통 모양 (높이 28px, 테두리, hover / focus / disabled). 색은 <code>themed()</code> 로 연결'],
  ['abstracts', 'mixin', 'form-button', 'form-button($prefix: dui)', 'form-control 기반 버튼'],
  ['abstracts', 'mixin', 'solid-variant', 'solid-variant($background, $color, $icon-stroke, $icon-fill-stroke)', '색이 채워진 버튼 변형. 하위 요소의 글자색과 아이콘 변수까지 함께 지정'],
  ['themes', 'function', 'themed', 'themed($name, $prefix: dui, $themes)', '<b>컴포넌트 CSS 용.</b> <code>var(--dui-name, light값)</code> 을 만든다. 단독 사용 시에도 light 로 표시됨'],
  ['themes', 'function', 'get-theme', 'get-theme($name, $themes)', '테마 맵 조회 (light / dark)'],
  ['themes', 'function', 'scope-list', 'scope-list($scope)', "쉼표로 이어진 선택자 문자열을 항목별 목록으로 분리"],
  ['themes', 'mixin', 'theme-vars', 'theme-vars($map, $prefix: dui)', '맵의 모든 키를 CSS 변수로 출력. <code>$prefix: \'\'</code> 이면 접두사 없는 변수'],
  ['themes', 'mixin', 'theme', 'theme($name, $prefix, $themes)', '이름으로 테마 변수를 출력 (그리드별 테마처럼 한 요소에 직접 지정할 때)'],
  ['themes', 'mixin', 'define-theme', 'define-theme($name, $default, $scope, $prefix, $themes)', '한 테마를 <code>[data-daracl-theme]</code> 선택자와 함께 출력'],
  ['themes', 'mixin', 'define-themes', 'define-themes($scope, $default, $auto-dark, $prefix, $themes)', '등록된 모든 테마 출력. <code>$scope</code> 가 쉼표 목록이어도 항목별로 처리. <code>$auto-dark</code> 는 OS 설정 대응'],
  ['base', 'mixin', 'reset', 'reset', '컴포넌트 범위의 box-sizing / border-spacing 초기화'],
  ['base', 'mixin', 'root-typography', 'root-typography($prefix, $size)', '루트 글꼴 / 글자색'],
  ['base', 'mixin', 'keyframes-fade', 'keyframes-fade($prefix: dui)', '<code>@keyframes {prefix}-fade-in / -fade-out</code> 만 출력'],
  ['base', 'mixin', 'keyframes', 'keyframes($prefix: dui)', 'fade-in / fade-out / spin / slide-out-right 모두 출력'],
  ['base', 'mixin', 'animate', 'animate($name, $duration, $easing, $fill, $prefix)', 'animation 속성 헬퍼 (reduced-motion 대응)'],
  ['base', 'mixin', 'spinner', 'spinner($size: 21px, $color, $thickness, $prefix)', '원형 스피너 (먼저 keyframes 출력 필요)'],
  ['utilities', 'mixin', 'scrollbar', 'scrollbar($size, $prefix, $radius)', '네이티브 스크롤바 스타일 (scroll-* 테마 변수 사용)'],
  ['utilities', 'mixin', 'scrollbar-hidden', 'scrollbar-hidden', '스크롤바 숨김'],
  ['utilities', 'mixin', 'helpers', 'helpers($prefix: dui)', '<code>.dui-hide / -show / -ellipsis / -noselect …</code> 유틸리티 클래스 출력'],
  ['utilities', 'mixin', 'variants', 'variants($prefix: dui)', '<code>.dui-primary / -success / -danger …</code> 색 버튼 클래스 출력'],
];

const srcOf = (mod) =>
  readdirSync(join(root, 'src', mod))
    .filter((f) => f.endsWith('.scss'))
    .map((f) => readFileSync(join(root, 'src', mod, f), 'utf8'))
    .join('\n');
const srcCache = {};
const missingApi = [];
for (const [mod, kind, name] of API) {
  srcCache[mod] ??= srcOf(mod);
  const re = new RegExp(`@${kind}\\s+${name.replace(/[-]/g, '\\-')}\\b`);
  if (!re.test(srcCache[mod])) missingApi.push(`${mod}: @${kind} ${name}`);
}
if (missingApi.length) throw new Error(`가이드에 있지만 소스에 없는 API: ${missingApi.join(', ')}`);

// 소스에는 있지만 가이드에 없는 공개 API 는 경고한다. (밑줄로 시작하는 내부 함수는 제외)
const documented = new Set(API.map(([m, k, n]) => `${m}:${k}:${n}`));
const undocumented = [];
for (const mod of ['abstracts', 'themes', 'base', 'utilities']) {
  srcCache[mod] ??= srcOf(mod);
  for (const m of srcCache[mod].matchAll(/@(mixin|function)\s+([a-z][a-z0-9-]*)/g)) {
    if (!documented.has(`${mod}:${m[1]}:${m[2]}`) && m[2] !== 'keyframe-name') undocumented.push(`${mod}:${m[1]}:${m[2]}`);
  }
}
if (undocumented.length) console.warn(`[guide] 가이드에 없는 공개 API: ${[...new Set(undocumented)].join(', ')}`);

const MODS = { abstracts: '@daracl/ui-style/abstracts', themes: '@daracl/ui-style/themes', base: '@daracl/ui-style/base', utilities: '@daracl/ui-style/utilities' };
const apiSections = Object.keys(MODS)
  .map((mod) => {
    const rows = API.filter(([m]) => m === mod);
    return (
      `<h4 id="api-${mod}">${esc(MODS[mod])}</h4><div class="tw"><table class="tt"><thead><tr><th>이름</th><th>설명</th></tr></thead><tbody>` +
      rows.map(([, kind, , sig, desc]) => `<tr><td><span class="tag ${kind}">${kind === 'mixin' ? '@mixin' : '@function'}</span><code>${esc(sig)}</code></td><td class="d">${desc}</td></tr>`).join('') +
      '</tbody></table></div>'
    );
  })
  .join('\n');

// ---------------------------------------------------------------------------
// 4. 프로젝트 적용 현황 / 이름 매핑 (손으로 관리하는 표)
// ---------------------------------------------------------------------------
const PROJECTS = [
  ['ui-grid', 'dg', '공통 색상은 <code>--dui-*</code>, 헤더 그라데이션 / 요약 행 / 행 배경 등은 <code>--dg-*</code>. 그리드별 <code>dg-dark</code> 클래스 동작 유지', '막대 차트 색 읽는 변수가 <code>--dui-bar-*</code> 로 변경 (JS)'],
  ['ui-form', 'df', '컨트롤 / 테두리 / 탭 / 필드 색. 간격 / 글꼴 크기는 <code>--df-*</code>', '<code>body.dark</code> / <code>.dark</code> 클래스 방식 제거'],
  ['ui-components', 'dstud / dga / dkp', '영역별 전용 값만 <code>--d*-*</code>. 영역별 <code>data-theme</code> 유지', '<code>build:css</code> 는 <code>--load-path=node_modules</code> 필요'],
  ['ui-report-studio', 'drs', '캔버스 / 항목 / 작업 영역 전용 값만 <code>--drs-*</code>', '다른 패키지의 dist css 를 포함하므로 grid / components 재빌드 후 확인'],
  ['ui-role-builder', 'dqu', 'AND / OR 색은 <code>--dqu-condition-*</code>', ''],
  ['ui-tree', '-', '글자 / 배경 / hover / 선택 색', 'hover 는 <code>hover-accent-*</code>, 선택은 <code>selected-*</code> 쌍'],
  ['ui-multiSelect', '-', '글자 / 배경 / 테두리 / 버튼 / 페이지네이션', '페이지네이션 hover 글자색 대비 개선'],
  ['ui-datetimepicker', 'ddtp', '선택한 날짜 색만 <code>--ddtp-select-bg</code>', 'keyframes <code>ddtp-fade-in / -out</code>'],
  ['ui-dialog', '-', '글자 / 배경 / 헤더 / 테두리', 'keyframes <code>ddlg-fade-*</code>. 색 버튼(variant)은 고정 색 유지'],
  ['ui-toast', '-', 'z-index 토큰만 (알림 색은 상태별 고정 색)', ''],
  ['ui-loading', '-', '해당 없음 (SCSS 없음)', ''],
];
const projectRows = PROJECTS.map(([n, p, a, note]) => `<tr><td><code>${n}</code></td><td>${p === '-' ? '-' : `<code>${p}</code>`}</td><td class="d">${a}</td><td class="d">${note}</td></tr>`).join('');

const RENAMES = [
  ['button-bg-hover', 'button-hover-bg'], ['item-selected / cell-bg-selection', 'selected-bg'], ['cell-selection-border', 'selected-border-color'],
  ['cell-bg-hover', 'hover-bg  (ui-grid 안에서는 --dg-cell-bg-hover 별칭을 거침)'], ['bg / panel-bg', 'body-bg'], ['disabled-color', 'font-disable-color'],
  ['body-color / btn-color', 'font-color'], ['btn-bg-hover', 'button-hover-bg'], ['color-danger', 'error-color'], ['invalid-background-color', 'invalid-bg'],
  ['tooltip-background', 'tooltip-bg'], ['bg-grid-header', 'panel-header-bg'], ['icon-color', 'icon-stroke-color'], ['item-hover-bg-color / item-focus-bg-color', 'hover-accent-bg'],
  ['item-select-bg-color / item-open-active-bg-color', 'selected-bg'], ['body-active-bg / body-active-color', 'active-bg / active-color'], ['item-search-font-color', 'search-match-color'],
  ['add-item-color', 'accent-text-color'], ['--bar-positive-bg / --bar-negative-bg', '--dui-bar-positive-bg / --dui-bar-negative-bg'],
  ['status 색 (--success / --error / --warning / --info)', 'alert-success-color / alert-error-color / alert-warning-color / alert-info-color'],
];
const renameRows = RENAMES.map(([a, b]) => `<tr><td><code>${esc(a)}</code></td><td><code>${esc(b)}</code></td></tr>`).join('');

// ---------------------------------------------------------------------------
// 5. HTML
// ---------------------------------------------------------------------------
const code = (lang, src) => `<div class="code"><button class="copy" type="button" aria-label="복사">복사</button><pre><code class="lang-${lang}">${esc(src.trim())}</code></pre></div>`;

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@daracl/ui-style 가이드</title>
<meta name="description" content="Daracl UI 공통 SCSS 라이브러리 사용 가이드: 테마 변수, 디자인 토큰, API, 컴포넌트 작성 규칙">
<style>
/* 이 페이지 자체도 ui-style 의 테마 변수(--dui-*)로 스타일링한다. (dist/theme-vars.css 를 그대로 포함) */
${themeCss}
:root{color-scheme:light dark;--g-font:-apple-system,'Segoe UI','Malgun Gothic',sans-serif;--g-mono:Consolas,'D2Coding',monospace}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:16px}
body{margin:0;background:var(--dui-body-bg);color:var(--dui-font-color);font:14px/1.65 var(--g-font)}
a{color:var(--dui-primary-color)}
code,pre{font-family:var(--g-mono);font-size:12.5px}
:not(pre)>code{background:var(--dui-body-bg-thin);border:1px solid var(--dui-border-light-color);border-radius:4px;padding:0 5px}
.layout{display:flex;min-height:100vh}
nav.side{position:sticky;top:0;align-self:flex-start;width:240px;flex:none;height:100vh;overflow:auto;padding:20px 14px;border-right:1px solid var(--dui-border-color);background:var(--dui-panel-header-bg)}
nav.side .brand{font-weight:700;font-size:15px;margin:0 6px 2px}
nav.side .ver{color:var(--dui-muted-color);font-size:12px;margin:0 6px 14px}
nav.side a{display:block;padding:5px 8px;border-radius:4px;color:var(--dui-label-color);text-decoration:none}
nav.side a:hover{background:var(--dui-hover-bg);color:var(--dui-hover-color)}
nav.side a.sub{padding-left:20px;font-size:13px;color:var(--dui-muted-color)}
nav.side a.active{background:var(--dui-selected-bg);color:var(--dui-selected-color);font-weight:600}
main{flex:1;min-width:0;max-width:1040px;padding:28px 36px 80px}
h1{font-size:28px;margin:0 0 6px}
h2{font-size:21px;margin:48px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--dui-border-color)}
h3{font-size:16px;margin:28px 0 8px}
h4{font-size:14px;margin:22px 0 6px;color:var(--dui-label-color)}
p{margin:8px 0}
.lead{color:var(--dui-label-color);font-size:15px}
.d{color:var(--dui-muted-color);font-size:12.5px}
ul{padding-left:20px}li{margin:3px 0}
.tw{overflow-x:auto;border:1px solid var(--dui-border-color);border-radius:6px;margin:8px 0 16px}
table{border-collapse:collapse;width:100%}
th,td{padding:7px 12px;text-align:left;vertical-align:top;border-bottom:1px solid var(--dui-border-light-color)}
th{background:var(--dui-panel-header-bg);color:var(--dui-label-color);font-weight:600;font-size:12.5px;white-space:nowrap}
tr:last-child td{border-bottom:0}
.tt td:first-child{white-space:nowrap}
.v{display:flex;align-items:center;gap:8px;min-height:22px}
.sw{display:inline-block;width:22px;height:22px;border-radius:4px;border:1px solid var(--dui-border-color);flex:none}
.sw.sh{border:0;background:var(--dui-body-bg)}
.bar{display:inline-block;height:10px;background:var(--dui-primary-color);border-radius:2px}
.rad{display:inline-block;width:30px;height:22px;border:2px solid var(--dui-primary-color)}
.tag{display:inline-block;margin-right:8px;padding:0 6px;border-radius:10px;font-size:11px;font-weight:600;color:var(--dui-primary-font-color)}
.tag.mixin{background:var(--dui-primary-color)}.tag.function{background:var(--dui-check-active-bg);color:var(--dui-check-mark-color)}
.code{position:relative;margin:10px 0 16px}
.code pre{margin:0;padding:12px 14px;background:var(--dui-body-bg-thin);border:1px solid var(--dui-border-color);border-radius:6px;overflow:auto;line-height:1.55}
.code .copy{position:absolute;top:6px;right:6px;font:12px var(--g-font);padding:2px 8px;border-radius:4px;border:1px solid var(--dui-input-border-color);background:var(--dui-button-bg);color:var(--dui-font-color);cursor:pointer;opacity:.0;transition:opacity .15s}
.code:hover .copy,.code .copy:focus{opacity:1}
.callout{border-left:4px solid var(--dui-primary-color);background:var(--dui-primary-soft-bg);padding:10px 14px;border-radius:0 6px 6px 0;margin:14px 0}
.callout.warn{border-color:var(--dui-alert-warning-color);background:var(--dui-body-bg-thin)}
.callout.bad{border-color:var(--dui-error-color);background:var(--dui-error-bg)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:10px 0 18px}
.card{border:1px solid var(--dui-border-color);border-radius:6px;padding:12px 14px;background:var(--dui-body-bg);box-shadow:var(--dui-page-shadow)}
.card b{display:block;margin-bottom:2px}
.pair .chip{padding:10px 12px;border-radius:6px;border:1px solid var(--dui-border-light-color);margin-bottom:6px;font-weight:600}
.demo{border:1px solid var(--dui-border-color);border-radius:8px;padding:16px;background:var(--dui-body-bg);margin:10px 0 16px}
.demo .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.demo input,.demo button.f{height:28px;padding:0 8px 0 5px;border:1px solid var(--dui-input-border-color);border-radius:4px;background:var(--dui-input-bg);color:var(--dui-input-color);font:12px var(--g-font)}
.demo button.f{background:var(--dui-button-bg);padding:0 10px;cursor:pointer}
.demo input:hover,.demo input:focus{border-color:var(--dui-input-border-hover-color);outline:0}
.demo button.f:hover{background:var(--dui-button-hover-bg)}
.toolbar{position:fixed;right:16px;bottom:16px;z-index:10000;display:flex;gap:6px;padding:6px;border:1px solid var(--dui-border-color);border-radius:8px;background:var(--dui-body-bg);box-shadow:var(--dui-shadow)}
.toolbar button{font:12px var(--g-font);padding:4px 10px;border:1px solid var(--dui-input-border-color);border-radius:4px;background:var(--dui-button-bg);color:var(--dui-font-color);cursor:pointer}
.toolbar button[aria-pressed=true]{background:var(--dui-active-bg);color:var(--dui-active-color);border-color:var(--dui-active-bg)}
@media (max-width:900px){.layout{display:block}nav.side{position:static;width:auto;height:auto;border-right:0;border-bottom:1px solid var(--dui-border-color);display:flex;flex-wrap:wrap;gap:2px;padding:12px}nav.side .brand,nav.side .ver{width:100%}nav.side a.sub{display:none}main{padding:20px 16px 80px}}
</style>
</head>
<body>
<div class="layout">
<nav class="side" id="nav">
  <div class="brand">@daracl/ui-style</div>
  <div class="ver">v${esc(pkg.version)} · 사용 가이드</div>
  <a href="#overview">개요</a>
  <a href="#install">설치 · 진입점</a>
  <a href="#quick">빠른 시작</a>
  <a href="#theme">테마</a>
  <a class="sub" href="#theme-switch">전환 방법</a>
  <a class="sub" href="#theme-tokens">테마 변수 목록</a>
  <a href="#tokens">디자인 토큰</a>
  <a href="#api">API 레퍼런스</a>
  <a href="#rules">컴포넌트 작성 규칙</a>
  <a href="#projects">프로젝트 적용 현황</a>
  <a class="sub" href="#renames">변수 이름 매핑</a>
  <a href="#build">빌드 · 배포</a>
</nav>
<main>
<h1>@daracl/ui-style</h1>
<p class="lead">Daracl UI 프로젝트가 공통으로 쓰는 SCSS 라이브러리입니다. 디자인 토큰, 라이트 / 다크 테마, 믹스인, 함수, 유틸리티를 제공합니다.</p>

<h2 id="overview">개요</h2>
<div class="cards">
  <div class="card"><b>가져오기만 해서는 CSS 가 나오지 않음</b>변수 · 함수 · 믹스인을 <code>@use</code> 해도 출력이 없습니다. 출력은 <code>@include</code> 로 명시합니다.</div>
  <div class="card"><b>런타임 테마 전환</b>색상은 CSS 변수(<code>--dui-*</code>)로 제공됩니다. <code>data-daracl-theme</code> 속성 또는 OS 설정으로 전환합니다.</div>
  <div class="card"><b>단독으로도 표시</b>컴포넌트 CSS 는 light 값을 fallback 으로 갖습니다. dark 는 <code>theme-vars.css</code> 를 로드하면 됩니다.</div>
  <div class="card"><b>모든 프로젝트가 같은 값</b>프로젝트 전용 값만 지역 변수(<code>--dg-*</code> 등)로 두고, 나머지는 이 라이브러리의 변수를 씁니다.</div>
</div>

<h2 id="install">설치 · 진입점</h2>
${code('bash', 'yarn add @daracl/ui-style\nyarn add -D sass   # SCSS 를 사용하는 경우 (>=1.80)')}
<div class="tw"><table class="tt"><thead><tr><th>경로</th><th>내용</th></tr></thead><tbody>
<tr><td><code>@daracl/ui-style/abstracts</code></td><td class="d">토큰 + 변수 + 함수 + 믹스인 + 브레이크포인트 (CSS 출력 없음)</td></tr>
<tr><td><code>@daracl/ui-style/tokens</code></td><td class="d">디자인 토큰만</td></tr>
<tr><td><code>@daracl/ui-style/themes</code></td><td class="d">테마 맵과 테마 출력 믹스인, <code>themed()</code></td></tr>
<tr><td><code>@daracl/ui-style/base</code></td><td class="d">reset, keyframes, spinner</td></tr>
<tr><td><code>@daracl/ui-style/utilities</code></td><td class="d">scrollbar, 유틸리티 클래스</td></tr>
<tr><td><code>@daracl/ui-style</code></td><td class="d">위 전체 (<code>theme-*</code>, <code>base-*</code>, <code>util-*</code> 접두사로 forward)</td></tr>
<tr><td><code>@daracl/ui-style/style.css</code></td><td class="d">테마 변수 + keyframes + 유틸리티 클래스</td></tr>
<tr><td><code>@daracl/ui-style/theme-vars.css</code></td><td class="d">테마 CSS 변수만 (dark 전환에 필요)</td></tr>
</tbody></table></div>
<h3>빌드 도구별 해석</h3>
<div class="tw"><table class="tt"><thead><tr><th>도구</th><th>방법</th></tr></thead><tbody>
<tr><td>Vite / webpack</td><td class="d"><code>@use '@daracl/ui-style/abstracts'</code> 그대로 (package.json <code>exports</code> 의 <code>sass</code> 조건)</td></tr>
<tr><td>esbuild-sass-plugin</td><td class="d">위와 동일하게 동작을 확인했습니다</td></tr>
<tr><td>sass CLI</td><td class="d"><code>sass --load-path=node_modules style/app.scss out.css</code> — 패키지 루트의 진입 파일(<code>abstracts/</code>, <code>themes/</code> …)로 해석됩니다</td></tr>
<tr><td>Sass JS API</td><td class="d"><code>NodePackageImporter</code> 를 쓰면 <code>@use 'pkg:@daracl/ui-style/abstracts'</code></td></tr>
</tbody></table></div>

<h2 id="quick">빠른 시작</h2>
<h3>SCSS 에서 쓰기</h3>
${code('scss', `@use '@daracl/ui-style/abstracts' as style;
@use '@daracl/ui-style/themes' as themes;

.my-panel {
  padding: style.$spacing-md;                    // 12px
  border-radius: style.radius(md);               // 4px
  z-index: style.z(dropdown);                    // 1000

  // 색은 테마 변수로 → var(--dui-border-color, #d9dde3)
  border: 1px solid themes.themed(border-color);
  background: themes.themed(body-bg);
  color: themes.themed(font-color);

  @include style.flex-between;
  @include style.respond-below(md) { display: none; }
}

.my-input  { @include style.form-control; }
.my-button { @include style.form-button; }`)}
<h3>CSS 만 쓰기 (SCSS 없이)</h3>
${code('js', `import '@daracl/ui-style/theme-vars.css';   // 테마 변수만
// 또는 import '@daracl/ui-style/style.css';   // 변수 + keyframes + 유틸리티 클래스`)}
<h3>dark 로 전환</h3>
${code('js', `document.documentElement.setAttribute('data-daracl-theme', 'dark');   // 페이지 전체
element.setAttribute('data-daracl-theme', 'dark');                  // 일부 영역만`)}

<h2 id="theme">테마</h2>
<h3 id="theme-switch">전환 방법</h3>
<p>지원하는 전환 방식은 <b>두 가지</b>입니다.</p>
<ul>
  <li><code>data-daracl-theme="light | dark"</code> 속성 — 요소 단위로 지정할 수 있고, 가장 가까운 조상의 값이 적용됩니다.</li>
  <li>OS 설정(<code>prefers-color-scheme: dark</code>) — 속성이 없을 때만 따릅니다. <code>style.css</code> / <code>theme-vars.css</code> 에 포함되어 있습니다.</li>
</ul>
<div class="callout warn">이전 프로젝트에서 쓰던 <code>body.dark</code>, <code>.dark</code> 같은 클래스 방식은 지원하지 않습니다. 오른쪽 아래 버튼으로 이 페이지의 테마를 직접 바꿔 볼 수 있습니다.</div>
<div class="demo" aria-label="테마 데모">
  <div class="row"><input type="text" value="입력 요소" aria-label="입력 예"> <button class="f" type="button">버튼</button>
  <span class="d">현재 테마: <b id="cur-theme">auto</b></span></div>
</div>
<h4>hover / selected / active — 배경과 글자색은 항상 쌍으로 씁니다</h4>
<p class="d">배경만 바꾸면 다른 테마에서 글자가 읽히지 않을 수 있어, 아래 쌍은 반드시 함께 사용합니다.</p>
<div class="cards">${pairCards}</div>
<div class="callout bad"><b>단독 사용 시 주의</b> dark 값은 <code>theme-vars.css</code> 가 있어야 적용됩니다. 로드하지 않으면 컴포넌트는 light fallback 으로 표시됩니다. 컴포넌트 안에서 <code>--dui-*</code> 를 다시 선언하지 마세요. 요소에 직접 선언한 값이 앱이 <code>:root</code> 에 지정한 값을 덮어씁니다.</div>

<h3 id="theme-tokens">테마 변수 목록 <span class="d">(${light.size}개 · 빌드된 theme-vars.css 기준)</span></h3>
${themeTables}

<h2 id="tokens">디자인 토큰</h2>
<p>SCSS 변수입니다. 빌드 시점에 값이 결정되므로 값을 바꾸면 해당 패키지를 다시 빌드해야 합니다. 런타임에 바뀌어야 하는 값(색, 그림자)은 위의 테마 변수를 사용합니다.</p>
${tokenSections}

<h2 id="api">API 레퍼런스</h2>
<p class="d">이 표는 소스(<code>src/</code>)와 대조해서 생성됩니다. 소스에 없는 이름이 있으면 가이드 빌드가 실패합니다.</p>
${apiSections}

<h2 id="rules">컴포넌트 작성 규칙</h2>
<h3>해야 할 것</h3>
<ul>
  <li>공통 색은 <code>themes.themed(키)</code> 로 참조합니다. 앱이 어떤 CSS 를 로드했는지와 무관하게 light 로 표시됩니다.</li>
  <li>프로젝트에서만 쓰는 값은 <b>자기 접두사</b> 변수(<code>--dg-*</code>, <code>--drs-*</code> …)로 두고, <code>define-themes($scope, $prefix: …, $themes: …)</code> 로 light / dark 를 출력합니다.</li>
  <li>배경과 글자색이 함께 쓰이는 hover / selected / active 는 쌍으로 사용합니다.</li>
  <li>입력 요소 · 버튼은 <code>form-control</code> / <code>form-button</code> 믹스인을 씁니다. 테두리는 <code>input-border-color</code>, 패널 / 표는 <code>border-color</code>.</li>
  <li>전역 <code>@keyframes</code> 는 프로젝트 접두사를 붙입니다 (<code>keyframes-fade('프로젝트')</code> → <code>프로젝트-fade-in</code>).</li>
  <li>z-index 는 토큰을 씁니다 (<code>style.$z-dropdown</code>, <code>style.$z-modal</code> …).</li>
</ul>
<h3>하지 말 것</h3>
<ul>
  <li>컴포넌트 루트에서 <code>--dui-*</code> 를 다시 선언 — 앱의 테마 / 커스텀 값을 덮어씁니다.</li>
  <li>접두사 없는 변수(<code>--border-color</code> 등) 선언 — 호스트 페이지의 같은 이름과 충돌합니다.</li>
  <li><code>helpers</code>, <code>keyframes</code>, <code>define-themes()</code> 를 여러 컴포넌트에서 반복 호출 — 호출할 때마다 CSS 가 출력됩니다. 앱 진입 CSS 에서 한 번만 호출하거나 <code>style.css</code> 를 쓰세요.</li>
</ul>
<h3>개별 영역 / 인스턴스 테마</h3>
<p>한 컴포넌트만 다른 테마로 보여야 한다면 그 요소에서 <code>themes.theme($name)</code> 으로 <code>--dui-*</code> 전체를 지정합니다. (ui-grid 의 <code>dg-dark</code>, ui-components 의 <code>data-theme</code> 가 이 방식입니다.)</p>
${code('scss', `// 영역 단위 테마: 공통(--dui-*) + 전용(--dg-*) 을 함께 지정
.daracl-grid .dg-layout.dg-dark {
  @include themes.theme(dark);
  @include themes.theme(dark, $prefix: 'dg', $themes: $grid-themes);
}`)}
<h3>JS 에서 색을 읽어야 할 때</h3>
${code('js', `// 값이 비어 있을 수 있으므로(theme-vars.css 미로드) 반드시 fallback 을 둔다
const c = getComputedStyle(el).getPropertyValue('--dui-bar-positive-bg').trim() || '#77c0fc';`)}

<h2 id="projects">프로젝트 적용 현황</h2>
<div class="tw"><table class="tt"><thead><tr><th>프로젝트</th><th>전용 접두사</th><th>공통 변수 사용</th><th>비고</th></tr></thead><tbody>${projectRows}</tbody></table></div>
<h3 id="renames">변수 이름 매핑 (이전 → 현재)</h3>
<p class="d">기존 프로젝트의 CSS 변수를 덮어써서 쓰던 앱은 아래 이름으로 바꿔야 합니다. 이전 이름의 alias 는 제공하지 않습니다.</p>
<div class="tw"><table class="tt"><thead><tr><th>이전</th><th>현재 (<code>--dui-</code> 접두사)</th></tr></thead><tbody>${renameRows}</tbody></table></div>
<div class="callout">기준값은 ui-components / ui-report-studio 의 테마입니다. 그 외 프로젝트는 글자색(<code>#222</code>), 테두리, dark 바탕(남색 <code>#1f2836</code>)이 새 기준으로 바뀌었습니다. 값의 출처와 "파생" 표시는 <code>src/themes/_light.scss</code>, <code>_dark.scss</code> 의 주석에 있습니다.</div>

<h2 id="build">빌드 · 배포</h2>
${code('bash', `yarn install
yarn build        # dist/style.css, theme-vars.css (+ .min.css) 와 이 가이드(docs/guide.html)
yarn test         # 빌드 + exports 경로, 공개 API, 테마 CSS, load-path, Sass 경고, 가이드 검증`)}
<ul>
  <li><code>npm pack --dry-run</code> 으로 포함 파일을 확인하고 <code>yarn publish --access public</code> 으로 배포합니다. (<code>prepack</code> 에서 빌드가 실행됩니다.)</li>
  <li>각 프로젝트는 <code>dependencies</code> 에 <code>"@daracl/ui-style": "^${esc(pkg.version.split('.').slice(0, 2).join('.'))}.0"</code> 형태로 추가합니다. 소스 SCSS 를 함께 배포하는 패키지는 사용자가 <code>@daracl/ui-style</code> 을 찾을 수 있어야 하기 때문입니다.</li>
  <li>공통 값(색, 간격 등)을 바꾸면 이 패키지를 배포한 뒤, SCSS 값에 영향받는 패키지는 다시 빌드 · 배포해야 반영됩니다. CSS 변수 값(테마 색)은 <code>theme-vars.css</code> 만 갱신하면 됩니다.</li>
</ul>
<p class="d">이 문서는 <code>scripts/build-guide.mjs</code> 가 생성합니다. 직접 수정하지 마세요. · 생성 시각 ${new Date().toISOString().slice(0, 10)}</p>
</main>
</div>
<div class="toolbar" role="group" aria-label="이 페이지의 테마">
  <button type="button" data-mode="auto" aria-pressed="true">auto</button>
  <button type="button" data-mode="light" aria-pressed="false">light</button>
  <button type="button" data-mode="dark" aria-pressed="false">dark</button>
</div>
<script>
(function () {
  var KEY = 'ui-style-guide-theme';
  var root = document.documentElement;
  var buttons = document.querySelectorAll('.toolbar button');
  var label = document.getElementById('cur-theme');
  function read() { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* 저장소를 쓸 수 없는 환경 */ } }
  function apply(mode) {
    if (mode === 'auto') root.removeAttribute('data-daracl-theme'); else root.setAttribute('data-daracl-theme', mode);
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode)); });
    if (label) label.textContent = mode === 'auto' ? 'auto (OS 설정)' : mode;
  }
  buttons.forEach(function (b) { b.addEventListener('click', function () { var m = b.getAttribute('data-mode'); save(m); apply(m); }); });
  apply(read());

  document.querySelectorAll('.code .copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.parentNode.querySelector('code').textContent;
      var done = function () { btn.textContent = '복사됨'; setTimeout(function () { btn.textContent = '복사'; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(ta); }
    });
  });

  var links = [].slice.call(document.querySelectorAll('nav.side a'));
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function onScroll() {
    var y = window.scrollY + 80, idx = 0;
    targets.forEach(function (t, i) { if (t && t.offsetTop <= y) idx = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === idx); });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
</script>
</body>
</html>
`;

writeFileSync(join(root, 'docs/guide.html'), html);
console.log(`docs/guide.html 생성 (${(html.length / 1024).toFixed(0)}KB, 테마 변수 ${light.size}개, API ${API.length}개)`);
