# 스펠링 간격 반복 + 오답 이력 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펠링 모드에 라이트너 박스 기반 간격 반복, 오답 즉시 교정(글자 diff + 따라쓰기), 라운드 끝 오답 재도전, 홈 화면 "오늘의 복습" 카드를 추가한다.

**Architecture:** `users/{uid}` 문서에 `wordStats` 맵 필드(`"카테고리:단어"` 키)를 추가하고, 스펠링 정답만 박스를 승급시킨다(객관식은 카운트만, 오답은 모든 정오답 모드에서 박스 1 강등). 출제는 기한 도래 → 취약 → 새 단어 → 나머지 순. 마스터는 박스 4 도달 시에만 등록한다.

**Tech Stack:** Vanilla JS (ES 모듈, 인라인 onclick → window 노출), Firebase Firestore, Firebase Hosting.

**스펙:** `docs/superpowers/specs/2026-06-10-spelling-spaced-repetition-design.md`

**검증 방식:** 이 프로젝트는 테스트 프레임워크가 없는 정적 바닐라 JS다. 사용자 결정에 따라 로컬 서버 없이 각 태스크 후 `node --check`로 구문 검증만 하고, 마지막 태스크에서 `firebase deploy` 후 실서비스에서 시나리오 검증한다.

**중요:** 모든 명령은 `H:\ClaudeProjects\EngStudy\EngStudy`에서 실행한다. 줄 번호는 2026-06-10 기준(`baf17e8` + 스펙 커밋)이며 선행 태스크 진행에 따라 밀릴 수 있으므로 함수명으로 위치를 찾을 것.

---

### Task 1: wordStats 데이터 계층

**Files:**
- Modify: `js/store.js` (loadState/saveState)
- Modify: `js/game.js` (상수, state, loadState 방어, saveState, 헬퍼 함수)

- [ ] **Step 1: store.js에 wordStats 추가**

`js/store.js`의 `loadState()` 반환 객체에 한 줄 추가 (`soundEnabled` 줄 앞).

```javascript
    mastered: d.mastered || {},
    wordStats: d.wordStats || {},
    soundEnabled: typeof d.soundEnabled === 'boolean' ? d.soundEnabled : true
```

`saveState()`의 `update` 객체에도 추가.

```javascript
    mastered: stateObj.mastered || {},
    wordStats: stateObj.wordStats || {},
    soundEnabled: stateObj.soundEnabled
```

- [ ] **Step 2: game.js 상수 추가**

`js/game.js`의 `const QUESTIONS_PER_ROUND = 8;` (line ~481) 바로 아래에 추가.

```javascript
// 라이트너 박스: 인덱스 = 박스 번호(1~5), 값 = 다음 복습까지 일수. 박스1 = 즉시.
const BOX_INTERVALS_DAYS = [0, 0, 1, 3, 7, 14];
const MAX_BOX = 5;
const MASTER_BOX = 4;
const XP_RETRY_CORRECT = 5;
const DAY_MS = 86400000;
```

- [ ] **Step 3: state에 wordStats 추가**

`let state = {` (line ~515) 안의 `mastered: {},` 아래에 추가.

```javascript
  mastered: {}, // { categoryKey: [wordEn, wordEn...] }
  wordStats: {}, // { "catKey:wordEn": { box, dueAt, correct, wrong, lastSeen } }
```

`async function loadState()` (line ~529) 안의 `if (!state.bestTyper ...)` 줄 아래에 방어 코드 추가.

```javascript
    if (!state.bestTyper || typeof state.bestTyper !== 'object') state.bestTyper = {};
    if (!state.wordStats || typeof state.wordStats !== 'object') state.wordStats = {};
```

`async function saveState()` (line ~547)의 `toSave` 객체에 추가.

```javascript
    mastered: state.mastered,
    wordStats: state.wordStats,
    bestTyper: state.bestTyper,
```

- [ ] **Step 4: 헬퍼 함수 추가**

`js/game.js`의 `function markMastered(catKey, wordEn)` (line ~1998) 바로 위에 추가.

