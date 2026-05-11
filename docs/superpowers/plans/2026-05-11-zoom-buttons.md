# 화면 줌 버튼 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 헤더에 줌 인/아웃 버튼 두 개를 추가해 사용자가 화면 크기를 조절할 수 있게 하고, 줌 레벨을 영속화한다.

**Architecture:** `document.body.style.zoom`을 통해 전체 페이지 확대/축소. 줌 레벨은 `state.zoomLevel`과 동일한 경로로 저장(로그인 시 Firestore, 비로그인 시 localStorage). 버튼은 사운드 토글 옆 헤더에 배치하며, 범위(70%~150%) 끝에서는 시각적으로 비활성화.

**Tech Stack:** Vanilla JS (ESM), 정적 HTML, CSS. 테스트 프레임워크 없음 — 검증은 브라우저에서 수동.

**Spec:** `docs/superpowers/specs/2026-05-11-zoom-buttons-design.md`

---

## File Structure

수정 파일: `js/game.js` 한 개. 새 파일 없음.

변경 지점(라인은 작업 시작 시점 기준 근사값):
- ~line 473 (상수 영역, `XP_PER_LEVEL` 근처): `ZOOM_MIN`/`ZOOM_MAX`/`ZOOM_STEP` 상수
- ~line 614 (`let soundEnabled = true;` 옆): `let zoomLevel = 1.0;`
- ~line 506-518 (`loadState`): zoomLevel 로딩 + body zoom 적용
- ~line 521-535 (`saveState` `toSave` 객체): `zoomLevel` 키 추가
- ~line 811 (`toggleSound` 근처): `zoomIn`, `zoomOut` 함수 추가
- ~line 848 (`renderHeader`): 줌 두 버튼 삽입 + disabled 스타일 계산
- ~line 1960 (`__exports`): `zoomIn`, `zoomOut` 추가

---

## Task 1: 상수 + 상태 + 저장/로딩

**Files:**
- Modify: `js/game.js`

**Background:** 이 작업은 줌 레벨이 영속화되고 페이지 로드 시 자동 적용되는 인프라를 만든다. 이 단계만 마쳐도 (수동으로 `zoomLevel`을 바꿔서 새로고침하면) 영속화가 작동함을 확인할 수 있다. 다음 작업에서 UI 버튼이 추가된다.

- [ ] **Step 1: 줌 관련 상수 추가**

`js/game.js`에서 `const QUESTIONS_PER_ROUND = 8;` 다음 줄(현재 ~line 476)에 추가:

```js
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
```

- [ ] **Step 2: zoomLevel 상태 변수 추가**

`let soundEnabled = true;` (현재 ~line 614) 다음 줄에 추가:

```js
let zoomLevel = 1.0;
```

- [ ] **Step 3: loadState에서 zoomLevel 로드 + 적용**

현재 `loadState` (~line 506-518):

```js
async function loadState() {
  const loaded = await _loadState();
  if (loaded) {
    state = { ...state, ...loaded };
    if (typeof loaded.soundEnabled === 'boolean') soundEnabled = loaded.soundEnabled;
    if (state.lastPlayed) {
      const last = new Date(state.lastPlayed).toDateString();
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (last !== today && last !== yesterday) state.streak = 0;
    }
  }
  await loadCustomWords();
}
```

`soundEnabled` 로딩 분기 바로 다음 줄에 zoomLevel 로딩을 추가하고, `if (loaded)` 블록 종료 직후(또는 그 안 마지막)에 `document.body.style.zoom = zoomLevel` 한 줄을 두어 페이지 진입 즉시 적용. 다음으로 교체:

```js
async function loadState() {
  const loaded = await _loadState();
  if (loaded) {
    state = { ...state, ...loaded };
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

`document.body.style.zoom = zoomLevel` 줄은 `if (loaded)` 블록 **밖**에 위치 — `loaded`가 없는(처음 사용자) 경우에도 기본값 1.0이 명시적으로 적용되도록.

- [ ] **Step 4: saveState에 zoomLevel 추가**

현재 `saveState` (~line 521-535):

```js
async function saveState() {
  const toSave = {
    name: state.name,
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    lastPlayed: state.lastPlayed,
    mastered: state.mastered,
    soundEnabled: soundEnabled
  };
  await _saveState(toSave);
}
```

`soundEnabled` 다음 줄에 `zoomLevel` 추가:

```js
async function saveState() {
  const toSave = {
    name: state.name,
    xp: state.xp,
    level: state.level,
    streak: state.streak,
    lastPlayed: state.lastPlayed,
    mastered: state.mastered,
    soundEnabled: soundEnabled,
    zoomLevel: zoomLevel
  };
  await _saveState(toSave);
}
```

- [ ] **Step 5: 코드 레벨 확인**

```bash
grep -n "ZOOM_MIN\|ZOOM_MAX\|ZOOM_STEP" js/game.js
grep -n "zoomLevel" js/game.js
```

기대 결과:
- `ZOOM_MIN/MAX/STEP`: 각 1회 정의 (총 3줄)
- `zoomLevel`: 변수 선언 1줄, loadState 분기 1줄, body.style.zoom 적용 1줄, saveState toSave 1줄 — 총 4줄. (이 단계까지)

- [ ] **Step 6: Commit**

```bash
git add js/game.js
git commit -m "$(cat <<'EOF'
feat(zoom): persist zoom level in state and apply on load

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 줌 함수 + 헤더 버튼 + window 노출

