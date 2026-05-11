# Random Mix 카테고리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 주제(내 단어장 포함)에서 랜덤으로 30단어를 뽑아 학습하는 "Random Mix" 가상 카테고리를 홈 화면에 추가한다. 카테고리에 진입할 때마다 단어가 새로 섞인다.

**Architecture:** `VOCAB`에 `random` 키를 추가하고, `selectCategory('random')` 진입 시 다른 모든 카테고리 단어를 합쳐서 `shuffle().slice(0, 30)`로 `VOCAB.random.words`에 대입한다. 기존 게임 모드는 모두 `VOCAB[state.currentCategory].words`를 읽기 때문에 코드 변경 없이 자동으로 작동한다. 진도 표시와 마스터 기록은 random에서 의미가 없으므로 비활성화한다.

**Tech Stack:** Vanilla JS (ESM), 정적 HTML, Firebase Hosting. 테스트 프레임워크 없음 — 검증은 브라우저에서 수동으로 수행.

**Spec:** `docs/superpowers/specs/2026-05-11-random-mix-category-design.md`

---

## File Structure

수정 파일: `js/game.js` 한 개. 새 파일 없음.

변경 지점(라인은 작업 시작 시점 기준 근사값):
- ~line 465-469 (`VOCAB.custom` 앞): `VOCAB.random` 항목 추가
- ~line 888-893 (`renderHome` totals): random 제외
- ~line 911 (`renderHome` grid card): isRandom 분기 — 진도바 숨김, 안내 문구
- ~line 941-955 (`renderModeSelect`): isRandom일 때 부제 교체
- ~line 1644-1650 (`markMastered`): isRandom 가드
- ~line 1781-1786 (`selectCategory`): random 진입 시 풀에서 30개 추출

---

## Task 1: VOCAB에 random 추가 + selectCategory 풀 생성

**Files:**
- Modify: `js/game.js` (VOCAB 객체, selectCategory 함수)

**Background:** 이 작업으로 기능의 핵심(데이터 + 진입 로직)이 완성된다. 이 단계만 끝나도 게임 모드는 정상 동작한다. 다음 작업들은 UI 정리(진도 표시, 마스터 기록)다.

- [ ] **Step 1: VOCAB.custom 앞에 random 항목 삽입**

`js/game.js`의 `custom: { name: 'My Words', ... }` 블록(현재 `VOCAB` 객체의 마지막 항목) 바로 앞에 다음 항목을 추가한다. 콤마와 들여쓰기를 기존 스타일과 맞춘다.

```js
  random: {
    name: 'Random Mix', nameKr: '랜덤 30', emoji: '🎲', color: '#845EC2',
    isRandom: true,
    words: []
  },
  custom: {
```

확인: `Object.keys(VOCAB)` 순서가 `[..., 'game', 'random', 'custom']`이 되어야 한다.

- [ ] **Step 2: selectCategory에 random 풀 생성 로직 추가**

현재 `selectCategory`:

```js
function selectCategory(key) {
  state.currentCategory = key;
  state.screen = VOCAB[key]?.isCustom ? 'customManage' : 'modeSelect';
  playSound('category');
  render();
}
```

다음으로 교체:

```js
function selectCategory(key) {
  if (key === 'random') {
    const pool = Object.keys(VOCAB)
      .filter(k => k !== 'random')
      .flatMap(k => VOCAB[k].words);
    VOCAB.random.words = shuffle(pool).slice(0, 30);
  }
  state.currentCategory = key;
  state.screen = VOCAB[key]?.isCustom ? 'customManage' : 'modeSelect';
  playSound('category');
  render();
}
```

`shuffle()`은 같은 파일 ~line 550에 이미 정의되어 있어 재사용한다.

- [ ] **Step 3: 브라우저에서 동작 확인**

서버 실행:

```bash
npx http-server . -p 8080 -c-1
```

브라우저로 `http://localhost:8080` 열고 로그인 후 확인:
- 홈 카테고리 그리드에 🎲 Random Mix 카드가 custom 앞에 보인다 (진도 표시는 아직 어색할 수 있음 — 다음 작업에서 정리).
- Random Mix 진입 → modeSelect 화면이 뜨고 단어 개수가 30개로 표시된다.
- "단어 카드", "뜻 맞추기", "단어 맞추기", "짝 맞추기", "스펠링 도전", "단어 목록" 6개 모드 모두 시작 가능.
- 홈으로 돌아갔다가 Random Mix 다시 진입 → 단어 30개 세트가 바뀐다 (단어 목록 모드로 확인).

