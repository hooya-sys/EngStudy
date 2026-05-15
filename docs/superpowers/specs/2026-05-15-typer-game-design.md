# 타자 우주 (Typer Space) — 설계 문서

작성일: 2026-05-15
대상 파일: `js/game.js`, `index.html`

## 1. 목적

주제학습의 **짝 맞추기(`matching`) 모드를 제거**하고, 한메타자교사의 베네치아 게임과 같은 **낙하 타자 게임 `typer`(타자 우주)**를 새 모드로 추가한다.

게임 규칙:
- 선택한 카테고리의 한글 단어들이 화면 위에서 아래로 떨어진다.
- 사용자가 하단 입력창에 해당 단어의 영어 단어를 정확히 타이핑하면 그 단어가 처치된다.
- 단어가 바닥에 닿으면 게임 종료(1생명).
- 레벨이 오를수록 동시 단어 수·낙하 속도·스폰 빈도가 빨라진다.

## 2. MODES 변경

`js/game.js` 상수 `MODES`:

- 삭제: `matching: { name: '짝 맞추기', desc: '영어-한국어 짝 찾기', emoji: '🧩', color: '#FF6F91' }`
- 추가: `typer: { name: '타자 우주', desc: '떨어지는 한글을 영어로 쳐서 처치', emoji: '🚀', color: '#7B2CBF' }`

(기존 `spelling`이 `#845EC2`를 쓰고 있으므로 `typer`는 더 진한 보라 `#7B2CBF`로 구분.)

활성 조건: 해당 카테고리 단어 수 ≥ 1. `renderModeSelect()`의 disabled 분기에서 `needsPairs` 체크를 제거한다.

## 3. 게임 상태

```js
state.gameState = {
  mode: 'typer',
  level: 1,                // 1~10 (10 이상은 10 유지)
  kills: 0,                // 총 처치 수
  killsThisLevel: 0,       // 현 레벨 처치 수 (5 도달 시 레벨업)
  bestLevelReached: 1,     // 최종 결과용

  words: [],               // 활성 단어 [{ id, en, ko, x, y, el }]
  nextId: 0,

  pool: [],                // shuffle 된 카테고리 단어 배열
  poolIdx: 0,              // 다음 스폰할 인덱스 (끝나면 reshuffle)

  startTime: 0,
  lastSpawnAt: 0,
  lastFrameT: 0,
  rafId: null,

  fieldW: 0,               // 측정된 필드 픽셀 크기
  fieldH: 0,

  paused: false,
  over: false,
  diedWordId: null         // 바닥에 닿은 단어 id (강조용)
};
```

## 4. 레벨 곡선

레벨업 조건: **5개 처치마다 레벨 +1**. 다음 레벨 진입 시 0.8초 동안 "Level N 🚀" 배너 오버레이.

| Lv | 동시 최대 | 스폰 간격(ms) | 낙하속도(px/s) |
|----|----------|--------------|---------------|
| 1  | 1 | 3000 | 30  |
| 2  | 1 | 2500 | 40  |
| 3  | 2 | 2200 | 50  |
| 4  | 2 | 2000 | 65  |
| 5  | 3 | 1800 | 80  |
| 6  | 3 | 1600 | 95  |
| 7  | 4 | 1400 | 115 |
| 8  | 4 | 1200 | 135 |
| 9  | 5 | 1000 | 155 |
| 10 | 5 | 800  | 180 |

Lv 10 도달 후엔 계속 Lv 10(무한 생존). `LEVELS` 상수 배열로 정의.

## 5. 화면 구조

새 화면 키: `typer`.

