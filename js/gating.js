// 인증 + 승인 상태에 따른 화면 게이팅.
// 로그인/대기/차단 화면을 직접 렌더링. approved일 때만 게임에 진입 허용.
import { onAuthChange, loginWithGoogle, logout } from './auth.js';

const app = () => document.getElementById('app');

function renderLogin() {
  app().innerHTML = `
    <div style="min-height:calc(100vh - 40px);display:flex;align-items:center;justify-content:center">
      <div class="card welcome" style="width:100%;max-width:440px">
        <div class="welcome-emoji">🦁</div>
        <h1>영어 단어 모험</h1>
        <p>구글 계정으로 로그인하면 어디서든 진도가 이어져요!</p>
        <div style="margin-top:24px">
          <button class="btn btn-primary btn-lg" id="loginBtn">🔐 Google로 로그인</button>
        </div>
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
    <div style="min-height:calc(100vh - 40px);display:flex;align-items:center;justify-content:center">
      <div class="card welcome" style="width:100%;max-width:440px">
        <div class="welcome-emoji">⏳</div>
        <h1>승인 대기 중</h1>
        <p>관리자가 가입을 검토하고 있어요.<br>승인되면 바로 학습을 시작할 수 있어요!</p>
        <div style="margin-top:24px">
          <button class="btn btn-secondary" id="logoutBtn">로그아웃</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function renderBlocked() {
  app().innerHTML = `
    <div style="min-height:calc(100vh - 40px);display:flex;align-items:center;justify-content:center">
      <div class="card welcome" style="width:100%;max-width:440px">
        <div class="welcome-emoji">🚫</div>
        <h1>이용이 제한되었어요</h1>
        <p>이 계정은 관리자에 의해 차단되었습니다.<br>문의가 필요하면 관리자에게 연락해 주세요.</p>
        <div style="margin-top:24px">
          <button class="btn btn-secondary" id="logoutBtn">로그아웃</button>
        </div>
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