**Files:**
- Modify: `js/game.js`

**Background:** Task 1에서 만든 인프라 위에 사용자가 클릭할 수 있는 UI와 동작 로직을 얹는다. 이 단계 완료 시점에 기능이 완전히 사용 가능.

- [ ] **Step 1: zoomIn / zoomOut 함수 추가**

`toggleSound` 함수 (현재 ~line 811-819) 바로 다음에 두 함수 추가:

```js
function zoomIn() {
  if (zoomLevel >= ZOOM_MAX) return;
  zoomLevel = Math.min(ZOOM_MAX, +(zoomLevel + ZOOM_STEP).toFixed(2));
  document.body.style.zoom = zoomLevel;
  saveState();
  render();
  playSound('click');
}

function zoomOut() {
  if (zoomLevel <= ZOOM_MIN) return;
  zoomLevel = Math.max(ZOOM_MIN, +(zoomLevel - ZOOM_STEP).toFixed(2));
  document.body.style.zoom = zoomLevel;
  saveState();
  render();
  playSound('click');
}
```

`+(... .toFixed(2))`는 부동소수점 누적 오차(`0.7 + 0.1 = 0.7999...`) 방지용.

- [ ] **Step 2: renderHeader에 줌 버튼 두 개 추가**

현재 `renderHeader` (~line 848-874):