```javascript
// ==========================================================
// WORD STATS (라이트너 박스 간격 반복)
// ==========================================================
function statKey(catKey, en) {
  return `${catKey}:${en}`;
}

function getWordStat(catKey, en) {
  return state.wordStats[statKey(catKey, en)] || null;
}

// 정오답 기록. promote: true면 정답 시 박스 승급(스펠링 모드 전용).
// 박스 4 도달 시 마스터 등록. 랜덤 카테고리는 갱신하지 않음.
function recordAnswer(catKey, en, isCorrect, { promote = false } = {}) {
  if (!catKey || VOCAB[catKey]?.isRandom) return;
  const key = statKey(catKey, en);
  const now = Date.now();
  const s = state.wordStats[key] || { box: 1, dueAt: now, correct: 0, wrong: 0, lastSeen: 0 };
  if (isCorrect) {
    s.correct++;
    if (promote) {
      s.box = Math.min(MAX_BOX, s.box + 1);
      s.dueAt = now + BOX_INTERVALS_DAYS[s.box] * DAY_MS;
      if (s.box >= MASTER_BOX) markMastered(catKey, en);
    }
  } else {
    s.wrong++;
    s.box = 1;
    s.dueAt = now;
  }
  s.lastSeen = now;
  state.wordStats[key] = s;
  saveState();
}
```

참고: `markMastered()`는 신규 등록 시 내부에서 `saveState()`를 한 번 더 호출하지만, 멱등 업데이트라 무해하다. `markMastered()` 자체는 수정하지 않는다.

- [ ] **Step 5: 구문 검증**

Run: `node --check js/game.js; node --check js/store.js`
Expected: 출력 없음 (구문 오류 없음)

- [ ] **Step 6: Commit**

```powershell
git add js/store.js js/game.js
git commit -m "feat(srs): add wordStats data layer with Leitner boxes"
```

---

### Task 2: 퀴즈 모드에 박스 갱신 연결 + 마스터 기준 변경

**Files:**
- Modify: `js/game.js` — `checkSpelling()`(~1590), `answerMeaning()`(~1403 부근), `answerWord()`(~1476 부근), 타이퍼 처치 처리(~1862)

- [ ] **Step 1: checkSpelling 수정**

`checkSpelling()`에서 `markMastered(...)` 호출을 `recordAnswer`로 교체하고 오답도 기록한다. 함수 전체를 아래로 교체.

```javascript
function checkSpelling() {
  const gs = state.gameState;
  if (gs.answered) return;
  const input = document.getElementById('spellInput').value.trim().toLowerCase();
  const word = gs.words[gs.idx];
  const correct = input === word.en.toLowerCase();
  gs.answered = true;
  gs.isCorrect = correct;
  const catKey = word._cat || state.currentCategory;
  if (correct) {
    gs.correct++;
    playSound('correct');
    recordAnswer(catKey, word.en, true, { promote: true });
    setTimeout(() => speak(word.en), 200);
    trackEvent('correct');
  } else {
    playSound('wrong');
    recordAnswer(catKey, word.en, false);
    trackEvent('wrong');
  }
  render();
}
```

(`word._cat`은 Task 6의 카테고리 혼합 복습 라운드에서 사용. 일반 라운드에선 undefined → `state.currentCategory`.)

- [ ] **Step 2: answerMeaning 수정**

`answerMeaning()` 안의 정답 분기에서 `markMastered(state.currentCategory, word.en);` 줄을 삭제하고, `if (isCorrect) { ... } else { ... }` 블록 직후(=`render()` 호출 전)에 한 줄 추가.

```javascript
  recordAnswer(state.currentCategory, word.en, isCorrect);
```

수정 후 함수 전체 모습.

```javascript
function answerMeaning(i) {
  const gs = state.gameState;
  if (gs.answered) return;
  gs.answered = true;
  gs.selectedIdx = i;
  const word = gs.words[gs.idx];
  const isCorrect = gs.options[i].en === word.en;
  if (isCorrect) {
    gs.correct++;
    playSound('correct');
    trackEvent('correct');
  } else {
    playSound('wrong');
    trackEvent('wrong');
  }
  recordAnswer(state.currentCategory, word.en, isCorrect);
  render();
}
```

- [ ] **Step 3: answerWord 수정**

같은 방식으로 `answerWord()`의 `markMastered(...)` 줄을 삭제하고 `recordAnswer` 호출을 추가. 수정 후 함수 전체 모습.

```javascript
function answerWord(i) {
  const gs = state.gameState;
  if (gs.answered) return;
  gs.answered = true;
  gs.selectedIdx = i;
  const word = gs.words[gs.idx];
  const isCorrect = gs.options[i].en === word.en;
  if (isCorrect) {
    gs.correct++;
    playSound('correct');
    trackEvent('correct');
  } else {
    playSound('wrong');
    trackEvent('wrong');
  }
  recordAnswer(state.currentCategory, word.en, isCorrect);
  if (isCorrect) setTimeout(() => speak(word.en), 200);
  render();
}
```

