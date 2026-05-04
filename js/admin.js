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

  // 이벤트 위임 — refreshList가 비동기로 채우는 .member-row가 클릭 시점에 존재하지 않을 수 있어 부모에 리스너 단다
  const memberListEl = document.getElementById('memberList');
  if (memberListEl) {
    memberListEl.addEventListener('click', (e) => {
      const row = e.target.closest('.member-row');
      if (!row) return;
      viewState.modalUid = row.dataset.uid;
      gameRender();
      loadModalProgress(viewState.modalUid);
    });
  }

  // 모달 외부 클릭 = 닫기 (오버레이 자체 클릭만, 내부 카드 클릭은 stopPropagation으로 차단됨)
  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') {
      viewState.modalUid = null;
      gameRender();
    }
  });

  // 모달 액션 버튼: 위임 — 모달이 동적으로 렌더된 직후라도 작동
  if (memberListEl) {
    const adminCardEl = memberListEl.closest('.card');
    adminCardEl?.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
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
  }

  // 첫 진입 시 목록 로드
  if (!viewState.members.length || document.getElementById('memberList')?.textContent === '불러오는 중...') {
    refreshList();
  }
}

// 외부에서 탭이 바뀌었거나 갱신 필요 시
export function resetAdminView() {
  viewState = { tab: 'pending', members: [], modalUid: null };
}
