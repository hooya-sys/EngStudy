# 타자 우주 (Typer Space) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 짝맞추기(`matching`) 모드를 제거하고, 한메타자교사의 베네치아 게임과 같은 낙하 타자 게임 `typer`(타자 우주)을 새 모드로 추가한다.

**Architecture:** Vanilla JS + DOM. 게임 진입 시 `app.innerHTML`로 UI를 1회 마운트하고, 이후 `requestAnimationFrame` 루프에서 낙하 단어 DOM을 직접 조작한다(매 프레임 innerHTML 재생성 금지). 입력은 하단 고정 `<input>`의 `oninput`/`onkeydown`으로 처리. 게임 상태는 기존 `state.gameState` 컨벤션을 따른다.

**Tech Stack:** Vanilla JS ES modules, CSS keyframes, Firebase Hosting (브라우저 수동 검증).

**Spec:** `docs/superpowers/specs/2026-05-15-typer-game-design.md` (필요 시 참조)

## 검증 환경

이 프로젝트엔 자동 테스트가 없다. 각 태스크 검증은 **브라우저 수동 점검**:

1. 로컬 정적 서버 띄우기:
   - `firebase serve --only hosting` (포트 5000)
   - 또는 `python -m http.server 8080`
2. 브라우저에서 `http://localhost:5000` (또는 8080) 열기.
3. 로그인 → 주제학습 카테고리 선택 → 모드 화면에서 점검.

DevTools Console를 열어둘 것. 에러·경고 없어야 함.

## 파일 구조

- **수정:** `js/game.js`
  - MODES 변경, 짝맞추기 함수/스위치 삭제, 타자 우주 함수 추가, state 확장, exports 갱신
- **수정:** `index.html`
  - `<style>` 블록에서 `.match-*` CSS 삭제, `.typer-*` CSS 추가
- **참조 가능:** `js/achievements.js` (수정 불요, dead key 무해 잔존)
- **새 파일 없음**

---

## Task 1: 짝맞추기 모드 제거

**목표:** 코드베이스에서 `matching` 흔적 완전 제거. 메뉴/게임/CSS 모두.

**Files:**
- Modify: `js/game.js` (여러 위치)
- Modify: `index.html` (~604–631)

- [ ] **Step 1: `MODES.matching` 삭제**

`js/game.js:494` 한 줄 제거:

```js
matching: { name: '짝 맞추기', desc: '영어-한국어 짝 찾기', emoji: '🧩', color: '#FF6F91' },
```

- [ ] **Step 2: `renderModeSelect()`의 `needsPairs` 제거**

`js/game.js:1022-1037` 부근. 변경 전:

```js
const needsChoices = (mk === 'meaning' || mk === 'word');
const needsPairs = (mk === 'matching');
const disabled = (mk !== 'wordlist' && cat.words.length === 0)
  || (needsChoices && cat.words.length < 4)
  || (needsPairs && cat.words.length < 2);
const disabledStyle = disabled ? 'opacity:0.45; cursor:not-allowed;' : '';
const disabledHint = disabled
  ? `<div style="font-size: 11px; color: var(--danger); font-family: 'Gowun Dodum'; margin-top: 2px;">${
      cat.words.length === 0
        ? '단어가 필요해요'
        : needsChoices ? '4개 이상 단어 필요'
        : needsPairs ? '2개 이상 단어 필요' : ''
    }</div>`
  : '';
```

변경 후:

```js
const needsChoices = (mk === 'meaning' || mk === 'word');
const disabled = (mk !== 'wordlist' && cat.words.length === 0)
  || (needsChoices && cat.words.length < 4);
const disabledStyle = disabled ? 'opacity:0.45; cursor:not-allowed;' : '';
const disabledHint = disabled
  ? `<div style="font-size: 11px; color: var(--danger); font-family: 'Gowun Dodum'; margin-top: 2px;">${
      cat.words.length === 0
        ? '단어가 필요해요'
        : needsChoices ? '4개 이상 단어 필요' : ''
    }</div>`
  : '';
```

- [ ] **Step 3: MATCHING MODE 함수 블록 통째 삭제**

`js/game.js:1562-1686` 사이 헤더 주석 + 4개 함수 모두 삭제:

```js
// ==========================================================
// MATCHING MODE
// ==========================================================
function startMatching() { ... }
function renderMatching() { ... }
function selectTile(id) { ... }
function finishMatching() { ... }
```

(`finishFlashcard`부터는 남김.)

- [ ] **Step 4: `startMode` 분기 삭제**

`js/game.js:1869` 한 줄 제거:

```js
else if (mode === 'matching') startMatching();
```

(앞 줄 `if (mode === 'flashcard') startFlashcard();`와 뒤 `else startQuiz(mode);`는 그대로.)

- [ ] **Step 5: `render()` switch case 삭제**

`js/game.js:1904` 한 줄 제거:

```js
case 'matching': html = renderMatching(); break;
```

- [ ] **Step 6: `__exports`에서 항목 제거**

`js/game.js:2028, 2037` — `finishMatching,` 와 `selectTile,` 두 줄 제거.

- [ ] **Step 7: `index.html`의 match CSS 삭제**

`index.html:604-631` 사이 다음 블록 통째 삭제:

```css
.match-grid { ... }
.match-tile { ... }
.match-tile.eng { ... }
.match-tile.kor { ... }
.match-tile:hover:not(.matched):not(.selected) { ... }
.match-tile.selected { ... }
.match-tile.matched { ... }
.match-tile.wrong-match { ... }
```

- [ ] **Step 8: grep으로 잔재 0건 확인**

Run: Grep 도구로 `matching|match-tile|match-grid` (path: 프로젝트 루트, glob: `*.{js,html,css}`)
Expected: **No matches found** (achievements.js의 `mode_used` 핸들러는 변수 키로 저장하므로 'matching' 리터럴 없음 — 영향 X)

- [ ] **Step 9: 브라우저 검증**

로컬 서버 실행 후:
1. 로그인 → 카테고리 선택 → 모드 화면 열기
2. Expected: "🧩 짝 맞추기" 카드 사라짐. 나머지 5개 모드(단어목록/카드/뜻맞추기/단어맞추기/스펠링) 정상 노출.
3. DevTools Console 에러 없음.
4. 임의 모드 1개(예: 뜻맞추기) 진입·플레이·결과화면까지 정상 작동.

