---
name: migrate-project
description: Daracl 소비 프로젝트(ui-grid, ui-form 등)의 SCSS 를 @daracl/ui-style 변수로 전환한다. 프로젝트의 자체 테마 변수/믹스인을 ui-style 로 바꾸고 빌드·테스트로 검증해야 할 때 사용한다.
---

# 소비 프로젝트에 ui-style 적용

`$ARGUMENTS` 는 대상 프로젝트 이름(예: `ui-dialog`)이다. 대상은 `F:\09.opensource\daracl\<프로젝트>` 이다.
이 절차는 ui-role-builder → ui-form → ui-datetimepicker → ui-multiSelect → ui-tree → ui-grid → ui-components → ui-report-studio → ui-dialog → ui-toast 에 적용하며 정리한 것이다. 적용 결과와 결정 사항은 `docs/SCSS_ANALYSIS.md` 8절과 `docs/guide.html` 에 있다.

## 0. 시작 전 확인 (먼저 한다)

- 대상 프로젝트의 `CLAUDE.md` / `AGENTS.md` 가 있으면 먼저 읽고 따른다 (ui-grid 는 코드 스타일 · 주석 언어 규칙이 있다).
- `git status`, `git branch`, 최근 `git log` 를 본다. 프로젝트마다 **별도 저장소**이고, 원격 변경과 충돌해 있을 수 있다. 충돌 표시(`<<<<<<<`)가 이미 커밋되어 있는지도 확인한다 (ui-toast 에서 있었다).
- 패키지 매니저가 프로젝트마다 다르다 (`package-lock.json` 이면 npm, 아니면 yarn). 스크립트가 `yarn …` 을 부르는 프로젝트도 있다.
- 빌드 도구를 먼저 파악한다: Vite / webpack + sass-loader / esbuild-sass-plugin / SCSS 컴파일 단계 없음(원본만 배포). **빌드 단계가 없는 프로젝트는 적용 이득이 작다** — 사용자에게 알린다.

## 1. 분석

1. SCSS 파일과 `var(--…)` 사용 목록을 뽑는다. 파일로 만든 스크립트로 키별 개수를 센다 (쉘 `node -e` 에 정규식을 넣지 않는다).
2. JS/TS 가 CSS 변수를 읽거나 쓰는지 확인한다 (`getPropertyValue`, `setProperty`, `data-theme`, 테마 클래스). 있으면 이름 변경이 JS 수정을 요구한다 — fallback 값이 있는지 본다.
3. 테마 전환 방식을 확인한다 (`body.dark`, `.dark`, `data-theme`, 인스턴스별 클래스). **클래스 방식은 지원되지 않는다.**
4. 키를 분류한다.
   - **공유** : ui-style 에 같은 의미의 키가 있다 → `themes.themed(key)`. 이름이 다르면 가이드의 "변수 이름 매핑" 표를 따른다.
   - **전용** : 이 프로젝트에서만 쓴다 → 자기 접두사 `--xx-*` 로 유지.
   - 입력 요소 / 버튼의 테두리는 `input-border-color`, 패널 / 표 / 탭은 `border-color`.
   - 배경과 글자색은 hover / hover-accent / selected / active **쌍**으로 매핑한다. 배경만 바꾸면 dark 에서 글자가 안 보인다.
   - 의미가 애매하면 임의로 합치지 말고 사용자에게 묻는다.

## 2. 변환

