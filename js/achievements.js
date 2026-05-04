// 업적 시스템 — 정의, 추적, 토스트, 페이지 렌더링.
import { doc, updateDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { db } from './firebase-init.js';
import { currentUser, currentProfile } from './auth.js';
import { VOCAB, CATEGORIES, state as gameState, render as gameRender } from './game.js';

// ============================================================
// 정의 (31개)
// ============================================================
export const ACHIEVEMENTS = [
  // 누적 마스터 (6)
  { id: 'first_word', emoji: '🌱', name: '첫 발걸음', desc: '첫 단어 마스터', group: '누적' },
  { id: 'master_10', emoji: '📚', name: '단어 수집가', desc: '10개 단어 마스터', group: '누적' },
  { id: 'master_50', emoji: '🎓', name: '부지런한 학생', desc: '50개 단어 마스터', group: '누적' },
  { id: 'master_100', emoji: '🏆', name: '백 단어 클럽', desc: '100개 단어 마스터', group: '누적' },
  { id: 'master_200', emoji: '💎', name: '단어 도사', desc: '200개 단어 마스터', group: '누적' },
  { id: 'master_500', emoji: '👑', name: '단어 황제', desc: '500개 단어 마스터', group: '누적' },

  // 카테고리 정복 (2)
  { id: 'category_first', emoji: '🎯', name: '첫 카테고리 정복', desc: '한 카테고리 100% 마스터', group: '카테고리' },
  { id: 'category_all', emoji: '🌍', name: '세계 정복', desc: '모든 기본 카테고리 100% 마스터', group: '카테고리' },

  // 연속 출석 (4)
  { id: 'streak_2', emoji: '📅', name: '재방문', desc: '2일 연속 학습', group: '출석' },
  { id: 'streak_7', emoji: '🔥', name: '일주일 학생', desc: '7일 연속 학습', group: '출석' },
  { id: 'streak_30', emoji: '🌟', name: '한 달 학생', desc: '30일 연속 학습', group: '출석' },
  { id: 'streak_100', emoji: '💯', name: '백일잔치', desc: '100일 연속 학습', group: '출석' },

  // 레벨 (4)
  { id: 'level_5', emoji: '⭐', name: '신인', desc: 'Lv.5 도달', group: '레벨' },
  { id: 'level_10', emoji: '🌟', name: '중급자', desc: 'Lv.10 도달', group: '레벨' },
  { id: 'level_25', emoji: '✨', name: '고수', desc: 'Lv.25 도달', group: '레벨' },
  { id: 'level_50', emoji: '💫', name: '전설', desc: 'Lv.50 도달', group: '레벨' },

  // 모드 다양성 (3)
  { id: 'mode_first', emoji: '🎴', name: '첫 게임', desc: '아무 게임 모드 1회 시도', group: '모드' },
  { id: 'mode_three', emoji: '🎲', name: '다재다능', desc: '3가지 모드 시도', group: '모드' },
  { id: 'mode_all', emoji: '🧩', name: '올라운더', desc: '6가지 모드 모두 시도', group: '모드' },

  // 정확도 (4)
  { id: 'perfect_round', emoji: '🎯', name: '퍼펙트 라운드', desc: '한 라운드 100% 정답', group: '정확도' },
  { id: 'combo_10', emoji: '⚡', name: '콤보 마스터', desc: '연속 10문제 정답', group: '정확도' },
  { id: 'spelling_perfect', emoji: '✍️', name: '스펠링 챔피언', desc: '스펠링 모드 5회 100%', group: '정확도' },
  { id: 'comeback_5', emoji: '💪', name: '끈기', desc: '틀린 후 다시 도전해서 정답 5회', group: '정확도' },

  // 커스텀 단어 (3)
  { id: 'custom_first', emoji: '🎒', name: '나만의 시작', desc: '커스텀 단어 1개 등록', group: '커스텀' },
  { id: 'custom_20', emoji: '📝', name: '단어 사냥꾼', desc: '커스텀 단어 20개 등록', group: '커스텀' },
  { id: 'translate_10', emoji: '🌐', name: '번역가', desc: '번역 버튼 10번 사용', group: '커스텀' },

  // 재미/이스터에그 (5)
  { id: 'speak_50', emoji: '🦜', name: '앵무새', desc: '발음 듣기 50번', group: '재미' },
  { id: 'night_owl', emoji: '🌙', name: '야행성', desc: '자정 ~ 새벽 4시 사이 학습', group: '재미' },
  { id: 'early_bird', emoji: '🌅', name: '부지런쟁이', desc: '새벽 4시 ~ 7시 사이 학습', group: '재미' },
  { id: 'weekend_warrior', emoji: '🎉', name: '주말 전사', desc: '주말에 학습', group: '재미' },
  { id: 'speed_demon', emoji: '🚀', name: '스피드 마스터', desc: '연속 5문제 모두 정답 + 빠르게', group: '재미' }
];

// ============================================================
// 런타임 상태 (세션 메모리, 영속화 X)
// ============================================================
const runtime = {
  comboCount: 0,
  lastWasWrong: false,
  comebackCount: 0,
  fastAnswers: 0,
  initialized: false
};

// ============================================================
// 초기화 — 로그인 후 호출
// ============================================================
export function initAchievements() {
  runtime.comboCount = 0;
  runtime.lastWasWrong = false;
  runtime.comebackCount = 0;
  runtime.fastAnswers = 0;
  runtime.initialized = true;
}

// ============================================================
// 헬퍼: 마스터한 단어 총 개수
// ============================================================
function totalMastered() {
  return CATEGORIES.reduce((s, k) => {
    if (!VOCAB[k]) return s;
    const ex = new Set(VOCAB[k].words.map(w => w.en));
    return s + (gameState.mastered[k] || []).filter(en => ex.has(en)).length;
  }, 0);
}

function categoryFullyMastered(catKey) {
  const cat = VOCAB[catKey];
  if (!cat || !cat.words.length) return false;
  const ex = new Set(cat.words.map(w => w.en));
  const mastered = (gameState.mastered[catKey] || []).filter(en => ex.has(en)).length;
  return mastered === cat.words.length;
}

function getCounters() {
  return currentProfile?.counters || {};
}

function getAchievements() {
  return currentProfile?.achievements || {};
}

// ============================================================
// 조건 평가 — 어떤 업적이 달성됐는지 검사
// ============================================================
function evaluate(achievement) {
  const id = achievement.id;
  const c = getCounters();
  const m = totalMastered();
  const lvl = gameState.level || 1;
  const streak = gameState.streak || 0;
  const customCount = (VOCAB.custom?.words || []).length;
  const modesUsed = c.modesUsed || {};
  const modesUsedCount = Object.values(modesUsed).filter(Boolean).length;
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun, 6=Sat

  switch (id) {
    case 'first_word':       return m >= 1;
    case 'master_10':        return m >= 10;
    case 'master_50':        return m >= 50;
    case 'master_100':       return m >= 100;
    case 'master_200':       return m >= 200;
    case 'master_500':       return m >= 500;
    case 'category_first':   return CATEGORIES.some(k => k !== 'custom' && categoryFullyMastered(k));
    case 'category_all':     return CATEGORIES.filter(k => k !== 'custom' && VOCAB[k]?.words?.length > 0).every(categoryFullyMastered);
    case 'streak_2':         return streak >= 2;
    case 'streak_7':         return streak >= 7;
    case 'streak_30':        return streak >= 30;
    case 'streak_100':       return streak >= 100;
    case 'level_5':          return lvl >= 5;
    case 'level_10':         return lvl >= 10;
    case 'level_25':         return lvl >= 25;
    case 'level_50':         return lvl >= 50;
    case 'mode_first':       return modesUsedCount >= 1;
    case 'mode_three':       return modesUsedCount >= 3;
    case 'mode_all':         return modesUsedCount >= 6;
    case 'perfect_round':    return (c.perfectRounds || 0) >= 1;
    case 'combo_10':         return runtime.comboCount >= 10 || (c.bestCombo || 0) >= 10;
    case 'spelling_perfect': return (c.perfectSpellingRounds || 0) >= 5;
    case 'comeback_5':       return runtime.comebackCount >= 5 || (c.comebackTotal || 0) >= 5;
    case 'custom_first':     return customCount >= 1;
    case 'custom_20':        return customCount >= 20;
    case 'translate_10':     return (c.translate || 0) >= 10;
    case 'speak_50':         return (c.speak || 0) >= 50;
    case 'night_owl':        return hour >= 0 && hour < 4;
    case 'early_bird':       return hour >= 4 && hour < 7;
    case 'weekend_warrior':  return day === 0 || day === 6;
    case 'speed_demon':      return runtime.fastAnswers >= 5;
    default:                 return false;
  }
}

// ============================================================
// 부여 — Firestore 업데이트 + 토스트
// ============================================================
async function grantAchievement(achievement) {
  if (!currentUser) return;
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      [`achievements.${achievement.id}.unlockedAt`]: serverTimestamp()
    });
    if (!currentProfile.achievements) currentProfile.achievements = {};
    currentProfile.achievements[achievement.id] = { unlockedAt: new Date() };
    showAchievementToast(achievement);
  } catch (e) {
    console.error('Failed to grant achievement', achievement.id, e);
  }
}

