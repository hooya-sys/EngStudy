# 모바일 UI 정돈 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 좁은 화면(≤600px)에서 헤더를 2단으로 재배치하고 전 화면의 타이포·여백을 모바일 스케일로 정돈한다.

**Architecture:** 단일 `@media (max-width: 600px)` 블록을 `index.html` 스타일 끝에 추가하고, 기존 500px/520px 쿼리를 흡수한다. 마크업 변경은 홈 배너 2곳에 `home-banner` 클래스를 부여하는 것뿐이며 JS 로직은 손대지 않는다.

**Tech Stack:** Vanilla CSS (단일 `index.html` 내 `<style>`), Vanilla JS 템플릿 문자열.

**스펙:** `docs/superpowers/specs/2026-06-10-mobile-responsive-polish-design.md`

**검증 방식:** 테스트 프레임워크 없음. `node --check`(game.js)로 구문만 확인 후 `firebase deploy`, 실서비스를 폰/데브툴(360px·390px·900px)에서 확인한다.

**CSS 캐스케이드 주의:** 모바일 블록은 스타일시트 맨 끝(`</style>` 직전)에 두므로, 같은 특이도의 단일 클래스 규칙은 **블록 내 선언 순서**가 데스크톱 규칙을 덮는다. 특히 `.btn` 오버라이드는 `.btn-sm`/`.btn-lg`/`.btn-icon`보다 먼저 선언해야 그들의 모바일 값이 살아남는다 (아래 블록의 순서를 그대로 유지할 것).

---

### Task 1: 기본 CSS 정의 + 홈 배너 클래스

**Files:**
- Modify: `index.html` — `.btn-lg` 정의(line ~212) 아래
- Modify: `js/game.js` — `renderHome()`의 배너 div 2곳

- [ ] **Step 1: .btn-icon / .home-banner 기본 정의 추가**

`index.html`에서 `.btn-lg { font-size: 20px; padding: 18px 30px; }` 줄 바로 아래에 추가.

```css
  .btn-icon { width: 44px; height: 44px; padding: 0; font-size: 18px; border-radius: 14px; flex-shrink: 0; }
  .home-banner { padding: 14px 18px; }
```

(`.btn-icon`은 현재 CSS 정의가 없어 헤더 아이콘 버튼이 풀사이즈 `.btn`으로 렌더링되던 것을 데스크톱에서도 44px 정사각으로 정리한다. `.btn`보다 뒤에 선언되어 `padding: 0`이 이긴다.)

- [ ] **Step 2: renderHome 전체 진도 배너에 클래스 부여**

`js/game.js`의 `renderHome()`에서 전체 진도 div를 수정 — `class="home-banner"` 추가, 인라인 `padding: 14px 18px; ` 제거.

수정 전:
```javascript
      <div style="background: linear-gradient(135deg, #FFE5B4, var(--yellow)); padding: 14px 18px; border-radius: 14px; border: 3px solid var(--navy); display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
```

수정 후:
```javascript
      <div class="home-banner" style="background: linear-gradient(135deg, #FFE5B4, var(--yellow)); border-radius: 14px; border: 3px solid var(--navy); display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
```

- [ ] **Step 3: 오늘의 복습 배너에 클래스 부여**

같은 함수의 복습 카드 div를 수정.

수정 전:
```javascript
        <div onclick="startReview()" style="background: linear-gradient(135deg, #E3F2FD, #BBDEFB); padding: 14px 18px; border-radius: 14px; border: 3px solid var(--navy); display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; cursor: pointer;">
```

수정 후:
```javascript
        <div class="home-banner" onclick="startReview()" style="background: linear-gradient(135deg, #E3F2FD, #BBDEFB); border-radius: 14px; border: 3px solid var(--navy); display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; cursor: pointer;">
```

- [ ] **Step 4: 구문 검증**

Run: `node --check js/game.js`
Expected: 출력 없음

- [ ] **Step 5: Commit**

```powershell
git add index.html js/game.js
git commit -m "style: add btn-icon sizing and home-banner class hook"
```

---

### Task 2: 통합 600px 모바일 블록

**Files:**
- Modify: `index.html` — 기존 500px 쿼리(line ~500-505)·520px 쿼리(line ~960-963) 제거, `</style>` 직전에 통합 블록 추가

- [ ] **Step 1: 기존 500px 쿼리 블록 제거**

`index.html`에서 아래 블록을 통째로 삭제.