- [ ] **Step 4: 타이퍼의 markMastered 제거**

`js/game.js:1862` 부근(타이퍼 단어 처치 처리)의 `markMastered(state.currentCategory, w.en);` 한 줄을 삭제한다. 스펙: 타자 우주는 단어별 정오답 개념이 없어 `wordStats`·마스터를 갱신하지 않는다.

- [ ] **Step 5: 구문 검증**

Run: `node --check js/game.js`
Expected: 출력 없음

- [ ] **Step 6: Commit**

```powershell
git add js/game.js
git commit -m "feat(srs): wire box updates into quiz modes, master only at box 4"
```

---

### Task 3: 스펠링 출제 우선순위

**Files:**
- Modify: `js/game.js` — `startQuiz()`(~1335), Task 1에서 추가한 헬퍼 아래에 `pickSpellingWords()` 추가

- [ ] **Step 1: pickSpellingWords 추가**

`recordAnswer()` 함수 바로 아래에 추가.

```javascript
// 스펠링 출제 우선순위: 기한 도래(오래된 순) → 취약(박스1+오답이력) → 새 단어 → 나머지
function pickSpellingWords(catKey) {
  const cat = VOCAB[catKey];
  if (cat.isRandom) {
    return shuffle(cat.words).slice(0, Math.min(QUESTIONS_PER_ROUND, cat.words.length));
  }
  const now = Date.now();
  const due = [], weak = [], fresh = [], rest = [];
  for (const w of cat.words) {
    const s = getWordStat(catKey, w.en);
    if (!s) fresh.push(w);
    else if (s.dueAt <= now) due.push({ w, s });
    else if (s.box === 1 && s.wrong > 0) weak.push(w);
    else rest.push(w);
  }
  due.sort((a, b) => a.s.dueAt - b.s.dueAt);
  const ordered = [...due.map(d => d.w), ...shuffle(weak), ...shuffle(fresh), ...shuffle(rest)];
  return shuffle(ordered.slice(0, Math.min(QUESTIONS_PER_ROUND, ordered.length)));
}
```

- [ ] **Step 2: startQuiz에서 스펠링만 우선순위 선택 사용**

`startQuiz()`의 단어 선택 두 줄을 교체. 수정 후 함수 전체 모습.

```javascript
function startQuiz(mode) {
  const cat = VOCAB[state.currentCategory];
  const words = mode === 'spelling'
    ? pickSpellingWords(state.currentCategory)
    : shuffle(cat.words).slice(0, Math.min(QUESTIONS_PER_ROUND, cat.words.length));
  state.gameState = {
    mode: mode,
    words: words,
    idx: 0,
    correct: 0,
    answered: false,
    selectedIdx: null,
    wrongWords: []
  };
  state.screen = mode;
  render();
  if (mode === 'meaning') setTimeout(() => speak(words[0].en), 300);
}
```

(`wrongWords: []`는 Task 5의 재도전 라운드가 사용한다. 다른 모드에선 빈 배열로 무해.)

- [ ] **Step 3: 구문 검증**

Run: `node --check js/game.js`
Expected: 출력 없음

- [ ] **Step 4: Commit**

```powershell
git add js/game.js
git commit -m "feat(srs): prioritize due/weak/new words in spelling rounds"
```

---

### Task 4: 오답 글자 diff + 교정 재입력

**Files:**
- Modify: `js/game.js` — `checkSpelling()`, `renderSpelling()`, 새 함수 `checkSpellCopy()`/`handleCopyKey()`, `render()`의 autofocus, 파일 끝 `__exports`
- Modify: `index.html` — `.spell-slot.space` 줄(~580) 아래 CSS 2줄

- [ ] **Step 1: CSS 추가**

`index.html`의 `.spell-slot.space { ... }` (line ~580) 바로 아래에 추가.

```css
  .spell-slot.diff-ok { background: #E8F5E9; border-color: var(--success); color: var(--success); }
  .spell-slot.diff-bad { background: #FFEBEE; border-color: var(--danger); color: var(--danger); }
```

- [ ] **Step 2: checkSpelling에 입력 보존·따라쓰기 상태 추가**

