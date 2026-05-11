# 화면 줌 버튼 — Design

## Goal

헤더에 줌 인/아웃 버튼 두 개를 추가해 사용자가 화면 크기를 조절할 수 있게 한다. 줌 레벨은 로그인 상태와 함께 저장돼 새로고침 후에도 유지된다.

## Approach

- `document.body.style.zoom` 속성으로 전체 페이지 확대/축소 (Chromium/WebKit/Firefox 126+ 모두 지원).
- 두 개의 헤더 버튼: `🔍➖` 줄아웃, `🔍➕` 줄인. 사운드 버튼(🔊) 왼쪽에 위치.
- 클릭당 ±10%, 범위 70%~150% (9단계).
- 범위 끝에서 버튼은 시각적으로 비활성화 (`opacity: 0.45` + `pointer-events: none`).
- 줌 레벨은 `state.zoomLevel`로 저장 — 기존 `state.soundEnabled` 옆에 동일한 저장 경로(로그인 시 Firestore, 비로그인 시 localStorage)로 영속화.

대안 비교:
- `transform: scale()`은 레이아웃 박스에 영향을 주고 스크롤 동작이 어색해져서 제외.
- CSS `rem` 단위로 root font-size 변경 방식은 현재 코드가 px 위주라 광범위한 리팩토링이 필요해서 제외.

## Changes

### 1. 상태 변수 (`js/game.js`)

`soundEnabled`와 동일한 위치(~line 614)에 `zoomLevel` 추가:

```js
let zoomLevel = 1.0;
```

상수 추가 (적절한 위치, 예: `XP_PER_LEVEL` 근처):

```js
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
```

### 2. 저장/로딩

`loadState` (`~line 506`): `soundEnabled` 로딩 분기 옆에 추가.

```js
if (typeof loaded.zoomLevel === 'number') zoomLevel = loaded.zoomLevel;
```

로드 직후 `document.body.style.zoom = zoomLevel`을 적용해 페이지 진입 즉시 마지막 줌 레벨이 보이도록 한다. `loadState`의 `if (typeof loaded.zoomLevel === 'number')` 분기 뒤에 `document.body.style.zoom = zoomLevel` 한 줄을 둔다(분기에 안 들어가도 기본값 1.0을 적용해 깔끔하게 정렬).

`saveState` (~line 521): `toSave` 객체에 `zoomLevel` 추가.

```js
const toSave = {
  ...,
  soundEnabled: soundEnabled,
  zoomLevel: zoomLevel
};
```

### 3. 줌 토글 함수

`toggleSound` (~line 811) 근처에 두 함수 추가:

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

`render()`를 호출하는 이유: 버튼의 disabled 상태(범위 끝일 때)가 다시 그려져야 하기 때문.

### 4. 헤더 버튼 (`renderHeader` ~line 848)

기존 사운드 버튼 바로 앞에 두 줌 버튼 추가:

```js
const zoomOutDisabled = zoomLevel <= ZOOM_MIN;
const zoomInDisabled = zoomLevel >= ZOOM_MAX;
const zoomOutStyle = zoomOutDisabled ? 'opacity:0.45;pointer-events:none;' : '';
const zoomInStyle = zoomInDisabled ? 'opacity:0.45;pointer-events:none;' : '';
```

(`renderHeader` 함수 위쪽 변수 정의 자리에 추가)

그리고 사운드 버튼 앞 줄에 두 줌 버튼 삽입:

```js
<button class="btn btn-icon" onclick="zoomOut()" title="화면 축소" style="${zoomOutStyle}">🔍➖</button>
<button class="btn btn-icon" onclick="zoomIn()" title="화면 확대" style="${zoomInStyle}">🔍➕</button>
<button class="btn btn-icon" onclick="toggleSound()" ...
```

### 5. 전역 노출 (~line 1956 근처)

`window`에 노출된 핸들러 목록에 `zoomIn`, `zoomOut` 추가.

## Out of Scope

- 줌 슬라이더/팝업 UI (요청 없음 — 헤더 +/- 두 버튼으로 결정)
- 모바일 핀치 줌 (브라우저 기본 동작 유지)
- 키보드 단축키 (요청 없음)
- 줌 레벨 표시 텍스트 (요청 없음 — 클릭으로 즉시 변화가 보임)

## Verification

- 페이지 새로고침 후 마지막 줌이 유지된다.
- 70%에서 줄아웃 버튼이 흐려지고 더 안 눌린다. 150%에서 줄인 버튼이 흐려진다.
- 줌 적용 시 헤더 자체도 같이 커지거나 작아진다 (`document.body`에 걸기 때문).
- 비로그인(게스트) 상태에서도 localStorage에 저장되어 새로고침 후 유지된다.
- 사운드 버튼은 기존과 동일하게 동작.