- [ ] **Step 4: Commit**

```bash
git add js/game.js
git commit -m "$(cat <<'EOF'
feat(category): add Random Mix category with 30 random words

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: renderHome에서 random 진도 표시 정리

**Files:**
- Modify: `js/game.js` (`renderHome` 함수, ~line 888-938)

**Background:** Random Mix 카드는 매번 다른 30개라 누적 진도가 의미 없다. 전체 진도 합계에서도 제외해야 한다. 단어 진도 텍스트는 안내 문구로 교체한다.

- [ ] **Step 1: 전체 진도 계산에서 random 제외**

현재 코드 (~line 889-893):

```js
const totalWords = CATEGORIES.reduce((sum, k) => sum + VOCAB[k].words.length, 0);
const totalMastered = CATEGORIES.reduce((sum, k) => {
  const existing = new Set(VOCAB[k].words.map(w => w.en));
  return sum + (state.mastered[k] || []).filter(en => existing.has(en)).length;
}, 0);
```

다음으로 교체:

```js
const countedCats = CATEGORIES.filter(k => !VOCAB[k].isRandom);
const totalWords = countedCats.reduce((sum, k) => sum + VOCAB[k].words.length, 0);
const totalMastered = countedCats.reduce((sum, k) => {
  const existing = new Set(VOCAB[k].words.map(w => w.en));
  return sum + (state.mastered[k] || []).filter(en => existing.has(en)).length;
}, 0);
```

- [ ] **Step 2: random 카드 진도바를 안내 문구로 교체**

현재 `CATEGORIES.map(key => { ... })` 내부 (~line 911-934):

```js
const cat = VOCAB[key];
const wordCount = cat.words.length;
const masteredList = state.mastered[key] || [];
const masteredSet = new Set(cat.words.map(w => w.en));
const mastered = masteredList.filter(en => masteredSet.has(en)).length;
const pct = wordCount > 0 ? (mastered / wordCount) * 100 : 0;
const isCustom = !!cat.isCustom;
const progressText = wordCount > 0
  ? `${mastered}/${wordCount}`
  : (isCustom ? '단어를 추가해봐!' : '0/0');
const cardStyle = isCustom
  ? ''
  : `style="background: linear-gradient(180deg, white 60%, ${cat.color}22);"`;
return `
  <div class="cat-card${isCustom ? ' custom' : ''}" ${cardStyle} onclick="selectCategory('${key}')">
    ${isCustom ? '<span class="cat-badge-add">+</span>' : ''}
    <span class="cat-emoji">${cat.emoji}</span>
    <div class="cat-name">${cat.name}</div>
    <div class="cat-name-kr">${cat.nameKr}</div>
    <div class="cat-progress"><div class="cat-progress-fill" style="width:${pct}%; background:${cat.color};"></div></div>
    <div class="cat-progress-text">${progressText}</div>
  </div>
`;
```

다음으로 교체:

```js
const cat = VOCAB[key];
const wordCount = cat.words.length;
const masteredList = state.mastered[key] || [];
const masteredSet = new Set(cat.words.map(w => w.en));
const mastered = masteredList.filter(en => masteredSet.has(en)).length;
const pct = wordCount > 0 ? (mastered / wordCount) * 100 : 0;
const isCustom = !!cat.isCustom;
const isRandom = !!cat.isRandom;
const progressText = isRandom
  ? '매번 새로운 30단어!'
  : (wordCount > 0
    ? `${mastered}/${wordCount}`
    : (isCustom ? '단어를 추가해봐!' : '0/0'));
const cardStyle = isCustom
  ? ''
  : `style="background: linear-gradient(180deg, white 60%, ${cat.color}22);"`;
const progressBar = isRandom
  ? ''
  : `<div class="cat-progress"><div class="cat-progress-fill" style="width:${pct}%; background:${cat.color};"></div></div>`;
