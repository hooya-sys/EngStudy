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
