# 구글 로그인 + 회원관리 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EngStudy 정적 HTML 학습 앱에 Firebase Auth(구글) + Firestore 기반 회원관리 시스템을 추가한다. 어드민 승인제 가입, 어드민/회원 권한 분리, 사용자별 진도 동기화, 어드민 회원관리 화면, 회원 "내 정보" 화면을 모두 포함한다.

**Architecture:** 단일 `index.html`의 인라인 스크립트를 `js/` 하위 ES 모듈로 분리한다 (빌드 도구 없음, Firebase Hosting이 정적 파일로 서빙). `auth.js`만 Firebase Auth를 알고, `store.js`만 Firestore를 안다. 게임 로직은 기존 `loadState/saveState` API 시그니처를 유지하므로 변경이 최소화된다. 권한 검증은 클라이언트 분기(UX) + Firestore Security Rules(실제 차단)의 이중 구조.

**Tech Stack:**
- Firebase JS SDK v11 (gstatic CDN, ESM 모듈식)
- Firebase Hosting (정적 호스팅)
- Cloud Firestore (사용자별 데이터)
- Firebase Authentication (Google Provider)
- 기존 코드: 순수 HTML/CSS/JS, 빌드 도구 없음

**Spec:** `docs/superpowers/specs/2026-05-04-google-auth-member-management-design.md`

**관습:** 기존 코드는 한국어 주석 사용. 새 모듈도 한국어 주석 유지. `var(--primary)`, `var(--navy)` 등 기존 CSS 변수 재사용.

---

## Task 0: 사람이 직접 해야 하는 사전 작업 (구현 전)

이 태스크는 코드 변경이 아니라 외부 콘솔 작업입니다. 에이전트가 자동 수행할 수 없으므로 **사용자가 직접 완료**한 뒤 다음 태스크로 넘어가야 합니다.

