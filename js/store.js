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
