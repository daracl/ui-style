# CLAUDE.md

이 파일은 Claude Code 가 이 저장소(`@daracl/ui-style`)에서 작업할 때 따르는 지침이다.

## 응답 언어 · 스타일

- 모든 응답과 코드 주석은 한국어로 작성한다. 코드, 변수명, API 명칭, 에러 메시지 원문은 그대로 둔다.
- 간결하게 답하고, 변경 후에는 **무엇을 어떻게 검증했는지**를 함께 알린다. 검증하지 못한 것은 못 했다고 적는다.
- 커밋 / 푸시 / 삭제는 사용자가 요청할 때만 한다.

## 이 저장소는 무엇인가

Daracl UI 프로젝트들이 공통으로 쓰는 **SCSS 라이브러리**다. 런타임 코드는 없고, 디자인 토큰 · 라이트/다크 테마 · 믹스인/함수 · 유틸리티와 빌드된 CSS 를 제공한다.
소비 프로젝트(`F:\09.opensource\daracl\ui-*`) 10곳이 `@daracl/ui-style` 을 `dependencies` 로 가져다 쓴다. 이 저장소의 변경은 그 프로젝트들의 화면에 영향을 준다.

## 명령어

| 명령 | 내용 |
| --- | --- |
| `yarn install` | 의존성 설치 (sass 하나뿐) |
| `yarn build` | `dist/` CSS(+min) 와 `docs/guide.html` 생성 |
| `yarn lint:rules` | 저장소 규칙 점검 (`scripts/lint-rules.mjs`). `dist/theme-vars.css` 가 먼저 있어야 한다 |
| `yarn test` | 빌드 + 규칙 점검 + 동작 검증(`scripts/verify.mjs`). **변경 후 마지막에 반드시 실행** |
| `npm pack --dry-run` | 배포 파일 구성 확인 |

`src/` 의 `.scss` 를 수정하면 훅(`scripts/hook-check.mjs`)이 컴파일 가능 여부와 Sass 경고를 곧바로 알려 준다. 훅은 빠른 확인일 뿐이므로 `yarn test` 를 대신하지 않는다.

## 구조

```
src/
  tokens/      디자인 토큰 (순수 SCSS 값, 빌드 시점 값). 색 팔레트 / 간격 / 타이포 / 모서리 / 그림자 / 크기 / z-index / 모션
  abstracts/   변수($prefix 등), 함수, 믹스인, 브레이크포인트. tokens 를 forward 한다
  themes/      light / dark 테마 맵, themed(), define-theme(s), theme-vars
  base/        reset, keyframes, spinner
  utilities/   scrollbar, 유틸리티 클래스, 색 버튼 변형
  css/         CSS 빌드 진입점 (style.scss → dist/style.css, theme-vars.scss → dist/theme-vars.css)
  index.scss   전체 API (CSS 출력 없음)
abstracts/ tokens/ themes/ base/ utilities/ index.scss   ← 루트 진입 파일. src/* 를 forward 만 한다 (수정할 일 없음)
scripts/       clean / build-guide / verify / lint-rules / hook-check
docs/          SCSS_ANALYSIS.md (분석 · 마이그레이션 기록), guide.html (생성물)
```

의존 방향은 `tokens ← abstracts ← themes ← base / utilities` 이다. 순환 의존을 만들지 않는다. (`abstracts/_mixins` 가 `themes/_mixins` 를 쓰고, `themes/_mixins` 는 `abstracts/functions·variables` 만 쓴다.)

## 생성물 — 직접 수정하지 않는다

- `dist/**` : `yarn build:css` 결과 (git 에서도 제외)
- `docs/guide.html` : `scripts/build-guide.mjs` 가 `dist/theme-vars.css` 와 `src/tokens` 에서 읽어 생성. 내용을 바꾸려면 **생성 스크립트**를 고친다
- 루트의 `abstracts/ tokens/ themes/ base/ utilities/ index.scss` : `src/*` 를 가리키는 진입 파일

## 핵심 규칙 (어기면 소비 프로젝트가 깨진다)