- [ ] **Step 1:** [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성 (예: `engstudy-prod`)
- [ ] **Step 2:** Authentication → Sign-in method → **Google** 활성화. 지원 이메일 = `imhooya@gmail.com`
- [ ] **Step 3:** Build → Firestore Database → 데이터베이스 만들기 → **프로덕션 모드** 선택, 리전 `asia-northeast3` (서울) 권장
- [ ] **Step 4:** 프로젝트 설정 → 일반 → "내 앱" 섹션에서 **웹 앱 등록** (`</>` 아이콘 클릭). 등록 후 표시되는 `firebaseConfig` 객체 6줄을 따로 저장 (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
- [ ] **Step 5:** 로컬에 Firebase CLI 설치 (`npm install -g firebase-tools`) 후 프로젝트 루트에서 `firebase login` 으로 인증.
- [ ] **Step 6:** 프로젝트 루트에서 `firebase init hosting firestore` 실행 — 다음 옵션 선택:
  - 기존 프로젝트 사용 → Step 1에서 만든 프로젝트 선택
  - public 디렉토리: `.` (현재 디렉토리)
  - SPA로 구성: **No**
  - 자동 빌드 + 배포 (GitHub): **No** (수동 배포)
  - 기존 `index.html` 덮어쓰기: **No**
  - Firestore rules file: `firestore.rules` (기본값)
  - Firestore indexes file: `firestore.indexes.json` (기본값)

이 단계가 끝나면 다음 파일들이 자동 생성됩니다: `firebase.json`, `.firebaserc`, `firestore.rules` (기본 거부 룰), `firestore.indexes.json`. **Step 4의 firebaseConfig는 Task 2에서 사용**하므로 잘 보관해 주세요.

---

## Task 1: `.gitignore` 정리 + Firebase 캐시 파일 무시

**Files:**
- Modify: `.gitignore` (없으면 생성)

- [ ] **Step 1: 현재 `.gitignore` 확인**

```bash
cat .gitignore 2>/dev/null || echo "(파일 없음)"
```

- [ ] **Step 2: `.gitignore` 생성/수정**

파일 끝에 다음 라인을 추가 (이미 있으면 스킵):

```
# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
```

- [ ] **Step 3: 커밋**

```bash
git add .gitignore
git commit -m "chore: add .gitignore for Firebase cache and OS files"
```

---

## Task 2: Firebase 초기화 모듈 생성

**Files:**
- Create: `js/firebase-init.js`

**전제 조건:** Task 0 Step 4에서 받은 `firebaseConfig` 값이 준비되어 있어야 함.

- [ ] **Step 1: `js/` 디렉토리 생성 (없을 때만)**

```bash
mkdir -p js
```

- [ ] **Step 2: `js/firebase-init.js` 작성**

⚠️ `apiKey` 등 6개 값은 사용자가 Task 0 Step 4에서 받은 실제 값으로 교체해야 함. **에이전트가 이 값을 만들면 안 됨** — 자리 표시자 그대로 두고, 사용자가 직접 채워 넣도록 안내.

```js
// Firebase 앱 초기화. 모든 다른 모듈은 여기서 export한 app/auth/db를 import해서 사용.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// ⚠️ 아래 값은 Firebase Console → 프로젝트 설정 → 웹앱에서 복사한 값으로 교체.
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// 어드민 화이트리스트 (단일 이메일). Security Rules와 반드시 동일하게 유지.
export const ADMIN_EMAIL = "imhooya@gmail.com";
```

- [ ] **Step 3: 사용자에게 안내**

화면에 출력:
```
firebaseConfig의 6개 REPLACE_ME 값을 Firebase Console에서 복사한 실제 값으로 교체해 주세요.
이 값은 클라이언트에 노출되어도 안전하지만, Security Rules(Task 11)가 실제 보안을 담당하므로 룰 배포 전까지는 외부 공유 금지.
```

- [ ] **Step 4: 커밋 (실제 키가 아직 자리 표시자여도 OK — Security Rules로 안전)**

```bash
git add js/firebase-init.js
git commit -m "feat: add Firebase init module (config placeholder)"
```

---

## Task 3: 게임 로직을 `js/game.js`로 추출 (행위 변경 없음 — 순수 리팩터링)

**Files:**
- Modify: `index.html` (인라인 `<script>` 본문 제거 + module 로드)
- Create: `js/game.js` (이동된 게임 코드)
- Create: `js/store.js` (임시: localStorage 기반 — Task 7에서 Firestore로 교체)

**의도:** Firebase 도입 전, 일단 코드 분리만 끝낸다. 게임이 정확히 이전과 동일하게 동작해야 함. `window.storage`는 Claude artifacts 환경 전용이므로 일반 브라우저용 localStorage 폴백을 `store.js`에 둔다.

- [ ] **Step 1: `js/store.js` 생성 (임시 localStorage 백엔드)**

```js
// 저장소 추상화. 현재는 localStorage. Task 7에서 Firestore로 교체.
// 게임 코드는 이 모듈의 API만 알고, 내부 구현은 모름.

const STATE_KEY = 'english_adventure_state';
const CUSTOM_KEY = 'english_adventure_custom_words';

// game.js가 주입하는 컨텍스트. Task 7에서 uid 기반으로 확장됨.
let ctx = { uid: null };

export function setStoreContext(newCtx) {
  ctx = { ...ctx, ...newCtx };
}

export async function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveState(stateObj) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(stateObj));
  } catch (e) { console.error('Save failed', e); }
}

export async function loadCustomWords() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export async function saveCustomWords(wordsArray) {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(wordsArray));
  } catch (e) { console.error('Save custom words failed', e); }
}
```

- [ ] **Step 2: `js/game.js` 생성 — `index.html`의 `<script>` 본문(현재 928~2717행)을 통째로 옮김**

방법:
1. `index.html`을 열어 `<script>`(928행)와 `</script>`(2718행) 사이의 본문을 모두 복사
2. 새 파일 `js/game.js`에 붙여넣기
3. 파일 맨 위에 import 추가:
   ```js
   import { loadState as _loadState, saveState as _saveState, loadCustomWords as _loadCustomWords, saveCustomWords as _saveCustomWords } from './store.js';
   ```
4. 파일 안의 4개 함수 정의(`async function loadState()`, `async function saveState()`, `async function loadCustomWords()`, `async function saveCustomWords()`)를 다음과 같이 교체:

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

async function loadCustomWords() {
  const arr = await _loadCustomWords();
  if (arr.length) {
    VOCAB.custom.words = arr.filter(w => w && typeof w.en === 'string' && typeof w.ko === 'string');
  }
}

async function saveCustomWords() {
  await _saveCustomWords(VOCAB.custom.words);
}
```

5. 파일 맨 아래의 IIFE `(async function init() { ... })();`는 **그대로 유지** — 추후 Task 6에서 제거.

6. 모든 `window.onclick`/`onclick="foo()"`이 작동하려면 함수가 전역에 노출되어야 함. ES 모듈 안의 함수는 기본적으로 모듈 스코프이므로, **파일 맨 아래에 다음 블록을 추가**:

```js
// onclick="..." 인라인 핸들러가 동작하려면 함수들이 window에 노출되어야 함
const __exports = {
  startGame, goHome, selectCategory, startMode, backToModeSelect, addCustomWord, removeCustomWord,
  goToCustomManage, backToCustomManage, flipCard, nextCard, selectMeaning, selectWord,
  submitSpelling, selectMatch, finishRound, closeLevelUp, toggleSound, restartGame
};
for (const [k, v] of Object.entries(__exports)) {
  window[k] = v;
}
// ⚠️ 위 목록에 빠진 함수가 있으면 onclick에서 ReferenceError 발생. 빠뜨린 게 보이면 즉시 추가.
```

(주의: 위 목록은 spec 작성 시점 추정치. 실제 게임 코드에서 `onclick="xxx()"`로 호출되는 함수를 모두 찾아 추가해야 함. 다음 단계 Step 4 검증에서 콘솔 에러로 발견됨.)

- [ ] **Step 3: `index.html` 수정 — 인라인 스크립트 제거 + 모듈 로드**

`index.html`의 `<script>` 부터 `</script>`까지(현재 928~2718행) 통째로 다음 한 줄로 교체:

```html
<script type="module" src="./js/game.js"></script>
```

`<body>` ... `</body>` 외 다른 부분(CSS, level-up overlay HTML 등)은 그대로 유지.

- [ ] **Step 4: 로컬 검증 — 게임이 이전과 동일하게 동작하는지 확인**

```bash
# Firebase 에뮬레이터나 간단한 정적 서버로 띄우기 (file:// 직접 열면 ES 모듈이 CORS로 차단됨)
npx http-server . -p 8080 -c-1
# 브라우저에서 http://localhost:8080 접속
```

검증 항목:
- 처음 로드 → welcome 화면(이름 입력) 노출
- 이름 입력 → 출발 → home 화면
- 카테고리 선택 → 모드 선택 → 게임 진행
- 새로고침 → 진도/이름 유지 (localStorage 작동)
- 콘솔에 `ReferenceError` 없음 (있으면 Step 2의 `__exports` 목록에 누락된 함수 추가)

- [ ] **Step 5: 커밋**

```bash
git add index.html js/game.js js/store.js
git commit -m "refactor: extract game logic to js/game.js + js/store.js (no behavior change)"
```

---

## Task 4: `js/auth.js` — 구글 로그인 + 사용자 문서 부트스트랩

**Files:**
- Create: `js/auth.js`

- [ ] **Step 1: `js/auth.js` 작성**

```js
// Firebase Auth 래퍼. 구글 로그인 / 로그아웃 / 인증 상태 변화 감지.
// 첫 로그인 시 users/{uid} 문서를 ADMIN_EMAIL 화이트리스트에 따라 생성.
import { signInWithPopup, signOut, onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { auth, db, googleProvider, ADMIN_EMAIL } from './firebase-init.js';

// 외부에 노출하는 현재 인증 상태
export let currentUser = null;     // Firebase User 객체
export let currentProfile = null;  // users/{uid} 문서 데이터

const listeners = new Set();

// 인증 상태 변화 콜백 등록. unsubscribe 함수 반환.
export function onAuthChange(cb) {
  listeners.add(cb);
  cb(currentUser, currentProfile);
  return () => listeners.delete(cb);
}

function notify() {
  for (const cb of listeners) cb(currentUser, currentProfile);
}

export async function loginWithGoogle() {
  await signInWithPopup(auth, googleProvider);
  // onAuthStateChanged 핸들러가 후속 처리
}

export async function logout() {
  await signOut(auth);
}

export async function deleteOwnAccount() {
  if (!currentUser) throw new Error('not signed in');
  // user.delete()는 'requires-recent-login' 에러를 낼 수 있음 — 호출자가 처리
  await deleteUser(currentUser);
}

// 첫 로그인 시 users/{uid} 문서 생성. 이미 있으면 lastLoginAt만 갱신.
async function ensureUserDoc(user) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const isAdmin = user.email === ADMIN_EMAIL;
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || null,
      role: isAdmin ? 'admin' : 'member',
      status: isAdmin ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      xp: 0,
      level: 1,
      streak: 0,
      lastPlayed: null,
      soundEnabled: true,
      mastered: {}
    });
    return (await getDoc(userRef)).data();
  } else {
    await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
    return snap.data();
  }
}

// Firebase Auth 상태 변화 → currentUser/currentProfile 갱신 → 구독자 통보
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    try {
      currentProfile = await ensureUserDoc(user);
    } catch (e) {
      console.error('Failed to load/create user doc', e);
      currentProfile = null;
    }
  } else {
    currentUser = null;
    currentProfile = null;
  }
  notify();
});

// 외부에서 프로필을 갱신했을 때 다시 읽도록
export async function refreshProfile() {
  if (!currentUser) return null;
  const snap = await getDoc(doc(db, 'users', currentUser.uid));
  currentProfile = snap.exists() ? snap.data() : null;
  notify();
  return currentProfile;
}
```

- [ ] **Step 2: 커밋**

```bash
git add js/auth.js
git commit -m "feat: add Firebase Auth wrapper with user doc bootstrap"
```

---

## Task 5: `js/gating.js` — 인증/승인 상태별 화면 분기

**Files:**
- Create: `js/gating.js`

- [ ] **Step 1: `js/gating.js` 작성**

```js
// 인증 + 승인 상태에 따른 화면 게이팅.
// 로그인/대기/차단 화면을 직접 렌더링. approved일 때만 게임에 진입 허용.
import { onAuthChange, loginWithGoogle, logout } from './auth.js';