```js
function renderHeader() {
  const xpInLevel = state.xp % XP_PER_LEVEL;
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100;
  const isAdmin = currentProfile?.role === 'admin';
  const photo = currentUser?.photoURL;
  const avatarHtml = photo
    ? `<img src="${photo}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`
    : `🦁`;

  return `
    <div class="header">
      <div class="avatar" id="avatarBtn" style="cursor:pointer" title="내 정보">${avatarHtml}</div>
      <div class="user-info">
        <div class="user-name">${state.name || '친구'}</div>
        <div class="user-level">Lv.${state.level} · 🔥 ${state.streak}일</div>
      </div>
      <div class="xp-container">
        <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
        <div class="xp-text">${xpInLevel} / ${XP_PER_LEVEL} XP</div>
      </div>
      <button class="btn btn-icon" onclick="toggleSound()" title="${soundEnabled ? '소리 끄기' : '소리 켜기'}">${soundEnabled ? '🔊' : '🔇'}</button>
      <button class="btn btn-icon" id="achievementsBtn" title="나의 업적">🏆</button>
      ${isAdmin ? `<button class="btn btn-icon" id="adminBtn" title="회원관리">🛡️</button>` : ''}
      <button class="btn btn-icon" id="logoutBtn" title="로그아웃">🚪</button>
    </div>
  `;
}
```

다음으로 교체:

```js
function renderHeader() {
  const xpInLevel = state.xp % XP_PER_LEVEL;
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100;
  const isAdmin = currentProfile?.role === 'admin';
  const photo = currentUser?.photoURL;
  const avatarHtml = photo
    ? `<img src="${photo}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`
    : `🦁`;
  const zoomOutDisabled = zoomLevel <= ZOOM_MIN;
  const zoomInDisabled = zoomLevel >= ZOOM_MAX;
  const zoomOutStyle = zoomOutDisabled ? 'opacity:0.45;pointer-events:none;' : '';
  const zoomInStyle = zoomInDisabled ? 'opacity:0.45;pointer-events:none;' : '';

  return `
    <div class="header">
      <div class="avatar" id="avatarBtn" style="cursor:pointer" title="내 정보">${avatarHtml}</div>
      <div class="user-info">
        <div class="user-name">${state.name || '친구'}</div>
        <div class="user-level">Lv.${state.level} · 🔥 ${state.streak}일</div>
      </div>
      <div class="xp-container">
        <div class="xp-bar"><div class="xp-fill" style="width:${xpPct}%"></div></div>
        <div class="xp-text">${xpInLevel} / ${XP_PER_LEVEL} XP</div>
      </div>
      <button class="btn btn-icon" onclick="zoomOut()" title="화면 축소" style="${zoomOutStyle}">🔍➖</button>
      <button class="btn btn-icon" onclick="zoomIn()" title="화면 확대" style="${zoomInStyle}">🔍➕</button>
      <button class="btn btn-icon" onclick="toggleSound()" title="${soundEnabled ? '소리 끄기' : '소리 켜기'}">${soundEnabled ? '🔊' : '🔇'}</button>
      <button class="btn btn-icon" id="achievementsBtn" title="나의 업적">🏆</button>
      ${isAdmin ? `<button class="btn btn-icon" id="adminBtn" title="회원관리">🛡️</button>` : ''}
      <button class="btn btn-icon" id="logoutBtn" title="로그아웃">🚪</button>
    </div>
  `;
}
```

- [ ] **Step 3: window에 zoomIn, zoomOut 노출**

현재 `__exports` (~line 1960-1985):

```js
const __exports = {
  addCustomWord,
  answerMeaning,
  answerWord,
  backToCustomManage,
  backToMode,
  checkSpelling,
  closeLevelUp,
  deleteCustomWord,
  finishFlashcard,
  finishMatching,
  flipCard,
  goHome,
  handleSpellKey,
  nextCard,
  nextQuestion,
  prevCard,
  resetCustomWords,
  selectCategory,
  selectTile,
  speak,
  startCustomStudy,
  startGame,
  startMode,
  toggleSound,
};
```

알파벳 순서 유지하여 `toggleSound` 다음에 `zoomIn`, `zoomOut` 추가:

```js
const __exports = {
  addCustomWord,
  answerMeaning,
  answerWord,
  backToCustomManage,
  backToMode,
  checkSpelling,
  closeLevelUp,
  deleteCustomWord,
  finishFlashcard,
  finishMatching,
  flipCard,
  goHome,
  handleSpellKey,
  nextCard,
  nextQuestion,
  prevCard,
  resetCustomWords,
  selectCategory,
  selectTile,
  speak,
  startCustomStudy,
  startGame,
  startMode,
  toggleSound,
  zoomIn,
  zoomOut,
};
```

- [ ] **Step 4: 코드 레벨 확인**

```bash
grep -n "function zoomIn\|function zoomOut" js/game.js
grep -n "onclick=\"zoom" js/game.js
grep -n "zoomIn,\|zoomOut," js/game.js
```

기대 결과:
- 함수 정의 2줄 (각 1회)
- `onclick="zoomOut()"`, `onclick="zoomIn()"` 헤더 각 1회
- `__exports` 안에서 `zoomIn,`, `zoomOut,` 각 1회

- [ ] **Step 5: Commit**

```bash
git add js/game.js
git commit -m "$(cat <<'EOF'
feat(zoom): add zoom in/out header buttons

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 브라우저 End-to-End 검증

**Files:** 없음 (검증 전용)

**Background:** 영속화와 UI가 모두 들어왔으니 실제 브라우저에서 사용자 시나리오 확인.

- [ ] **Step 1: 서버 실행**

```bash
npx -y http-server . -p 8080 -c-1
```

브라우저로 `http://localhost:8080` 열고 로그인.

- [ ] **Step 2: 기본 동작**

- 헤더에 🔍➖ 🔍➕ 두 버튼이 사운드(🔊) 왼쪽에 보인다.
- 🔍➕ 클릭 → 페이지 전체가 10% 커진다 (헤더 포함).
- 🔍➖ 클릭 → 10% 작아진다.
- 100% 상태에서 🔍➖를 7회 누르면 70% 도달 → 8번째 클릭은 무반응 + 버튼이 흐려져 있음.
- 그 상태에서 🔍➕를 8회 누르면 150% 도달 → 9번째 클릭 무반응 + 🔍➕가 흐려져 있음.

- [ ] **Step 3: 영속화**

- 줌을 120%로 맞춘 뒤 페이지 새로고침 → 다시 120%로 시작.
- 로그아웃했다가 같은 계정으로 재로그인 → 120% 유지(Firestore에 저장됨).
- 시크릿 창에서 게스트로 접속한 경우 새로고침은 유지되지만 다른 시크릿 창은 별개 (localStorage).

- [ ] **Step 4: 다른 기능과의 상호작용**

- 줌 변경 후 게임 모드 진입 → 게임 화면도 같은 비율로 표시.
- 줌 변경 후 사운드 토글, 업적 페이지, 어드민 페이지 진입 → 모두 정상.

- [ ] **Step 5: 커밋 확인**

```bash
git log --oneline main..HEAD | head -5
```

상위 2개 commit이 Task 1, 2에 대응하는지 확인.