```
[renderHeader()]
[card]
  [상단바]   ← 나가기 | 🚀 Lv N · 처치 K · 최고 Lv M | ⏸ 일시정지
  [필드 #typerField height: min(60vh, 480px), position:relative, 보라 그라데이션 배경]
     - 낙하 단어 DOM 들: position:absolute, top=y, left=x (% 단위)
     - 일시정지 오버레이 #typerPauseOverlay (paused 시)
     - 레벨업 배너 #typerLevelBanner (레벨업 직후)
  [입력바]  <input id="typerInput" inputmode="latin" autocapitalize="off" autocomplete="off" spellcheck="false">
```

기존 `render()` 패턴(매 상태변경 시 `app.innerHTML` 재생성)과 달리, **타자 우주는 게임 진입 시 1회만 마운트**하고 이후 게임루프에서는 단어 DOM을 직접 조작한다(매 프레임 innerHTML 재생성 금지).

상단바 텍스트(레벨/처치 카운트)는 게임루프에서 직접 `textContent` 갱신.

## 6. 단어 풀

```js
function buildPool(cat) {
  return shuffle(cat.words.filter(w => w.en && w.ko));
}
```

- 진입 시 `pool = buildPool(cat); poolIdx = 0`
- 스폰 시: `w = pool[poolIdx++]`. 단, 현재 활성 단어 중 같은 `en`이 있으면 다음 인덱스로 넘어감(최대 풀 크기만큼 시도, 못 찾으면 그 프레임은 스폰 스킵).
- `poolIdx >= pool.length` 되면 `pool = shuffle(pool); poolIdx = 0`.

## 7. 게임 루프

`requestAnimationFrame` 기반.

```
function typerLoop(t) {
  if (gs.paused || gs.over) return;
  const dt = (t - gs.lastFrameT) / 1000;
  gs.lastFrameT = t;
  const cfg = LEVELS[Math.min(gs.level, 10) - 1];

  // 1) 스폰
  if (t - gs.lastSpawnAt > cfg.spawnMs && gs.words.length < cfg.maxConcurrent) {
    spawnWord();
    gs.lastSpawnAt = t;
  }

  // 2) 이동
  for (const w of gs.words) {
    w.y += cfg.speed * dt;
    w.el.style.top = w.y + 'px';
  }

  // 3) 바닥 충돌 검사
  const limit = gs.fieldH - WORD_HEIGHT;
  const dead = gs.words.find(w => w.y >= limit);
  if (dead) { typerGameOver(dead); return; }

  gs.rafId = requestAnimationFrame(typerLoop);
}
```

`WORD_HEIGHT`는 CSS와 일치하는 상수(예: 44px).

`spawnWord()`:
- 풀에서 다음 단어 선택(위 규칙)
- x = `random(8, 92)` % (필드 폭 기준)
- y = 0
- DOM 생성 `<div class="typer-word" data-id="..." style="left:X%; top:0">${w.ko}</div>`
- `gs.words.push(w)`, `field.appendChild(w.el)`

## 8. 입력 처리

입력바에 `oninput`·`onkeydown` 핸들러.

- `oninput`:
  - `q = input.value.trim().toLowerCase()`
  - 빈 문자열이면 모든 `.typer-word.target` 제거.
  - `exact = gs.words.find(w => w.en.toLowerCase() === q)` → 있으면 처치(아래 절차).
  - 동률 시 `y` 큰 단어 우선(가장 바닥에 가까운 것부터).
  - 매칭 없고 `q != ''`이면 `prefix = gs.words.filter(w => w.en.toLowerCase().startsWith(q))` 에 `.target` 클래스 부여, 나머지 제거.
- `onkeydown` Enter: 입력창 비움(오타 리셋).

처치 절차:
1. `w.el.classList.add('dying')` → 0.2s 페이드 애니메이션 후 `removeChild`
2. `gs.words = gs.words.filter(x => x.id !== w.id)`
3. `gs.kills++; gs.killsThisLevel++`
4. `playSound('correct')`
5. `markMastered(state.currentCategory, w.en)`
6. 입력창 `value = ''`
7. 상단바 카운트 갱신
8. `if (gs.killsThisLevel >= 5) typerLevelUp()`

