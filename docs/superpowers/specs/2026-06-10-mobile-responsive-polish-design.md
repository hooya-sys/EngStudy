# 모바일(좁은 화면 폭) UI 정돈 설계

날짜: 2026-06-10
대상: 영어 단어 모험 (EngStudy)

## 목표

좁은 화면(스마트폰, ~600px 이하)에서 헤더를 비롯한 전 화면이 "데스크톱 크기 그대로 욱여넣은" 느낌 없이 정돈되어 보이게 한다. 사용자가 지목한 주 통증 지점은 헤더 영역.

## 현재 문제

1. **헤더** — 아바타(56px) + 이름/레벨(min-width 140px) + XP바(min-width 180px) + 일반 `.btn` 크기(padding 14px 22px)의 아이콘 버튼 3~4개가 한 flex 행에 있고, 좁은 폭에서 `flex-wrap`으로 제멋대로 2~3줄 감기며 화면을 과도하게 차지한다. `.btn-icon` 클래스는 CSS 정의가 없어 아이콘 버튼이 풀사이즈다.
2. **타이포** — 화면 제목 28px, 퀴즈 단어 48px, 스펠링 뜻 38px, 결과 제목 36px 등이 모바일 축소 없이 그대로다(퀴즈 단어만 500px 쿼리에 일부 있음).
3. **여백** — `.app` 패딩 20px, `.card` 패딩 28px/24px가 좁은 폭에서 콘텐츠 영역을 잠식한다.
4. **스펠링 슬롯** — 32px 슬롯이라 11자 단어(grandmother)는 360px 폭에서 줄바꿈된다.
5. **브레이크포인트 파편화** — 500px(.quiz-options 등), 520px(.custom-form) 쿼리가 흩어져 있다.

## 설계

### 방침

- **단일 모바일 브레이크포인트 `@media (max-width: 600px)`** 하나로 통합한다. 기존 500px/520px 쿼리의 규칙을 이 블록으로 옮긴다(500~600px 구간도 모바일 규칙 적용으로 동작이 더 일관됨).
- **CSS-only 원칙.** 예외 둘: ① `.btn-icon`에 데스크톱용 정의를 추가(현재 미정의 — 데스크톱에서도 아이콘 버튼을 적정 크기로), ② 홈의 인라인 스타일 배너(전체 진도·오늘의 복습) 2곳에 `home-banner` 클래스를 부여하는 `game.js` 마크업 1줄씩 변경(인라인 스타일은 미디어쿼리로 못 건드리므로).
- 마크업 구조·동작(JS 로직)은 변경하지 않는다.

### 1. 아이콘 버튼 기본 정의 (전 해상도)

```css
.btn-icon { width: 44px; height: 44px; padding: 0; font-size: 18px; border-radius: 14px; flex-shrink: 0; }
```

헤더의 🔊/🏆/🛡️/🚪 버튼이 데스크톱에서도 풀사이즈 `.btn`(padding 14px 22px)이던 것을 44px 정사각으로 정리. 데스크톱 헤더도 함께 정돈된다.

### 2. 모바일 헤더 (≤600px) — flex order 재배치

마크업 변경 없이 CSS로 2단 구성을 만든다.

```
1행:  [아바타 40px] [이름 · Lv·🔥]      [🔊][🏆][🚪]
2행:  [████████ XP바 (전체 폭) ████████]
```

```css
.header { padding: 10px 12px; gap: 8px 10px; margin-bottom: 14px; }
.avatar { width: 40px; height: 40px; font-size: 22px; }
.user-info { min-width: 0; }
.user-name { font-size: 16px; }
.user-level { font-size: 12px; }
.xp-container { order: 10; flex-basis: 100%; min-width: 0; }
.btn-icon { width: 38px; height: 38px; font-size: 16px; }
```

`order: 10` + `flex-basis: 100%`로 XP바가 마지막 줄 전체 폭으로 내려가고, 나머지가 자연스럽게 1행에 남는다.