```css
  @media (max-width: 500px) {
    .quiz-options { grid-template-columns: 1fr; }
    .quiz-word { font-size: 36px; }
    .quiz-word-kr { font-size: 28px; }
    .flash-word { font-size: 40px; }
  }
```

- [ ] **Step 2: 기존 520px 쿼리 블록 제거**

아래 블록을 통째로 삭제.

```css
  @media (max-width: 520px) {
    .custom-form { grid-template-columns: 1fr 1fr; }
    .custom-form .btn { grid-column: 1 / -1; }
  }
```

- [ ] **Step 3: 통합 모바일 블록 추가**

`</style>` 바로 위에 추가. **블록 내 선언 순서를 바꾸지 말 것** (.btn → .btn-sm → .btn-lg → .btn-icon 순서가 캐스케이드상 필수).

```css
  /* ========== MOBILE (≤600px) ========== */
  @media (max-width: 600px) {
    .app { padding: 12px; }
    .card { padding: 20px 14px; }

    /* 헤더: 1행 아바타+이름+아이콘 버튼, 2행 XP바 전체 폭 */
    .header { padding: 10px 12px; gap: 8px 10px; margin-bottom: 14px; }
    .avatar { width: 40px; height: 40px; font-size: 22px; }
    .user-info { min-width: 0; }
    .user-name { font-size: 16px; }
    .user-level { font-size: 12px; }
    .xp-container { order: 10; flex-basis: 100%; min-width: 0; }

    /* 버튼 스케일 — 선언 순서 유지 필수 */
    .btn { font-size: 15px; padding: 12px 18px; }
    .btn-sm { font-size: 14px; padding: 10px 16px; }
    .btn-lg { font-size: 17px; padding: 14px 22px; }
    .btn-icon { width: 38px; height: 38px; padding: 0; font-size: 16px; }

    /* 타이포·여백 */
    .screen-title { font-size: 22px; }
    .screen-sub { font-size: 14px; }
    .welcome h1 { font-size: 32px; }
    .progress-pill { font-size: 13px; }
    .mode-card { padding: 14px; }
    .mode-icon { width: 42px; height: 42px; font-size: 22px; }

    /* 퀴즈 (기존 500px 쿼리 통합) */
    .quiz-options { grid-template-columns: 1fr; }
    .quiz-word { font-size: 36px; }
    .quiz-word-kr { font-size: 28px; }
    .flash-word { font-size: 40px; }

    /* 스펠링 */
    .spell-mean { font-size: 28px; }
    .spell-hint { gap: 3px; }
    .spell-slot { width: 24px; height: 32px; font-size: 17px; }
    .spell-input { font-size: 20px; padding: 12px; }

    /* 결과 */
    .result-hero { padding: 16px 12px; }
    .result-emoji { font-size: 64px; }
    .result-title { font-size: 28px; }
    .stat-num { font-size: 22px; }
    .stat-box { padding: 10px 6px; }

    /* 커스텀 단어 폼 (기존 520px 쿼리 통합) */
    .custom-form { grid-template-columns: 1fr 1fr; }
    .custom-form .btn { grid-column: 1 / -1; }

    /* 홈 배너 */
    .home-banner { padding: 10px 12px; }
  }
```

- [ ] **Step 4: Commit**

```powershell
git add index.html
git commit -m "style: unified 600px mobile breakpoint with compact header"
```

---

### Task 3: 배포 및 실서비스 검증

**Files:** 없음

- [ ] **Step 1: 배포**

Run: `firebase deploy --only hosting`
Expected: `Deploy complete!`

- [ ] **Step 2: 실서비스 검증 (사용자 또는 데브툴)**

1. 360px/390px 폭에서 헤더가 2단(아바타·이름·아이콘 / XP바 전폭)으로 정리되는지.
2. 홈·모드 선택·퀴즈·스펠링·결과 화면에 가로 스크롤이 없는지.
3. 스펠링에서 `grandmother`(가족 카테고리, 11자) 글자 슬롯이 한 줄에 들어가는지 (24px×11 + 3px×10 = 294px ≤ 콘텐츠 폭 302px = 360 − 앱 패딩 24 − 카드 패딩 28 − 보더 6).
4. 데스크톱 900px에서 기존 레이아웃 유지 + 헤더 아이콘 버튼만 44px 정사각으로 정돈되는지.
5. 550px(중간 폭)에서 모바일 규칙이 적용되는지.

- [ ] **Step 3: 푸시**

문제 없으면 푸시. 문제 발견 시 수정 → 커밋 → 재배포 후 푸시.

```powershell
git push
```
