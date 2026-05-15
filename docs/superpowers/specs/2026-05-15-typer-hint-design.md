# 타자 우주 — 발음 힌트 + 영문 플래시 설계 문서

작성일: 2026-05-15
대상 파일: `js/game.js`
기반: `docs/superpowers/specs/2026-05-15-typer-game-design.md` (타자 우주 게임)

## 1. 목적

타자 우주 게임에서 사용자가 영어 단어를 떠올리지 못해 단어가 바닥에 닿을 위험에 처할 때, 다음 두 단계 힌트를 제공한다.

1. **스폰 시 발음 1회** — 단어가 화면 상단에 나타나는 순간 영어 발음을 들려주어 사용자가 단어를 청각적으로 인지하게 한다.
2. **반 이상 내려갈 때 시각·청각 동시 힌트** — 단어가 필드의 절반 이상 내려오면 한글 텍스트를 1.2초 동안 영문 철자로 바꿔 표시하고 영어 발음을 다시 들려준 뒤, 한글로 복귀한다.

## 2. 트리거 명세

### 2.1 스폰 시 발음

`spawnWord()`에서 단어 DOM 생성 후 마지막 줄에:

```js
speak(pick.en);
```

기존 `speak()` 함수(`js/game.js` 약 590라인)를 그대로 사용. Web Speech API. 다음 `speak` 호출 시 자동 `speechSynthesis.cancel()`로 큐 비움.

### 2.2 반 이상 내려갈 때 힌트

`typerLoop`의 이동 루프 내부에서 검사. 각 단어 객체에 새 필드 `hinted: false` 추가. 트리거 조건:

```js
if (!w.hinted && w.y >= gs.fieldH * 0.5) {
  w.hinted = true;
  showHint(w);
}
```

조건이 충족된 단어당 정확히 1회만 실행.

### 2.3 `showHint` 함수

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

- 한글 → 영문 텍스트 즉시 교체
- 영어 발음 재생
- 1200ms 후 한글로 복귀
- DOM이 이미 제거됐으면(처치/finishTyper) 무해하게 패스

## 3. 단어 상태 확장

`spawnWord` 의 `gs.words.push(...)` 객체에 `hinted: false` 한 필드 추가:

```js
gs.words.push({ id, en: pick.en, ko: pick.ko, x, y: 0, el, hinted: false });
```

다른 곳은 이 필드를 읽기/쓰기만 함. 추가 영향 없음.

## 4. 엣지케이스

| 시나리오 | 동작 |
|---------|------|
| 힌트 표시 중 단어 처치 | `killTyperWord`에서 `.dying` 클래스 추가 + 220ms 후 DOM 제거. `showHint`의 setTimeout(1200)이 그 사이 발화되면 `parentNode` 가드로 무해 패스. |
| 힌트 표시 중 게임오버 | DOM은 결과화면 전환 전 1.5초간 남아있고, `finishTyper`에서 일괄 제거. setTimeout이 그 사이 발화돼 textContent를 ko로 바꿔도 곧 DOM이 사라지므로 무해. |
| 동시 다수 단어가 같은 프레임에 반 통과 | 각각 `showHint` 호출 → `speak()`가 매번 `cancel()` 후 새 utterance → 마지막 단어 영어만 들림. 시각 텍스트는 모두 영문으로 바뀜. 1.2초 후 모두 한글 복귀. 의도된 trade-off. |
| 일시정지 후 재개 | `hinted` 플래그는 보존됨 → 같은 단어 재트리거 없음. setTimeout은 일시정지 중에도 실시간 흐름이므로 일시정지 중 텍스트가 한글로 돌아갈 수 있음 — 의도된 단순성. |
| `speak()` 실패 (브라우저 미지원) | 기존 `speak()`가 `if (!('speechSynthesis' in window)) return;` 가드 — 무해. |
| 사용자가 효과음 끔(`soundEnabled = false`) | `speak()`는 `soundEnabled` 와 무관 (기존 동작 그대로 — Web Speech는 별도 채널). 일관성 유지. |

## 5. 영향 범위

### `js/game.js` 수정 (단일 파일, 약 15라인 추가)

| 위치 | 변경 |
|------|------|
| `spawnWord` 마지막 줄 (`gs.words.push(...)` 다음) | `speak(pick.en);` 추가 |
| `spawnWord`의 push 객체 | `hinted: false` 필드 추가 |
| `typerLoop` 이동 루프 | 반 이상 검사 + `showHint(w)` 호출 |
| TYPER 섹션 | 신규 함수 `showHint` 추가 |

### 변경 없음

- CSS (`index.html`) — 텍스트 변경만, 스타일 유지
- 다른 모듈 (`achievements.js`, `profile.js`, `admin.js`)
- 기존 `speak()` 함수
- 게임 상태 초기화·종료 흐름 (Task 8 finishTyper, Task 9 pause/resume)

## 6. 검증 기준

- [ ] 스폰 직후 영어 발음 1회 들림
- [ ] 단어가 필드 중앙 이하로 내려오면 한글이 영문으로 바뀌고 발음 재생
- [ ] 1.2초 후 한글로 복귀
- [ ] 같은 단어가 두 번 힌트되지 않음 (반 통과는 1회만)
- [ ] 힌트 도중 처치/게임오버 발생해도 콘솔 에러 없음
- [ ] 다른 모드(스펠링/뜻 맞추기 등) 동작 영향 없음