### 3. 모바일 전역 스케일 (≤600px)

| 항목 | 데스크톱 | 모바일 |
|------|---------|--------|
| `.app` padding | 20px | 12px |
| `.card` padding | 28px 24px | 20px 14px |
| `.screen-title` | 28px | 22px |
| `.screen-sub` | 15px | 14px |
| `.welcome h1` | 42px | 32px |
| `.quiz-word` | 48px | 36px (기존 500px 규칙 이동) |
| `.quiz-word-kr` | 38px | 28px (〃) |
| `.quiz-options` | 2열 | 1열 (〃) |
| `.flash-word` | — | 40px (〃) |
| `.spell-mean` | 38px | 28px |
| `.spell-slot` | 32×40px, 22px | 24×32px, 17px (간격 6→3px — 11자 단어가 360px 콘텐츠 폭 302px 안에 들어가는 최대 크기) |
| `.spell-input` | 24px/p16px | 20px/p12px |
| `.result-title` | 36px | 28px |
| `.result-emoji` | 100px | 64px |
| `.result-hero` padding | 30px 20px | 16px 12px |
| `.stat-num` | 28px | 22px |
| `.stat-box` padding | 14px 8px | 10px 6px |
| `.btn` | 16px/p14·22px | 15px/p12·18px |
| `.btn-lg` | 20px/p18·30px | 17px/p14·22px |
| `.progress-pill` | 14px | 13px |
| `.mode-card` padding | 18px | 14px |
| `.mode-icon` | 50px | 42px |
| `.custom-form` | 1fr 1fr auto | 1fr 1fr + 버튼 전폭 (기존 520px 규칙 이동) |
| `.home-banner` padding | 14px 18px (인라인) | 10px 12px |

### 4. 홈 배너 클래스 부여

`renderHome()`의 전체 진도 div와 오늘의 복습 div에 `class="home-banner"`를 추가한다. 인라인 `padding: 14px 18px;`은 미디어쿼리로 오버라이드할 수 없으므로 인라인에서 제거하고 클래스로 옮긴다.

- 인라인 스타일에서 `padding: 14px 18px;` 제거, 기본 CSS에 `.home-banner { padding: 14px 18px; }` 추가.
- 모바일 블록에서 `.home-banner { padding: 10px 12px; }`로 오버라이드.
- 내부 폰트(16/13/28·22px)는 인라인 유지(모바일에서도 수용 가능한 크기).

## 변경 범위

| 파일 | 변경 |
|------|------|
| `index.html` | `.btn-icon` 기본 정의, `.home-banner` 기본 정의, `@media (max-width: 600px)` 통합 블록 추가, 기존 500px/520px 쿼리 블록 제거 |
| `js/game.js` | `renderHome()` 배너 2곳에 `home-banner` 클래스 부여 + 인라인 padding 제거 |

변경하지 않는 것: 헤더 마크업 구조, JS 로직 전부, 데스크톱(>600px) 레이아웃(아이콘 버튼 정리 제외), zoom FAB.

## 검증 방식

`firebase deploy` 후 실서비스에서 확인한다 (이전 작업과 동일하게 로컬 테스트 생략).

1. 폰(또는 데브툴 360px/390px)에서 헤더가 2단(정보+버튼 / XP바)으로 깔끔하게 정리되는지.
2. 홈·모드 선택·퀴즈·스펠링·결과 화면이 가로 스크롤 없이 들어가는지, 타이포가 과하게 크지 않은지.
3. 스펠링에서 11자 단어(grandmother, 가족 카테고리)의 글자 슬롯이 한 줄에 들어가는지.
4. 데스크톱(900px)에서 기존 레이아웃이 유지되는지(아이콘 버튼만 44px 정사각으로 정돈).
5. 500~600px 구간(폴더블·작은 태블릿)에서 모바일 규칙이 적용되는지.