1. **`@use` / `@forward` 만 쓴다.** `@import` 금지. Sass 의 deprecated 기능도 쓰지 않는다 (`if()` 대신 `@if`, 전역 `append` 대신 `sass:list`). **Sass 경고 0건**이 기준이다.
2. **가져오는 것만으로 CSS 가 출력되면 안 된다.** CSS 는 `@include` 로만 출력한다. (`yarn test` 가 확인)
3. **테마 전환은 `data-daracl-theme` 속성과 OS 설정(`prefers-color-scheme`) 두 가지뿐이다.** `body.dark`, `.dark`, `.dui-theme-*` 같은 클래스 방식을 추가하지 않는다.
4. **CSS 변수는 `--dui-*` 접두사.** 접두사 없는 변수를 선언하면 호스트 페이지와 충돌한다. 프로젝트 전용 값은 소비 프로젝트가 자기 접두사(`--dg-*` 등)로 둔다.
5. **컴포넌트용 참조는 `themes.themed(key)`** (`var(--dui-key, light값)`). `token()` 은 fallback 이 없으므로 컴포넌트 CSS 에 권장하지 않는다. 컴포넌트가 `--dui-*` 를 다시 선언하게 만드는 API 를 추가하지 않는다 (앱의 `:root` 값을 덮어쓴다).
6. **light 와 dark 는 같은 키를 가진다.** 테마 키는 kebab-case.
7. **hover / hover-accent / selected / active 는 `-bg` 와 `-color` 가 쌍이다.** 한쪽만 추가하지 않는다.
8. **공개 이름은 바꾸지 않는다.** 소비 프로젝트가 이미 쓰는 토큰 · 믹스인 · 테마 키의 이름 변경은 breaking change 다. 필요하면 새 이름을 추가하고 `CHANGELOG.md` 에 기록한다.
9. **값의 출처를 주석으로 남긴다.** 기존 프로젝트에서 가져온 값은 프로젝트 이름을, 새로 정한 dark 값은 `파생` 을 적는다. (`src/themes/_light.scss`, `_dark.scss` 참고)
10. 새 공개 API(믹스인 / 함수)는 `scripts/build-guide.mjs` 의 `API` 배열에 추가한다. 누락되면 가이드 빌드가 경고하고, 존재하지 않는 이름을 적으면 실패한다.

## 자주 하는 작업

작업별 절차는 스킬로 정리되어 있다. (`.claude/skills/`)

- 테마 키 추가 · 변경 → `/add-theme-token`
- 소비 프로젝트에 ui-style 적용 → `/migrate-project`
- 배포 전 점검 → `/release-check`
- 변경 검토 → `style-reviewer` 에이전트

## 알려진 함정

- **sass CLI 는 `package.json` 의 `exports` 를 읽지 못한다.** 그래서 루트에 진입 파일을 두었고, 소비 프로젝트는 `sass --load-path=node_modules` 로 컴파일한다. CSS 산출물 이름을 `themes.css` 로 하면 `./themes`(Sass) 와 해석이 모호해지므로 `theme-vars.css` 를 쓴다.
- **jest(jsdom) 안에서는 sass 가 파일을 탐색할 때 나는 Node fs 오류를 처리하지 못한다** (`Null check operator used on a null value`). SCSS 를 `@use` 하는 테스트는 별도 Node 프로세스에서 컴파일한다. (ui-grid 의 `test/helpers/compileBodyStyle.js` 참고)
- **쉼표로 이어진 선택자를 문자열째 접두 / 접미하면 첫 / 마지막 항목에만 적용된다.** 선택자 목록은 `themes.scope-list()` 로 분리해서 처리한다.
- **범위(scope) 지정 시 OS 다크는 `:where(:root:not([data-daracl-theme]))`** 로 특이도를 0 으로 낮춰 명시 속성 규칙이 이기게 한다. 이 규칙은 명시 테마 규칙보다 **앞에** 출력해야 한다.
- **`yarn test` 는 `dist/` 를 지우고 다시 만든다.** 다른 프로젝트가 `dist/*.css` 를 읽는 중이면 영향이 있다.
- 소비 프로젝트의 개발 환경은 `node_modules/@daracl/ui-style` 을 이 폴더로 연결(junction)한 상태일 수 있다. 이 저장소의 수정이 즉시 반영된다.
- 쉘에서 `node -e "…"` 로 정규식이 들어간 코드를 넘기면 이스케이프가 깨진다. 파일로 만들어 실행한다.

## 검증 체크리스트

변경을 마무리하기 전에 다음을 확인한다.

1. `yarn test` 통과 (경고 0건)
2. 공개 값 / 이름을 바꿨다면 소비 프로젝트 영향 범위를 확인했는지 (`docs/SCSS_ANALYSIS.md` 8.2 의 프로젝트 목록)
3. `CHANGELOG.md` 갱신
4. 가이드(`docs/guide.html`)가 의도대로 갱신됐는지 (생성 스크립트 경고 없음)
