---
name: add-theme-token
description: ui-style 의 공통 테마 변수(--dui-*)를 추가하거나 값을 바꾼다. 테마 키 추가, light/dark 값 수정, hover/selected 같은 배경+글자색 쌍 추가, 소비 프로젝트에 미치는 영향 확인이 필요할 때 사용한다.
---

# 테마 토큰 추가 · 변경

공통 테마 변수는 모든 소비 프로젝트(ui-grid, ui-form, ui-components …)가 같은 값을 쓰는 것이 목적이다. 추가하기 전에 "정말 공통인가"부터 판단한다.

## 1. 공통인지 판단

- **2개 이상의 프로젝트가 같은 의미로 쓴다** → 공통 토큰 (이 저장소)
- 한 프로젝트에서만 쓰거나 그 프로젝트 DOM 에 묶여 있다 → 소비 프로젝트의 전용 변수(`--dg-*` 등). 여기에 추가하지 않는다.
- 값이 같아 보여도 **의미가 다르면 합치지 않는다.** (예: 알림 성공색 `alert-success-color` 와 검증 오류색 `error-color`)

## 2. 수정할 곳

`$ARGUMENTS` 로 키 이름과 값이 주어지면 그에 따른다. 없으면 사용자에게 키 이름, light 값, dark 값, 용도를 확인한다.

1. `src/themes/_light.scss`, `src/themes/_dark.scss` — **두 파일 모두**에 같은 키를 추가한다. 두 테마에서 값이 같으면 `src/themes/_common.scss`.
   - 값의 출처를 주석으로 남긴다: 기존 프로젝트 값이면 프로젝트 이름, 새로 정한 dark 값이면 `파생`.
   - 팔레트에 없는 새 색이면 `src/tokens/_colors.scss` 에 먼저 추가하고 `tokens.$이름` 으로 참조한다.
2. 배경 / 글자색이 함께 쓰이는 값이면 **쌍**으로 추가한다 (`foo-bg` + `foo-color`). `scripts/lint-rules.mjs` 의 `pair` 규칙 대상 목록(`hover`, `hover-accent`, `selected`, `active`)에도 추가한다.
3. `scripts/build-guide.mjs` — `DESC`(한 줄 설명)와 `GROUPS`(표시 그룹)에 추가한다. 그룹에 없으면 가이드 빌드가 실패한다.
4. `CHANGELOG.md` 에 기록한다.

## 3. 검증

```bash
yarn test      # 빌드 + 규칙 점검(light/dark 키 일치, 쌍) + 동작 검증 + 가이드 생성
```

## 4. 소비 프로젝트 영향 확인

- **키 추가** : 영향 없음 (additive).
- **값 변경** : 그 키를 쓰는 화면이 모두 바뀐다. 사용처를 찾아 사용자에게 알린다.

```bash
grep -rn --include=*.scss "themed(KEY" ../ui-*/style
```

- **이름 변경 / 삭제** : breaking change. 소비 프로젝트가 앱 쪽에서 `--dui-KEY` 를 덮어쓰고 있을 수 있다. 새 이름을 추가하고 기존 이름은 유지한 채 CHANGELOG 에 deprecated 로 기록하는 것을 우선한다. 이름 자체를 바꿔야 하면 사용자 승인을 받는다.

## 주의

- dark 값을 새로 정할 때는 기존 dark 가 Element Plus 기준 중립 회색 계열(`#141414` 바탕)임을 고려한다. 남색 같은 채도 있는 색을 섞지 않는다.
- 글자색을 정할 때는 바탕과의 대비를 확인한다 (일반 글자 4.5:1 이상).
- 커밋 · 배포는 하지 않는다.
