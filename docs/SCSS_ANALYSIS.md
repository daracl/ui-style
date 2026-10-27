# Daracl UI SCSS 분석 및 공통화 결과

분석 기준일: 2026-10-27. 분석 대상은 `F:\09.opensource\daracl` 하위의 SCSS 를 가진 프로젝트이며,
**기존 프로젝트는 읽기만 했고 어떤 파일도 수정하지 않았다.**

> `ui-grid.worktrees` 는 `ui-grid` 의 git worktree 사본(SCSS 40개)이라 별도 프로젝트로 보지 않았다.
> `ui-loading` 은 SCSS 파일이 없다. `corejs`(`style/daracl.scss`, 5줄)는 공통화할 내용이 없다.

## 1. 프로젝트별 SCSS 분석

| 프로젝트 | SCSS 수 | 구조 / 특징 | 테마 방식 |
| --- | --- | --- | --- |
| ui-grid | 40 | `abstracts / base / components / themes / views` 7-1 유사 구조. 가장 정교한 테마(`$themes` map + `theme` mixin) | `[data-daracl-theme]`, `.dg-layout.dg-<name>`, 접두사 없는 `--border-color` 등 |
| ui-form | 23 | ui-grid 의 abstracts/themes 구조를 복제. `form-control` 믹스인(접두사 인자) | `$themes` map, 접두사 변수(`$p`) |
| ui-components | 18 | `shared/abstracts`, `shared/themes` 가 ui-grid 값을 복제. grid / chart / kpi 하위 접두사(`dga/dca/dkp`) | `$themes` map |
| ui-report-studio | 16 | `abstracts/_mixins.scss` 가 ui-components 와 동일. 접두사 `drs` | `$themes` map |
| ui-role-builder | 15 | ui-grid `base/_utilities.scss`, `abstracts` 복제 | `$themes` map |
| ui-drift | 4 | `$drift-*` 변수(`!default`), 이동 easing, 터치 타겟 | 없음 |
| ui-tree | 3 | `.daracl-tree { --border-color … }` + `body.dark .daracl-tree, .daracl-tree.dark` | CSS 변수 직접 선언 |
| ui-multiSelect | 3 | ui-tree 와 거의 동일한 변수 이름·값 | 위와 동일 |
| ui-dialog / ui-toast | 2 | 변수 없음. `--success/--error/--warning/--info`, z-index 1000/10000, 전역 `@keyframes` | 없음 |
| ui-datetimepicker | 1 | `--color --success --error …` light/dark 두 블록, 전역 `fadeIn/fadeOut` | light / dark 두 변수 블록 |
| corejs | 1 | import 한 줄 | - |

핵심 관찰:

1. **ui-grid 가 사실상 디자인 원본**이다. ui-form / ui-components / ui-report-studio / ui-role-builder 는 ui-grid 값(`#cdcdcd`, `#686868`, `28px` 컨트롤 …)을 주석("ui-grid 와 같은 값")과 함께 복제하고 있다.
2. 테마 인프라(`themes/_index.scss` + `_mixin.scss` + `_common.scss`)가 **5개 프로젝트에 같은 형태로 복제**되어 있다.
3. CSS 변수 이름은 프로젝트마다 접두사 없음 / `drs-` / `dga-` / `--#{$p}-` 로 제각각이다.
4. ui-tree·ui-multiSelect 는 grid 계열과 **다른 색 체계**(`#dfe1e5`, `#1d212a`)를 쓴다.

## 2. 중복 변수 · 함수 · 믹스인