IME 충돌 방지: `inputmode="latin"`, `autocapitalize="off"`, `autocomplete="off"`, `spellcheck="false"`. 게임 진행 중 input이 blur되면 자동 refocus.

## 9. 레벨업

```
function typerLevelUp() {
  if (gs.level < 10) {
    gs.level++;
    gs.bestLevelReached = Math.max(gs.bestLevelReached, gs.level);
  }
  gs.killsThisLevel = 0;
  showLevelBanner();      // 0.8s 오버레이 + playSound('levelUp' or 'streak')
}
```

`showLevelBanner()`는 `#typerLevelBanner` 의 textContent을 `Level ${gs.level} 🚀`로 설정하고 `.show` 클래스 0.8s 후 제거.

## 10. 게임오버·결과

```
function typerGameOver(deadWord) {
  gs.over = true;
  cancelAnimationFrame(gs.rafId);
  deadWord.el.classList.add('shake');
  playSound('wrong');
  setTimeout(finishTyper, 1500);
}
```

`finishTyper()`:
- 모든 단어 DOM 제거.
- XP 정산: `xpGained = gs.kills * XP_CORRECT` (기존 상수 사용).
- `addXP(xpGained); updateStreak();`
- 최고 레벨 갱신: `bestUpdated = gs.bestLevelReached > (state.bestTyper[catKey] || 0)`; 갱신되면 저장 후 `saveState()`.
- `state.gameState = { mode: 'typer', correct: gs.kills, total: gs.kills, mistakes: 0, xpGained, reachedLevel: gs.bestLevelReached, isTyper: true, bestUpdated }` (`total = correct`로 두는 이유는 무한 모드라 분모 개념이 없음 — `renderResult`의 기존 분기 호환을 위한 더미).
- `state.screen = 'result'; render();`
- 결과화면 전환 후 효과음: `playSound('streak')` (기존 비완벽 라운드와 동일한 마무리음).

결과화면(`renderResult`)에서 `gameState.isTyper`면:
- 큰 글씨 "도달 레벨 N", "처치 K개", "+X XP"
- `bestUpdated` 면 "🏆 최고 레벨 갱신!" 표시
- 버튼: "다시 도전" / "다른 게임" / "홈으로"

기존 `renderResult` 함수에 분기 한 줄 추가하는 식.

## 11. 최고 레벨 저장

`state` 신규 필드: `bestTyper: { [catKey: string]: number }`. 기본값 `{}`.

`loadState`/`saveState`에 포함. (현재 `saveState`의 `toSave` 객체에 `bestTyper: state.bestTyper` 추가.)

`renderTyper` 상단바에서 `state.bestTyper?.[state.currentCategory] ?? 0` 으로 표시.

## 12. 일시정지

상단바 ⏸ 버튼 + `keydown Esc` 로 토글:

```
function pauseTyper() {
  if (gs.over) return;
  gs.paused = true;
  cancelAnimationFrame(gs.rafId);
  showPauseOverlay();        // .typer-pause-overlay.show
  document.getElementById('typerInput').disabled = true;
}
function resumeTyper() {
  if (gs.over || !gs.paused) return;
  gs.paused = false;
  hidePauseOverlay();
  const input = document.getElementById('typerInput');
  input.disabled = false; input.focus();
  gs.lastFrameT = performance.now();   // dt 점프 방지
  gs.lastSpawnAt = performance.now();  // 스폰 점프 방지
  gs.rafId = requestAnimationFrame(typerLoop);
}
```

오버레이는 "▶ 계속하기" 버튼 1개.

## 13. 모바일

- 데스크톱 우선 설계. 모바일은 동작은 하되 UX 미보장.
- 필드 높이 `min(60vh, 480px)` — 모바일 가상키보드가 화면을 절반 가리는 경우 대비.
- 가상키보드 한/영 전환 등으로 인한 IME 충돌 가능. 모바일 사용자에게 "데스크톱에서 더 잘 동작" 정도의 안내문은 추가하지 않음(요구 없음).