`checkSpelling()`의 `gs.isCorrect = correct;` 줄 아래에 두 줄 추가.

```javascript
  gs.isCorrect = correct;
  gs.lastInput = input;
  gs.copyDone = false;
```

- [ ] **Step 3: renderSpelling의 answered 분기 교체**

`renderSpelling()` 함수 전체를 아래로 교체.

```javascript
function renderSpelling() {
  const gs = state.gameState;
  const word = gs.words[gs.idx];

  const slots = word.en.split('').map(c =>
    c === ' ' ? '<div class="spell-slot space"></div>' : `<div class="spell-slot">?</div>`
  ).join('');

  // 오답 시: 정답 글자 슬롯을 펼치고, 입력과 같은 위치가 일치하면 초록·다르면 빨강 (단순 위치 비교)
  const diffSlots = word.en.split('').map((c, i) => {
    if (c === ' ') return '<div class="spell-slot space"></div>';
    const ok = (gs.lastInput || '')[i] === c.toLowerCase();
    return `<div class="spell-slot ${ok ? 'diff-ok' : 'diff-bad'}">${c}</div>`;
  }).join('');

  const nextLabel = gs.idx === gs.words.length - 1 ? '결과 보기 🏆' : '다음 문제 →';

  return `
    ${renderHeader()}
    <div class="card">
      <div class="game-header">
        <button class="btn btn-ghost btn-sm" onclick="backToMode()">← 나가기</button>
        <div class="progress-pill">✍️ ${gs.idx + 1} / ${gs.words.length} · ✅ ${gs.correct}</div>
      </div>

      <div class="spell-display">
        <div class="spell-mean">${word.ko}</div>
        <div class="spell-hint">${gs.answered && !gs.isCorrect ? diffSlots : slots}</div>
        <button class="speak-btn" onclick="speak('${word.en}')" style="margin: 12px auto 0;">🔊</button>
      </div>

      ${gs.answered ? '' : `
      <input type="text"
             class="spell-input"
             id="spellInput"
             placeholder="${word.en.length}글자로 써보세요"
             autocomplete="off"
             spellcheck="false"
             onkeydown="handleSpellKey(event)">
      `}

      ${gs.answered ? (gs.isCorrect ? `
        <div class="feedback correct">🎉 완벽해! <b>${word.en}</b> = ${word.ko}</div>
        <div style="text-align:center;">
          <button class="btn btn-primary" onclick="nextQuestion()">${nextLabel}</button>
        </div>
      ` : `
        <div class="feedback wrong">😢 내 답: <b>${gs.lastInput || '(빈 칸)'}</b> — 빨간 글자를 잘 봐!</div>
        ${gs.copyDone ? `
          <div class="feedback correct">👍 잘 따라 썼어! 이제 다음 문제로!</div>
          <div style="text-align:center;">
            <button class="btn btn-primary" onclick="nextQuestion()">${nextLabel}</button>
          </div>
        ` : `
          <div class="help-text" style="margin-top: 10px;">✏️ 정답을 보고 한 번 따라 써보자!</div>
          <input type="text"
                 class="spell-input"
                 id="copyInput"
                 placeholder="${word.en}"
                 autocomplete="off"
                 spellcheck="false"
                 onkeydown="handleCopyKey(event)">
          <div style="text-align:center; margin-top: 12px;">
            <button class="btn btn-primary btn-sm" onclick="checkSpellCopy()">따라 쓰기 확인 ✓</button>
          </div>
        `}
      `) : `
        <div class="controls-row" style="justify-content: center; margin-top: 12px;">
          <button class="btn btn-accent btn-sm" onclick="speak('${word.en}')">🔊 다시 듣기</button>
          <button class="btn btn-primary btn-sm" onclick="checkSpelling()">확인 ✓</button>
        </div>
        <div class="help-text">💡 모르겠으면 소리 버튼을 눌러 들어봐!</div>
      `}
    </div>
  `;
}
```

- [ ] **Step 4: 따라쓰기 검증 함수 추가**

`handleSpellKey()` 함수 바로 아래에 추가.