const app = () => document.getElementById('app');

function renderLogin() {
  app().innerHTML = `
    <div class="card welcome">
      <div class="welcome-emoji">🦁</div>
      <h1>영어 단어 모험</h1>
      <p>구글 계정으로 로그인하면 어디서든 진도가 이어져요!</p>
      <div style="margin-top:24px">
        <button class="btn btn-primary btn-lg" id="loginBtn">🔐 Google로 로그인</button>
      </div>
    </div>
  `;
  document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        alert('로그인에 실패했습니다: ' + e.message);
      }
    }
  });
}

function renderPending() {
  app().innerHTML = `
    <div class="card welcome">
      <div class="welcome-emoji">⏳</div>
      <h1>승인 대기 중</h1>
      <p>관리자가 가입을 검토하고 있어요.<br>승인되면 바로 학습을 시작할 수 있어요!</p>
      <div style="margin-top:24px">
        <button class="btn btn-secondary" id="logoutBtn">로그아웃</button>
      </div>
    </div>
  `;
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function renderBlocked() {
  app().innerHTML = `
    <div class="card welcome">
      <div class="welcome-emoji">🚫</div>
      <h1>이용이 제한되었어요</h1>
      <p>이 계정은 관리자에 의해 차단되었습니다.<br>문의가 필요하면 관리자에게 연락해 주세요.</p>
      <div style="margin-top:24px">
        <button class="btn btn-secondary" id="logoutBtn">로그아웃</button>
      </div>
    </div>
  `;
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

// onApproved 콜백: 인증 + 승인 통과 시 호출. 호출자가 게임 부팅 담당.
// onLoggedOut: 인증 잃었을 때 호출 (정리용).
export function startGating({ onApproved, onLoggedOut }) {
  onAuthChange((user, profile) => {
    if (!user) {
      onLoggedOut?.();
      renderLogin();
      return;
    }
    if (!profile) {
      // 로딩 중 또는 에러 — 잠시 후 다시 알림 옴
      app().innerHTML = `<div class="card welcome"><p>로딩 중...</p></div>`;
      return;
    }
    if (profile.status === 'pending') { renderPending(); return; }
    if (profile.status === 'blocked') { renderBlocked(); return; }
    if (profile.status === 'approved') {
      onApproved(user, profile);
      return;
    }
    // 알 수 없는 상태
    app().innerHTML = `<div class="card welcome"><p>알 수 없는 상태입니다. 다시 로그인해 주세요.</p></div>`;
  });
}
```

- [ ] **Step 2: 커밋**

```bash
git add js/gating.js
git commit -m "feat: add gating module for login/pending/blocked screens"
```

---

## Task 6: `js/main.js` — 부팅 시퀀스 + game.js의 IIFE 제거

**Files:**
- Create: `js/main.js`
- Modify: `js/game.js` (마지막 IIFE 삭제 + bootGame export 추가)
- Modify: `index.html` (`<script type="module" src="./js/game.js">` → `./js/main.js`)

- [ ] **Step 1: `js/game.js` 수정 — 자동 init IIFE 제거하고 export 추가**

`js/game.js` 맨 아래의 다음 블록을 찾아서:

```js
(async function init() {
  await loadState();
  if (state.name) state.screen = 'home';
  render();
})();
```

다음으로 교체:

```js
// 외부(main.js)에서 인증 후 호출
export async function bootGame() {
  await loadState();
  state.screen = 'home';  // welcome 화면 제거 — 이제 항상 home에서 시작
  render();
}

window.addEventListener('beforeunload', () => {
  // 마지막 진도 즉시 저장
  try { saveState(); } catch {}
});
```

- [ ] **Step 2: `js/store.js`에 `setStoreContext` 호출 위치 추가는 일단 skip**

(`store.js`는 Task 7에서 Firestore로 교체. 지금은 localStorage 그대로.)

- [ ] **Step 3: `js/main.js` 작성**

```js
// 앱 부팅: Firebase 초기화 → 인증 게이팅 → 승인되면 게임 시작.
import './firebase-init.js';  // side-effect import: Firebase 앱 초기화 트리거
import { startGating } from './gating.js';
import { bootGame } from './game.js';
import { setStoreContext } from './store.js';

let bootstrapped = false;

startGating({
  onApproved: async (user, profile) => {
    setStoreContext({ uid: user.uid });
    if (!bootstrapped) {
      bootstrapped = true;
      await bootGame();
    } else {
      // 이미 부팅됨. 프로필 변화로 인한 재호출 — 무시.
    }
  },
  onLoggedOut: () => {
    bootstrapped = false;
  }
});
```

- [ ] **Step 4: `index.html` 수정 — main.js로 교체**

다음 라인을 찾아:
```html
<script type="module" src="./js/game.js"></script>
```

다음으로 교체:
```html
<script type="module" src="./js/main.js"></script>
```

- [ ] **Step 5: 로컬 검증**

```bash
npx http-server . -p 8080 -c-1
```

브라우저에서 확인:
- 로그인 화면이 노출됨 (welcome 이름 입력 화면이 더 이상 안 나옴)
- "Google로 로그인" 클릭 → 팝업 → 승인 후
  - `imhooya@gmail.com`으로 로그인하면 게임 home 화면 진입 (status: approved 자동)
  - 다른 계정으로 로그인하면 "승인 대기 중" 화면 노출
- Firestore Console에서 `users/{uid}` 문서가 생성되었는지 확인
- 콘솔 에러 없음

⚠️ 이 시점에서는 **localStorage에 진도 저장 중** — Firestore에는 메타데이터만. 다음 태스크에서 Firestore로 옮김.

- [ ] **Step 6: 커밋**

```bash
git add js/game.js js/main.js index.html
git commit -m "feat: wire Firebase Auth gating to game boot sequence"
```

---

## Task 7: `js/store.js`를 Firestore 백엔드로 교체

**Files:**
- Modify: `js/store.js` (전체 재작성)

**의도:** localStorage가 아닌 `users/{uid}`에 게임 state 저장. 커스텀 단어는 `users/{uid}/customWords` 서브컬렉션.

- [ ] **Step 1: `js/store.js` 전체 교체**

```js
// Firestore 백엔드 store. localStorage 백엔드를 대체.
// API 시그니처는 game.js가 의존하므로 유지. 내부만 Firestore.
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from './firebase-init.js';

let ctx = { uid: null };

export function setStoreContext(newCtx) {
  ctx = { ...ctx, ...newCtx };
}

function requireUid() {
  if (!ctx.uid) throw new Error('store: uid not set — login first');
  return ctx.uid;
}

// users/{uid} 문서를 통째로 읽어서 game state 형태로 반환.
export async function loadState() {
  const uid = requireUid();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    name: d.displayName || '',
    xp: d.xp || 0,
    level: d.level || 1,
    streak: d.streak || 0,
    lastPlayed: d.lastPlayed?.toMillis ? d.lastPlayed.toMillis() : (d.lastPlayed || null),
    mastered: d.mastered || {},
    soundEnabled: typeof d.soundEnabled === 'boolean' ? d.soundEnabled : true
  };
}

// game.js의 saveState가 보내는 객체를 users/{uid}에 부분 업데이트.
export async function saveState(stateObj) {
  const uid = requireUid();
  const update = {
    xp: stateObj.xp,
    level: stateObj.level,
    streak: stateObj.streak,
    lastPlayed: stateObj.lastPlayed ? new Date(stateObj.lastPlayed) : null,
    mastered: stateObj.mastered || {},
    soundEnabled: stateObj.soundEnabled
  };
  // displayName은 게임 진행으로는 변경되지 않음 — saveState에선 다루지 않음 (profile.js에서 처리)
  try {
    await updateDoc(doc(db, 'users', uid), update);
  } catch (e) { console.error('Save state failed', e); }
}

// users/{uid}/customWords 서브컬렉션 → [{en, ko}, ...] 배열 반환
export async function loadCustomWords() {
  const uid = requireUid();
  const colRef = collection(db, 'users', uid, 'customWords');
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ en: d.data().en, ko: d.data().ko, _id: d.id }));
}