- [ ] **Step 10: Commit**

```bash
git add js/game.js index.html
git commit -m "refactor: remove 짝맞추기(matching) mode

타자 우주 모드로 대체하기 위한 사전 정리. MODES 항목·함수 4개·
render 분기·CSS 블록·exports 항목 모두 제거."
```

---

## Task 2: MODES.typer 등록 + state.bestTyper 스캐폴딩

**목표:** 메뉴에 "🚀 타자 우주" 카드 노출. 클릭 시 빈 placeholder 화면 표시. 게임 로직은 다음 태스크.

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: `MODES.typer` 추가**

`js/game.js:489-496`의 `MODES` 객체 끝에 추가 (`spelling` 다음 줄):

```js
const MODES = {
  wordlist: { name: '단어 목록', desc: '전체 단어와 뜻·발음 한눈에', emoji: '📋', color: '#4CAF50' },
  flashcard: { name: '단어 카드', desc: '카드 넘기며 단어 익히기', emoji: '🎴', color: '#FFC857' },
  meaning: { name: '뜻 맞추기', desc: '영어 → 한국어 뜻 고르기', emoji: '🎯', color: '#FF8C42' },
  word: { name: '단어 맞추기', desc: '한국어 → 영어 단어 고르기', emoji: '🔤', color: '#2EC4B6' },
  spelling: { name: '스펠링 도전', desc: '단어 직접 써보기', emoji: '✍️', color: '#845EC2' },
  typer: { name: '타자 우주', desc: '떨어지는 한글을 영어로 쳐서 처치', emoji: '🚀', color: '#7B2CBF' }
};
```

- [ ] **Step 2: `state` 초기값에 `bestTyper` 추가**

`js/game.js:501-512`의 `state` 객체에 `bestTyper: {}` 추가:

```js
let state = {
  name: '',
  xp: 0,
  level: 1,
  streak: 0,
  lastPlayed: null,
  mastered: {},
  bestTyper: {},
  screen: 'welcome',
  currentCategory: null,
  currentMode: null,
  gameState: null
};
```

- [ ] **Step 3: `loadState`에서 `bestTyper` 머지**

`js/game.js:514-529`의 `loadState()` 함수 내부, `state = { ...state, ...loaded };` 다음에 안전장치 한 줄 추가:

```js
async function loadState() {
  const loaded = await _loadState();
  if (loaded) {
    state = { ...state, ...loaded };
    if (!state.bestTyper || typeof state.bestTyper !== 'object') state.bestTyper = {};
    if (typeof loaded.soundEnabled === 'boolean') soundEnabled = loaded.soundEnabled;
    if (typeof loaded.zoomLevel === 'number') zoomLevel = loaded.zoomLevel;
    if (state.lastPlayed) {
      const last = new Date(state.lastPlayed).toDateString();
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (last !== today && last !== yesterday) state.streak = 0;
    }
  }
  document.body.style.zoom = zoomLevel;
  await loadCustomWords();
}
```

- [ ] **Step 4: `saveState`에 `bestTyper` 포함**

`js/game.js:531-545`의 `saveState()` 내부 `toSave` 객체에 `bestTyper: state.bestTyper` 한 줄 추가:

```js
async function saveState() {
  const toSave = {
    name: state.name,
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    lastPlayed: state.lastPlayed,
    mastered: state.mastered,
    bestTyper: state.bestTyper,
    soundEnabled: soundEnabled,
    zoomLevel: zoomLevel
  };
  await _saveState(toSave);
  trackEvent('mastered');
  trackEvent('streak');
}
```

- [ ] **Step 5: `startMode` 에 typer 분기 (stub)**

`js/game.js:1859-1871`의 `startMode()` 함수 수정. `flashcard` 분기 다음에 추가:

```js
function startMode(mode) {
  trackEvent('mode_used', mode);
  if (mode === 'wordlist') {
    state.screen = 'wordlist';
    render();
    return;
  }
  state.currentMode = mode;
  playSound('gameStart');
  if (mode === 'flashcard') startFlashcard();
  else if (mode === 'typer') startTyper();
  else startQuiz(mode);
}
```

- [ ] **Step 6: `startTyper` stub + `renderTyper` stub 추가**

`js/game.js`에서 기존 MATCHING MODE 블록이 있던 자리(현재는 `finishFlashcard` 직전)에 새 섹션 추가:

```js
// ==========================================================
// TYPER (타자 우주)
// ==========================================================
function startTyper() {
  state.gameState = { mode: 'typer' };
  state.screen = 'typer';
  render();
}

function renderTyper() {
  return `
    ${renderHeader()}
    <div class="card">
      <button class="btn btn-ghost btn-sm" onclick="backToMode()">← 나가기</button>
      <div style="padding:40px; text-align:center;">
        <div style="font-size:60px;">🚀</div>
        <div class="screen-title" style="color:#7B2CBF;">타자 우주</div>
        <div class="screen-sub">곧 구현됩니다…</div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 7: `render()` switch case 추가**

`js/game.js:1895-1911` 의 `render()` 함수 switch에 `case 'spelling'` 다음 줄에 추가:

```js
case 'spelling': html = renderSpelling(); break;
case 'typer': html = renderTyper(); break;
case 'wordlist': html = renderWordList(); break;
```

- [ ] **Step 8: `__exports`에 `startTyper` 추가**

`js/game.js:2018-2046`의 `__exports` 객체에 알파벳 순으로 `startTyper,` 추가 (`startMode,` 와 `toggleSound,` 사이):

```js
startMode,
startTyper,
toggleSound,
```

- [ ] **Step 9: 브라우저 검증**