```javascript
// 오답 교정: 정답을 보고 따라 써야 다음으로 진행. XP·박스에 영향 없음.
function checkSpellCopy() {
  const gs = state.gameState;
  if (!gs.answered || gs.isCorrect || gs.copyDone) return;
  const word = gs.words[gs.idx];
  const el = document.getElementById('copyInput');
  const val = el.value.trim().toLowerCase();
  if (val === word.en.toLowerCase()) {
    gs.copyDone = true;
    playSound('correct');
    render();
  } else {
    playSound('wrong');
    el.classList.add('wrong');
    setTimeout(() => el.classList.remove('wrong'), 500);
  }
}

function handleCopyKey(event) {
  if (event.key === 'Enter') {
    checkSpellCopy();
    return;
  }
  if (event.key.length === 1 || event.key === 'Backspace') {
    playSound('type');
  }
}
```

- [ ] **Step 5: render()에 copyInput 자동 포커싱 추가**

`render()` 안의 `if (spellInput && !state.gameState?.answered) spellInput.focus();` 줄 아래에 추가.

```javascript
  const copyInput = document.getElementById('copyInput');
  if (copyInput) copyInput.focus();
```

- [ ] **Step 6: window 노출 추가**

파일 끝 `__exports` 객체(알파벳순)에 두 항목 추가.

```javascript
  checkSpellCopy,
  handleCopyKey,
```

- [ ] **Step 7: 구문 검증**

Run: `node --check js/game.js`
Expected: 출력 없음

- [ ] **Step 8: Commit**

```powershell
git add js/game.js index.html
git commit -m "feat(spelling): letter diff feedback + copy-the-correction gate"
```

---

### Task 5: 라운드 끝 오답 재도전

**Files:**
- Modify: `js/game.js` — `checkSpelling()`, `nextQuestion()`(~1496), `finishQuiz()`(~1510), `renderResult()`(~2022), 새 함수 `startRetryRound()`

- [ ] **Step 1: checkSpelling에서 오답 수집**

`checkSpelling()`의 오답 분기 첫 줄에 추가. 수정 후 오답 분기 모습.

```javascript
  } else {
    if (gs.wrongWords) gs.wrongWords.push(word);
    playSound('wrong');
    recordAnswer(catKey, word.en, false);
    trackEvent('wrong');
  }
```

- [ ] **Step 2: nextQuestion에서 재도전 분기**

`nextQuestion()` 전체를 아래로 교체.

```javascript
function nextQuestion() {
  const gs = state.gameState;
  gs.idx++;
  gs.answered = false;
  gs.selectedIdx = null;
  gs.options = null;
  if (gs.idx >= gs.words.length) {
    if (gs.mode === 'spelling' && !gs.isRetry && gs.wrongWords && gs.wrongWords.length > 0) {
      startRetryRound();
    } else {
      finishQuiz();
    }
  } else {
    render();
    if (gs.mode === 'meaning') setTimeout(() => speak(gs.words[gs.idx].en), 300);
  }
}
```

- [ ] **Step 3: startRetryRound 추가**

`nextQuestion()` 바로 아래에 추가.

```javascript
// 스펠링 본 라운드 종료 후 오답만 1회 재출제. 재도전 정답 XP는 절반(5).
function startRetryRound() {
  const gs = state.gameState;
  playSound('gameStart');
  state.gameState = {
    mode: 'spelling',
    words: shuffle(gs.wrongWords),
    idx: 0,
    correct: 0,
    answered: false,
    selectedIdx: null,
    wrongWords: [],
    isRetry: true,
    isReview: gs.isReview || false,
    mainCorrect: gs.correct,
    mainTotal: gs.words.length
  };
  render();
}
```

- [ ] **Step 4: finishQuiz에서 합산 정산**

`finishQuiz()` 전체를 아래로 교체.

```javascript
function finishQuiz() {
  const gs = state.gameState;
  const mainCorrect = gs.isRetry ? gs.mainCorrect : gs.correct;
  const mainTotal = gs.isRetry ? gs.mainTotal : gs.words.length;
  const retryCorrect = gs.isRetry ? gs.correct : 0;
  let xpGained = mainCorrect * XP_CORRECT + retryCorrect * XP_RETRY_CORRECT;
  const isPerfect = mainCorrect === mainTotal;
  if (isPerfect) xpGained += XP_BONUS_PERFECT;
  addXP(xpGained);
  updateStreak();
  state.gameState = {
    mode: gs.mode,
    total: mainTotal,
    correct: mainCorrect,
    retryCorrect: retryCorrect,
    isReview: gs.isReview || false,
    xpGained: xpGained,
    perfect: isPerfect
  };
  state.screen = 'result';
  render();
  if (isPerfect) {
    setTimeout(() => playSound('perfect'), 200);
    setTimeout(confetti, 300);
  } else if (mainCorrect / mainTotal >= 0.75) {
    setTimeout(() => playSound('streak'), 200);
  }
}
```