// 기존 코드는 saveCustomWords(전체 배열)를 호출 — Firestore에서는 비효율적이므로
// 기존 행위 호환을 위해 "현재 컬렉션을 통째로 비우고 다시 쓴다"로 구현.
// (커스텀 단어는 보통 수십 개 이내 — 비용 무시 가능)
export async function saveCustomWords(wordsArray) {
  const uid = requireUid();
  const colRef = collection(db, 'users', uid, 'customWords');
  const existing = await getDocs(colRef);
  await Promise.all(existing.docs.map(d => deleteDoc(d.ref)));
  await Promise.all(wordsArray.map(w => addDoc(colRef, {
    en: w.en, ko: w.ko, createdAt: serverTimestamp()
  })));
}
```

- [ ] **Step 2: `js/main.js` 확인 — `setStoreContext({ uid })`가 게임 부팅 전에 호출되는지 재확인**

이미 Task 6 Step 3에서 `setStoreContext({ uid: user.uid })`를 `bootGame()` 직전에 호출하므로 OK. 변경 불필요.

- [ ] **Step 3: 로컬 검증**

```bash
npx http-server . -p 8080 -c-1
```

- 로그인 후 게임 진행 → XP 쌓이는지 확인
- 새로고침 → 진도 유지 확인
- Firestore Console에서 `users/{uid}.xp/mastered` 등 값이 갱신되는지 확인
- 커스텀 단어 추가 → `users/{uid}/customWords/{...}` 문서 생성 확인
- 콘솔에 'store: uid not set' 에러 없음 (있으면 main.js의 setStoreContext 호출 누락)

- [ ] **Step 4: 커밋**

```bash
git add js/store.js
git commit -m "feat: switch store backend from localStorage to Firestore"
```

---

## Task 8: 헤더에 "내 정보" 버튼 + 어드민 메뉴 추가

**Files:**
- Modify: `js/game.js` (`renderHeader` 함수)

**의도:** 게임 home/모드 화면 헤더에 아바타 클릭 = `profile` 화면, 어드민이면 추가로 "🛡️ 회원관리" 버튼 노출.

- [ ] **Step 1: `js/game.js`의 `renderHeader` 함수 찾기**

기존 함수 시그니처는 `function renderHeader() { ... }` — 약 1762행 부근.

- [ ] **Step 2: `js/game.js` 상단에 auth 정보 import 추가**

파일 상단 import 영역에 추가:

```js
import { currentUser, currentProfile, logout } from './auth.js';
```

- [ ] **Step 3: `renderHeader` 본문 교체**

기존 `renderHeader`의 반환 HTML 안의 user-info 블록 옆에, 다음 버튼들을 노출하도록 수정:

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
      ${isAdmin ? `<button class="btn btn-icon" id="adminBtn" title="회원관리">🛡️</button>` : ''}
      <button class="btn btn-icon" id="logoutBtn" title="로그아웃">🚪</button>
    </div>
  `;
}
```

⚠️ **주의:** 기존 `renderHeader` 함수의 정확한 본문은 파일에서 직접 확인 후 위 내용으로 대체할 것. CSS 클래스 이름(`header`, `avatar`, `user-info` 등)은 기존 그대로 사용.

- [ ] **Step 4: render() 끝부분에 클릭 핸들러 바인딩 추가**

`render()` 함수의 `app.innerHTML = html;` 다음 (다른 input 핸들러 바인딩이 있는 영역) 에 추가:

```js
const avatarBtn = document.getElementById('avatarBtn');
if (avatarBtn) avatarBtn.addEventListener('click', () => {
  state.screen = 'profile';
  render();
});

