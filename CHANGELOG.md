# Changelog

## 0.0.1

- 최초 공개: 디자인 토큰(`tokens`), 라이트/다크 테마(`themes`), 믹스인·함수(`abstracts`), `base`, `utilities`
- 테마 전환은 `data-daracl-theme` 속성과 OS 설정(`prefers-color-scheme`)만 지원
- 컴포넌트 CSS 용 `themes.themed()` (light fallback 포함 CSS 변수 참조)
- 빌드 산출물: `style.css`, `theme-vars.css` (+ `.min.css`)
- `base.keyframes-fade($prefix)`: fade-in / fade-out 만 접두사와 함께 출력
- 패키지 루트 진입 파일(`abstracts/`, `tokens/`, `themes/`, `base/`, `utilities/`, `index.scss`): `sass --load-path=node_modules` 에서도 `@use "@daracl/ui-style/..."` 해석
- 사용 가이드 `docs/guide.html` (`yarn build:guide`): 테마 변수 / 토큰 / API / 작성 규칙. 소스와 대조해 생성