// ============================================================
// 메인 진입점 — 게임 코드가 호출
// ============================================================
export async function trackEvent(eventName, payload) {
  if (!currentUser || !currentProfile) return;

  const updates = {};

  if (eventName === 'speak') {
    updates['counters.speak'] = increment(1);
    if (!currentProfile.counters) currentProfile.counters = {};
    currentProfile.counters.speak = (currentProfile.counters.speak || 0) + 1;
  } else if (eventName === 'translate') {
    updates['counters.translate'] = increment(1);
    if (!currentProfile.counters) currentProfile.counters = {};
    currentProfile.counters.translate = (currentProfile.counters.translate || 0) + 1;
  } else if (eventName === 'mode_used' && payload) {
    updates[`counters.modesUsed.${payload}`] = true;
    if (!currentProfile.counters) currentProfile.counters = {};
    if (!currentProfile.counters.modesUsed) currentProfile.counters.modesUsed = {};
    currentProfile.counters.modesUsed[payload] = true;
  } else if (eventName === 'round_end' && payload) {
    if (payload.correct === payload.total && payload.total > 0) {
      updates['counters.perfectRounds'] = increment(1);
      if (!currentProfile.counters) currentProfile.counters = {};
      currentProfile.counters.perfectRounds = (currentProfile.counters.perfectRounds || 0) + 1;
      if (payload.mode === 'spelling' && payload.total >= 5) {
        updates['counters.perfectSpellingRounds'] = increment(1);
        currentProfile.counters.perfectSpellingRounds = (currentProfile.counters.perfectSpellingRounds || 0) + 1;
      }
    }
  } else if (eventName === 'correct') {
    runtime.comboCount = (runtime.comboCount || 0) + 1;
    if (runtime.lastWasWrong) {
      runtime.comebackCount = (runtime.comebackCount || 0) + 1;
      updates['counters.comebackTotal'] = increment(1);
      if (!currentProfile.counters) currentProfile.counters = {};
      currentProfile.counters.comebackTotal = (currentProfile.counters.comebackTotal || 0) + 1;
    }
    runtime.lastWasWrong = false;
    if (payload?.fast) runtime.fastAnswers = (runtime.fastAnswers || 0) + 1;
    else runtime.fastAnswers = 0;
    if (runtime.comboCount > (currentProfile.counters?.bestCombo || 0)) {
      updates['counters.bestCombo'] = runtime.comboCount;
      if (!currentProfile.counters) currentProfile.counters = {};
      currentProfile.counters.bestCombo = runtime.comboCount;
    }
  } else if (eventName === 'wrong') {
    runtime.comboCount = 0;
    runtime.lastWasWrong = true;
    runtime.fastAnswers = 0;
  }

  if (Object.keys(updates).length > 0) {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
    } catch (e) {
      console.warn('Counter update failed', e);
    }
  }

  const earned = getAchievements();
  for (const a of ACHIEVEMENTS) {
    if (earned[a.id]) continue;
    if (evaluate(a)) {
      await grantAchievement(a);
    }
  }
}