const adminBtn = document.getElementById('adminBtn');
if (adminBtn) adminBtn.addEventListener('click', () => {
  state.screen = 'admin';
  render();
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', async () => {
  await logout();
});
```

- [ ] **Step 5: render()의 switch에 두 화면 case 추가 (placeholder)**

```js
case 'profile': html = '<div class="card">프로필 화면 준비 중...</div>'; break;
case 'admin': html = '<div class="card">어드민 화면 준비 중...</div>'; break;
```

(실제 렌더링은 Task 9·10에서 채움)

- [ ] **Step 6: 로컬 검증**

- 어드민 계정으로 로그인 → 헤더에 🛡️ + 🚪 + 아바타 사진(또는 🦁) 노출
- 일반 회원 계정으로 로그인 → 🛡️ 안 보임, 나머지 동일
- 아바타 클릭 → "프로필 화면 준비 중..." 표시
- 🛡️ 클릭 (어드민만) → "어드민 화면 준비 중..." 표시
- 🚪 클릭 → 로그아웃 → 로그인 화면

- [ ] **Step 7: 커밋**

```bash
git add js/game.js
git commit -m "feat: add header avatar + admin button + logout to game header"
```

---

## Task 9: `js/profile.js` — "내 정보" 화면 (조회·표시이름변경·진도초기화·탈퇴)

**Files:**
- Create: `js/profile.js`
- Modify: `js/game.js` (profile 화면 render 분기, mastered 카운팅 헬퍼 사용)

- [ ] **Step 1: `js/profile.js` 작성**

```js
// 회원 본인의 "내 정보" 화면. 표시이름 수정 / 진도 초기화 / 탈퇴.
import { doc, updateDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from './firebase-init.js';
import { currentUser, currentProfile, refreshProfile, deleteOwnAccount, logout } from './auth.js';

// VOCAB을 game.js 모듈에서 가져오기 위해 game.js가 export 해줘야 함 (Task 9 Step 2 참고)
import { VOCAB, CATEGORIES, render as gameRender, state as gameState } from './game.js';

export function renderProfile() {
  if (!currentProfile || !currentUser) return '<div class="card">로딩 중...</div>';
  const p = currentProfile;
  const u = currentUser;
  const photo = u.photoURL;
  const created = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('ko-KR') : '-';

  // 카테고리별 마스터 진도
  const totalWords = CATEGORIES.reduce((s, k) => s + VOCAB[k].words.length, 0);
  const totalMastered = CATEGORIES.reduce((s, k) => {
    const ex = new Set(VOCAB[k].words.map(w => w.en));
    return s + (gameState.mastered[k] || []).filter(en => ex.has(en)).length;
  }, 0);

  const catRows = CATEGORIES.map(k => {
    const cat = VOCAB[k];
    const ex = new Set(cat.words.map(w => w.en));
    const m = (gameState.mastered[k] || []).filter(en => ex.has(en)).length;
    const pct = cat.words.length ? Math.round(m / cat.words.length * 100) : 0;
    return `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee">
        <span>${cat.emoji} ${cat.nameKr}</span>
        <span>${m} / ${cat.words.length} (${pct}%)</span>
      </div>
    `;
  }).join('');

  return `
    <div class="card">
      <button class="btn btn-secondary" id="profileBackBtn" style="margin-bottom:14px">← 돌아가기</button>
      <div class="screen-title">👤 내 정보</div>

      <div style="display:flex;align-items:center;gap:16px;padding:14px;background:var(--bg-soft);border-radius:14px;border:3px solid var(--navy);margin-bottom:18px">
        <div class="avatar" style="width:72px;height:72px;font-size:40px">
          ${photo ? `<img src="${photo}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : '🦁'}
        </div>
        <div style="flex:1">
          <div style="font-family:'Fredoka';font-weight:600;font-size:20px;">${p.displayName}</div>
          <div style="color:var(--navy-soft);font-size:13px">${p.email}</div>
          <div style="color:var(--navy-soft);font-size:12px;margin-top:4px">가입일: ${created} · ${p.role === 'admin' ? '🛡️ 관리자' : '회원'}</div>
        </div>
      </div>

      <div style="margin-bottom:18px">
        <label style="font-weight:600">표시 이름</label>
        <div style="display:flex;gap:8px;margin-top:6px">
          <input type="text" id="displayNameInput" value="${p.displayName}" maxlength="20" style="flex:1;padding:10px;border-radius:10px;border:2px solid var(--navy)">
          <button class="btn btn-primary" id="saveNameBtn">저장</button>
        </div>
      </div>

      <div style="margin-bottom:18px">
        <div style="font-weight:600;margin-bottom:8px">📊 학습 진도</div>
        <div style="background:var(--bg-soft);padding:12px;border-radius:10px;border:2px solid var(--navy)">
          <div style="font-weight:600;margin-bottom:8px">전체 ${totalMastered} / ${totalWords} 단어 · Lv.${gameState.level} · ${gameState.xp} XP · 🔥 ${gameState.streak}일</div>
          ${catRows}
        </div>
      </div>

      <div style="border:3px solid var(--danger);border-radius:14px;padding:14px;background:#FFF0F0">
        <div style="font-weight:700;color:var(--danger);margin-bottom:10px">⚠️ 위험 작업</div>
        <button class="btn btn-secondary" id="resetProgressBtn" style="margin-right:8px">진도 초기화</button>
        <button class="btn" id="deleteAccountBtn" style="background:var(--danger);color:white">탈퇴하기</button>
      </div>
    </div>
  `;
}

export function bindProfileHandlers() {
  document.getElementById('profileBackBtn')?.addEventListener('click', () => {
    gameState.screen = 'home';
    gameRender();
  });

  document.getElementById('saveNameBtn')?.addEventListener('click', async () => {
    const newName = document.getElementById('displayNameInput').value.trim();
    if (!newName) { alert('이름을 입력해 주세요'); return; }
    await updateDoc(doc(db, 'users', currentUser.uid), { displayName: newName });
    await refreshProfile();
    gameState.name = newName;
    gameRender();
  });

  document.getElementById('resetProgressBtn')?.addEventListener('click', async () => {
    if (!confirm('XP, 레벨, streak, 마스터한 단어가 모두 초기화됩니다. 커스텀 단어는 유지됩니다. 계속할까요?')) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      xp: 0, level: 1, streak: 0, mastered: {}
    });
    gameState.xp = 0; gameState.level = 1; gameState.streak = 0; gameState.mastered = {};
    await refreshProfile();
    alert('초기화되었습니다.');
    gameState.screen = 'home';
    gameRender();
  });

  document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
    if (!confirm('정말 탈퇴하시겠어요? 모든 데이터가 삭제됩니다.\n다시 가입하려면 관리자 승인이 필요합니다.')) return;
    try {
      // 1. customWords 서브컬렉션 비우기
      const colRef = collection(db, 'users', currentUser.uid, 'customWords');
      const snap = await getDocs(colRef);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      // 2. user 문서 삭제
      await deleteDoc(doc(db, 'users', currentUser.uid));
      // 3. Firebase Auth 계정 삭제
      await deleteOwnAccount();
      // onAuthStateChanged가 자동으로 로그인 화면으로 보냄
    } catch (e) {
      if (e.code === 'auth/requires-recent-login') {
        alert('보안을 위해 다시 로그인이 필요합니다. 로그아웃 후 재로그인 → 다시 시도해 주세요.');
        await logout();
      } else {
        alert('탈퇴 중 오류: ' + e.message);
      }
    }
  });
}
```

- [ ] **Step 2: `js/game.js` 수정 — VOCAB/CATEGORIES/state/render export**

`js/game.js` 맨 아래의 `__exports` 블록 직전에 추가:

```js
// 다른 모듈(profile.js, admin.js)에서 사용하는 심볼들 export
export { VOCAB, CATEGORIES, state, render };
```

⚠️ ES 모듈에서 `export { ... }`는 함수/변수가 모듈 스코프에 정의되어 있어야 함. `state`/`VOCAB`/`CATEGORIES`/`render`는 이미 정의되어 있으므로 import 측에서 정상 동작.

- [ ] **Step 3: `js/game.js`의 render() switch에 profile 분기 추가**

기존 placeholder를 실제 렌더링으로 교체:

```js
case 'profile': html = renderProfile(); break;
```

그리고 파일 상단 import 영역에 추가:

```js
import { renderProfile, bindProfileHandlers } from './profile.js';
```

- [ ] **Step 4: render() 끝부분에 핸들러 바인딩 호출 추가**

기존 다른 핸들러 바인딩 옆에 추가:

```js
if (state.screen === 'profile') bindProfileHandlers();
```

- [ ] **Step 5: 로컬 검증**

- 아바타 클릭 → 내 정보 화면 노출, 사진/이름/이메일/가입일/역할 표시
- 표시 이름 변경 → Firestore에 반영 + 헤더에도 새 이름
- 진도 초기화 → XP 0, 카테고리 진도 0, 커스텀 단어는 유지
- 탈퇴 → 다이얼로그 → user 문서/customWords/Auth 모두 삭제 + 로그인 화면 복귀
- 다른 계정으로 다시 가입 → status: pending 화면

- [ ] **Step 6: 커밋**

```bash
git add js/profile.js js/game.js
git commit -m "feat: add profile screen with display name edit, reset, and account deletion"
```

---

## Task 10: `js/admin.js` — 어드민 회원관리 화면 (탭, 목록, 액션)

**Files:**
- Create: `js/admin.js`
- Modify: `js/game.js` (admin 화면 render 분기)

- [ ] **Step 1: `js/admin.js` 작성**

```js
// 어드민 전용 회원관리 화면.
// - 승인 대기 탭 (status: pending)
// - 전체 회원 탭 (모든 users)
// - 행 클릭 → 상세 모달 (차단/역할/삭제 액션, 카테고리별 진도, 커스텀 단어 수)
// 마지막 어드민 락아웃 방지 포함.
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, getCountFromServer
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from './firebase-init.js';
import { currentUser, currentProfile } from './auth.js';
import { VOCAB, CATEGORIES, state as gameState, render as gameRender } from './game.js';

let viewState = {
  tab: 'pending',          // 'pending' | 'all'
  members: [],             // 캐시된 목록
  modalUid: null           // 상세 모달이 열린 회원 uid (null이면 닫힘)
};

async function fetchMembers(tab) {
  const usersRef = collection(db, 'users');
  const q = tab === 'pending' ? query(usersRef, where('status', '==', 'pending')) : usersRef;
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

async function countAdmins() {
  const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin'), where('status', '==', 'approved')));
  return snap.size;
}

async function countCustomWords(uid) {
  const cnt = await getCountFromServer(collection(db, 'users', uid, 'customWords'));
  return cnt.data().count;
}

export function renderAdmin() {
  if (currentProfile?.role !== 'admin') {
    return '<div class="card">접근 권한이 없습니다.</div>';
  }
  return `
    <div class="card">
      <button class="btn btn-secondary" id="adminBackBtn" style="margin-bottom:14px">← 돌아가기</button>
      <div class="screen-title">🛡️ 회원관리</div>

      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button class="btn ${viewState.tab === 'pending' ? 'btn-primary' : 'btn-secondary'}" data-tab="pending">⏳ 승인 대기</button>
        <button class="btn ${viewState.tab === 'all' ? 'btn-primary' : 'btn-secondary'}" data-tab="all">👥 전체 회원</button>
      </div>

      <div id="memberList">불러오는 중...</div>
      ${viewState.modalUid ? renderModal() : ''}
    </div>
  `;
}

function renderModal() {
  const m = viewState.members.find(x => x.uid === viewState.modalUid);
  if (!m) return '';
  const isSelf = m.uid === currentUser.uid;
  return `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000" id="modalOverlay">
      <div class="card" style="max-width:480px;width:90%;max-height:80vh;overflow-y:auto" onclick="event.stopPropagation()">
        <div style="font-family:'Fredoka';font-size:18px;font-weight:600;margin-bottom:6px">${m.displayName} ${isSelf ? '(나)' : ''}</div>
        <div style="color:var(--navy-soft);font-size:13px;margin-bottom:14px">${m.email} · ${m.role === 'admin' ? '🛡️ 관리자' : '회원'} · ${m.status}</div>

        <div id="modalProgress" style="margin-bottom:14px;font-size:13px;color:var(--navy-soft)">진도 불러오는 중...</div>

        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${m.status === 'pending' ? `<button class="btn btn-primary" data-action="approve" data-uid="${m.uid}">✅ 승인</button>` : ''}
          ${m.status === 'pending' ? `<button class="btn btn-secondary" data-action="reject" data-uid="${m.uid}">❌ 거절</button>` : ''}
          ${m.status === 'approved' ? `<button class="btn btn-secondary" data-action="block" data-uid="${m.uid}">🚫 차단</button>` : ''}
          ${m.status === 'blocked' ? `<button class="btn btn-primary" data-action="unblock" data-uid="${m.uid}">🔓 차단 해제</button>` : ''}
          ${m.status !== 'pending' ? `<button class="btn btn-secondary" data-action="toggleRole" data-uid="${m.uid}">${m.role === 'admin' ? '회원으로 강등' : '어드민 부여'}</button>` : ''}
          <button class="btn" data-action="delete" data-uid="${m.uid}" style="background:var(--danger);color:white">🗑 삭제</button>
          <button class="btn btn-secondary" data-action="close">닫기</button>
        </div>
      </div>
    </div>
  `;
}

async function loadModalProgress(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return;
    const d = snap.data();
    const total = CATEGORIES.reduce((s, k) => s + VOCAB[k].words.length, 0);
    const mastered = CATEGORIES.reduce((s, k) => {
      const ex = new Set(VOCAB[k].words.map(w => w.en));
      return s + (d.mastered?.[k] || []).filter(en => ex.has(en)).length;
    }, 0);
    const customCount = await countCustomWords(uid);
    const el = document.getElementById('modalProgress');
    if (el) el.innerHTML = `Lv.${d.level || 1} · ${d.xp || 0} XP · 🔥 ${d.streak || 0}일<br>마스터 단어: ${mastered} / ${total} · 커스텀 단어: ${customCount}개`;
  } catch (e) { console.error(e); }
}

async function refreshList() {
  const listEl = document.getElementById('memberList');
  if (listEl) listEl.innerHTML = '불러오는 중...';
  viewState.members = await fetchMembers(viewState.tab);
  if (!listEl) return;
  if (viewState.members.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:30px;color:var(--navy-soft)">${viewState.tab === 'pending' ? '승인 대기 중인 회원이 없어요' : '회원이 없어요'}</div>`;
    return;
  }
  listEl.innerHTML = viewState.members.map(m => `
    <div class="member-row" data-uid="${m.uid}" style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid #eee;cursor:pointer">
      <div style="width:40px;height:40px;border-radius:50%;background:var(--bg-soft);overflow:hidden;display:flex;align-items:center;justify-content:center;border:2px solid var(--navy)">
        ${m.photoURL ? `<img src="${m.photoURL}" style="width:100%;height:100%;object-fit:cover">` : '🦁'}
      </div>
      <div style="flex:1">
        <div style="font-weight:600">${m.displayName} ${m.uid === currentUser.uid ? '<span style="color:var(--primary)">(나)</span>' : ''}</div>
        <div style="color:var(--navy-soft);font-size:12px">${m.email}</div>
      </div>
      <div style="text-align:right;font-size:12px;color:var(--navy-soft)">
        <div>${m.role === 'admin' ? '🛡️' : ''} ${m.status}</div>
        <div>Lv.${m.level || 1}</div>
      </div>
    </div>
  `).join('');
}

