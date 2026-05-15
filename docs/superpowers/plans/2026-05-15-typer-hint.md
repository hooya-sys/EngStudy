# 타자 우주 — 발음 힌트 + 영문 플래시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 타자 우주 게임에서 (1) 단어 스폰 시 영어 발음을 들려주고 (2) 단어가 필드 반 이상 내려오면 1.2초간 한글 → 영어 텍스트 플래시 + 영어 발음을 다시 들려준다.

**Architecture:** `js/game.js`의 기존 `spawnWord`/`typerLoop` 함수를 최소 후킹. 단어 객체에 `hinted` 플래그 추가하여 반 통과 트리거 1회 보장. 새 헬퍼 `showHint(w)` 하나 추가.

**Tech Stack:** Vanilla JS, Web Speech API (`speechSynthesis` via existing `speak()` 함수).

**Spec:** `docs/superpowers/specs/2026-05-15-typer-hint-design.md`

---

## 검증 환경

자동 테스트 없음. 검증 = 브라우저 수동:
1. `firebase serve --only hosting` 또는 `python -m http.server 8080`
2. 로그인 → 카테고리 → 타자 우주 진입
3. 효과음 ON 상태에서 단어 낙하 관찰

DevTools Console 열어둘 것. 에러·경고 없어야 함.

## 파일 구조

- **수정:** `js/game.js` — 3개 함수 (`spawnWord`, `typerLoop`)와 신규 헬퍼 `showHint` 추가
- 새 파일 없음
- CSS·HTML 변경 없음

---

## Task 1: 발음 힌트 + 영문 플래시 구현

**Files:**
- Modify: `js/game.js`

**Steps:**

- [ ] **Step 1: `spawnWord` 의 push 객체에 `hinted: false` 필드 추가**

`js/game.js`의 `spawnWord` 함수에서 `gs.words.push({ id, en: pick.en, ko: pick.ko, x, y: 0, el });` 라인을 찾아 다음으로 교체:

```js
  gs.words.push({ id, en: pick.en, ko: pick.ko, x, y: 0, el, hinted: false });
```

- [ ] **Step 2: `spawnWord` 끝에 영어 발음 1회 호출 추가**

같은 함수의 `gs.words.push(...)` 다음 줄에 한 줄 추가:

```js
  speak(pick.en);
```

전체 함수 끝 부분이 다음 모양:

```js
  gs.words.push({ id, en: pick.en, ko: pick.ko, x, y: 0, el, hinted: false });
  speak(pick.en);
}
```

- [ ] **Step 3: `showHint` 함수 추가**

`js/game.js`의 TYPER 섹션 내(예: `spawnWord` 함수 다음, `typerLoop` 직전 또는 직후 — 위치는 호출 순서 무관, 호이스팅됨) 새 함수 추가:

```js
function showHint(w) {
  if (!w.el || !w.el.parentNode) return;
  w.el.textContent = w.en;
  speak(w.en);
  setTimeout(() => {
    if (w.el && w.el.parentNode) w.el.textContent = w.ko;
  }, 1200);
}
```

- [ ] **Step 4: `typerLoop` 이동 루프에 반 이상 검사 추가**

`typerLoop` 함수의 이동 블록을 찾는다:

```js
const limit = gs.fieldH - WORD_HEIGHT;
let dead = null;
for (const w of gs.words) {
  w.y += cfg.speed * dt;
  w.el.style.top = w.y + 'px';
  if (w.y >= limit && !dead) dead = w;
}
```

`w.el.style.top = ...` 다음 줄에 힌트 트리거 추가:

```js
const limit = gs.fieldH - WORD_HEIGHT;
let dead = null;
for (const w of gs.words) {
  w.y += cfg.speed * dt;
  w.el.style.top = w.y + 'px';
  if (!w.hinted && w.y >= gs.fieldH * 0.5) {
    w.hinted = true;
    showHint(w);
  }
  if (w.y >= limit && !dead) dead = w;
}
```

- [ ] **Step 5: syntax 검증**

Run:
```bash
node --check H:/ClaudeProjects/EngStudy/EngStudy/js/game.js
```
Expected: exit 0 (출력 없음).

- [ ] **Step 6: 정의 횟수 검증**

Grep `function showHint\(` (path 프로젝트, glob `*.js`) → 1건.
Grep `\.hinted` (path 프로젝트, glob `*.js`) → 최소 3건 (push 시 초기화, 조건 검사, true 설정).

- [ ] **Step 7: 브라우저 수동 검증**

(자동 테스트 없으므로 사용자가 수동으로 확인)

1. 로컬 서버 띄우기: `firebase serve --only hosting` 또는 `python -m http.server 8080`
2. 로그인 → 카테고리 선택 → 타자 우주 진입
3. 효과음 ON 상태로 단어 낙하 관찰:
   - [ ] 단어 스폰 직후 영어 발음 1회 들림
   - [ ] 단어가 필드 중앙 이하로 내려오면 한글 텍스트가 영문으로 바뀜
   - [ ] 동시에 영어 발음 재생됨
   - [ ] 1.2초 후 한글로 복귀
   - [ ] 같은 단어가 두 번 힌트되지 않음 (반 통과는 1회만)
4. 게임 끝까지 플레이 후 결과 화면까지 도달, Console 에러 없음
5. 일시정지 → 재개 시 힌트 동작 정상 (재진입 시 hinted 보존)
6. 다른 모드(스펠링/뜻 맞추기) 진입·플레이 → 동작 영향 없음

- [ ] **Step 8: Commit**

```bash
git add js/game.js
git commit -m "feat(typer): speak word on spawn + flash English at midpoint

단어 스폰 시 영어 발음 1회 + 필드 반 이상 내려오면 1.2초간
한글→영문 텍스트 플래시 + 영어 발음 재생.
word 객체에 hinted 플래그 추가하여 중복 트리거 방지."
```

---

## 자기 리뷰

**스펙 커버리지** (`docs/superpowers/specs/2026-05-15-typer-hint-design.md`):

| 스펙 § | 내용 | 태스크 위치 |
|--------|------|------|
| §2.1 스폰 시 발음 | `spawnWord` 끝에 `speak(pick.en)` | Step 2 |
| §2.2 반 통과 트리거 | `typerLoop` 이동 루프 내 검사 | Step 4 |
| §2.3 `showHint` 함수 | 텍스트 교체 + speak + 1.2초 복귀 + parentNode 가드 | Step 3 |
| §3 `hinted: false` 필드 | push 객체에 추가 | Step 1 |
| §4 엣지케이스 | `showHint`의 parentNode 가드로 처리 (코드 자체로 해결) | Step 3 |
| §5 영향 범위 | js/game.js 단일 파일 | Files 명시 |
| §6 검증 기준 | 6개 항목 모두 Step 7 체크리스트로 매핑 | Step 7 |

**Placeholder 스캔:** "TBD"/"TODO"/"implement later"/"add error handling" 없음. 모든 코드 블록은 완전한 실행 가능 코드.

**타입 일관성:** `w.hinted` (boolean), `w.el`, `w.en`, `w.ko`, `w.y` 모두 기존 타자 우주 코드의 word 객체 스키마와 일치. `gs.fieldH` 는 기존 typerLoop에서 사용 중. `showHint(w)` 시그니처는 호출부(Step 4)와 정의(Step 3) 일치.

**누락 없음.** 스펙 6개 섹션 모두 태스크 단계로 매핑됨.