| 항목 | 중복 위치 | 비고 |
| --- | --- | --- |
| `$control-height: 28px`, `$control-radius: 4px`, `$control-font-size: 12px` | ui-components, ui-report-studio | ui-grid base 에 리터럴로도 존재 |
| `$font-family`, `$font-size(13)`, `$font-size-small(12)`, `$font-size-tiny(11)`, `$radius(3px)` | ui-components, ui-report-studio | 값 완전 동일 |
| `@mixin form-control`, `@mixin form-button` | ui-form(접두사 인자), ui-components(인자), ui-report-studio(전역 `$prefix`) | 구현 동일, 접두사 처리만 다름 |
| `@mixin theme($theme)` (map → `--key: value`) | ui-grid, ui-form, ui-components, ui-report-studio, ui-role-builder | 5벌 동일 |
| `$themes` map + `$default-theme: light` | 위 5개 프로젝트 | |
| `.dg-hide/.dg-show/.dg-invisible/.dg-disabled/.dg-ellipsis/.dg-text-a*` | ui-grid, ui-role-builder (`_utilities.scss`) | 접두사만 `dg-` |
| `.dg-primary/.dg-secondary/.dg-info/.dg-success/.dg-warning/.dg-danger` | ui-grid `base/_base.scss` (role-builder `_base.scss` 는 동일 여부 미확인) | 색 + 아이콘 stroke 변수 |
| `.dg-noselect/.dg-select` | ui-grid | ui-tree 도 `user-select` + vendor prefix 를 반복 |
| `@keyframes fadeIn / fadeOut` | ui-dialog, ui-toast, ui-datetimepicker | **전역 이름 충돌 위험** |
| `daradialogHide` / `daraToastHide` | ui-dialog / ui-toast | ui-dialog 쪽만 내용을 확인했고 `slide-out-right` 는 이를 기준으로 만들었다. ui-toast 와 동일한지는 적용 시 확인 |
| `--success #0abf30 / --error #e24d4c / --warning #e9bd0c / --info #3498db` | ui-toast, ui-datetimepicker | 값 동일 |
| `--border-color`, `--body-bg`, `--body-color`, `--body-hover-*`, `--body-active-*`, `--input-bg/color`, `--btn-*` | ui-tree, ui-multiSelect (light/dark 모두) | 값 동일 |
| `@mixin opacityVal` (IE 필터 포함) | ui-grid | **사용처 확인 필요**, IE 지원 코드라 이식하지 않음 |
| 이름만 다른 동일 기능 | ui-form `invalid-background-color` ↔ ui-grid `invalid-bg`, ui-form `tooltip-background` ↔ `tooltip-bg`, `color-danger` ↔ `status-danger-color`, `button-hover-bg` ↔ `button-bg-hover`, `bg-grid-header` ↔ `header-bg` | 신규 토큰은 grid 이름을 기준으로 통일하되 `form-control` 이 쓰는 `button-hover-bg`, `input-border-*` 는 ui-form 이름을 채택 |

## 3. 공통화한 스타일

| 영역 | 내용 | 모듈 |
| --- | --- | --- |
| 색 팔레트 | grid light/dark 중립색 스케일, 상태색(alert 계열 / bootstrap 버튼 계열), 선택색 | `tokens/_colors` |
| 간격 · 타이포 · 모서리 · 그림자 · 크기 · z-index · 모션 | 위 표의 중복 값을 단계화 | `tokens/*` |
| 테마 | light / dark 의미 토큰 map, `theme-vars`, `define-theme(s)`, 사용자 테마 등록, `prefers-color-scheme` 대응 | `themes/*` |
| 폼 컨트롤 | `form-control`, `form-button`, `solid-variant` | `abstracts/_mixins` |
| 레이아웃 · 텍스트 믹스인 | `flex-center`, `flex-between`, `ellipsis`, `line-clamp`, `user-select`, `transition`, `reduced-motion`, `coarse-pointer` | `abstracts/_mixins` |
| 함수 | `space/radius/shadow/font-size/z/token/rem/css-var-name` | `abstracts/_functions` |
| 브레이크포인트 | 720 / 960 / 1280 + `respond-above/below` | `abstracts/_breakpoints` |
| 애니메이션 | 접두사가 붙은 `fade-in/out`, `spin`, `slide-out-right`, `animate`, `spinner`(ui-tree 로더) | `base/_animations` |
| reset | 컴포넌트 스코프 `box-sizing` / `border-spacing` | `base/_reset` |
| 스크롤바 | 네이티브 `scrollbar`, `scrollbar-hidden` | `utilities/_scrollbar` |
| 유틸리티 클래스 | `hide/show/invisible/disabled/ellipsis/noselect/select/text-*`, 색 버튼 변형 | `utilities/_helpers` |

### 선정 이유
- **3개 이상 프로젝트에서 값/구현이 동일**한 것(컨트롤 크기, 글꼴, `theme` 믹스인, `form-control`).
- ui-grid 의 검증된 테마 값이 이미 다른 프로젝트의 기준값으로 쓰이고 있어, **그 값을 의미 토큰으로 승격**하는 것이 가장 안전하다.
- 전역 `@keyframes` 이름 충돌처럼 **공통화하지 않으면 버그가 되는 것**.

## 4. 기존 SCSS → 신규 모듈 매핑

