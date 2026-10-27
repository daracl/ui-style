# @daracl/ui-style

Daracl UI 프로젝트가 공통으로 사용하는 SCSS 라이브러리. 디자인 토큰, 라이트/다크 테마, 믹스인, 함수, 유틸리티를 제공한다.

- Sass 모듈 시스템(`@use` / `@forward`)만 사용한다. `@import` 는 쓰지 않는다.
- **가져오는 것만으로는 CSS 가 출력되지 않는다.** CSS 는 `@include` 로 명시하거나 빌드된 `style.css` 를 사용한다.
- 색상은 CSS 변수(`--dui-*`)로 제공되어 런타임에 테마를 전환할 수 있다.
- **사용 가이드(테마 변수 · 토큰 · API · 작성 규칙)** : [docs/guide.html](docs/guide.html) — 브라우저에서 열면 light / dark 를 바꿔 볼 수 있다.
- 분석 근거와 기존 SCSS 와의 매핑은 [docs/SCSS_ANALYSIS.md](docs/SCSS_ANALYSIS.md) 참고.

## 설치

```bash
yarn add @daracl/ui-style
yarn add -D sass          # SCSS 를 사용하는 경우 (>=1.80)
```

소스 SCSS 를 함께 배포하는 패키지는 `dependencies` 에 추가한다. (사용자가 `@daracl/ui-style` 을 찾을 수 있어야 한다.)
배포 전 로컬 개발에서는 `node_modules/@daracl/ui-style` 을 이 폴더로 연결(link / junction)해 사용한다.

## 진입점

| 경로 | 내용 |
| --- | --- |
| `@daracl/ui-style/abstracts` | 토큰 + 변수 + 함수 + 믹스인 + 브레이크포인트 (CSS 출력 없음) |
| `@daracl/ui-style/tokens` | 디자인 토큰만 |
| `@daracl/ui-style/themes` | 테마 맵, 테마 출력 믹스인, `themed()` |
| `@daracl/ui-style/base` | reset, keyframes, spinner 믹스인 |
| `@daracl/ui-style/utilities` | scrollbar, 유틸리티 클래스 믹스인 |
| `@daracl/ui-style` | 위 전체 (`theme-*`, `base-*`, `util-*` 접두사로 forward) |
| `@daracl/ui-style/style.css` | 테마 변수 + keyframes + 유틸리티 클래스 |
| `@daracl/ui-style/theme-vars.css` | 테마 CSS 변수만 (dark 전환에 필요) |

| 도구 | 해석 방법 |
| --- | --- |
| Vite / webpack / esbuild-sass-plugin | `@use '@daracl/ui-style/abstracts'` 그대로 (`exports` 의 `sass` 조건) |
| sass CLI | `sass --load-path=node_modules app.scss out.css` — 패키지 루트의 진입 파일(`abstracts/`, `themes/` …)로 해석된다 |
| Sass JS API | `NodePackageImporter` 를 쓰면 `@use 'pkg:@daracl/ui-style/abstracts'` |

## SCSS 사용

```scss
@use '@daracl/ui-style/abstracts' as style;
@use '@daracl/ui-style/themes' as themes;

.example {
  padding: style.$spacing-md;                       // 12px
  border-radius: style.radius(md);                  // 4px
  z-index: style.z(modal);                          // 10000
  font-size: style.rem(14px);

  // 색은 테마 변수로 → var(--dui-border-color, #d9dde3)  (light 값이 fallback)
  border: 1px solid themes.themed(border-color);
  color: themes.themed(font-color);

  @include style.flex-center;
  @include style.respond-below(md) { display: none; }
}

.input  { @include style.form-control; }
.button { @include style.form-button; }
```

토큰만 필요하면:

```scss
@use '@daracl/ui-style/tokens' as tokens;

.example { border-radius: tokens.$radius-md; }
```

### 주요 API

전체 목록과 설명은 [가이드](docs/guide.html)의 "API 레퍼런스"(소스와 대조해 생성)를 참고한다.