async function performAction(action, uid) {
  const m = viewState.members.find(x => x.uid === uid);
  if (!m) return;
  const isSelf = uid === currentUser.uid;

  // 마지막 어드민 락아웃 방지: 어드민 1명일 때 본인 강등/차단/삭제 차단
  const dangerous = (action === 'block' || action === 'delete' || (action === 'toggleRole' && m.role === 'admin'));
  if (isSelf && dangerous) {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      alert('마지막 관리자입니다. 다른 계정에 어드민을 부여한 뒤 다시 시도해 주세요.');
      return;
    }
    if (!confirm('본인 계정에 영향을 주는 작업입니다. 정말 진행할까요?')) return;
  }

  const userRef = doc(db, 'users', uid);
  try {
    if (action === 'approve')   await updateDoc(userRef, { status: 'approved' });
    else if (action === 'reject')   await deleteDoc(userRef);
    else if (action === 'block')    await updateDoc(userRef, { status: 'blocked' });
    else if (action === 'unblock')  await updateDoc(userRef, { status: 'approved' });
    else if (action === 'toggleRole') {
      await updateDoc(userRef, { role: m.role === 'admin' ? 'member' : 'admin' });
    }
    else if (action === 'delete') {
      if (!confirm(`${m.displayName}을(를) 삭제합니다. 모든 데이터가 영구 삭제됩니다.`)) return;
      const colRef = collection(db, 'users', uid, 'customWords');
      const snap = await getDocs(colRef);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(userRef);
    }
    viewState.modalUid = null;
    await refreshList();
    gameRender();
  } catch (e) {
    alert('작업 실패: ' + e.message);
  }
}