| 기존 | 신규 |
| --- | --- |
| ui-grid `themes/_light.scss`, `_dark.scss` | `themes/_light.scss`, `_dark.scss` (키 이름 유지) |
| ui-grid/form/components/report-studio/role-builder `themes/_mixin.scss` `theme` | `themes.theme-vars($map, $prefix)` / `themes.theme($name)` |
| 각 프로젝트 `themes/_index.scss` 의 `$themes`, `$default-theme` | `themes.$themes`, `themes.$default-theme`, `themes.define-themes()` |
| ui-grid `daracl.grid.scss` 의 테마 선택자 블록 (`[data-daracl-theme]`, `.dg-layout.dg-x`) | `themes.define-themes($scope)` (`[data-daracl-theme=x] $scope`, `$scope[data-daracl-theme=x]`) |
| ui-form `abstracts/_mixins.scss` `form-control($p)`, ui-components/report-studio `form-control` | `style.form-control($prefix)` |
| `$control-height/radius/font-size` | `tokens.$control-height/radius/font-size` |
| `$font-family`, `$font-size*`, `$radius`, `$radius-large` | `tokens.$font-family`, `$font-size-2xs…lg`, `$radius-sm/lg` |
| ui-form `themes/_common.scss` `field-margin-top` 등 | `tokens.$field-margin-top/padding-top/padding-right` |
| ui-components `$config-layout-breakpoint`, report-studio `$narrow-breakpoint` | `$breakpoint-sm(720)`, `$breakpoint-md(960)` |
| ui-grid `base/_utilities.scss`, role-builder `base/_utilities.scss` | `utilities.helpers` |
| ui-grid `base/_base.scss` `.dg-primary …` | `utilities.variants`, `style.solid-variant` |
| ui-grid `.dg-ellipsis` | `style.ellipsis` |
| ui-grid `.dg-noselect/.dg-select`, ui-tree `user-select` | `style.user-select` |
| ui-dialog/toast/datetimepicker `@keyframes fadeIn/fadeOut/…Hide` | `base.keyframes`, `base.animate` |
| ui-tree `dt-spinner-loader` | `base.spinner` |
| ui-grid `*{ box-sizing… border-spacing }` | `base.reset` |
| ui-grid `views/main/_scroll.scss` 의 색 변수 | `utilities.scrollbar` 가 같은 `scroll-*` 토큰 사용 |
| ui-datetimepicker `box-shadow` popup | `tokens.$shadow-popup` |
| z-index 1000 / 10000 / 2147483000 | `tokens.$z-dropdown / $z-modal / $z-drag-ghost` |
| ui-drift `$drift-move-ease`, `$drift-touch-target`, `$drift-radius` | `tokens.$ease-move`, `$touch-target`, `$radius-lg` |

## 5. 프로젝트별 향후 적용 방법

공통 전제: 해당 프로젝트 `package.json` 에 `@daracl/ui-style` 추가, 그리고 CSS 변수 접두사를 바꾸기 어려우면
`themes.theme-vars($map, $prefix: '')` 로 **기존 접두사 없는 변수 이름을 그대로 출력**해 마이그레이션 비용을 줄인다.

| 프로젝트 | 1순위 적용 | 주의 |
| --- | --- | --- |
| ui-grid | `themes/*` 를 ui-style `themes` 로 교체 (`$prefix: ''`), `base/_utilities` → `util.helpers($prefix: dg)` | `.dg-layout.dg-<name>` 선택자는 grid 전용이므로 `define-theme($scope)` 결과와 병행 |
| ui-form | `abstracts/_mixins` 의 `form-control` 제거 → `style.form-control('df')`; `themes/*` 교체 | 변수 이름 `invalid-background-color` 등 → grid 이름으로 정리 필요 |
| ui-components | `shared/abstracts`, `shared/themes` 교체 | 하위 접두사 `dga/dca/dkp` 를 `$prefix` 로 전달 |
| ui-report-studio | `abstracts/_variables`(폰트·컨트롤), `_mixins`, `themes/*` 교체 | 레이아웃 변수(`$panel-left-width` …)는 유지 |
| ui-role-builder | `base/_utilities`, `themes/*` 교체 | |
| ui-tree / ui-multiSelect | 변수 값은 grid 계열과 달라 **1단계에서는 `keyframes`/`spinner`/`user-select` 등 믹스인만** 적용 | 색 체계 통일은 디자인 결정 필요 |
| ui-dialog / ui-toast / ui-datetimepicker | `base.keyframes` + `animate` 로 전역 `fadeIn/fadeOut` 제거, z-index 토큰 사용 | 이름 변경 시 JS 쪽에서 keyframe 이름을 참조하는지 확인 |
| ui-drift | 모션/그림자/z-index 토큰 | `!default` 변수는 외부에서 override 중일 수 있으므로 유지 |
| ui-loading, corejs | 해당 없음 | |

## 6. 공통화하지 않은 것과 이유