- **토큰**: `$spacing-*`, `$font-size-*`, `$radius-*`, `$shadow-*`, `$z-*`, `$duration-*`, `$control-height`, 색 팔레트(`$gray-*`, `$dark-*`, `$accent`, 상태색 …)
- **함수**: `space() radius() shadow() font-size() z() token() css-var-name() rem() strip-unit() breakpoint()`
- **믹스인**: `flex-center flex-between flex-column absolute-fill ellipsis line-clamp user-select reduced-motion coarse-pointer transition form-control form-button solid-variant respond-above respond-below`
- **themes**: `themed() get-theme() scope-list() theme-vars theme define-theme define-themes`
- **base**: `reset root-typography keyframes keyframes-fade animate spinner`
- **utilities**: `scrollbar scrollbar-hidden helpers variants`

접두사(기본 `dui`)를 바꾸려면 최초 `@use` 에서 설정한다.

```scss
@use '@daracl/ui-style/abstracts' as style with ($prefix: 'drs');
```

## 테마

테마는 CSS Custom Property(`--dui-*`) 로 출력되므로 런타임에 전환할 수 있다. 지원하는 전환 방식은 **두 가지**다.

1. `data-daracl-theme="light | dark"` 속성 (요소 단위, 가장 가까운 조상의 값)
2. OS 설정 `prefers-color-scheme: dark` — 속성이 없을 때만 따른다. (`style.css` / `theme-vars.css` 에 포함)

`body.dark` 같은 클래스 방식은 지원하지 않는다.

### 1) 공통 CSS 사용

```js
import '@daracl/ui-style/theme-vars.css';          // 테마 변수만
// 또는 import '@daracl/ui-style/style.css';       // 변수 + keyframes + 유틸리티

document.documentElement.setAttribute('data-daracl-theme', 'dark');
```

### 2) 컴포넌트 CSS 에서 쓰기

컴포넌트는 `themed()` 로 참조한다. light 값이 fallback 으로 들어가므로 `theme-vars.css` 없이도 표시되고, 로드하면 dark / 사용자 정의 테마가 적용된다.

```scss
.foo { background: themes.themed(body-bg); }   // var(--dui-body-bg, #ffffff)
```

> 컴포넌트 루트에서 `--dui-*` 를 **다시 선언하지 않는다.** 요소에 직접 선언한 값이 앱이 `:root` 에 지정한 값을 덮어쓴다.
> hover / selected / active 는 배경과 글자색(`*-bg` + `*-color`)을 항상 쌍으로 사용한다.

### 3) 프로젝트 전용 값

프로젝트에서만 쓰는 값은 자기 접두사 변수로 두고 테마별로 출력한다. `$scope` 는 쉼표로 이어진 선택자여도 된다.

```scss
$local-themes: (
  light: (header-bg: #fff),
  dark:  (header-bg: #18202c),
);

@include themes.define-themes('.daracl-foo, .daracl-foo-popup', $prefix: 'df', $themes: $local-themes);
// → --df-header-bg  (전역 data-daracl-theme 에 따라)
```

### 4) 개별 요소만 다른 테마

```scss
.daracl-grid .dg-layout.dg-dark { @include themes.theme(dark); }
```

### 5) 테마 추가

```scss
@use 'sass:map';
@use '@daracl/ui-style/themes' as themes;

$brand: map.merge(themes.get-theme(light), (primary-color: #ff00aa));
@include themes.define-theme(brand, $themes: map.merge(themes.$themes, (brand: $brand)));
```

## 빌드 / 검증 / 배포

```bash
yarn install
yarn build        # dist/style.css, theme-vars.css (+ .min.css) 와 docs/guide.html
yarn test         # 빌드 + exports 경로, 공개 API(@use / @forward), 테마 CSS, load-path, Sass 경고, 가이드 검증
```

`docs/guide.html` 은 `scripts/build-guide.mjs` 가 빌드된 `theme-vars.css` 와 `src/tokens` 에서 값을 읽어 생성한다.
가이드에 적힌 API 가 소스에 없거나 테마 키가 가이드 그룹에 없으면 빌드가 실패한다. 직접 수정하지 않는다.

배포는 `prepack` 에서 빌드가 실행되고 `files`(`src`, `dist`, 루트 진입 파일, `docs/guide.html`)만 패키징된다.

```bash
npm pack --dry-run   # 포함 파일 확인
yarn publish --access public
```