return `
  <div class="cat-card${isCustom ? ' custom' : ''}" ${cardStyle} onclick="selectCategory('${key}')">
    ${isCustom ? '<span class="cat-badge-add">+</span>' : ''}
    <span class="cat-emoji">${cat.emoji}</span>
    <div class="cat-name">${cat.name}</div>
    <div class="cat-name-kr">${cat.nameKr}</div>
    ${progressBar}
    <div class="cat-progress-text">${progressText}</div>
  </div>
`;
```

- [ ] **Step 3: 브라우저에서 동작 확인**

(서버가 안 돌고 있으면 `npx http-server . -p 8080 -c-1` 재실행, 페이지 새로고침)

- 홈 상단 "전체 진도" 카운트가 Random Mix 진입 전후로 동일 (예: 200/390). 30이 더해지지 않음.
- Random Mix 카드에는 진도바가 없고 "매번 새로운 30단어!" 문구가 보인다.
- 다른 카테고리 카드(가족, 학교 등)는 기존과 동일하게 진도바 + N/M 표시.
- My Words 카드도 기존과 동일하게 동작.

- [ ] **Step 4: Commit**

```bash
git add js/game.js
git commit -m "$(cat <<'EOF'
feat(home): exclude Random Mix from totals and replace progress with helper text

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: renderModeSelect 부제 정리

**Files:**
- Modify: `js/game.js` (`renderModeSelect` 함수, ~line 941-955)

**Background:** Random Mix 카테고리에서 modeSelect 화면을 열면 부제에 "30개 단어 · 0개 마스터"로 표시된다. random은 마스터 기록을 하지 않으니 항상 0이라 헷갈린다. "30개 단어 (매번 새로 뽑힘)"으로 교체.

- [ ] **Step 1: isRandom 분기 추가**

현재 코드 (~line 941-955):

```js
function renderModeSelect() {
  const cat = VOCAB[state.currentCategory];
  const existing = new Set(cat.words.map(w => w.en));
  const mastered = (state.mastered[state.currentCategory] || []).filter(en => existing.has(en)).length;
  const backLabel = cat.isCustom ? '← 단어 관리로' : '← 돌아가기';
  const backAction = cat.isCustom ? 'backToCustomManage()' : 'goHome()';
  return `
    ${renderHeader()}
    <div class="card">
      <button class="btn btn-ghost btn-sm" onclick="${backAction}">${backLabel}</button>
      <div style="text-align:center; margin: 16px 0;">
        <div style="font-size: 60px;">${cat.emoji}</div>
        <div class="screen-title" style="color: ${cat.color};">${cat.name}</div>
        <div class="screen-sub">${cat.nameKr} · ${cat.words.length}개 단어 · ${mastered}개 마스터</div>
      </div>