export function bindAdminHandlers() {
  document.getElementById('adminBackBtn')?.addEventListener('click', () => {
    gameState.screen = 'home';
    viewState.modalUid = null;
    gameRender();
  });

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      viewState.tab = btn.dataset.tab;
      gameRender();
    });
  });

  // 행 클릭 → 모달 열기
  document.querySelectorAll('.member-row').forEach(row => {
    row.addEventListener('click', () => {
      viewState.modalUid = row.dataset.uid;
      gameRender();
      loadModalProgress(viewState.modalUid);
    });
  });

  // 모달 외부 클릭 = 닫기
  document.getElementById('modalOverlay')?.addEventListener('click', () => {
    viewState.modalUid = null;
    gameRender();
  });

  // 모달 액션 버튼
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const uid = btn.dataset.uid;
      if (action === 'close') {
        viewState.modalUid = null;
        gameRender();
        return;
      }
      await performAction(action, uid);
    });
  });

  // 첫 진입 시 목록 로드
  if (!viewState.members.length || document.getElementById('memberList')?.textContent === '불러오는 중...') {
    refreshList();
  }
}

// 외부에서 탭이 바뀌었거나 갱신 필요 시
export function resetAdminView() {
  viewState = { tab: 'pending', members: [], modalUid: null };
}
```

- [ ] **Step 2: `js/game.js`에서 admin 화면 분기 활성화**

상단 import 영역에 추가:

```js
import { renderAdmin, bindAdminHandlers, resetAdminView } from './admin.js';
```

`render()` switch의 admin placeholder 교체:

```js
case 'admin': html = renderAdmin(); break;
```

render() 끝부분 핸들러 바인딩 영역에 추가:

```js
if (state.screen === 'admin') bindAdminHandlers();
```

또한 헤더의 어드민 버튼 클릭 핸들러(Task 8 Step 4)에서 `resetAdminView()` 호출해 깨끗한 상태로 진입하도록 수정:

```js
const adminBtn = document.getElementById('adminBtn');
if (adminBtn) adminBtn.addEventListener('click', () => {
  resetAdminView();
  state.screen = 'admin';
  render();
});
```

- [ ] **Step 3: 로컬 검증 (Security Rules는 아직 기본값 — Firestore Console에서 임시로 read/write 허용 모드여야 작동)**

⚠️ Task 0 Step 3에서 "프로덕션 모드"로 만들었다면 현재는 모든 read/write가 거부됨. 검증 전에 Firestore Console → 규칙 탭에서 임시로:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

으로 게시한 뒤 검증. (Task 11에서 정식 룰로 교체)

검증:
- 어드민으로 로그인 → 🛡️ 클릭 → 회원관리 화면
- 다른 계정을 미리 한 번 로그인시켜 pending 회원 만들어둠
- 승인 대기 탭에 그 회원 보임 → 행 클릭 → 모달 → 승인 → 사라짐
- 전체 회원 탭에서 그 회원이 approved 상태로 보임
- 행 클릭 → 진도 정보 + 액션 노출
- 차단 → 그 회원 새로고침 시 차단 화면 노출
- 어드민 1명일 때 본인 강등 시도 → "마지막 관리자입니다" 알림
- 다른 회원 [삭제] → user 문서 + customWords 삭제 확인

- [ ] **Step 4: 커밋**

```bash
git add js/admin.js js/game.js
git commit -m "feat: add admin member management screen with tabs and actions"
```

---

## Task 11: `firestore.rules` 작성 + 배포

**Files:**
- Modify: `firestore.rules` (Task 0에서 자동 생성된 기본 파일 교체)

- [ ] **Step 1: `firestore.rules` 전체 교체**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isSelf(uid) { return request.auth.uid == uid; }
    function isAdmin() {
      return isSignedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin"
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == "approved";
    }
    function isApproved() {
      return isSignedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == "approved";
    }

    match /users/{uid} {
      allow get: if isSelf(uid) || isAdmin();
      allow list: if isAdmin();

      // 첫 생성: 본인만, role/status는 ADMIN_EMAIL 화이트리스트에 따라 강제
      allow create: if isSelf(uid)
        && request.resource.data.email == request.auth.token.email
        && (
          (request.resource.data.email == "imhooya@gmail.com"
            && request.resource.data.role == "admin"
            && request.resource.data.status == "approved")
          ||
          (request.resource.data.email != "imhooya@gmail.com"
            && request.resource.data.role == "member"
            && request.resource.data.status == "pending")
        );

      // 본인 업데이트: role/status/email 변경 금지 (그 외 필드는 OK)
      allow update: if isSelf(uid)
        && request.resource.data.role == resource.data.role
        && request.resource.data.status == resource.data.status
        && request.resource.data.email == resource.data.email;
      // 어드민 업데이트: 모든 필드 가능
      allow update: if isAdmin();

      // 삭제: 본인(탈퇴) 또는 어드민
      allow delete: if isSelf(uid) || isAdmin();
    }

    match /users/{uid}/customWords/{wordId} {
      // 본인: 읽기/쓰기 모두 (단 approved 상태)
      allow read, write: if isSelf(uid) && isApproved();
      // 어드민: 읽기 + 삭제 (회원 진도 조회 + cascade delete용). write/update는 미허용 = 최소 권한.
      allow read, delete: if isAdmin();
    }
  }
}
```

⚠️ `imhooya@gmail.com`은 `js/firebase-init.js`의 `ADMIN_EMAIL`과 반드시 동일하게 유지. 어드민 이메일을 바꾸려면 두 파일 모두 수정.

- [ ] **Step 2: 룰 배포**

```bash
firebase deploy --only firestore:rules
```

성공 출력 예: `✔ cloud.firestore: rules file ... compiled successfully` + `✔ Deploy complete!`

- [ ] **Step 3: 룰이 잘 작동하는지 검증**

브라우저에서 (정상 케이스):
- 어드민 로그인 → 회원관리에서 다른 회원 승인/차단 → 정상 동작
- 일반 회원 로그인 → 게임 진행 (XP 저장 등) → 정상 동작
- 일반 회원 → 다른 회원 정보 읽기 시도(콘솔에서 직접 `getDoc(doc(db, 'users', '다른uid'))`) → permission-denied
- 일반 회원 → 자기 문서에 `role: 'admin'` 직접 setDoc → permission-denied