// ============================================================
// 토스트 알림
// ============================================================
function ensureToastContainer() {
  let container = document.getElementById('achievementToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'achievementToastContainer';
    container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2000;display:flex;flex-direction:column;gap:10px;pointer-events:none';
    document.body.appendChild(container);
  }
  return container;
}

function showAchievementToast(a) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: linear-gradient(135deg, #FFE5B4, #FFC857);
    border: 3px solid var(--navy);
    border-radius: 14px;
    padding: 12px 16px;
    box-shadow: 0 6px 0 rgba(42,53,88,0.25), 0 10px 30px rgba(42,53,88,0.2);
    display: flex; align-items: center; gap: 12px;
    min-width: 240px; max-width: 320px;
    font-family: 'Quicksand', 'Gowun Dodum', sans-serif;
    animation: achievementSlideIn 0.4s ease-out;
    pointer-events: auto;
  `;
  toast.innerHTML = `
    <div style="font-size:36px;line-height:1">${a.emoji}</div>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:13px;color:var(--navy);opacity:0.7">🏆 업적 달성!</div>
      <div style="font-family:'Fredoka';font-weight:600;font-size:16px;color:var(--navy);line-height:1.2">${a.name}</div>
      <div style="font-size:12px;color:var(--navy);opacity:0.8;margin-top:2px">${a.desc}</div>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s, transform 0.4s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// 토스트 슬라이드-인 애니메이션 CSS 1회 주입
(function injectToastCSS() {
  if (document.getElementById('achievementToastCSS')) return;
  const style = document.createElement('style');
  style.id = 'achievementToastCSS';
  style.textContent = `
    @keyframes achievementSlideIn {
      from { opacity: 0; transform: translateX(120%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
})();

// ============================================================
// 업적 초기화 — Firestore의 achievements + counters 모두 삭제, 런타임 상태도 리셋
// ============================================================
export async function resetAchievements() {
  if (!currentUser) return;
  const earnedCount = Object.keys(currentProfile?.achievements || {}).length;
  const message = earnedCount === 0
    ? '아직 달성한 업적이 없지만 카운터(발음 들은 횟수 등)도 함께 초기화할까요?'
    : `달성한 ${earnedCount}개 업적을 모두 초기화하고 처음부터 다시 도전할까요?\n\n⚠️ 이 작업은 되돌릴 수 없어요.`;
  if (!confirm(message)) return;
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      achievements: {},
      counters: {}
    });
    if (currentProfile) {
      currentProfile.achievements = {};
      currentProfile.counters = {};
    }
    runtime.comboCount = 0;
    runtime.lastWasWrong = false;
    runtime.comebackCount = 0;
    runtime.fastAnswers = 0;
    alert('업적이 초기화되었어요. 처음부터 다시 도전해 봐요!');
    gameRender();
  } catch (e) {
    alert('초기화 중 오류: ' + e.message);
  }
}

// ============================================================
// 업적 페이지
// ============================================================
export function renderAchievementsPage() {
  const earned = getAchievements();
  const earnedCount = Object.keys(earned).length;
  const total = ACHIEVEMENTS.length;
  const groups = {};
  for (const a of ACHIEVEMENTS) {
    if (!groups[a.group]) groups[a.group] = [];
    groups[a.group].push(a);
  }
  const groupOrder = ['누적', '카테고리', '출석', '레벨', '모드', '정확도', '커스텀', '재미'];

  return `
    <div class="card">
      <button class="btn btn-secondary" id="achievementsBackBtn" style="margin-bottom:14px">← 돌아가기</button>
      <div class="screen-title">🏆 나의 업적</div>
      <div class="screen-sub">달성한 업적: <b>${earnedCount} / ${total}</b></div>

      <div style="margin-top:16px">
        ${groupOrder.filter(g => groups[g]).map(group => `
          <div style="margin-bottom:20px">
            <div style="font-family:'Fredoka';font-weight:600;font-size:16px;color:var(--navy);margin-bottom:8px">${group}</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">
              ${groups[group].map(a => {
                const got = !!earned[a.id];
                return `
                  <div style="border:2px solid ${got ? 'var(--navy)' : '#ddd'};border-radius:12px;padding:10px;background:${got ? 'white' : '#f5f5f5'};opacity:${got ? '1' : '0.55'};text-align:center">
                    <div style="font-size:32px;line-height:1;margin-bottom:4px;filter:${got ? 'none' : 'grayscale(1)'}">${a.emoji}</div>
                    <div style="font-family:'Fredoka';font-weight:600;font-size:13px;color:var(--navy);line-height:1.2">${a.name}</div>
                    <div style="font-size:11px;color:var(--navy-soft);margin-top:2px;line-height:1.3">${a.desc}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:24px;border:3px solid var(--danger);border-radius:14px;padding:14px;background:#FFF0F0;text-align:center">
        <div style="font-weight:700;color:var(--danger);margin-bottom:10px">⚠️ 위험 작업</div>
        <button class="btn" id="resetAchievementsBtn" style="background:var(--danger);color:white">🗑 업적 초기화</button>
      </div>
    </div>
  `;
}

export function bindAchievementsHandlers() {
  document.getElementById('achievementsBackBtn')?.addEventListener('click', () => {
    gameState.screen = 'profile';
    gameRender();
  });
  document.getElementById('resetAchievementsBtn')?.addEventListener('click', resetAchievements);
}