참고: `round_end` 업적 추적과 결과 화면의 정답/정답률은 본 라운드 수치(mainCorrect/mainTotal)를 쓴다. 재도전이 발생했다면 본 라운드에 오답이 있었으므로 perfect는 자연히 false다.

- [ ] **Step 5: renderResult에 재도전 합산 표시**

`renderResult()`의 `</div>` (`.result-stats` 닫는 태그) 바로 아래, `.controls-row` div 위에 추가.

```javascript
      ${gs.retryCorrect > 0 ? `
        <div style="text-align:center; font-family: 'Gowun Dodum'; font-size: 14px; color: var(--navy-soft); margin-bottom: 12px;">
          🔁 재도전으로 ${gs.retryCorrect}개 더 맞혔어! (+${gs.retryCorrect * XP_RETRY_CORRECT} XP 포함)
        </div>
      ` : ''}
```

- [ ] **Step 6: 재도전 라운드 표시 차별화**

`renderSpelling()`의 progress-pill 줄을 교체.

```javascript
        <div class="progress-pill">${gs.isRetry ? '🔁 다시 도전!' : '✍️'} ${gs.idx + 1} / ${gs.words.length} · ✅ ${gs.correct}</div>
```

- [ ] **Step 7: 구문 검증**

Run: `node --check js/game.js`
Expected: 출력 없음

- [ ] **Step 8: Commit**

```powershell
git add js/game.js
git commit -m "feat(spelling): auto retry round for wrong words with half XP"
```

---

### Task 6: 홈 화면 "오늘의 복습" 카드 + 혼합 복습 라운드

**Files:**
- Modify: `js/game.js` — `pickSpellingWords()` 아래에 `getDueWords()`/`startReview()` 추가, `renderHome()`(~1005), `renderSpelling()` 나가기 버튼, `renderResult()` 버튼, `__exports`

- [ ] **Step 1: getDueWords / startReview 추가**

`pickSpellingWords()` 바로 아래에 추가.

```javascript
// 복습 기한이 도래한 단어를 전 카테고리에서 수집 (오래된 순).
// 랜덤 카테고리 제외, 삭제된 커스텀 단어 등 고아 stats는 무시.
function getDueWords() {
  const now = Date.now();
  const out = [];
  for (const key of Object.keys(state.wordStats)) {
    const s = state.wordStats[key];
    if (!s || s.dueAt > now) continue;
    const sep = key.indexOf(':');
    if (sep < 0) continue;
    const catKey = key.slice(0, sep);
    const en = key.slice(sep + 1);
    const cat = VOCAB[catKey];
    if (!cat || cat.isRandom) continue;
    const w = cat.words.find(x => x.en === en);
    if (w) out.push({ en: w.en, ko: w.ko, _cat: catKey, _dueAt: s.dueAt });
  }
  return out.sort((a, b) => a._dueAt - b._dueAt);
}

// 홈의 "오늘의 복습" 카드 → 카테고리 혼합 스펠링 라운드
function startReview() {
  const due = getDueWords();
  if (!due.length) return;
  state.currentCategory = null;
  state.currentMode = 'spelling';
  playSound('gameStart');
  state.gameState = {
    mode: 'spelling',
    words: due.slice(0, QUESTIONS_PER_ROUND),
    idx: 0,
    correct: 0,
    answered: false,
    selectedIdx: null,
    wrongWords: [],
    isReview: true
  };
  state.screen = 'spelling';
  render();
}
```

- [ ] **Step 2: renderHome에 복습 카드 추가**

`renderHome()` 함수 시작부에 due 집계를 추가하고, "전체 진도" div 닫힌 직후에 카드를 넣는다. `const totalPct = ...` 줄 아래에 추가.

```javascript
  const dueCount = getDueWords().length;
```

"전체 진도" div(`</div>`로 닫히는 `linear-gradient(135deg, #FFE5B4, ...)` 블록) 바로 아래에 추가.

