# Changelog

## Unreleased

- 빌드 개선(공개 API · 산출물 변화 없음): `scripts/build.mjs` 가 sass CLI 3회 + yarn 중첩 호출 대신 한 프로세스에서 `dist/` CSS(+min)와 가이드를 생성한다. `yarn test` 약 7.5s → 3.1s. `build:css` / `build:css:min` 이름은 유지
- 보안 · 설정 정리: 배포 워크플로의 `npm install -g npm yarn` 제거(Node 24 가 npm 11 포함), `yarn install --ignore-scripts`, `timeout-minutes` 추가. `scripts/serve.mjs` 는 `127.0.0.1` 에만 바인딩하고, 경로 접두 비교 우회(`docs-x`)와 잘못된 URL 인코딩으로 인한 서버 종료를 막는다

- `docs/examples.html` 추가: light / dark 를 나란히 비교하는 예제 페이지(버튼 · 폼 · 탭 · 테이블 · 알림 등과 색 견본). `npm start` 가 이 페이지를 연다.

- `npm start` / `yarn start` 추가: 빌드 후 `docs/guide.html` 을 로컬 서버로 띄워 예제 테마(auto / light / dark 전환)를 브라우저에서 확인. 빌드 없이 띄우려면 `npm run serve`. 배포 파일에는 포함되지 않는 개발용 스크립트(`scripts/serve.mjs`)

- 테마 키 `font-soft-color` 추가: `font-color` 보다 한 단계 옅은 본문용 글자색 (light `#4a4a4a`, dark `#b9bdc6`). 키 추가만이므로 기존 화면에는 영향 없음

- `themes.define-theme-defaults()` 추가: `:where()`(특이도 0)로 light / OS 다크 / `[data-daracl-theme=dark]` 변수를 출력. 컴포넌트 라이브러리가 `theme-vars.css` 없이도 dark 를 지원하되 앱 값이 순서와 상관없이 우선한다. 속성이 붙은 요소만 다른 테마로 표시 가능

- light 테마 글자 대비 개선(WCAG AA 4.5:1): `muted-color` #8a919c → #626976, `required-color` #ff4136 → #d92d20, `invalid-font-color` #ff4136 → #c4281c. 키 이름과 토큰(`$required`)은 그대로이며 light 의 글자색만 짙어진다

- dark 테마 색을 Element Plus dark 기준(중립 회색 `#141414` / `#0a0a0a` / `#1d1e1f`, 글자 · 테두리 · fill 단계값)으로 변경. 키 이름은 그대로이며 값만 바뀐다. 소비 프로젝트의 dark 화면 색이 달라진다. `overlay-bg` 알파 0.6 → 0.8

## 0.0.1

- 최초 공개: 디자인 토큰(`tokens`), 라이트/다크 테마(`themes`), 믹스인·함수(`abstracts`), `base`, `utilities`
- 테마 전환은 `data-daracl-theme` 속성과 OS 설정(`prefers-color-scheme`)만 지원
- 컴포넌트 CSS 용 `themes.themed()` (light fallback 포함 CSS 변수 참조)
- 빌드 산출물: `style.css`, `theme-vars.css` (+ `.min.css`)
- `base.keyframes-fade($prefix)`: fade-in / fade-out 만 접두사와 함께 출력
- 패키지 루트 진입 파일(`abstracts/`, `tokens/`, `themes/`, `base/`, `utilities/`, `index.scss`): `sass --load-path=node_modules` 에서도 `@use "@daracl/ui-style/..."` 해석
- 사용 가이드 `docs/guide.html` (`yarn build:guide`): 테마 변수 / 토큰 / API / 작성 규칙. 소스와 대조해 생성
