// Firebase Auth 래퍼. 구글 로그인 / 로그아웃 / 인증 상태 변화 감지.
// 첫 로그인 시 users/{uid} 문서를 ADMIN_EMAIL 화이트리스트에 따라 생성.
import { signInWithPopup, signOut, onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { auth, db, googleProvider, ADMIN_EMAIL } from './firebase-init.js';

// 외부에 노출하는 현재 인증 상태
export let currentUser = null;     // Firebase User 객체
export let currentProfile = null;  // users/{uid} 문서 데이터

const listeners = new Set();
let authResolved = false; // true once Firebase has determined initial auth state

// 인증 상태 변화 콜백 등록. unsubscribe 함수 반환.
export function onAuthChange(cb) {
  listeners.add(cb);
  // 인증 상태가 한 번이라도 결정된 후에만 즉시 콜백 호출. 그 전에는 첫 onAuthStateChanged가 알림을 띄움.
  if (authResolved) cb(currentUser, currentProfile);
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
  authResolved = true;
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