1. 로컬 서버 실행, 페이지 새로고침
2. 카테고리 선택 → 모드 화면에 "🚀 타자 우주" 카드 6번째로 노출 (보라색 #7B2CBF)
3. 클릭 → "타자 우주 / 곧 구현됩니다…" placeholder 화면 표시
4. "← 나가기" 클릭 → 모드 화면 복귀
5. DevTools Console 에러 없음
6. DevTools Application → IndexedDB/Firestore에서 `bestTyper: {}` 필드가 저장된 state에 포함되는지 확인 (다른 액션 후 새로고침해서 유지되는지)

- [ ] **Step 10: Commit**

```bash
git add js/game.js
git commit -m "feat(typer): register MODES.typer with placeholder screen

state.bestTyper 스캐폴딩 포함. 메뉴 카드 노출과 화면 라우팅만 동작."
```

---

## Task 3: 타자 우주 CSS 추가

**목표:** 게임 UI 모양만 미리 만들어 둠. 다음 태스크에서 JS가 이 클래스들을 조작.

**Files:**
- Modify: `index.html` `<style>` 블록

- [ ] **Step 1: 기존 짝맞추기 CSS가 있던 위치에 typer CSS 추가**

`index.html` 의 `<style>` 안 적절한 위치(예: 다른 게임 모드 CSS 근처)에 추가:

```css
  /* ========== TYPER (타자 우주) ========== */
  .typer-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }
  .typer-field {
    position: relative;
    width: 100%;
    height: min(60vh, 480px);
    background: linear-gradient(180deg, #2D1B69 0%, #4A2C8F 50%, #7B2CBF 100%);
    border: 3px solid var(--navy);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 0 var(--navy);
  }
  .typer-word {
    position: absolute;
    transform: translateX(-50%);
    font-family: 'Gowun Dodum', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    padding: 6px 14px;
    line-height: 1.2;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
  }
  .typer-word.target {
    background: #FFE066;
    color: var(--navy);
    border-color: var(--yellow);
    box-shadow: 0 0 12px rgba(255, 224, 102, 0.8);
    text-shadow: none;
  }
  .typer-word.dying {
    animation: typer-die 0.2s ease-out forwards;
  }
  .typer-word.shake {
    animation: shake 0.4s;
    background: var(--danger);
    border-color: #fff;
  }
  @keyframes typer-die {
    to { transform: translateX(-50%) scale(1.4); opacity: 0; }
  }
  .typer-input {
    width: 100%;
    margin-top: 12px;
    padding: 14px 18px;
    font-family: 'Fredoka', sans-serif;
    font-size: 22px;
    font-weight: 600;
    text-align: center;
    border: 3px solid var(--navy);
    border-radius: 12px;
    background: white;
    color: var(--navy);
    box-shadow: 0 3px 0 var(--navy);
    outline: none;
  }
  .typer-input:focus {
    border-color: #7B2CBF;
    box-shadow: 0 3px 0 #7B2CBF;
  }
  .typer-input:disabled {
    background: #eee;
    color: #999;
  }
  .typer-pause-overlay,
  .typer-level-banner {
    position: absolute;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    z-index: 5;
  }
  .typer-pause-overlay.show,
  .typer-level-banner.show {
    display: flex;
  }
  .typer-pause-overlay .title { font-size: 36px; }
  .typer-level-banner .title { font-size: 48px; text-shadow: 0 4px 12px rgba(123, 44, 191, 0.9); }
  .typer-game-over {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-family: 'Fredoka', sans-serif;
    font-size: 36px;
    font-weight: 700;
    z-index: 6;
    pointer-events: none;
  }
```

(`shake` 키프레임은 기존 `.match-tile.wrong-match` 에서 쓰던 게 다른 곳에도 정의돼 있는지 확인. 없으면 다음 블록도 추가:)

```css
  @keyframes shake {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    25% { transform: translateX(-50%) translateY(0) translate(4px, 0); }
    75% { transform: translateX(-50%) translateY(0) translate(-4px, 0); }
  }
```

확인 방법: Grep `@keyframes shake` → 이미 있으면 추가 불필요. 단, 기존 정의가 `translateX(-50%)`를 가정하지 않으면 위 `.typer-word.shake`에서 transform 충돌 가능 — 그 경우 `.typer-word.shake { animation: typer-shake 0.4s; }`로 별도 키프레임 정의:

```css
  @keyframes typer-shake {
    0%, 100% { transform: translateX(-50%); }
    25% { transform: translateX(calc(-50% + 6px)); }
    75% { transform: translateX(calc(-50% - 6px)); }
  }
```

후자(별도 키프레임)를 채택 권장 — `translateX(-50%)` 가운데 정렬과 충돌 없음.

- [ ] **Step 2: 브라우저 검증**

`renderTyper` placeholder는 아직 CSS 클래스를 안 쓰므로 별도 화면 변화 없음. DevTools Elements 탭에서 `<style>` 내용이 실제 들어갔는지만 확인.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(typer): add typer game CSS classes

낙하 필드·단어 박스·입력바·일시정지/레벨업 오버레이 스타일."
```

---

## Task 4: 게임 UI 마운트 (게임 로직 전)

**목표:** 게임 진입 시 실제 게임 화면 DOM이 1회 마운트되도록 `renderTyper` 본격 구현. 아직 단어 낙하 없음. 일시정지/입력바/상단바 모두 렌더되나 빈 상태.

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: `LEVELS` / `WORD_HEIGHT` 상수 추가**

`js/game.js`의 상수 블록(예: `XP_BONUS_PERFECT`, `QUESTIONS_PER_ROUND` 근처, 478~484 부근)에 추가:

```js
const WORD_HEIGHT = 44;
const LEVELS = [
  { maxConcurrent: 1, spawnMs: 3000, speed: 30 },
  { maxConcurrent: 1, spawnMs: 2500, speed: 40 },
  { maxConcurrent: 2, spawnMs: 2200, speed: 50 },
  { maxConcurrent: 2, spawnMs: 2000, speed: 65 },
  { maxConcurrent: 3, spawnMs: 1800, speed: 80 },
  { maxConcurrent: 3, spawnMs: 1600, speed: 95 },
  { maxConcurrent: 4, spawnMs: 1400, speed: 115 },
  { maxConcurrent: 4, spawnMs: 1200, speed: 135 },
  { maxConcurrent: 5, spawnMs: 1000, speed: 155 },
  { maxConcurrent: 5, spawnMs: 800,  speed: 180 }
];
const TYPER_KILLS_PER_LEVEL = 5;
```

- [ ] **Step 2: `startTyper` 본구현**

`js/game.js` 의 stub `startTyper`를 다음으로 교체:

```js
function startTyper() {
  const cat = VOCAB[state.currentCategory];
  const pool = shuffle(cat.words.filter(w => w.en && w.ko));
  if (pool.length === 0) {
    state.screen = 'modeSelect';
    render();
    return;
  }
  state.gameState = {
    mode: 'typer',
    level: 1,
    kills: 0,
    killsThisLevel: 0,
    bestLevelReached: 1,
    words: [],
    nextId: 0,
    pool: pool,
    poolIdx: 0,
    startTime: performance.now(),
    lastSpawnAt: 0,
    lastFrameT: 0,
    rafId: null,
    fieldW: 0,
    fieldH: 0,
    paused: false,
    over: false
  };
  state.screen = 'typer';
  render();
}
```

- [ ] **Step 3: `renderTyper` 본구현**

`js/game.js`의 stub `renderTyper`를 다음으로 교체:

```js
function renderTyper() {
  const gs = state.gameState;
  const best = state.bestTyper?.[state.currentCategory] || 0;
  return `
    ${renderHeader()}
    <div class="card">
      <div class="typer-bar">
        <button class="btn btn-ghost btn-sm" onclick="exitTyper()">← 나가기</button>
        <div class="progress-pill" id="typerStats">
          🚀 Lv <span id="typerLv">${gs.level}</span> · 처치 <span id="typerKills">${gs.kills}</span> · 최고 Lv ${best}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="pauseTyper()">⏸</button>
      </div>
      <div class="typer-field" id="typerField">
        <div class="typer-pause-overlay" id="typerPauseOverlay">
          <div class="title">일시정지</div>
          <button class="btn btn-accent" onclick="resumeTyper()">▶ 계속하기</button>
        </div>
        <div class="typer-level-banner" id="typerLevelBanner">
          <div class="title" id="typerLevelBannerText">Level 1 🚀</div>
        </div>
      </div>
      <input
        type="text"
        class="typer-input"
        id="typerInput"
        inputmode="latin"
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        placeholder="영어로 타이핑!"
        oninput="handleTyperInput()"
        onkeydown="handleTyperKey(event)" />
    </div>
  `;
}
```

- [ ] **Step 4: `exitTyper` 함수 추가 (게임 정리 후 모드 화면 복귀)**

`js/game.js` 의 TYPER 섹션에 추가:

```js
function exitTyper() {
  const gs = state.gameState;
  if (gs && gs.rafId) cancelAnimationFrame(gs.rafId);
  if (gs) {
    gs.over = true;
    gs.words = [];
  }
  backToMode();
}
```

- [ ] **Step 5: `handleTyperInput` / `handleTyperKey` / `pauseTyper` / `resumeTyper` stub 추가**

다음 태스크에서 본격 구현. 일단 빈 함수로 두어 onclick/oninput 에러 방지:

```js
function handleTyperInput() { /* Task 6 */ }
function handleTyperKey(event) { /* Task 6 */ }
function pauseTyper() { /* Task 9 */ }
function resumeTyper() { /* Task 9 */ }
```

- [ ] **Step 6: `__exports`에 새 함수 등록**

`js/game.js`의 `__exports` 에 알파벳 순으로 추가:

```js
exitTyper,
handleTyperInput,
handleTyperKey,
pauseTyper,
resumeTyper,
startTyper,
```

(기존 `startTyper`는 Task 2에서 이미 추가. 나머지 5개 신규.)

- [ ] **Step 7: 브라우저 검증**

1. 페이지 새로고침
2. 카테고리(단어 1개 이상) 선택 → "타자 우주" 클릭
3. Expected: 보라 그라데이션 필드, 상단바 "🚀 Lv 1 · 처치 0 · 최고 Lv 0", 하단 입력바 보임. 입력바에 자동 focus (또는 클릭 시 focus). 타이핑은 글자만 들어가고 아무 일도 안 일어남(정상).
4. "← 나가기" → 모드 화면 복귀
5. DevTools Console 에러 없음

- [ ] **Step 8: Commit**

```bash
git add js/game.js
git commit -m "feat(typer): mount game UI (field, top bar, input)

게임 로직 전 정적 UI만 마운트. LEVELS·WORD_HEIGHT 상수 추가."
```

---

## Task 5: 단어 스폰 + rAF 낙하 루프

**목표:** 게임 진입 시 한글 단어가 위에서 아래로 떨어진다. 아직 충돌·입력·게임오버 없음. 단어가 바닥 닿으면 그냥 거기 정지.

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: `spawnWord` 추가**

`js/game.js` 의 TYPER 섹션에 추가:

```js
function spawnWord() {
  const gs = state.gameState;
  if (!gs || gs.over) return;
  if (gs.poolIdx >= gs.pool.length) {
    gs.pool = shuffle(gs.pool);
    gs.poolIdx = 0;
  }
  const activeEns = new Set(gs.words.map(w => w.en));
  let pick = null;
  for (let i = 0; i < gs.pool.length; i++) {
    const candidate = gs.pool[(gs.poolIdx + i) % gs.pool.length];
    if (!activeEns.has(candidate.en)) {
      pick = candidate;
      gs.poolIdx = (gs.poolIdx + i + 1) % gs.pool.length;
      break;
    }
  }
  if (!pick) return; // 모든 풀이 활성중이면 다음 프레임 시도
  const field = document.getElementById('typerField');
  if (!field) return;
  const id = ++gs.nextId;
  const x = 10 + Math.random() * 80; // 10%~90%
  const el = document.createElement('div');
  el.className = 'typer-word';
  el.dataset.id = String(id);
  el.style.left = x + '%';
  el.style.top = '0px';
  el.textContent = pick.ko;
  field.appendChild(el);
  gs.words.push({ id, en: pick.en, ko: pick.ko, x, y: 0, el });
}
```

- [ ] **Step 2: `typerLoop` 추가 (충돌은 다음 태스크)**

```js
function typerLoop(t) {
  const gs = state.gameState;
  if (!gs || gs.over || gs.paused) return;
  if (!gs.lastFrameT) gs.lastFrameT = t;
  const dt = (t - gs.lastFrameT) / 1000;
  gs.lastFrameT = t;
  const cfg = LEVELS[Math.min(gs.level, LEVELS.length) - 1];

  // 스폰
  if (t - gs.lastSpawnAt > cfg.spawnMs && gs.words.length < cfg.maxConcurrent) {
    spawnWord();
    gs.lastSpawnAt = t;
  }

  // 이동
  const limit = gs.fieldH - WORD_HEIGHT;
  for (const w of gs.words) {
    w.y += cfg.speed * dt;
    if (w.y > limit) w.y = limit; // 바닥에 잠시 정지 (다음 태스크에서 게임오버로 대체)
    w.el.style.top = w.y + 'px';
  }

  gs.rafId = requestAnimationFrame(typerLoop);
}
```

- [ ] **Step 3: `render()` 호출 후 루프 시작 — `startTyper` 끝부분 수정**

`render()`는 동기 함수지만 DOM은 직접 만져야 하므로 다음 마이크로태스크에서 시작. `startTyper` 내부 `render();` 다음에 추가:

```js
function startTyper() {
  // ... (기존 게임 상태 초기화)
  state.screen = 'typer';
  render();
  // 다음 틱에 DOM 준비 후 루프 시작
  requestAnimationFrame(t => {
    const field = document.getElementById('typerField');
    if (!field) return;
    const rect = field.getBoundingClientRect();
    state.gameState.fieldW = rect.width;
    state.gameState.fieldH = rect.height;
    state.gameState.lastFrameT = t;
    state.gameState.lastSpawnAt = t - LEVELS[0].spawnMs; // 첫 단어 즉시 스폰
    state.gameState.rafId = requestAnimationFrame(typerLoop);
    const input = document.getElementById('typerInput');
    if (input) input.focus();
  });
}
```

- [ ] **Step 4: 화면 이탈/재마운트 시 루프 정리**

`render()`가 다른 화면으로 전환할 때 typer 루프가 살아있으면 안 됨. `exitTyper()`는 이미 정리하지만, 직접 다른 경로(예: `goHome`)로 빠지는 경우 대비. 가장 단순한 안전장치: `render()` 함수의 switch 진입 직전에 typer 정리. 단, 화면이 다시 `typer`일 때는 정리 금지.

`js/game.js`의 `render()` 함수에서 switch 들어가기 직전(`function render() { const app = ...; let html = ''; switch (...) ...` 직전):

```js
function render() {
  const app = document.getElementById('app');
  // typer 루프 정리: 다음 화면이 typer가 아니면 RAF 취소
  if (state.gameState && state.gameState.mode === 'typer' && state.screen !== 'typer') {
    if (state.gameState.rafId) cancelAnimationFrame(state.gameState.rafId);
    state.gameState.over = true;
  }
  let html = '';
  switch (state.screen) {
    // ...
```

- [ ] **Step 5: 브라우저 검증**

1. 카테고리 진입 → 타자 우주
2. Expected: 한글 단어 한 개가 천천히 위→아래 낙하 (Lv1 speed=30, 3초마다 1개). 두 번째 단어는 3초 후. 바닥 닿으면 거기서 정지.
3. "← 나가기" 클릭 → 모드 화면 복귀, Console 에러 없음
4. 다시 진입 → 새로 시작
5. DevTools Performance 탭에서 rAF 호출 확인(선택)

- [ ] **Step 6: Commit**

```bash
git add js/game.js
git commit -m "feat(typer): spawn falling words with rAF game loop

단어 풀에서 중복 없이 한글 단어 스폰, 레벨별 속도/스폰간격으로 낙하.
바닥 충돌·입력은 다음 커밋."
```

---

## Task 6: 입력 처리 — 단어 처치

**목표:** 입력바에 영어 타이핑하면 일치 단어가 사라진다. 처치 카운트 증가, prefix 매칭 단어 노란 강조.

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: `clearTargets` 헬퍼**

`js/game.js` TYPER 섹션에 추가:

```js
function clearTyperTargets() {
  const gs = state.gameState;
  if (!gs) return;
  for (const w of gs.words) w.el.classList.remove('target');
}
```

- [ ] **Step 2: `killTyperWord` 헬퍼**

```js
function killTyperWord(w) {
  const gs = state.gameState;
  w.el.classList.add('dying');
  setTimeout(() => { if (w.el.parentNode) w.el.parentNode.removeChild(w.el); }, 220);
  gs.words = gs.words.filter(x => x.id !== w.id);
  gs.kills++;
  gs.killsThisLevel++;
  playSound('correct');
  trackEvent('correct');
  markMastered(state.currentCategory, w.en);
  // 상단바 카운트 갱신
  const kEl = document.getElementById('typerKills');
  if (kEl) kEl.textContent = String(gs.kills);
}
```

- [ ] **Step 3: `handleTyperInput` 본구현**

Task 4의 stub을 교체:

```js
function handleTyperInput() {
  const gs = state.gameState;
  if (!gs || gs.over || gs.paused) return;
  const input = document.getElementById('typerInput');
  if (!input) return;
  const q = input.value.trim().toLowerCase();
  if (!q) { clearTyperTargets(); return; }

  // 정확 일치 우선 (동률이면 y 큰 단어 = 가장 바닥에 가까운 것)
  const exact = gs.words
    .filter(w => w.en.toLowerCase() === q)
    .sort((a, b) => b.y - a.y)[0];
  if (exact) {
    killTyperWord(exact);
    input.value = '';
    clearTyperTargets();
    // 레벨업 체크는 Task 7에서
    return;
  }

  // prefix 강조
  clearTyperTargets();
  for (const w of gs.words) {
    if (w.en.toLowerCase().startsWith(q)) w.el.classList.add('target');
  }
}
```

- [ ] **Step 4: `handleTyperKey` 본구현 (Enter → 입력 초기화)**

```js
function handleTyperKey(event) {
  if (event.key === 'Enter') {
    const input = document.getElementById('typerInput');
    if (input) input.value = '';
    clearTyperTargets();
    event.preventDefault();
  }
}
```

- [ ] **Step 5: 입력바 자동 refocus 가드 (게임 진행 중에만)**

`renderTyper`의 input에 `onblur` 추가:

```html
<input
  ...
  onblur="refocusTyperInput()"
  ... />
```

함수 추가:

```js
function refocusTyperInput() {
  const gs = state.gameState;
  if (!gs || gs.over || gs.paused) return;
  setTimeout(() => {
    const input = document.getElementById('typerInput');
    if (input && !input.disabled) input.focus();
  }, 0);
}
```

`__exports`에 `refocusTyperInput,` 추가.

- [ ] **Step 6: 브라우저 검증**

1. 진입 → 한글 단어 하나 떨어짐
2. 해당 영어 단어를 정확히 타이핑 → 즉시 사라짐(0.2s 페이드), 입력창 비워짐, 상단바 처치 카운트 +1, "correct" 효과음
3. 잘못된 prefix 타이핑 → 강조 없음. 올바른 prefix 타이핑 → 일치 단어 노란색 강조.
4. Enter 키 → 입력창 비워짐
5. 입력바 클릭 풀어도 자동 refocus
6. Console 에러 없음

- [ ] **Step 7: Commit**

```bash
git add js/game.js
git commit -m "feat(typer): input handling kills matching words

정확 매칭 시 단어 페이드 아웃 + XP/마스터 마킹. prefix 매칭 강조.
Enter 입력 초기화. blur 시 자동 refocus."
```

---

## Task 7: 레벨업

**목표:** 5킬마다 레벨 +1, 0.8초 "Level N 🚀" 배너, 속도·스폰 즉시 적용.

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: `typerLevelUp` 추가**

```js
function typerLevelUp() {
  const gs = state.gameState;
  if (!gs) return;
  if (gs.level < LEVELS.length) {
    gs.level++;
    gs.bestLevelReached = Math.max(gs.bestLevelReached, gs.level);
  }
  gs.killsThisLevel = 0;
  const lvEl = document.getElementById('typerLv');
  if (lvEl) lvEl.textContent = String(gs.level);
  showTyperLevelBanner(gs.level);
  playSound('levelup');
}

function showTyperLevelBanner(lv) {
  const banner = document.getElementById('typerLevelBanner');
  const text = document.getElementById('typerLevelBannerText');
  if (!banner || !text) return;
  text.textContent = `Level ${lv} 🚀`;
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 800);
}
```

- [ ] **Step 2: `killTyperWord` 끝에 레벨업 체크 추가**

Task 6의 `killTyperWord` 함수 끝(`kEl.textContent = ...` 다음)에 추가:

```js
function killTyperWord(w) {
  // ... 기존 ...
  const kEl = document.getElementById('typerKills');
  if (kEl) kEl.textContent = String(gs.kills);
  if (gs.killsThisLevel >= TYPER_KILLS_PER_LEVEL) typerLevelUp();
}
```

- [ ] **Step 3: 브라우저 검증**

1. 진입 → 5개 단어 처치 (Lv1 느리므로 시간 걸림)
2. Expected: 5번째 처치 직후 화면 가운데 "Level 2 🚀" 배너 0.8초, "levelup" 사운드, 상단바 Lv 표시 2로 변경, 이후 단어 낙하 속도 빨라짐 (Lv2: speed 40, spawn 2500)
3. 추가 5킬마다 Lv 계속 상승. Lv10 도달 후엔 그대로 Lv10 유지.

(주의: 검증을 빨리 하려면 카테고리 단어가 짧고 쉬운 것 선택. 또는 임시로 LEVELS[0].speed를 200으로 올려 테스트 후 원복.)

- [ ] **Step 4: Commit**

```bash
git add js/game.js
git commit -m "feat(typer): level up every 5 kills with banner

레벨 1~10, 5킬마다 +1, 0.8초 배너 + levelup 사운드.
Lv10 이후엔 유지(무한 모드)."
```

---

## Task 8: 게임오버 + 결과 화면

**목표:** 단어가 바닥에 닿으면 게임 종료 → 결과 화면. 처치 XP 가산, 최고 레벨 저장, "다시 도전" 버튼.

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: `typerGameOver` 추가**

```js
function typerGameOver(deadWord) {
  const gs = state.gameState;
  if (!gs || gs.over) return;
  gs.over = true;
  if (gs.rafId) cancelAnimationFrame(gs.rafId);
  if (deadWord && deadWord.el) deadWord.el.classList.add('shake');
  playSound('wrong');
  trackEvent('wrong');
  const input = document.getElementById('typerInput');
  if (input) input.disabled = true;
  setTimeout(finishTyper, 1500);
}
```

- [ ] **Step 2: `typerLoop` 바닥 충돌 → 게임오버 호출로 교체**

Task 5의 이동 루프에서 `if (w.y > limit) w.y = limit;` 를 게임오버 호출로 교체:

```js
// 이동
const limit = gs.fieldH - WORD_HEIGHT;
let dead = null;
for (const w of gs.words) {
  w.y += cfg.speed * dt;
  w.el.style.top = w.y + 'px';
  if (w.y >= limit && !dead) dead = w;
}
if (dead) {
  typerGameOver(dead);
  return;
}

gs.rafId = requestAnimationFrame(typerLoop);
```

- [ ] **Step 3: `finishTyper` 추가**

```js
function finishTyper() {
  const gs = state.gameState;
  if (!gs) return;
  // 활성 단어 DOM 제거
  for (const w of gs.words) {
    if (w.el && w.el.parentNode) w.el.parentNode.removeChild(w.el);
  }
  const xpGained = gs.kills * XP_CORRECT;
  const catKey = state.currentCategory;
  const prevBest = state.bestTyper?.[catKey] || 0;
  const bestUpdated = gs.bestLevelReached > prevBest;
  if (bestUpdated) {
    if (!state.bestTyper) state.bestTyper = {};
    state.bestTyper[catKey] = gs.bestLevelReached;
  }
  if (xpGained > 0) addXP(xpGained);
  updateStreak();
  state.gameState = {
    mode: 'typer',
    correct: gs.kills,
    total: gs.kills,
    mistakes: 0,
    xpGained,
    reachedLevel: gs.bestLevelReached,
    isTyper: true,
    bestUpdated
  };
  state.screen = 'result';
  render();
  setTimeout(() => playSound('streak'), 200);
}
```

- [ ] **Step 4: `renderResult`에 typer 분기 추가**

`js/game.js:1739-1795` 의 `renderResult` 함수 수정. `isFlashcard` 분기 다음에 `isTyper` 분기 추가:

```js
function renderResult() {
  const gs = state.gameState;
  let emoji, title, msg;
  if (gs.isFlashcard) {
    emoji = '📚'; title = '잘했어!'; msg = `${gs.correct}개 단어를 쭉 봤어. 이제 퀴즈로 실력을 확인해보자!`;
  } else if (gs.isTyper) {
    emoji = '🚀'; title = `Lv ${gs.reachedLevel} 도달!`;
    msg = gs.bestUpdated
      ? `🏆 최고 레벨 갱신! ${gs.kills}개 단어를 처치했어!`
      : `${gs.kills}개 단어를 처치했어. 다시 도전해볼까?`;
  } else {
    const pct = gs.correct / gs.total;
    if (gs.perfect || pct === 1) { emoji = '🏆'; title = '완벽해!!!'; msg = '전부 다 맞혔어! 넌 진짜 영어 천재야!'; }
    else if (pct >= 0.75) { emoji = '🌟'; title = '훌륭해!'; msg = '거의 다 맞혔어! 조금만 더 해보자!'; }
    else if (pct >= 0.5) { emoji = '💪'; title = '잘하고 있어!'; msg = '점점 좋아지고 있어. 계속 해보자!'; }
    else { emoji = '🌱'; title = '괜찮아!'; msg = '처음엔 누구나 어려워. 다시 해보면 더 잘할 거야!'; }
  }

  return `
    ${renderHeader()}
    <div class="card">
      <div class="result-hero">
        <div class="result-emoji">${emoji}</div>
        <div class="result-title">${title}</div>
        <div class="result-sub">${msg}</div>
      </div>

      <div class="result-stats">
        ${gs.isFlashcard ? `
          <div class="stat-box">
            <div class="stat-num">${gs.correct}</div>
            <div class="stat-label">본 단어</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">+${gs.xpGained}</div>
            <div class="stat-label">경험치</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">🔥${state.streak}</div>
            <div class="stat-label">연속일</div>
          </div>
        ` : gs.isTyper ? `
          <div class="stat-box">
            <div class="stat-num">Lv ${gs.reachedLevel}</div>
            <div class="stat-label">도달 레벨</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${gs.kills}</div>
            <div class="stat-label">처치</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">+${gs.xpGained}</div>
            <div class="stat-label">경험치</div>
          </div>
        ` : `
          <div class="stat-box">
            <div class="stat-num">${gs.correct}/${gs.total}</div>
            <div class="stat-label">정답</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">+${gs.xpGained}</div>
            <div class="stat-label">경험치</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${Math.round(gs.correct/gs.total*100)}%</div>
            <div class="stat-label">정답률</div>
          </div>
        `}
      </div>

      <div class="controls-row" style="justify-content: center;">
        <button class="btn btn-accent" onclick="backToMode()">🔁 한번 더</button>
        <button class="btn btn-primary" onclick="goHome()">🏠 처음으로</button>
      </div>
    </div>
  `;
}
```

(주의: `gs.kills` 는 typer 분기에서만 존재 — 위 코드에서 `gs.kills`를 typer 분기 안에서만 참조함. 안전.)

- [ ] **Step 5: `__exports`에 finishTyper, typerGameOver 추가**

```js
finishTyper,
typerGameOver,
```

(인라인 핸들러에서 직접 호출하진 않지만 디버깅·일관성 위해 등록.)

- [ ] **Step 6: 브라우저 검증**

1. 진입 → 단어 1개 일부러 안 치고 바닥 닿게 둠
2. Expected: 닿은 단어 빨갛게 셰이크, "wrong" 사운드, 입력바 비활성화, 1.5초 후 결과화면 자동 전환
3. 결과화면: "🚀 Lv N 도달!", 처치 수·XP 표시. 첫 플레이면 "🏆 최고 레벨 갱신!"
4. "🔁 한번 더" 클릭 → 모드 선택 화면 복귀 → 다시 진입 가능
5. 페이지 새로고침 후 다시 진입 → 상단바 "최고 Lv N" 정상 표시 (저장 확인)
6. Console 에러 없음

- [ ] **Step 7: Commit**

```bash
git add js/game.js
git commit -m "feat(typer): game over + result screen + best level save

바닥 충돌 시 1.5초 셰이크 후 결과화면. XP 가산, markMastered,
카테고리별 최고 도달 레벨 저장."
```

---

## Task 9: 일시정지·재개

**목표:** ⏸ 버튼·ESC 키로 게임 정지. 단어 정지, 입력 비활성, 오버레이 표시. ▶ 버튼·ESC로 재개. 재개 시 시간 점프 없음.

**Files:**
- Modify: `js/game.js`

- [ ] **Step 1: `pauseTyper` / `resumeTyper` 본구현**

Task 4의 stub 교체:

```js
function pauseTyper() {
  const gs = state.gameState;
  if (!gs || gs.over || gs.paused) return;
  gs.paused = true;
  if (gs.rafId) cancelAnimationFrame(gs.rafId);
  const overlay = document.getElementById('typerPauseOverlay');
  if (overlay) overlay.classList.add('show');
  const input = document.getElementById('typerInput');
  if (input) input.disabled = true;
  playSound('click');
}

function resumeTyper() {
  const gs = state.gameState;
  if (!gs || gs.over || !gs.paused) return;
  gs.paused = false;
  const overlay = document.getElementById('typerPauseOverlay');
  if (overlay) overlay.classList.remove('show');
  const input = document.getElementById('typerInput');
  if (input) { input.disabled = false; input.focus(); }
  const now = performance.now();
  gs.lastFrameT = now;
  gs.lastSpawnAt = now;
  gs.rafId = requestAnimationFrame(typerLoop);
  playSound('click');
}
```

- [ ] **Step 2: ESC 키 토글 — `handleTyperKey` 확장**

Task 6의 `handleTyperKey` 수정:

```js
function handleTyperKey(event) {
  if (event.key === 'Escape') {
    const gs = state.gameState;
    if (gs && !gs.over) {
      if (gs.paused) resumeTyper(); else pauseTyper();
    }
    event.preventDefault();
    return;
  }
  if (event.key === 'Enter') {
    const input = document.getElementById('typerInput');
    if (input) input.value = '';
    clearTyperTargets();
    event.preventDefault();
  }
}
```

(주의: input이 disabled 되면 그 위에서 ESC keydown이 발생하지 않을 수 있음. ⏸ 버튼이 1순위 UI고 ESC는 보조.)

- [ ] **Step 3: 브라우저 검증**

1. 진입 → 단어 낙하 중 ⏸ 클릭
2. Expected: 단어 즉시 정지, "일시정지" 오버레이 + "▶ 계속하기" 버튼, 입력바 비활성
3. ▶ 버튼 클릭 → 단어 다시 낙하 시작, 입력바 활성, 자동 focus. **단어가 갑자기 화면 끝까지 점프하지 않음** (lastFrameT/lastSpawnAt 리셋 검증)
4. 재진입 후 단어 떨어지는 중 ESC → 일시정지. ESC 다시 누르면 재개 (input이 활성 상태일 때만)
5. 일시정지 중 "← 나가기" → 정상 모드 화면 복귀
6. Console 에러 없음

- [ ] **Step 4: Commit**

```bash
git add js/game.js
git commit -m "feat(typer): pause/resume with overlay and ESC toggle

⏸ 버튼·ESC 키로 토글. 재개 시 lastFrameT·lastSpawnAt 리셋해 시간 점프 방지."
```

---

## Task 10: 최종 점검 + 회귀 검증

**목표:** 스펙 모든 항목 충족 확인. 다른 모드들 회귀 없음. 잔재 코드 0.

**Files:** 코드 변경 없거나 미미한 정리만.

- [ ] **Step 1: matching 잔재 grep**

Run: Grep `matching|match-tile|match-grid|짝 맞추기|짝맞추기` (path: 프로젝트 루트, glob: `*.{js,html,css}`)
Expected: **No matches found**. (docs/* 의 스펙·플랜 문서는 카운트 제외 — 글롭이 js/html/css만 잡음.)

만약 잔재 있으면 제거 후 동일 grep 재실행.

- [ ] **Step 2: 다른 모드 회귀 검증**

각 모드 1라운드씩 플레이:
- 단어 카드 (flashcard) — 카드 넘기기 정상
- 뜻 맞추기 (meaning) — 4지선다 정상, 결과 화면 정상
- 단어 맞추기 (word) — 동일
- 스펠링 도전 (spelling) — 입력 정상
- 단어 목록 (wordlist) — 발음 재생 정상

Expected: 모두 결과 화면까지 도달, Console 에러 없음.

- [ ] **Step 3: 타자 우주 시나리오 검증**

스펙 §16 검증 기준 전수:
- [ ] 메뉴에서 짝맞추기 사라지고 "타자 우주 🚀" 등장 (보라 #7B2CBF)
- [ ] 게임 진입 → 한글 단어가 위에서 아래로 내려옴
- [ ] 영어 정확 입력 시 단어 소멸 + 입력창 비워짐 + XP 가산
- [ ] 동시 단어 수·속도가 5킬마다 단계 상승
- [ ] 단어가 바닥에 닿으면 게임 종료 → 결과화면
- [ ] 결과화면에서 "한번 더" 버튼으로 모드 화면 복귀, 재진입 가능
- [ ] 최고 레벨이 카테고리별로 저장되어 다음 진입 시 상단바에 표시
- [ ] 일시정지 시 단어 멈추고 오버레이 표시, 재개 시 점프 없이 이어짐

- [ ] **Step 4: profile.js / admin.js / achievements.js 빠른 점검**

Grep `'matching'` / `"matching"` 리터럴 검색.
Expected: 0건 (achievements.js의 `mode_used` 페이로드는 변수로 처리되므로 리터럴 없음 확인).

- [ ] **Step 5: 최종 커밋 (필요 시)**

잔재 정리 변경이 있었다면:

```bash
git add -A
git commit -m "chore(typer): cleanup leftover references"
```

변경 없으면 이 단계 스킵.

---

## 자기 리뷰

스펙 `docs/superpowers/specs/2026-05-15-typer-game-design.md` 16개 섹션 대비:

| 스펙 §  | 내용 | 구현 태스크 |
|--------|------|-----|
| §2 MODES 변경 | matching 삭제, typer 추가 | T1, T2 |
| §3 게임 상태 | gameState 필드 | T4 |
| §4 레벨 곡선 | LEVELS 표 | T4 (상수), T7 (레벨업) |
| §5 화면 구조 | 마운트 1회 + DOM 조작 | T4 (UI), T5 (DOM 조작) |
| §6 단어 풀 | shuffle + 중복 차단 | T5 (spawnWord) |
| §7 게임 루프 | rAF | T5 |
| §8 입력 처리 | oninput + Enter + IME | T6 |
| §9 레벨업 | 5킬마다 + 배너 | T7 |
| §10 게임오버·결과 | 셰이크 + 1.5s + result | T8 |
| §11 최고 레벨 저장 | bestTyper | T2 (스캐폴딩), T8 (갱신) |
| §12 일시정지 | ⏸ + ESC + 시간 리셋 | T9 |
| §13 모바일 | UX 미보장 안내 안 함 | (없음 — 의도) |
| §14 삭제 항목 | matching 잔재 | T1, T10 |
| §15 추가 항목 | 함수·CSS | T2~T9 |
| §16 검증 기준 | — | T10 |

**Placeholder 스캔:** "TBD"·"TODO"·"implement later"·"add error handling" 없음. Task 4의 4개 stub 함수는 의도된 단계적 구현(Task 6/9에서 채움)이며 본문에 명시.

**타입 일관성:** `gs.kills`/`gs.killsThisLevel`/`gs.bestLevelReached`/`gs.fieldW`/`gs.fieldH` 등 필드명 모든 태스크에서 동일. 함수명 `typerLoop`/`startTyper`/`pauseTyper`/`resumeTyper`/`typerGameOver`/`finishTyper`/`spawnWord`/`killTyperWord`/`clearTyperTargets`/`handleTyperInput`/`handleTyperKey`/`refocusTyperInput`/`exitTyper`/`typerLevelUp`/`showTyperLevelBanner` 모두 정의·호출 일치 확인.

**누락 확인:** `exitTyper`는 §3·§14에 명시 없으나 §5의 "← 나가기" 버튼이 필요. 그래서 Task 4에서 정의 — 정당.

스펙 누락된 spec 요구사항 없음.