- [ ] **Step 4: 커밋**

```bash
git add firestore.rules
git commit -m "feat: enforce role/status/email rules in Firestore Security Rules"
```

---

## Task 12: Firebase Hosting 배포 + 종단간 수동 테스트

**Files:** (코드 변경 없음 — 배포 + 검증만)

- [ ] **Step 1: `firebase.json` 확인 — Hosting 설정**

`firebase init hosting`으로 자동 생성된 `firebase.json`이 다음 형태인지 확인:

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "**/docs/**"
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

`docs/**`을 ignore 목록에 추가 (없으면 직접 추가) — 설계 문서를 호스팅에 올릴 필요 없음.

- [ ] **Step 2: 호스팅 배포**

```bash
firebase deploy --only hosting
```

성공 시 출력에 호스팅 URL이 표시됨 (예: `https://<project-id>.web.app`).

- [ ] **Step 3: 종단간 수동 테스트 시나리오 실행**

배포된 URL에서 다음 9가지 시나리오를 모두 통과해야 함:

1. **최초 어드민 부트스트랩**: `imhooya@gmail.com`로 첫 로그인 → 즉시 게임 home 화면 + 헤더에 🛡️ 노출. Firestore Console에서 `users/{uid}.role == 'admin', status == 'approved'` 확인.
2. **신규 가입자 게이팅**: 다른 구글 계정으로 로그인 → "승인 대기 중" 화면만 노출, 게임 진입 불가.
3. **승인 흐름**: 어드민이 승인 탭에서 [승인] → 신규 사용자 페이지 새로고침 시 게임 가능.
4. **차단 흐름**: 어드민이 [차단] → 그 사용자 페이지 새로고침 → "이용이 제한되었어요" 화면.
5. **탈퇴 흐름**: 회원이 내 정보 → [탈퇴하기] → confirm 후 user 문서/customWords/Auth 계정 모두 삭제(Firestore + Auth Console에서 확인). 같은 계정 재로그인 시 status:pending 처음부터.
6. **진도 초기화**: 내 정보 → [진도 초기화] → XP/streak/mastered 0, customWords 유지 확인.
7. **마지막 어드민 락아웃 방지**: 어드민이 1명뿐일 때 본인 [회원으로 강등] / [차단] / [삭제] 시도 → "마지막 관리자입니다" 알림.
8. **다중 기기 동기화**: 같은 계정으로 다른 브라우저(또는 시크릿 창)에서 로그인 → XP·진도 동일하게 보임.
9. **위조 시도 (Security Rules 검증)**:
   - 일반 회원이 브라우저 콘솔에서 `firebase.firestore().doc('users/다른uid').get()` 시도 → permission-denied
   - 일반 회원이 `setDoc(doc(db, 'users', myUid), { role: 'admin', ... }, { merge: true })` 시도 → permission-denied (update 룰의 role 불변 검증으로 차단)

각 시나리오 통과를 체크리스트에 기록.

- [ ] **Step 4: 통과 시 README 업데이트 (선택)**

`README.md`가 거의 비어 있으니 다음 정도 추가하면 좋음:

```markdown
# 영어 단어 모험 (English Adventure)

초등 영어 단어 학습 웹앱. Firebase Auth(Google) + Firestore 기반.

## 개발

```bash
npx http-server . -p 8080 -c-1   # 로컬 서버
firebase deploy                    # 배포
```

관리자 이메일은 `js/firebase-init.js`의 `ADMIN_EMAIL` 및 `firestore.rules` 두 곳에 동시에 명시되어 있다.
```

- [ ] **Step 5: 최종 커밋**

```bash
git add firebase.json README.md
git commit -m "chore: configure hosting ignore + update README"
```

---

## 자체 점검 (Self-Review) 결과

- **Spec 1 (배경/목표)**: Task 0~12 전체로 커버.
- **Spec 2 (요구사항 요약)**: 모든 항목 구현 — 호스팅(Task 12), Auth(Task 4), Firestore(Task 7), 승인제(Task 4·10), 어드민 하드코딩(Task 2·11), 사용자별 데이터(Task 7), 커스텀 단어 본인만(Task 11), 기존 데이터 폐기(Task 3에서 명시 안 함 — 새 store는 Firestore 기반이므로 자동 폐기), ES 모듈(Task 3~10).
- **Spec 3 (파일 구조)**: 모든 모듈 생성 — `firebase-init`(T2), `auth`(T4), `store`(T3·T7), `gating`(T5), `admin`(T10), `profile`(T9), `game`(T3), `main`(T6).
- **Spec 4 (데이터 모델)**: Task 4·7·9·10에서 정확한 필드 사용 (email, displayName, photoURL, role, status, createdAt, lastLoginAt, xp, level, streak, lastPlayed, soundEnabled, mastered, customWords/{en,ko,createdAt}).
- **Spec 5 (인증/권한/게이팅)**: Task 4 (signInWithPopup/onAuthStateChanged/ensureUserDoc), Task 5 (login/pending/blocked 화면), Task 6 (라우팅).
- **Spec 6 (어드민 화면)**: Task 10 — 두 탭 + 모달 + 6개 액션 + 마지막 어드민 보호.
- **Spec 7 (내 정보 화면)**: Task 9 — 프로필카드/이름수정/진도/초기화/탈퇴 + requires-recent-login 처리.
- **Spec 8 (게임 코드 변경)**: Task 3 (game.js 분리), Task 6 (welcome 제거), Task 7 (store 교체), Task 8 (헤더 변경).
- **Spec 9 (Security Rules)**: Task 11 — get/list/create/update(self+admin)/delete + customWords(self+admin read-delete).
- **Spec 10 (에러 처리)**: 로그인 팝업 차단(T5), 쓰기 실패 console.error+토스트(T7), requires-recent-login(T9), Security Rules 거절은 onAuthStateChanged가 자동으로 게이팅으로 보내는 구조(T4·T5).
- **Spec 11 (수동 테스트)**: Task 12 Step 3 — 9개 시나리오 모두 명시.
- **Spec 12 (사전 작업)**: Task 0.
- **Spec 13 (범위 외)**: 모두 구현 안 함 — 자동 테스트 / URL 라우팅 / 다국어 / 이메일 알림 / 마이그레이션 / PWA / 그룹·랭킹 미포함.

**Type 일관성**: `currentUser`/`currentProfile`은 `auth.js`에서 export, `profile.js`/`admin.js`/`game.js`에서 동일 이름으로 import. `setStoreContext({uid})`는 `main.js`에서 호출, `store.js`에서 정의 — 일치. `VOCAB`/`CATEGORIES`/`state`/`render`는 `game.js`에서 export, 다른 모듈들이 import — 일치.

**Placeholder 스캔**: TBD/TODO 없음. 모든 코드 블록에 실제 코드 제시. 단 한 곳 — Task 2에서 `firebaseConfig`의 6개 값은 사용자가 콘솔에서 받은 실제 값으로 교체해야 한다고 명시 (의도된 자리 표시자, 에이전트가 만들면 안 되는 값).
