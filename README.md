# @daracl/ui-style

Daracl UI 프로젝트가 공통으로 사용하는 SCSS 라이브러리. 디자인 토큰, 라이트/다크 테마, 믹스인, 함수, 유틸리티를 제공한다.

- Sass 모듈 시스템(`@use` / `@forward`)만 사용한다. `@import` 는 쓰지 않는다.
- **가져오는 것만으로는 CSS 가 출력되지 않는다.** CSS 는 `@include` 로 명시하거나 빌드된 `style.css` 를 사용한다.
- 분석 근거와 기존 SCSS 와의 매핑은 [docs/SCSS_ANALYSIS.md](docs/SCSS_ANALYSIS.md) 참고.

## 설치

```bash
yarn add @daracl/ui-style
yarn add -D sass          # SCSS 를 사용하는 경우 (^1.80)
```

> 아직 npm 에 배포되지 않았다. 배포 전에는 `yarn add file:../ui-style` 또는 `yarn link` 로 사용한다.

## 진입점

| 경로 | 내용 |
| --- | --- |
| `@daracl/ui-style/abstracts` | 토큰 + 변수 + 함수 + 믹스인 + 브레이크포인트 (CSS 출력 없음) |
| `@daracl/ui-style/tokens` | 디자인 토큰만 |
| `@daracl/ui-style/themes` | 테마 map 과 테마 출력 믹스인 |
| `@daracl/ui-style/base` | reset, keyframes, spinner 믹스인 |
| `@daracl/ui-style/utilities` | scrollbar, 유틸리티 클래스 믹스인 |
| `@daracl/ui-style` | 위 전체 (`theme-*`, `base-*`, `util-*` 접두사로 forward) |
| `@daracl/ui-style/style.css` | 테마 변수 + keyframes + 유틸리티 클래스 |
| `@daracl/ui-style/theme-vars.css` | 테마 CSS 변수만 |

Vite / webpack 은 `@use '@daracl/ui-style/abstracts'` 로 해석한다.
Sass CLI·JS API 에서 `NodePackageImporter` 를 쓰면 `@use 'pkg:@daracl/ui-style/abstracts'` 로 쓴다.

## SCSS 사용

```scss
@use '@daracl/ui-style/abstracts' as style;

.example {
  padding: style.$spacing-md;                 // 12px
  border-radius: style.radius(md);            // 4px
  color: style.token(font-color);             // var(--dui-font-color)
  z-index: style.z(modal);                    // 10000
  font-size: style.rem(14px);

  @include style.flex-center;

  @include style.respond-below(md) {
    display: none;
  }
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

- **토큰**: `$spacing-*`, `$font-size-*`, `$radius-*`, `$shadow-*`, `$z-*`, `$duration-*`, `$control-height`, 색 팔레트(`$gray-*`, `$dark-*`, `$accent`, 상태색 …) 와 map(`$spacing`, `$radii`, `$shadows`, `$z-layers`, `$font-sizes`)
- **함수**: `space() radius() shadow() font-size() z() token() css-var-name() rem() strip-unit() breakpoint()`
- **믹스인**: `flex-center flex-between flex-column absolute-fill ellipsis line-clamp user-select reduced-motion coarse-pointer transition form-control form-button solid-variant respond-above respond-below`
- **base**: `reset root-typography keyframes animate spinner`
- **utilities**: `scrollbar scrollbar-hidden helpers variants`

접두사(기본 `dui`)를 바꾸려면 최초 `@use` 에서 설정한다.

```scss
@use '@daracl/ui-style/abstracts' as style with ($prefix: 'drs');
```

## 테마

테마는 CSS Custom Property 로 출력되므로 런타임에 전환할 수 있다.

### 1) 공통 CSS 사용

```js
import '@daracl/ui-style/style.css';          // 변수 + keyframes + 유틸리티
// 또는 import '@daracl/ui-style/theme-vars.css';   // 변수만
```

```html
<html>                                   <!-- light (기본) -->
<html data-daracl-theme="dark">          <!-- dark -->
<div data-daracl-theme="dark">…</div>   <!-- 일부 영역만 dark -->
```

`style.css` 는 OS 설정(`prefers-color-scheme: dark`)도 따른다. `data-daracl-theme` 속성이 있으면 그 값이 우선한다. 지원하는 전환 방식은 이 두 가지뿐이다.

```ts
document.documentElement.setAttribute('data-daracl-theme', 'dark');
```

### 2) 컴포넌트 범위로 출력

```scss
@use '@daracl/ui-style/themes' as themes;

// .daracl-foo 에 light 기본, [data-daracl-theme=dark] .daracl-foo / .daracl-foo[data-daracl-theme=dark] 에 dark
@include themes.define-themes('.daracl-foo');

// 기존 접두사 없는 변수(--border-color)를 유지해야 하는 경우
.daracl-foo { @include themes.theme-vars(themes.get-theme(light), $prefix: ''); }
```

### 3) 테마 추가

```scss
@use 'sass:map';
@use '@daracl/ui-style/themes' as themes;

$brand: map.merge(themes.get-theme(light), (primary-color: #ff00aa));
@include themes.define-theme(brand, $themes: map.merge(themes.$themes, (brand: $brand)));
```

## 빌드 / 검증 / 배포

```bash
yarn install
yarn build        # dist/style.css, theme-vars.css (+ .min.css)
yarn test         # 빌드 + exports 경로, 공개 API(@use / @forward), 테마 CSS, Sass 경고 검증
```

배포는 `prepack` 에서 빌드가 실행되고 `files`(`src`, `dist`)만 패키징된다.

```bash
npm pack --dry-run   # 포함 파일 확인
yarn publish --access public
```
