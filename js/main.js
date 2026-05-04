// 앱 부팅: Firebase 초기화 → 인증 게이팅 → 승인되면 게임 시작.
import './firebase-init.js';  // side-effect import: Firebase 앱 초기화 트리거
import { startGating } from './gating.js';
import { bootGame } from './game.js';
import { setStoreContext } from './store.js';
import { initAchievements } from './achievements.js';

let bootstrapped = false;

startGating({
  onApproved: async (user, profile) => {
    setStoreContext({ uid: user.uid });
    initAchievements();
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
