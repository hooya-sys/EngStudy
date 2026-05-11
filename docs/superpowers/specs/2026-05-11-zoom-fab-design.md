# 줌 버튼 FAB 리팩터 — Design

## Goal

헤더에서 줌 버튼 2개를 빼고, 화면 우상단에 고정된 트리거 버튼(🔍) 하나로 옮긴다. 트리거를 누르면 줌 인/아웃 버튼이 세로 스택으로 펼쳐진다. 결과적으로 헤더가 한 줄로 정리된다.

## Problem

헤더에 7개(아바타·이름·XP·🔍➖·🔍➕·🔊·🏆·🚪)+ 가 들어가니 폭이 좁은 환경(또는 줌 150%)에서 줄바꿈 발생.

## Approach

- 화면 우상단(`position: fixed; top: 20px; right: 20px; z-index: 100`)에 떠 있는 FAB(floating action button) 추가.
- 트리거 클릭 → 세로 스택으로 ➕/➖ 등장 / 다시 클릭 또는 바깥 클릭 → 접힘.
- 줌 동작 로직(`zoomIn`/`zoomOut`/경계 disabled)은 그대로 재사용. UI 위치/구조만 변경.

## Changes

### 1. `index.html` — 정적 컨테이너 추가

`<div class="app" id="app"></div>` 다음 줄에 추가:

```html
<div id="zoomFab"></div>
```

### 2. `index.html` — CSS 추가

`<style>` 블록 끝 (`.custom-empty-emoji ...` 다음, `</style>` 앞)에 추가:

```css
.zoom-fab {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}
.zoom-fab-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid var(--navy);
  background: white;
  color: var(--navy);
  font-size: 20px;
  font-family: 'Fredoka';
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.zoom-fab-btn:hover:not([disabled]) { transform: translateY(-2px); }
.zoom-fab-btn:active:not([disabled]) { transform: translateY(0); }
.zoom-fab-btn[disabled] { opacity: 0.45; cursor: not-allowed; }
.zoom-fab-trigger.open { background: var(--primary); color: white; }
```

### 3. `js/game.js` — `renderHeader`에서 줌 관련 제거

`zoomOutDisabled`, `zoomInDisabled`, `zoomOutAttrs`, `zoomInAttrs` const 4줄과 헤더 템플릿의 두 zoom 버튼(`onclick="zoomOut()"`, `onclick="zoomIn()"` 줄)을 모두 삭제. 헤더는 사운드(🔊)부터 시작.

### 4. `js/game.js` — `zoomMenuOpen` 상태 추가

`let zoomLevel = 1.0;` 다음 줄에 추가:

```js
let zoomMenuOpen = false;
```

### 5. `js/game.js` — `renderZoomFab` 함수 추가

`renderHeader` 함수 바로 위 또는 아래에 추가:

```js
function renderZoomFab() {
  const triggerClass = zoomMenuOpen ? 'zoom-fab-btn zoom-fab-trigger open' : 'zoom-fab-btn zoom-fab-trigger';
  const zoomInDisabled = zoomLevel >= ZOOM_MAX ? 'disabled' : '';
  const zoomOutDisabled = zoomLevel <= ZOOM_MIN ? 'disabled' : '';
  const actions = zoomMenuOpen
    ? `
      <button class="zoom-fab-btn" onclick="zoomIn()" title="화면 확대" ${zoomInDisabled}>➕</button>
      <button class="zoom-fab-btn" onclick="zoomOut()" title="화면 축소" ${zoomOutDisabled}>➖</button>
    `
    : '';
  return `
    <div class="zoom-fab">
      <button class="${triggerClass}" onclick="toggleZoomMenu(event)" title="화면 크기 조절">🔍</button>
      ${actions}
    </div>
  `;
}
```

`event` 인자를 받아 click 핸들러가 메뉴 자체 클릭을 바깥 클릭으로 오인하지 않도록 한다.

### 6. `js/game.js` — `toggleZoomMenu` 함수 추가

`zoomOut` 함수 다음에 추가:

```js
function toggleZoomMenu(e) {
  if (e) e.stopPropagation();
  zoomMenuOpen = !zoomMenuOpen;
  render();
}
```

### 7. `js/game.js` — `render()`에서 FAB 매번 갱신

`render()` 함수 내 `app.innerHTML = html;` 다음 줄에 추가:

```js
const fab = document.getElementById('zoomFab');
if (fab) fab.innerHTML = renderZoomFab();
```

### 8. `js/game.js` — 바깥 클릭 시 닫기

`bootGame` 함수 안에서 `await loadState();` 다음에 한 줄 추가:

```js
document.addEventListener('click', (ev) => {
  if (zoomMenuOpen && !ev.target.closest('#zoomFab')) {
    zoomMenuOpen = false;
    render();
  }
});
```

이 핸들러는 한 번만 등록되면 충분하므로 boot 시점이 적합.

### 9. `js/game.js` — `__exports`

`zoomIn`/`zoomOut` 옆에 `toggleZoomMenu` 추가.

### 10. `js/game.js` — `zoomIn`/`zoomOut`의 동작

기존 그대로. 메뉴는 열린 상태를 유지하므로 사용자가 ➕을 여러 번 누를 수 있다 (자동 닫지 않음). 닫기는 사용자가 트리거를 다시 누르거나 바깥을 클릭해야 발생.

## Out of Scope

- 줌 레벨 표시 텍스트 (요청 없음)
- 키보드 단축키
- 드래그로 위치 이동
- 모바일 터치 제스처

## Verification

- 헤더에 줌 버튼이 없고 한 줄로 정리됨 (🔊/🏆/🚪).
- 우상단 🔍 트리거가 항상 보임 (스크롤 시에도 고정).
- 트리거 클릭 → ➕ ➖ 세로 스택 등장. 한 번 더 클릭 → 접힘.
- 메뉴 열린 상태에서 화면 아무 데나 클릭 → 메뉴 닫힘.
- 줌 70%일 때 ➖ disabled. 150%일 때 ➕ disabled.
- 새로고침 후 메뉴는 닫힌 상태에서 시작 (영속 안 됨), 줌 레벨은 유지됨.
- 줌 변경 시 FAB 자체도 같이 크기 변화 (`document.body`의 zoom 영향 받음).