| 항목 | 이유 |
| --- | --- |
| ui-grid 가상 스크롤 DOM(`.dg-scroll-*`), 헤더/바디/푸터/툴바/컨텍스트 메뉴 | 그리드 전용 DOM·레이아웃 |
| ui-form 의 row/tab/field-container/form-group | 폼 레이아웃 전용 |
| ui-report-studio 의 canvas/palette/properties/preview, `$toolbar-height` 등 레이아웃 값 | 에디터 전용 |
| ui-role-builder `_group.scss` | 도메인 전용 |
| ui-components `_studio.scss`(993줄), kpi/chart | 컴포넌트 전용 스타일 |
| ui-tree / ui-multiSelect 의 색 값(`#dfe1e5`, `#1d212a` …) | grid 계열과 의미/값이 다른 별도 체계. 값이 비슷해 보여도 합치면 시각이 변함 |
| ui-datetimepicker 의 `--sunday`, `--today-bg` | 도메인 전용 변수 |
| ui-datetimepicker 의 `--select-background-color`, `--button-hover-color` 등 | 이름이 grid 계열과 달라 1:1 매핑이 불명확. 적용 시 별도 매핑 필요 |
| `opacityVal` 믹스인 | IE `filter/-ms-filter` 코드. 현대 `opacity` 로 충분 |
| ui-drift `$drift-accent`(#2563eb) | `tokens.$accent` 로 같은 값을 제공하지만 `!default` 변수 계약을 가진 프로젝트라 매핑만 안내 |
| ui-grid 아이콘/체크/스위치 컴포넌트 | 컴포넌트 전용 |

## 7. 향후 리팩토링 시 주의사항

1. **CSS 변수 접두사**: 기본은 `--dui-*` 다. 기존 접두사 없는 `--border-color` 와 병행하면 이중 선언이 된다.
   마이그레이션 중에는 `$prefix: ''` 로 기존 이름을 유지하고, 한 번에 `--dui-*` 로 바꾸지 않는다.
2. **키 이름 변경**: ui-form 의 `invalid-background-color`, `tooltip-background` 등은 grid 이름(`invalid-bg`, `tooltip-bg`)으로 통일되어 있지 않다. 신규 토큰은 `input-*`, `button-hover-bg`, `invalid-bg`, `tooltip-bg` 를 사용한다.
3. **dark 파생 값**: `muted-color`, `body-bg-deep`, `overlay-bg`, `shadow`, `page-shadow`(dark)는 기존 프로젝트에 dark 값이 없어 **새로 정한 값**이다. 실제 화면에서 검토가 필요하다.
4. **light 의 `font-disable-color: #ebebeb`** 처럼 의미가 모호한 기존 값(비활성 글자색이 배경보다 연함)도 그대로 가져왔다. 정리는 디자인 검토 후에 한다.
5. **keyframe 이름 변경**: `fadeIn` → `dui-fade-in` 은 JS/HTML 에서 animation 이름을 직접 지정하는 곳이 없는지 확인한 뒤 적용한다.
6. **`!important` 가 있는 helpers**(`hide/show/disabled`)는 grid 동작을 그대로 옮긴 것이다. 새 프로젝트에서 우선순위 문제가 생기면 `$prefix` 로 분리해서 사용한다.
7. **중복 출력 방지**: `helpers`, `keyframes`, `define-themes` 는 호출할 때마다 CSS 를 출력한다. 여러 컴포넌트 CSS 를 번들하는 경우 **앱 진입 CSS 에서 한 번만** 호출하거나 `dist/style.css` 를 사용한다.
8. **Sass 해석 방식**: Vite / webpack 은 `@use '@daracl/ui-style/abstracts'` 로, Sass CLI·JS API 의 `NodePackageImporter` 는 `@use 'pkg:@daracl/ui-style/abstracts'` 로 해석한다.
9. `ui-grid.worktrees` 는 분석에서 제외했다. 원본 `ui-grid` 와 동기화된 상태인지는 확인하지 않았다.

## 8. 토큰 기준: ui-components / ui-report-studio

모든 프로젝트가 ui-style 의 변수를 쓰고, 프로젝트 전용 값만 지역 변수로 둔다는 전제다.
**ui-components / ui-report-studio 의 테마 값을 기준값으로 삼았다.** (두 프로젝트의 입력 요소 값은 원래 ui-grid 값과 같다.)

### 기준 적용 규칙
1. 두 프로젝트가 정의한 토큰은 그 값을 그대로 쓴다. 둘이 다르면(dark `button-hover-bg`) report-studio 값을 채택했다.
2. 두 프로젝트에 없는 토큰은 ui-grid / ui-tree / ui-multiSelect / ui-datetimepicker 값을 쓰고(출처를 주석에 표기), dark 는 남색 바탕에 맞춰 새로 정했다("파생" 표기).
3. 배경 / 글자는 항상 쌍으로 사용한다: `hover-*`, `hover-accent-*`, `selected-*`, `active-*`.
4. 알림 상태색은 `alert-*`, 검증 오류는 `error-*`, 채움용 위험색은 `danger-color`(#dc2626).
5. 두 프로젝트 전용 값(`workspace-*`, `item-*`, `table-header-bg`, `badge-*`, `unsupported-*`, `partial-*`, `rail-bg`, `series-0~5` …)은 지역 변수로 둔다.

### 프로젝트별 변경표 (현재 값 → 기준 적용 후)

| 프로젝트 | light | dark |
| --- | --- | --- |
| ui-components | 변화 없음 | 버튼 hover `#727272`→`#3a4558` 뿐 |
| ui-report-studio | 변화 없음 | 변화 없음 |
| ui-grid | 글자 `#686868`→`#222222`, hover 글자 `#3a3d41`→`#000`, 테두리 `#cdcdcd`→`#d9dde3`, 셀 hover `#f3f3f3`→`#eef3fc`, 비활성 글자 `#ebebeb`→`#9aa1ab`, 오류 `#d9534f`→`#b42318` | 바탕 `#1a1a1a`→`#1f2836`, 테두리 `#585858`→`#3a4456`, 글자 `#e0e0e0`→`#ddd`, hover `#2b2b2b`→`#2f3b4f`, 버튼 `#5a5a5a`→`#2a3444`(hover `#727272`→`#3a4558`), 탭 `#2c2c2c`→`#18202c`, 스크롤 `#1e1e1e`→`#18202c`, `body-bg-thin` `#444343`→`#273244`, 오류 `#ff6b6b`→`#ff8a80`. **grid 전용 키(`header-bg #1a1717`, `summary-bg`, `cell-bg-linenumber`, `row-bg`, `fixed-column-bg`)는 무채색 그대로라 남색 바탕과 어긋남 → 지역에서 재조정 필요** |
| ui-form | 글자, 테두리, 비활성 글자 (grid 와 동일). `color-danger #d9534f` 는 용도에 따라 `error-color`(#b42318) 또는 `danger-color`(#dc2626) 로 분리 필요 | grid 와 동일한 공통 값 변화 |
| ui-role-builder | 글자, 테두리, 비활성 글자 | grid 와 동일한 공통 값 변화 |
| ui-tree | 글자 `#686868`→`#222`, 테두리 `#dfe1e5`→`#d9dde3`(거의 같음), 선택 `#c8efff`→`#e9faff` | 바탕 `#1d212a`→`#1f2836`(거의 같음), 테두리 `#41444c`→`#3a4456`(거의 같음), 글자 `#b0b2b5`→`#ddd`, hover·선택: 밝은 하늘색+검정 글자 → 어두운 파랑+흰 글자, active 글자 `#3a3d41`→`#fff`, 버튼 hover `#3950a2`→`#3a4558` |
| ui-multiSelect | tree 와 동일 + 선택 배경 rgba(청록)→`#e9faff`, 버튼 hover `#dee2e6`→`#e3e3e3` | tree 와 동일 + 선택 `#5774dd`→`#264f78`, 비활성 배경 `#878787`→`#555` |
| ui-datetimepicker | 글자 `#34495e`→`#222`, 테두리 `#d3d2d2`→`#d9dde3`, hover `#d4d4d48a`→`#eef3fc`, 비활성 배경 `#f1f1f18a`→`#ebebeb` | 바탕 `#070d19`→`#1f2836`, 테두리 `#6e7380`→`#3a4456`, 글자 `#d0d6e1`→`#ddd`, hover `#31316c`→`#2f3b4f`, 비활성 `#818181`→`#555` |
| ui-dialog / ui-toast | 테마 없음 → 지원 가능(알림 색은 동일 값) | 테마 없음 → 지원 가능 |
| ui-loading | 해당 없음 | 해당 없음 |

### 남은 결정 사항
1. 글자색 `#222` 적용 여부 : ui-grid·ui-form·ui-tree·ui-multiSelect·ui-role-builder 의 light 본문이 전반적으로 더 진해진다.
2. ui-grid 전용 dark 키(위 표) 재조정.
3. ui-datetimepicker 선택한 날짜 색(light 녹색 `#0abf30`, dark 흰색)은 `selected-*` 와 의미가 달라 미해결.
4. ui-tree 의 포커스(`#e4f7ff`) / open-active(`#b7e9ff`) 색 매핑.
5. "파생" 표시된 dark 값 검토.