```

`screen-sub` div의 내용을 다음과 같이 분기 처리:

```js
function renderModeSelect() {
  const cat = VOCAB[state.currentCategory];
  const existing = new Set(cat.words.map(w => w.en));
  const mastered = (state.mastered[state.currentCategory] || []).filter(en => existing.has(en)).length;
  const backLabel = cat.isCustom ? '← 단어 관리로' : '← 돌아가기';
  const backAction = cat.isCustom ? 'backToCustomManage()' : 'goHome()';
  const subText = cat.isRandom
    ? `${cat.nameKr} · ${cat.words.length}개 단어 (매번 새로 뽑힘)`
    : `${cat.nameKr} · ${cat.words.length}개 단어 · ${mastered}개 마스터`;
  return `
    ${renderHeader()}
    <div class="card">
      <button class="btn btn-ghost btn-sm" onclick="${backAction}">${backLabel}</button>
      <div style="text-align:center; margin: 16px 0;">
        <div style="font-size: 60px;">${cat.emoji}</div>
        <div class="screen-title" style="color: ${cat.color};">${cat.name}</div>
        <div class="screen-sub">${subText}</div>
      </div>
```

(이후 줄들은 그대로)

- [ ] **Step 2: 브라우저에서 동작 확인**

페이지 새로고침 후:
- 다른 카테고리 진입 → 부제: "가족 · 30개 단어 · 5개 마스터" (기존과 동일)
- Random Mix 진입 → 부제: "랜덤 30 · 30개 단어 (매번 새로 뽑힘)"

- [ ] **Step 3: Commit**

```bash
git add js/game.js
git commit -m "$(cat <<'EOF'
feat(mode-select): show special subtitle for Random Mix category

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: markMastered에서 random 가드

**Files:**
- Modify: `js/game.js` (`markMastered` 함수, ~line 1644-1650)

**Background:** Random Mix에서 퀴즈를 풀거나 스펠링을 맞히면 `state.mastered.random`에 단어가 누적된다. 매번 단어 세트가 다르니 의미가 없고, 같은 단어가 원래 카테고리에서 마스터될 때 중복 집계가 될 수 있다. 단일 진입점인 `markMastered`에서 가드.

- [ ] **Step 1: 가드 추가**

현재 함수:

```js
function markMastered(catKey, wordEn) {
  if (!state.mastered[catKey]) state.mastered[catKey] = [];
  if (!state.mastered[catKey].includes(wordEn)) {
    state.mastered[catKey].push(wordEn);
    saveState();
  }
}
```

다음으로 교체:

```js
function markMastered(catKey, wordEn) {
  if (VOCAB[catKey]?.isRandom) return;
  if (!state.mastered[catKey]) state.mastered[catKey] = [];
  if (!state.mastered[catKey].includes(wordEn)) {
    state.mastered[catKey].push(wordEn);
    saveState();
  }
}
```

- [ ] **Step 2: 브라우저에서 동작 확인**

페이지 새로고침. 콘솔(DevTools) 열고:

1. 다른 카테고리(가족 등)에서 스펠링 퀴즈 또는 뜻 맞추기 한 판 완료.
2. 콘솔에서 `JSON.stringify(window.state?.mastered || 'no-state')` 또는 Firestore/localStorage 상태 확인 → `mastered.family`(예시)에 단어가 추가됨.
3. Random Mix 진입해서 동일하게 한 판 완료.
4. 다시 상태 확인 → `mastered.random`은 비어 있거나 없음 (기존 키만 늘어났는지 확인).
5. 홈으로 돌아가 "전체 진도" 카운트가 random 플레이로 인해 증가하지 않음.

`window.state` 노출이 안 되어 있으면 Firestore Console에서 사용자 문서를 직접 확인하거나, `localStorage.getItem('engstudy-state-...')`(키 이름은 store.js 참조)로 확인.

- [ ] **Step 3: Commit**

```bash
git add js/game.js
git commit -m "$(cat <<'EOF'
feat(mastery): skip recording for Random Mix category

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: End-to-end 검증

**Files:** 없음 (검증 전용)

**Background:** 각 작업 후 단편적으로 확인한 동작을 한 번에 흐름으로 검증한다.

- [ ] **Step 1: 모든 게임 모드 동작 확인**

서버 재시작(`npx http-server . -p 8080 -c-1`), 브라우저 새로고침, 로그인 후:

Random Mix 진입 → 6개 모드 각각 시작 → 정상 완료 (또는 중간에 홈 복귀):
1. 단어 목록 — 30개 단어가 2열 그리드로 보임
2. 단어 카드 — 30장 플립 가능
3. 뜻 맞추기 — 8문항 진행, 정답 표시 정상
4. 단어 맞추기 — 8문항 진행, 정답 표시 정상
5. 짝 맞추기 — 짝 매칭 정상
6. 스펠링 도전 — 입력 정상

- [ ] **Step 2: 재진입 시 새 단어 세트 확인**

홈 → Random Mix → 단어 목록 (단어 30개 기록) → 홈 → Random Mix → 단어 목록 (이전과 다른 30개여야 함, 일부 겹침은 자연스러움).

- [ ] **Step 3: 진도/마스터 격리 확인**

홈 상단 "전체 진도" 분자/분모가 Random Mix 사용 전후 동일. 예: 시작 50/390 → Random Mix 한 판 완료 → 여전히 50/390.

- [ ] **Step 4: 커스텀 단어 빈/채움 둘 다 확인**

- 내 단어장에 단어가 있는 계정: Random Mix에 진입했을 때 커스텀 단어가 후보에 포함될 수 있음 (확률적이므로 여러 번 재진입 시 가끔 등장).
- 빈 커스텀 계정: 풀이 빈 배열 합산만 추가되므로 random은 기본 13주제 × 30 = 390단어에서 추출, 정상 동작.

- [ ] **Step 5: PR 브랜치 정리**

각 작업이 개별 commit으로 들어갔는지 확인:

```bash
git log --oneline main..HEAD | head -10
```

상위 4개 commit이 Task 1~4에 대응하는지 확인.
