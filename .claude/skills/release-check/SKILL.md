---
name: release-check
description: @daracl/ui-style 를 npm 에 배포하기 전 점검 체크리스트를 실행한다. 배포 직전, 버전 올리기 전, 소비 프로젝트를 정식 의존성으로 바꾸기 전에 사용한다. 배포 자체는 하지 않는다.
disable-model-invocation: true
---

# 배포 전 점검

**이 스킬은 배포(`npm publish`, `yarn publish`)를 실행하지 않는다.** 점검하고 결과를 보고만 한다. 배포는 사용자가 직접 한다.

## 1. 이 저장소

1. `yarn test` — 전부 통과, Sass 경고 0건
2. `npm pack --dry-run` — 포함 파일 확인
   - 있어야 한다: `src/**`, `dist/*.css`(+min), 루트 진입 파일(`abstracts/ tokens/ themes/ base/ utilities/ index.scss`), `docs/guide.html`, `CHANGELOG.md`, `LICENSE`, `README.md`, `package.json`
   - 없어야 한다: `scripts/`, `node_modules/`, `.claude/`, `CLAUDE.md`, `docs/SCSS_ANALYSIS.md`
3. `package.json` — `version` 이 `CHANGELOG.md` 의 최신 항목과 일치하는지, `exports` 의 경로가 모두 존재하는지 (`yarn test` 가 확인)
4. `CHANGELOG.md` — 이번 변경이 기록되어 있는지. breaking change(공개 이름 변경 / 삭제, 값 의미 변경)는 명시되어 있는지
5. `docs/guide.html` 을 브라우저에서 열어 light / dark 전환과 표가 정상인지 (사용자에게 확인 요청)

## 2. 소비 프로젝트 영향

배포하면 모든 소비 프로젝트가 `@daracl/ui-style` 을 받는다. 다음을 확인하고 보고한다.

- 각 프로젝트 `package.json` 의 `@daracl/ui-style` 범위가 이번 버전을 포함하는지
- `dependencies` 에 있는지 (SCSS 원본을 함께 배포하는 프로젝트는 `devDependencies` 가 아니어야 한다)
- `file:` 의존이 남아 있는 프로젝트 (ui-components, ui-report-studio) — 배포 전에 버전 범위로 바꿔야 한다
- 개발용 junction(`node_modules/@daracl/ui-style`)이 남아 있으면 정식 설치로 바꾸기 전에는 배포 결과가 반영되지 않는다
- 값이 바뀐 토큰이 있으면 영향을 받는 화면을 목록으로 만든다 (`grep -rn --include=*.scss "themed(KEY" ../ui-*/style`)

## 3. 배포 순서 (사용자에게 안내)

1. `@daracl/ui-style` 배포
2. 각 프로젝트에서 junction 제거 → `yarn install` / `npm install` 로 정식 설치 → 빌드 · 테스트
3. 의존 순서대로 프로젝트 배포: ui-datetimepicker / ui-toast / ui-dialog / ui-tree / ui-multiSelect → ui-grid / ui-form → ui-components / ui-role-builder → ui-report-studio
4. ui-grid, ui-components 는 다시 빌드한 뒤 ui-report-studio 를 확인한다 (report-studio CSS 가 두 패키지의 `dist/*.css` 를 포함한다)

## 4. 보고 형식

점검 항목별로 **통과 / 실패 / 확인하지 못함**을 표로 정리하고, 실패 · 미확인 항목은 이유와 다음 행동을 적는다.