- 변수 이름을 바꾸는 **스크립트를 파일로 작성**하고, 매핑되지 않은 이름이 나오면 **중단**하게 한다 (누락 방지). 괄호가 중첩된 fallback(`var(--x, rgba(...))`)은 정규식 대신 괄호를 세는 파서를 쓴다.
- 파일 맨 위에 `@use '@daracl/ui-style/themes' as themes;` 를 추가한다. 줄바꿈(CRLF/LF)은 원본을 유지한다.
- 프로젝트의 `themes/` 폴더(맵 + `theme` 믹스인)는 전용 값만 남긴다. 출력은 `themes.define-themes($scope, $prefix: …, $themes: …)`. `$scope` 가 쉼표 목록이어도 된다.
- 인스턴스별 테마(클래스 / `data-theme`)는 JS 를 바꾸지 않고 **그 요소에 `themes.theme($name)` 으로 `--dui-*` 와 전용 값을 함께** 지정한다. 상위에서 이미 계산된 `var()` 별칭은 하위로 그대로 상속되므로, 별칭이 있으면 같은 규칙 안에서 다시 선언한다.
- 입력 요소 믹스인이 중복되어 있으면 `style.form-control` / `style.form-button` 으로 대체한다.
- JS 가 CSS 변수를 읽으면 `--dui-*` 로 바꾸고 **fallback 을 둔다** (`theme-vars.css` 가 없을 수 있다).
- 쓰이지 않게 된 파일은 **삭제하지 말고** 최종 보고에 목록으로 남긴다 (삭제는 사용자 승인).

## 3. 패키지 · 연결

- `package.json` 의 `dependencies` 에 `"@daracl/ui-style": "^0.0.1"` 추가. 소스 SCSS 를 배포하는 프로젝트는 반드시 `dependencies`.
- 개발 중 연결은 `npm link` 대신 **junction** 으로 한다 (`npm link` 는 `node_modules` 를 정리하면서 `package.json` 에 없는 패키지를 지울 수 있다).

```powershell
$nm='F:\09.opensource\daracl\<프로젝트>\node_modules\@daracl'
New-Item -ItemType Directory -Force $nm | Out-Null
New-Item -ItemType Junction -Path "$nm\ui-style" -Target 'F:\09.opensource\daracl\ui-style'
```

- `sass` CLI 로 SCSS 를 컴파일하는 스크립트(`build:css` 등)에는 `--load-path=node_modules` 를 추가한다.
- 프로젝트 README 에 테마 섹션을 추가한다: 변수는 `--dui-*`, dark 는 `theme-vars.css` + `data-daracl-theme`, 클래스 방식 제거.
- 데모 페이지가 있으면 테마 전환 시 `data-daracl-theme` 를 설정하고 `theme-vars.css` 를 불러온다.

## 4. 검증

1. SCSS 컴파일: 경고 0건이어야 한다. `--dui-*` 참조 수를 세고, 접두사 없는 옛 변수가 남지 않았는지 컴파일 결과로 확인한다.
2. **실제 빌드는 프로젝트 `dist` 를 덮어쓰지 않도록 임시 폴더에서** 한다. 소스(`src`, `style`)와 설정만 복사하고 `node_modules` 는 junction 으로 연결한다. `vite.config` 에 `visualizer({ open: true })` 가 있으면 사본에서만 제거한다 (브라우저가 열리고 `bundle-report.html` 이 생성된다).
3. 설치되지 않은 도구는 `npm install` 로 채우지 말고, 설치된 다른 프로젝트의 `node_modules` 를 사본에 연결해 쓰거나 "검증하지 못함"으로 보고한다.
4. 프로젝트의 기존 테스트(Jest 등)를 실행한다. 테스트가 SCSS 파일을 직접 읽어 문자열을 치환하는 경우(ui-grid `ExcelExport.test.ts`) 변수 이름 / `@use` 로 깨지므로 테스트를 함께 고친다. jest(jsdom) 안에서는 sass 를 돌릴 수 없으니 별도 Node 프로세스를 쓴다.
5. 타입체크 (`tsc --noEmit`, 설정이 `emitDeclarationOnly` 면 `--emitDeclarationOnly --outDir <임시>`).

## 5. 보고

- 바뀐 파일, 검증한 것 / 못 한 것, **시각이 바뀌는 값**(글자색, 테두리, dark 바탕), 남은 옛 파일, 이름이 바뀌어 외부 앱에 영향이 있는 변수를 알린다.
- 커밋하지 않는다. 변경은 사용자가 확인한 뒤 커밋한다.