## 14. 삭제 항목

### `js/game.js`
- `MODES.matching` 항목 (494)
- 함수 4개: `startMatching` (1565), `renderMatching` (1586), `selectTile` (1622), `finishMatching` (1664) — 총 약 122라인
- `renderModeSelect()`의 `needsPairs` 변수와 분기 (1025, 1028, 1035)
- `startMode()`의 `mode === 'matching'` 분기 (1869)
- `render()` switch의 `case 'matching'` (1904)
- `__exports`의 `finishMatching`, `selectTile` (2028, 2037)

### `index.html`
- CSS 블록 `.match-grid` 및 `.match-tile.*` (604~631 부근, 약 28라인)

### 외부 영향
- `js/achievements.js`는 `mode_used` 페이로드를 키로 저장하므로 (`counters.modesUsed.matching`) 코드 자체에 'matching' 리터럴 없음 → 변경 불필요. 기존 사용자 프로필의 `modesUsed.matching` 키는 무해한 dead data로 잔존.
- `js/admin.js`는 matching 참조 없음.

## 15. 추가 항목

### `js/game.js`
- `LEVELS` 상수 (10개 단계 설정 배열) 및 `WORD_HEIGHT` 상수
- `MODES.typer` 등록
- 함수: `startTyper`, `mountTyperUI`, `renderTyperPlaceholder` (innerHTML 1회 마운트용), `typerLoop`, `spawnWord`, `handleTyperInput`, `handleTyperKey`, `typerLevelUp`, `showLevelBanner`, `pauseTyper`, `resumeTyper`, `typerGameOver`, `finishTyper`
- `state` 초기값에 `bestTyper: {}`
- `loadState`/`saveState`에 `bestTyper` 입출력
- `startMode` 의 `'typer'` 분기 → `startTyper()`
- `render()` switch에 `case 'typer'`
- `__exports`에 `startTyper`, `pauseTyper`, `resumeTyper`, `finishTyper` 등 인라인 핸들러용 노출
- `renderResult` 의 typer 분기

### `index.html` `<style>`
- `.typer-field` (그라데이션, position:relative, overflow:hidden, border-radius)
- `.typer-word` (position:absolute, font-family 'Gowun Dodum', 폰트크기·padding·배경·그림자)
- `.typer-word.target` (강조색 외곽선 또는 배경)
- `.typer-word.dying` (0.2s 페이드+스케일 키프레임)
- `.typer-word.shake` (0.4s 셰이크 — 기존 `shake` 키프레임 재활용 가능)
- `.typer-bar` (상단 진행바)
- `.typer-input` (하단 고정 large input)
- `.typer-pause-overlay` (반투명 풀스크린 within field, `.show` 토글)
- `.typer-level-banner` (중앙 큰 텍스트, `.show` 토글)

## 16. 진행 검증 기준

- [ ] 메뉴에서 짝맞추기 사라지고 "타자 우주 🚀" 등장.
- [ ] 게임 진입 → 한글 단어가 위에서 아래로 내려옴.
- [ ] 영어 정확 입력 시 단어 소멸 + 입력창 비워짐 + XP 가산.
- [ ] 동시 단어 수·속도가 5킬마다 단계 상승.
- [ ] 단어가 바닥에 닿으면 게임 종료 → 결과화면.
- [ ] 결과화면에서 다시 도전 버튼으로 같은 카테고리 재시작.
- [ ] 최고 레벨이 카테고리별로 저장되어 다음 진입시 상단바에 표시.
- [ ] 일시정지 시 단어 멈추고 오버레이 표시, 재개 시 점프 없이 이어짐.
- [ ] 짝맞추기 코드·CSS 잔재 없음 (grep `matching|match-tile|match-grid` 0건).