```javascript
      ${dueCount > 0 ? `
        <div onclick="startReview()" style="background: linear-gradient(135deg, #E3F2FD, #BBDEFB); padding: 14px 18px; border-radius: 14px; border: 3px solid var(--navy); display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; cursor: pointer;">
          <div>
            <div style="font-family: 'Fredoka'; font-weight: 600; font-size: 16px; color: var(--navy);">🔔 오늘의 복습</div>
            <div style="font-family: 'Gowun Dodum'; font-size: 13px; color: var(--navy-soft);">복습할 단어 ${dueCount}개! 스펠링으로 도전해보자</div>
          </div>
          <div style="font-family: 'Fredoka'; font-size: 22px; font-weight: 700; color: var(--primary);">GO →</div>
        </div>
      ` : ''}
```

- [ ] **Step 3: 복습 라운드의 나가기 동선 처리**

복습 라운드는 `state.currentCategory`가 null이라 `backToMode()`(modeSelect로 복귀)가 깨진다.

`renderSpelling()`의 나가기 버튼 줄을 교체.

```javascript
        <button class="btn btn-ghost btn-sm" onclick="${gs.isReview ? 'goHome()' : 'backToMode()'}">← 나가기</button>
```

`renderResult()`의 버튼 블록을 교체.

```javascript
      <div class="controls-row" style="justify-content: center;">
        ${gs.isReview ? '' : `<button class="btn btn-accent" onclick="backToMode()">🔁 한번 더</button>`}
        <button class="btn btn-primary" onclick="goHome()">🏠 처음으로</button>
      </div>
```

`renderResult()`의 `round_end` 추적은 `state.currentMode`를 쓰는데 `startReview()`가 `'spelling'`으로 설정하므로 그대로 동작한다.

- [ ] **Step 4: window 노출 추가**

`__exports` 객체에 추가 (알파벳순 위치).

```javascript
  startReview,
```

- [ ] **Step 5: 구문 검증**

Run: `node --check js/game.js`
Expected: 출력 없음

- [ ] **Step 6: Commit**

```powershell
git add js/game.js
git commit -m "feat(srs): today's review card with mixed-category spelling round"
```

---

### Task 7: 배포 및 실서비스 검증

**Files:** 없음 (배포·검증만)

- [ ] **Step 1: 배포**

Run: `firebase deploy --only hosting` (작업 디렉토리: `H:\ClaudeProjects\EngStudy\EngStudy`)
Expected: `Deploy complete!` 와 Hosting URL 출력

- [ ] **Step 2: 실서비스 시나리오 검증 (사용자 또는 브라우저로 수행)**

배포된 사이트에 로그인 후 순서대로 확인한다.

1. **오답 교정 루프**: 아무 카테고리 → 스펠링 도전 → 일부러 틀리기 → 정답 글자 슬롯에 빨강/초록 diff 표시 + "따라 써보자" 입력란 노출 → 오타 입력 시 흔들림, 정답 입력 시에만 다음 문제 버튼 등장.
2. **재도전 라운드**: 8문제 중 1개 이상 틀린 뒤 마지막 문제 완료 → "🔁 다시 도전!" 라운드 자동 시작 → 결과 화면에 "재도전으로 N개 더 맞혔어!" 표시, XP = 본라운드×10 + 재도전×5.
3. **wordStats 저장**: Firebase 콘솔 → Firestore → `users/{uid}` 문서에 `wordStats` 맵 생성 확인. 정답 단어는 `box: 2`, 틀린 단어는 `box: 1` + `dueAt` ≈ 지금.
4. **마스터 기준**: 객관식(뜻/단어 맞추기) 정답으로는 홈 진도 수치가 늘지 않고, 스펠링으로 박스 4에 도달해야 마스터 집계 증가. (빠른 확인: Firestore 콘솔에서 특정 단어의 `box`를 3으로 수정 후 스펠링 정답 → 마스터 등록)
5. **오늘의 복습**: Firestore 콘솔에서 단어 2~3개의 `dueAt`을 과거 값(예: 1)으로 수정 → 새로고침 → 홈에 "🔔 오늘의 복습 N개" 카드 노출 → 클릭 시 카테고리 혼합 스펠링 라운드 시작 → 완료 후 카드의 개수 감소/소멸.
6. **회귀 확인**: 플래시카드·뜻 맞추기·단어 맞추기·타자 우주·커스텀 단어장이 기존대로 동작.

- [ ] **Step 3: 검증 결과에 따라 마무리**

문제 발견 시 수정 → `node --check` → 커밋 → 재배포. 이상 없으면 `git push`로 origin/main에 반영.

```powershell
git push
```
