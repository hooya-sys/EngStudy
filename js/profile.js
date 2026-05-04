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
