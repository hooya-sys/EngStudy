import { loadState as _loadState, saveState as _saveState, loadCustomWords as _loadCustomWords, saveCustomWords as _saveCustomWords } from './store.js';
import { currentUser, currentProfile, logout } from './auth.js';
import { renderProfile, bindProfileHandlers } from './profile.js';
import { renderAdmin, bindAdminHandlers, resetAdminView } from './admin.js';
// ==========================================================
// VOCABULARY DATA - 교육부 초등 필수 영단어 (주제별)
// ==========================================================
const VOCAB = {
  family: {
    name: 'Family', nameKr: '가족', emoji: '👨‍👩‍👧‍👦', color: '#FF6F91',
    words: [
      { en: 'mother', ko: '엄마, 어머니' },
      { en: 'father', ko: '아빠, 아버지' },
      { en: 'brother', ko: '형, 오빠, 남동생' },
      { en: 'sister', ko: '누나, 언니, 여동생' },
      { en: 'grandmother', ko: '할머니' },
      { en: 'grandfather', ko: '할아버지' },
      { en: 'family', ko: '가족' },
      { en: 'son', ko: '아들' },
      { en: 'daughter', ko: '딸' },
      { en: 'baby', ko: '아기' },
      { en: 'friend', ko: '친구' },
      { en: 'parent', ko: '부모님' },
      { en: 'uncle', ko: '삼촌' },
      { en: 'aunt', ko: '이모, 고모' },
      { en: 'cousin', ko: '사촌' },
      { en: 'child', ko: '아이' },
      { en: 'boy', ko: '소년' },
      { en: 'girl', ko: '소녀' },
      { en: 'man', ko: '남자' },
      { en: 'woman', ko: '여자' },
      { en: 'husband', ko: '남편' },
      { en: 'wife', ko: '아내' },
      { en: 'twin', ko: '쌍둥이' },
      { en: 'nephew', ko: '조카 (남)' },
      { en: 'niece', ko: '조카 (여)' },
      { en: 'neighbor', ko: '이웃' },
      { en: 'love', ko: '사랑' },
      { en: 'people', ko: '사람들' },
      { en: 'person', ko: '사람' },
      { en: 'name', ko: '이름' }
    ]
  },
  school: {
    name: 'School', nameKr: '학교', emoji: '🏫', color: '#2EC4B6',
    words: [
      { en: 'school', ko: '학교' },
      { en: 'teacher', ko: '선생님' },
      { en: 'student', ko: '학생' },
      { en: 'classroom', ko: '교실' },
      { en: 'book', ko: '책' },
      { en: 'pencil', ko: '연필' },
      { en: 'eraser', ko: '지우개' },
      { en: 'desk', ko: '책상' },
      { en: 'chair', ko: '의자' },
      { en: 'bag', ko: '가방' },
      { en: 'notebook', ko: '공책' },
      { en: 'pen', ko: '펜' },
      { en: 'ruler', ko: '자' },
      { en: 'board', ko: '칠판' },
      { en: 'crayon', ko: '크레용' },
      { en: 'study', ko: '공부하다' },
      { en: 'class', ko: '수업, 학급' },
      { en: 'homework', ko: '숙제' },
      { en: 'library', ko: '도서관' },
      { en: 'paper', ko: '종이' },
      { en: 'scissors', ko: '가위' },
      { en: 'glue', ko: '풀' },
      { en: 'math', ko: '수학' },
      { en: 'science', ko: '과학' },
      { en: 'English', ko: '영어' },
      { en: 'art', ko: '미술' },
      { en: 'lesson', ko: '수업' },
      { en: 'test', ko: '시험' },
      { en: 'grade', ko: '학년, 점수' },
      { en: 'subject', ko: '과목' }
    ]
  },
  animals: {
    name: 'Animals', nameKr: '동물', emoji: '🐾', color: '#FF8C42',
    words: [
      { en: 'dog', ko: '개' },
      { en: 'cat', ko: '고양이' },
      { en: 'bird', ko: '새' },
      { en: 'fish', ko: '물고기' },
      { en: 'rabbit', ko: '토끼' },
      { en: 'tiger', ko: '호랑이' },
      { en: 'lion', ko: '사자' },
      { en: 'elephant', ko: '코끼리' },
      { en: 'monkey', ko: '원숭이' },
      { en: 'bear', ko: '곰' },
      { en: 'pig', ko: '돼지' },
      { en: 'cow', ko: '소' },
      { en: 'horse', ko: '말' },
      { en: 'duck', ko: '오리' },
      { en: 'chicken', ko: '닭' },
      { en: 'snake', ko: '뱀' },
      { en: 'mouse', ko: '쥐' },
      { en: 'frog', ko: '개구리' },
      { en: 'sheep', ko: '양' },
      { en: 'goat', ko: '염소' },
      { en: 'fox', ko: '여우' },
      { en: 'wolf', ko: '늑대' },
      { en: 'deer', ko: '사슴' },
      { en: 'giraffe', ko: '기린' },
      { en: 'zebra', ko: '얼룩말' },
      { en: 'panda', ko: '판다' },
      { en: 'butterfly', ko: '나비' },
      { en: 'bee', ko: '벌' },
      { en: 'turtle', ko: '거북이' },
      { en: 'dolphin', ko: '돌고래' }
    ]
  },
  food: {
    name: 'Food', nameKr: '음식', emoji: '🍎', color: '#FFC857',
    words: [
      { en: 'apple', ko: '사과' },
      { en: 'banana', ko: '바나나' },
      { en: 'bread', ko: '빵' },
      { en: 'milk', ko: '우유' },
      { en: 'water', ko: '물' },
      { en: 'juice', ko: '주스' },
      { en: 'egg', ko: '계란' },
      { en: 'rice', ko: '밥, 쌀' },
      { en: 'cheese', ko: '치즈' },
      { en: 'meat', ko: '고기' },
      { en: 'cake', ko: '케이크' },
      { en: 'cookie', ko: '쿠키' },
      { en: 'candy', ko: '사탕' },
      { en: 'pizza', ko: '피자' },
      { en: 'noodle', ko: '국수' },
      { en: 'soup', ko: '국, 수프' },
      { en: 'sugar', ko: '설탕' },
      { en: 'salt', ko: '소금' },
      { en: 'orange', ko: '오렌지' },
      { en: 'grape', ko: '포도' },
      { en: 'strawberry', ko: '딸기' },
      { en: 'tomato', ko: '토마토' },
      { en: 'potato', ko: '감자' },
      { en: 'carrot', ko: '당근' },
      { en: 'onion', ko: '양파' },
      { en: 'butter', ko: '버터' },
      { en: 'salad', ko: '샐러드' },
      { en: 'fruit', ko: '과일' },
      { en: 'vegetable', ko: '채소' },
      { en: 'hamburger', ko: '햄버거' }
    ]
  },
  body: {
    name: 'Body', nameKr: '신체', emoji: '👀', color: '#845EC2',
    words: [
      { en: 'head', ko: '머리' },
      { en: 'face', ko: '얼굴' },
      { en: 'eye', ko: '눈' },
      { en: 'nose', ko: '코' },
      { en: 'mouth', ko: '입' },
      { en: 'ear', ko: '귀' },
      { en: 'hand', ko: '손' },
      { en: 'foot', ko: '발' },
      { en: 'arm', ko: '팔' },
      { en: 'leg', ko: '다리' },
      { en: 'finger', ko: '손가락' },
      { en: 'hair', ko: '머리카락' },
      { en: 'tooth', ko: '이빨' },
      { en: 'body', ko: '몸' },
      { en: 'neck', ko: '목' },
      { en: 'knee', ko: '무릎' },
      { en: 'lip', ko: '입술' },
      { en: 'tongue', ko: '혀' },
      { en: 'chin', ko: '턱' },
      { en: 'cheek', ko: '볼' },
      { en: 'shoulder', ko: '어깨' },
      { en: 'elbow', ko: '팔꿈치' },
      { en: 'wrist', ko: '손목' },
      { en: 'back', ko: '등' },
      { en: 'stomach', ko: '배' },
      { en: 'heart', ko: '심장' },
      { en: 'brain', ko: '뇌' },
      { en: 'skin', ko: '피부' },
      { en: 'toe', ko: '발가락' },
      { en: 'thumb', ko: '엄지손가락' }
    ]
  },
  colors: {
    name: 'Colors', nameKr: '색깔', emoji: '🎨', color: '#FF6F91',
    words: [
      { en: 'red', ko: '빨간색' },
      { en: 'blue', ko: '파란색' },
      { en: 'yellow', ko: '노란색' },
      { en: 'green', ko: '초록색' },
      { en: 'black', ko: '검은색' },
      { en: 'white', ko: '흰색' },
      { en: 'pink', ko: '분홍색' },
      { en: 'orange', ko: '주황색' },
      { en: 'purple', ko: '보라색' },
      { en: 'brown', ko: '갈색' },
      { en: 'gray', ko: '회색' },
      { en: 'gold', ko: '금색' },
      { en: 'silver', ko: '은색' },
      { en: 'navy', ko: '남색' },
      { en: 'beige', ko: '베이지색' },
      { en: 'ivory', ko: '상아색' },
      { en: 'peach', ko: '복숭아색' },
      { en: 'lime', ko: '연두색' },
      { en: 'mint', ko: '민트색' },
      { en: 'violet', ko: '보랏빛' },
      { en: 'cream', ko: '크림색' },
      { en: 'tan', ko: '황갈색' },
      { en: 'light', ko: '밝은' },
      { en: 'dark', ko: '어두운' },
      { en: 'bright', ko: '환한' },
      { en: 'color', ko: '색깔' },
      { en: 'rainbow', ko: '무지개' },
      { en: 'paint', ko: '페인트, 색칠하다' },
      { en: 'shade', ko: '색조, 그늘' },
      { en: 'clear', ko: '투명한' }
    ]
  },
  actions: {
    name: 'Actions', nameKr: '행동', emoji: '🏃', color: '#2EC4B6',
    words: [
      { en: 'run', ko: '달리다' },
      { en: 'jump', ko: '점프하다' },
      { en: 'walk', ko: '걷다' },
      { en: 'swim', ko: '수영하다' },
      { en: 'eat', ko: '먹다' },
      { en: 'drink', ko: '마시다' },
      { en: 'sleep', ko: '자다' },
      { en: 'read', ko: '읽다' },
      { en: 'write', ko: '쓰다' },
      { en: 'sing', ko: '노래하다' },
      { en: 'dance', ko: '춤추다' },
      { en: 'play', ko: '놀다' },
      { en: 'go', ko: '가다' },
      { en: 'come', ko: '오다' },
      { en: 'see', ko: '보다' },
      { en: 'listen', ko: '듣다' },
      { en: 'speak', ko: '말하다' },
      { en: 'open', ko: '열다' },
      { en: 'close', ko: '닫다' },
      { en: 'sit', ko: '앉다' },
      { en: 'stand', ko: '서다' },
      { en: 'laugh', ko: '웃다' },
      { en: 'cry', ko: '울다' },
      { en: 'smile', ko: '미소짓다' },
      { en: 'fly', ko: '날다' },
      { en: 'throw', ko: '던지다' },
      { en: 'catch', ko: '잡다' },
      { en: 'push', ko: '밀다' },
      { en: 'pull', ko: '당기다' },
      { en: 'draw', ko: '그리다' }
    ]
  },
  nature: {
    name: 'Nature', nameKr: '자연', emoji: '🌳', color: '#4CAF50',
    words: [
      { en: 'sun', ko: '해, 태양' },
      { en: 'moon', ko: '달' },
      { en: 'star', ko: '별' },
      { en: 'sky', ko: '하늘' },
      { en: 'cloud', ko: '구름' },
      { en: 'rain', ko: '비' },
      { en: 'snow', ko: '눈' },
      { en: 'wind', ko: '바람' },
      { en: 'tree', ko: '나무' },
      { en: 'flower', ko: '꽃' },
      { en: 'mountain', ko: '산' },
      { en: 'river', ko: '강' },
      { en: 'sea', ko: '바다' },
      { en: 'beach', ko: '해변' },
      { en: 'grass', ko: '잔디' },
      { en: 'fire', ko: '불' },
      { en: 'leaf', ko: '잎' },
      { en: 'rock', ko: '바위' },
      { en: 'stone', ko: '돌' },
      { en: 'sand', ko: '모래' },
      { en: 'lake', ko: '호수' },
      { en: 'island', ko: '섬' },
      { en: 'forest', ko: '숲' },
      { en: 'desert', ko: '사막' },
      { en: 'hill', ko: '언덕' },
      { en: 'ice', ko: '얼음' },
      { en: 'earth', ko: '지구, 땅' },
      { en: 'plant', ko: '식물' },
      { en: 'garden', ko: '정원' },
      { en: 'storm', ko: '폭풍' }
    ]
  },
  home: {
    name: 'Home', nameKr: '집', emoji: '🏠', color: '#FF8C42',
    words: [
      { en: 'house', ko: '집' },
      { en: 'door', ko: '문' },
      { en: 'window', ko: '창문' },
      { en: 'room', ko: '방' },
      { en: 'bed', ko: '침대' },
      { en: 'table', ko: '탁자' },
      { en: 'chair', ko: '의자' },
      { en: 'kitchen', ko: '부엌' },
      { en: 'bathroom', ko: '욕실' },
      { en: 'key', ko: '열쇠' },
      { en: 'clock', ko: '시계' },
      { en: 'lamp', ko: '램프' },
      { en: 'TV', ko: '텔레비전' },
      { en: 'phone', ko: '전화기' },
      { en: 'computer', ko: '컴퓨터' },
      { en: 'sofa', ko: '소파' },
      { en: 'mirror', ko: '거울' },
      { en: 'fork', ko: '포크' },
      { en: 'spoon', ko: '숟가락' },
      { en: 'knife', ko: '칼' },
      { en: 'plate', ko: '접시' },
      { en: 'cup', ko: '컵' },
      { en: 'bowl', ko: '그릇' },
      { en: 'bottle', ko: '병' },
      { en: 'towel', ko: '수건' },
      { en: 'soap', ko: '비누' },
      { en: 'brush', ko: '빗, 솔' },
      { en: 'blanket', ko: '담요' },
      { en: 'pillow', ko: '베개' },
      { en: 'floor', ko: '바닥' }
    ]
  },
  time: {
    name: 'Time', nameKr: '시간', emoji: '🕐', color: '#845EC2',
    words: [
      { en: 'morning', ko: '아침' },
      { en: 'afternoon', ko: '오후' },
      { en: 'evening', ko: '저녁' },
      { en: 'night', ko: '밤' },
      { en: 'today', ko: '오늘' },
      { en: 'yesterday', ko: '어제' },
      { en: 'tomorrow', ko: '내일' },
      { en: 'Monday', ko: '월요일' },
      { en: 'Tuesday', ko: '화요일' },
      { en: 'Wednesday', ko: '수요일' },
      { en: 'Thursday', ko: '목요일' },
      { en: 'Friday', ko: '금요일' },
      { en: 'Saturday', ko: '토요일' },
      { en: 'Sunday', ko: '일요일' },
      { en: 'hour', ko: '시간 (단위)' },
      { en: 'minute', ko: '분' },
      { en: 'second', ko: '초' },
      { en: 'day', ko: '날, 하루' },
      { en: 'week', ko: '주' },
      { en: 'month', ko: '달, 월' },
      { en: 'year', ko: '년' },
      { en: 'time', ko: '시간' },
      { en: 'season', ko: '계절' },
      { en: 'January', ko: '1월' },
      { en: 'February', ko: '2월' },
      { en: 'March', ko: '3월' },
      { en: 'April', ko: '4월' },
      { en: 'May', ko: '5월' },
      { en: 'June', ko: '6월' },
      { en: 'July', ko: '7월' }
    ]
  },
  feelings: {
    name: 'Feelings', nameKr: '감정', emoji: '😊', color: '#FFC857',
    words: [
      { en: 'happy', ko: '행복한' },
      { en: 'sad', ko: '슬픈' },
      { en: 'angry', ko: '화난' },
      { en: 'hungry', ko: '배고픈' },
      { en: 'tired', ko: '피곤한' },
      { en: 'sleepy', ko: '졸린' },
      { en: 'cold', ko: '추운' },
      { en: 'hot', ko: '더운' },
      { en: 'scared', ko: '무서운' },
      { en: 'excited', ko: '신난' },
      { en: 'sorry', ko: '미안한' },
      { en: 'glad', ko: '기쁜' },
      { en: 'thirsty', ko: '목마른' },
      { en: 'sick', ko: '아픈' },
      { en: 'fine', ko: '괜찮은' },
      { en: 'nice', ko: '좋은' },
      { en: 'kind', ko: '친절한' },
      { en: 'brave', ko: '용감한' },
      { en: 'shy', ko: '수줍은' },
      { en: 'busy', ko: '바쁜' },
      { en: 'bored', ko: '지루한' },
      { en: 'surprised', ko: '놀란' },
      { en: 'proud', ko: '자랑스러운' },
      { en: 'lonely', ko: '외로운' },
      { en: 'calm', ko: '차분한' },
      { en: 'smart', ko: '똑똑한' },
      { en: 'lucky', ko: '운이 좋은' },
      { en: 'polite', ko: '예의 바른' },
      { en: 'funny', ko: '재미있는' },
      { en: 'worried', ko: '걱정되는' }
    ]
  },
  sports: {
    name: 'Sports', nameKr: '스포츠', emoji: '⚽', color: '#2EC4B6',
    words: [
      { en: 'soccer', ko: '축구' },
      { en: 'baseball', ko: '야구' },
      { en: 'basketball', ko: '농구' },
      { en: 'tennis', ko: '테니스' },
      { en: 'ball', ko: '공' },
      { en: 'bike', ko: '자전거' },
      { en: 'game', ko: '게임' },
      { en: 'music', ko: '음악' },
      { en: 'movie', ko: '영화' },
      { en: 'run', ko: '달리다' },
      { en: 'win', ko: '이기다' },
      { en: 'team', ko: '팀' },
      { en: 'hockey', ko: '하키' },
      { en: 'golf', ko: '골프' },
      { en: 'volleyball', ko: '배구' },
      { en: 'badminton', ko: '배드민턴' },
      { en: 'ski', ko: '스키' },
      { en: 'skate', ko: '스케이트' },
      { en: 'race', ko: '경주' },
      { en: 'kick', ko: '차다' },
      { en: 'bat', ko: '방망이' },
      { en: 'glove', ko: '장갑' },
      { en: 'helmet', ko: '헬멧' },
      { en: 'goal', ko: '골, 목표' },
      { en: 'point', ko: '점수' },
      { en: 'coach', ko: '코치' },
      { en: 'jog', ko: '조깅하다' },
      { en: 'surf', ko: '서핑하다' },
      { en: 'boxing', ko: '권투' },
      { en: 'medal', ko: '메달' }
    ]
  },
  games: {
    name: 'Games', nameKr: '게임', emoji: '🎮', color: '#5C9E31',
    words: [
      { en: 'game', ko: '게임' },
      { en: 'player', ko: '플레이어' },
      { en: 'level', ko: '레벨' },
      { en: 'item', ko: '아이템' },
      { en: 'block', ko: '블록' },
      { en: 'craft', ko: '제작하다, 만들다' },
      { en: 'mine', ko: '채굴하다, 광산' },
      { en: 'build', ko: '짓다, 만들다' },
      { en: 'world', ko: '세계' },
      { en: 'tool', ko: '도구' },
      { en: 'sword', ko: '검' },
      { en: 'pickaxe', ko: '곡괭이' },
      { en: 'diamond', ko: '다이아몬드' },
      { en: 'iron', ko: '철' },
      { en: 'zombie', ko: '좀비' },
      { en: 'creeper', ko: '크리퍼' },
      { en: 'skeleton', ko: '해골' },
      { en: 'villager', ko: '마을 주민' },
      { en: 'chest', ko: '상자' },
      { en: 'torch', ko: '횃불' },
      { en: 'arrow', ko: '화살' },
      { en: 'bow', ko: '활' },
      { en: 'map', ko: '지도' },
      { en: 'monster', ko: '몬스터' },
      { en: 'adventure', ko: '모험' },
      { en: 'quest', ko: '퀘스트' },
      { en: 'hero', ko: '영웅' },
      { en: 'enemy', ko: '적' },
      { en: 'magic', ko: '마법' },
      { en: 'treasure', ko: '보물' }
    ]
  },
  custom: {
    name: 'My Words', nameKr: '내 단어장', emoji: '⭐', color: '#FF8C42',
    isCustom: true,
    words: []
  }
};

const CATEGORIES = Object.keys(VOCAB);
const XP_PER_LEVEL = 100;
const XP_CORRECT = 10;
const XP_BONUS_PERFECT = 30;
const QUESTIONS_PER_ROUND = 8;

// ==========================================================
// GAME MODES
// ==========================================================
const MODES = {
  wordlist: { name: '단어 목록', desc: '전체 단어와 뜻·발음 한눈에', emoji: '📋', color: '#4CAF50' },
  flashcard: { name: '단어 카드', desc: '카드 넘기며 단어 익히기', emoji: '🎴', color: '#FFC857' },
  meaning: { name: '뜻 맞추기', desc: '영어 → 한국어 뜻 고르기', emoji: '🎯', color: '#FF8C42' },
  word: { name: '단어 맞추기', desc: '한국어 → 영어 단어 고르기', emoji: '🔤', color: '#2EC4B6' },
  matching: { name: '짝 맞추기', desc: '영어-한국어 짝 찾기', emoji: '🧩', color: '#FF6F91' },
  spelling: { name: '스펠링 도전', desc: '단어 직접 써보기', emoji: '✍️', color: '#845EC2' }
};

// ==========================================================
// STATE & STORAGE
// ==========================================================
let state = {
  name: '',
  xp: 0,
  level: 1,
  streak: 0,
  lastPlayed: null,
  mastered: {}, // { categoryKey: [wordIndex, wordIndex...] }
  screen: 'welcome',
  currentCategory: null,
  currentMode: null,
  gameState: null
};

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

// ==========================================================
// UTILITIES
// ==========================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

function confetti() {
  const colors = ['#FF8C42', '#2EC4B6', '#FF6F91', '#FFC857', '#845EC2'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = (2 + Math.random() * 2) + 's';
    c.style.animationDelay = Math.random() * 0.5 + 's';
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }
}

// ==========================================================
// SOUND ENGINE - 풍부한 효과음 생성
// ==========================================================
let audioCtx = null;
let soundEnabled = true;
let masterGain = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// 단일 톤 재생 (ADSR 엔벨로프 적용)
function playTone(freq, duration, opts = {}) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const {
      type = 'sine',
      volume = 0.18,
      attack = 0.005,
      release = 0.15,
      delay = 0,
      pitchBend = 0
    } = opts;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (pitchBend) {
      osc.frequency.exponentialRampToValueAtTime(freq + pitchBend, ctx.currentTime + delay + duration);
    }
    osc.connect(gain);
    gain.connect(masterGain);

    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(volume * 0.7, now + attack + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

    osc.start(now);
    osc.stop(now + duration + release + 0.05);
  } catch (e) {}
}

// 노이즈 재생 (파동/마찰음 등 퍼커시브 사운드용)
function playNoise(duration, opts = {}) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const { volume = 0.08, filterFreq = 2000, filterType = 'lowpass', delay = 0, sweep = 0 } = opts;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    if (sweep) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(40, filterFreq + sweep),
        ctx.currentTime + delay + duration
      );
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start(ctx.currentTime + delay);
  } catch (e) {}
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    switch (type) {
      case 'correct':
        // 밝고 경쾌한 '띵!' - E5 → B5 → E6 아르페지오
        playTone(659, 0.1, { type: 'triangle', volume: 0.2 });
        playTone(988, 0.12, { type: 'triangle', volume: 0.2, delay: 0.07 });
        playTone(1319, 0.25, { type: 'sine', volume: 0.18, delay: 0.13 });
        playTone(1975, 0.3, { type: 'sine', volume: 0.08, delay: 0.18 });
        break;

      case 'wrong':
        // 부드러운 '아쉬워' - 아이에게 너무 거칠지 않게
        playTone(349, 0.12, { type: 'triangle', volume: 0.14 });
        playTone(277, 0.2, { type: 'triangle', volume: 0.14, delay: 0.1 });
        playTone(207, 0.25, { type: 'sine', volume: 0.1, delay: 0.18 });
        break;

      case 'levelup':
        // 레벨업 팡파르 - C-E-G-C + 반짝이는 하이톤
        [523, 659, 784, 1047].forEach((freq, i) => {
          playTone(freq, 0.15, { type: 'triangle', volume: 0.2, delay: i * 0.09 });
        });
        playTone(1568, 0.4, { type: 'sine', volume: 0.12, delay: 0.4 });
        playTone(2093, 0.5, { type: 'sine', volume: 0.08, delay: 0.5 });
        playTone(2637, 0.4, { type: 'sine', volume: 0.06, delay: 0.55 });
        break;

      case 'perfect':
        // 올클리어 - 화려한 상승 스케일
        [523, 659, 784, 1047, 1319, 1568, 2093].forEach((freq, i) => {
          playTone(freq, 0.12, { type: 'triangle', volume: 0.18, delay: i * 0.07 });
        });
        // 심벌 크래시
        playNoise(0.6, { volume: 0.05, filterFreq: 8000, filterType: 'highpass', delay: 0.5, sweep: -6000 });
        break;

      case 'flip':
        // 카드 넘기는 소리 - 짧은 노이즈 휘익
        playNoise(0.12, { volume: 0.06, filterFreq: 4000, sweep: -2500 });
        break;

      case 'click':
        // 버튼 클릭 - 깔끔한 짧은 톡
        playTone(1200, 0.03, { type: 'sine', volume: 0.08, attack: 0.001, release: 0.03 });
        playTone(800, 0.04, { type: 'sine', volume: 0.06, attack: 0.001, release: 0.05, delay: 0.01 });
        break;

      case 'select':
        // 선택 팝 - 부드러운 두 음
        playTone(523, 0.06, { type: 'sine', volume: 0.12, attack: 0.002 });
        playTone(784, 0.08, { type: 'sine', volume: 0.1, delay: 0.04 });
        break;

      case 'match':
        // 짝 맞추기 성공 - 상승하는 플링크
        playTone(784, 0.08, { type: 'triangle', volume: 0.18 });
        playTone(1047, 0.12, { type: 'triangle', volume: 0.16, delay: 0.05 });
        playTone(1568, 0.2, { type: 'sine', volume: 0.14, delay: 0.1 });
        playNoise(0.15, { volume: 0.04, filterFreq: 6000, filterType: 'highpass', delay: 0.05 });
        break;

      case 'gameStart':
        // 게임 시작 - 에너지 넘치는 상승
        [392, 523, 659, 784].forEach((freq, i) => {
          playTone(freq, 0.1, { type: 'triangle', volume: 0.16, delay: i * 0.06 });
        });
        break;

      case 'welcome':
        // 웰컴 - 따뜻한 멜로디
        playTone(523, 0.25, { type: 'sine', volume: 0.16 });
        playTone(659, 0.25, { type: 'sine', volume: 0.16, delay: 0.15 });
        playTone(784, 0.45, { type: 'sine', volume: 0.16, delay: 0.3 });
        playTone(1047, 0.3, { type: 'sine', volume: 0.12, delay: 0.5 });
        break;

      case 'category':
        // 카테고리 진입 - 부드러운 띠리링
        playTone(659, 0.1, { type: 'sine', volume: 0.14 });
        playTone(880, 0.12, { type: 'sine', volume: 0.14, delay: 0.06 });
        break;

      case 'back':
        // 뒤로가기 - 짧은 하강
        playTone(660, 0.08, { type: 'sine', volume: 0.1 });
        playTone(440, 0.1, { type: 'sine', volume: 0.1, delay: 0.05 });
        break;

      case 'type':
        // 타이핑 - 매우 짧은 톡
        playTone(1400 + Math.random() * 200, 0.015, {
          type: 'square', volume: 0.03, attack: 0.001, release: 0.01
        });
        break;

      case 'streak':
        // 스트릭/연속 정답 보너스
        [659, 880, 1175, 1568].forEach((freq, i) => {
          playTone(freq, 0.1, { type: 'triangle', volume: 0.15, delay: i * 0.05 });
        });
        break;
    }
  } catch (e) {
    console.error('Sound error', e);
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  saveState();
  if (soundEnabled) {
    getAudioCtx();
    playSound('click');
  }
  render();
}

function addXP(amount) {
  const prevLevel = state.level;
  state.xp += amount;
  const newLevel = Math.floor(state.xp / XP_PER_LEVEL) + 1;
  if (newLevel > prevLevel) {
    state.level = newLevel;
    showLevelUp(newLevel);
  }
  saveState();
}

function showLevelUp(lvl) {
  document.getElementById('levelUpNum').textContent = lvl;
  document.getElementById('levelUpOverlay').classList.add('show');
  playSound('levelup');
  confetti();
}

function closeLevelUp() {
  document.getElementById('levelUpOverlay').classList.remove('show');
  render();
}

// ==========================================================
// HEADER
// ==========================================================
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

// ==========================================================
// SCREENS
// ==========================================================
function renderWelcome() {
  return `
    <div class="card welcome">
      <div class="welcome-emoji">🦁</div>
      <h1>영어 단어 모험</h1>
      <p>안녕! 나는 너의 영어 선생님 Leo야 🦁<br>같이 재미있게 영어 공부 해볼까?</p>
      <input type="text" class="name-input" id="nameInput" placeholder="이름을 알려줄래?" maxlength="10">
      <div style="margin-top:20px">
        <button class="btn btn-primary btn-lg" onclick="startGame()">🚀 출발!</button>
      </div>
    </div>
  `;
}

function renderHome() {
  const totalWords = CATEGORIES.reduce((sum, k) => sum + VOCAB[k].words.length, 0);
  const totalMastered = CATEGORIES.reduce((sum, k) => {
    const existing = new Set(VOCAB[k].words.map(w => w.en));
    return sum + (state.mastered[k] || []).filter(en => existing.has(en)).length;
  }, 0);
  const totalPct = totalWords > 0 ? Math.round(totalMastered / totalWords * 100) : 0;

  return `
    ${renderHeader()}
    <div class="card">
      <div class="screen-title">🌟 주제를 골라봐!</div>
      <div class="screen-sub">원하는 주제를 선택하면 다양한 게임으로 단어를 공부할 수 있어요</div>

      <div style="background: linear-gradient(135deg, #FFE5B4, var(--yellow)); padding: 14px 18px; border-radius: 14px; border: 3px solid var(--navy); display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div>
          <div style="font-family: 'Fredoka'; font-weight: 600; font-size: 16px; color: var(--navy);">전체 진도</div>
          <div style="font-family: 'Gowun Dodum'; font-size: 13px; color: var(--navy-soft);">${totalMastered} / ${totalWords} 단어 마스터!</div>
        </div>
        <div style="font-family: 'Fredoka'; font-size: 28px; font-weight: 700; color: var(--primary);">${totalPct}%</div>
      </div>

      <div class="categories">
        ${CATEGORIES.map(key => {
          const cat = VOCAB[key];
          const wordCount = cat.words.length;
          const masteredList = state.mastered[key] || [];
          const masteredSet = new Set(cat.words.map(w => w.en));
          const mastered = masteredList.filter(en => masteredSet.has(en)).length;
          const pct = wordCount > 0 ? (mastered / wordCount) * 100 : 0;
          const isCustom = !!cat.isCustom;
          const progressText = wordCount > 0
            ? `${mastered}/${wordCount}`
            : (isCustom ? '단어를 추가해봐!' : '0/0');
          const cardStyle = isCustom
            ? ''
            : `style="background: linear-gradient(180deg, white 60%, ${cat.color}22);"`;
          return `
            <div class="cat-card${isCustom ? ' custom' : ''}" ${cardStyle} onclick="selectCategory('${key}')">
              ${isCustom ? '<span class="cat-badge-add">+</span>' : ''}
              <span class="cat-emoji">${cat.emoji}</span>
              <div class="cat-name">${cat.name}</div>
              <div class="cat-name-kr">${cat.nameKr}</div>
              <div class="cat-progress"><div class="cat-progress-fill" style="width:${pct}%; background:${cat.color};"></div></div>
              <div class="cat-progress-text">${progressText}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderModeSelect() {
  const cat = VOCAB[state.currentCategory];
  const existing = new Set(cat.words.map(w => w.en));
  const mastered = (state.mastered[state.currentCategory] || []).filter(en => existing.has(en)).length;
  const backLabel = cat.isCustom ? '← 단어 관리로' : '← 돌아가기';
  const backAction = cat.isCustom ? 'backToCustomManage()' : 'goHome()';
  return `
    ${renderHeader()}
    <div class="card">
      <button class="btn btn-ghost btn-sm" onclick="${backAction}">${backLabel}</button>
      <div style="text-align:center; margin: 16px 0;">
        <div style="font-size: 60px;">${cat.emoji}</div>
        <div class="screen-title" style="color: ${cat.color};">${cat.name}</div>
        <div class="screen-sub">${cat.nameKr} · ${cat.words.length}개 단어 · ${mastered}개 마스터</div>
      </div>
      <div style="font-family: 'Fredoka'; font-weight: 600; color: var(--navy); margin-bottom: 10px;">어떤 게임으로 공부할까?</div>
      <div class="modes">
        ${Object.keys(MODES).map((mk, idx) => {
          const m = MODES[mk];
          const needsChoices = (mk === 'meaning' || mk === 'word');
          const needsPairs = (mk === 'matching');
          const disabled = (mk !== 'wordlist' && cat.words.length === 0)
            || (needsChoices && cat.words.length < 4)
            || (needsPairs && cat.words.length < 2);
          const disabledStyle = disabled ? 'opacity:0.45; cursor:not-allowed;' : '';
          const disabledHint = disabled
            ? `<div style="font-size: 11px; color: var(--danger); font-family: 'Gowun Dodum'; margin-top: 2px;">${
                cat.words.length === 0
                  ? '단어가 필요해요'
                  : needsChoices ? '4개 이상 단어 필요'
                  : needsPairs ? '2개 이상 단어 필요' : ''
              }</div>`
            : '';
          const onClick = disabled ? '' : `onclick="startMode('${mk}')"`;
          return `
            <div class="mode-card" ${onClick} style="position:relative;${disabledStyle}">
              <div style="position:absolute;top:8px;left:8px;width:28px;height:28px;border-radius:50%;background:white;color:var(--navy);border:2px solid var(--navy);display:flex;align-items:center;justify-content:center;font-family:'Fredoka';font-weight:700;font-size:14px;line-height:1">${idx + 1}</div>
              <div class="mode-icon" style="background: ${m.color};">${m.emoji}</div>
              <div>
                <div class="mode-title">${m.name}</div>
                <div class="mode-desc">${m.desc}</div>
                ${disabledHint}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ==========================================================
// CUSTOM CATEGORY MANAGEMENT
// ==========================================================
function renderCustomManage() {
  const cat = VOCAB.custom;
  const words = cat.words;
  const wordCount = words.length;
  const hintMsg = wordCount === 0
    ? '아래에 영어 단어와 뜻을 적어서 나만의 단어장을 만들어봐!'
    : wordCount < 4
      ? `💡 지금 ${wordCount}개! 퀴즈 게임은 4개 이상 추가하면 재미있게 할 수 있어요.`
      : `👏 ${wordCount}개 단어! 이제 공부하러 가볼까?`;
  return `
    ${renderHeader()}
    <div class="card">
      <button class="btn btn-ghost btn-sm" onclick="goHome()">← 돌아가기</button>
      <div style="text-align:center; margin: 16px 0 20px;">
        <div style="font-size: 60px;">${cat.emoji}</div>
        <div class="screen-title" style="color: ${cat.color};">${cat.nameKr}</div>
        <div class="screen-sub">${hintMsg}</div>
      </div>

      <div class="custom-form" onsubmit="return false;">
        <input type="text" class="custom-input" id="customEnInput" placeholder="English (예: apple)" maxlength="40" autocomplete="off" spellcheck="false">
        <input type="text" class="custom-input" id="customKoInput" placeholder="뜻 (예: 사과)" maxlength="60" autocomplete="off">
        <button class="btn btn-primary" onclick="addCustomWord()">+ 추가</button>
      </div>

      ${wordCount === 0 ? `
        <div class="custom-empty">
          <span class="custom-empty-emoji">📝</span>
          아직 단어가 없어요.<br>위에서 단어를 추가해볼까?
        </div>
      ` : `
        <div class="custom-list">
          ${words.map((w, i) => `
            <div class="custom-row">
              <div class="custom-en">${escapeHtml(w.en)}</div>
              <div class="custom-ko">${escapeHtml(w.ko)}</div>
              <button class="custom-speak" onclick="speak('${escapeAttr(w.en)}')" title="듣기">🔊</button>
              <button class="custom-del" onclick="deleteCustomWord(${i})" title="삭제">✕</button>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-primary btn-lg" onclick="startCustomStudy()">🎮 공부하러 가기</button>
        </div>
      `}

      <div class="help-text">💡 <b>꿀팁:</b> 학교에서 배운 단어나 헷갈리는 단어를 모아서 나만의 단어장으로 복습해봐!</div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}
function escapeAttr(s) {
  return String(s).replace(/['"\\]/g, '\\$&');
}

async function addCustomWord() {
  const enEl = document.getElementById('customEnInput');
  const koEl = document.getElementById('customKoInput');
  if (!enEl || !koEl) return;
  const sanitize = s => s.trim().replace(/[<>'"`\\]/g, '');
  const en = sanitize(enEl.value);
  const ko = sanitize(koEl.value);
  if (!en || !ko) {
    playSound('wrong');
    if (!en) enEl.focus();
    else koEl.focus();
    return;
  }
  const dup = VOCAB.custom.words.find(w => w.en.toLowerCase() === en.toLowerCase());
  if (dup) {
    playSound('wrong');
    alert(`"${en}" 단어는 이미 있어요! 😅`);
    enEl.focus();
    enEl.select();
    return;
  }
  VOCAB.custom.words.push({ en, ko });
  await saveCustomWords();
  playSound('correct');
  render();
  setTimeout(() => {
    const newEn = document.getElementById('customEnInput');
    if (newEn) newEn.focus();
  }, 0);
}

async function deleteCustomWord(i) {
  if (i < 0 || i >= VOCAB.custom.words.length) return;
  const removed = VOCAB.custom.words.splice(i, 1)[0];
  if (removed && state.mastered.custom) {
    state.mastered.custom = state.mastered.custom.filter(en => en !== removed.en);
    await saveState();
  }
  await saveCustomWords();
  playSound('click');
  render();
}

function startCustomStudy() {
  if (!VOCAB.custom.words.length) return;
  state.screen = 'modeSelect';
  playSound('category');
  render();
}

function backToCustomManage() {
  state.gameState = null;
  state.screen = 'customManage';
  playSound('back');
  render();
}

// ==========================================================
// FLASHCARD MODE
// ==========================================================
function renderFlashcard() {
  const gs = state.gameState;
  const word = gs.words[gs.idx];
  const flipped = gs.flipped ? 'flipped' : '';
  return `
    ${renderHeader()}
    <div class="card">
      <div class="game-header">
        <button class="btn btn-ghost btn-sm" onclick="backToMode()">← 나가기</button>
        <div class="progress-pill">🎴 ${gs.idx + 1} / ${gs.words.length}</div>
      </div>

      <div class="flash ${flipped}" id="flash" onclick="flipCard()">
        <div class="flash-inner">
          <div class="flash-face flash-front">
            <div class="flash-word">${word.en}</div>
            <button class="speak-btn" onclick="event.stopPropagation(); speak('${word.en}')">🔊</button>
            <div class="flash-hint">카드를 눌러서 뜻 확인하기</div>
          </div>
          <div class="flash-face flash-back">
            <div class="flash-mean">${word.ko}</div>
            <div class="flash-hint" style="color: white;">${word.en}</div>
          </div>
        </div>
      </div>

      <div class="controls-row">
        <button class="btn btn-sm" onclick="prevCard()" ${gs.idx === 0 ? 'disabled style="opacity:0.4"' : ''}>← 이전</button>
        <button class="btn btn-accent btn-sm" onclick="speak('${word.en}')">🔊 다시 듣기</button>
        ${gs.idx === gs.words.length - 1
          ? `<button class="btn btn-primary btn-sm" onclick="finishFlashcard()">끝! 다음 ➜</button>`
          : `<button class="btn btn-primary btn-sm" onclick="nextCard()">다음 →</button>`}
      </div>

      <div class="help-text">💡 <b>꿀팁:</b> 소리도 듣고, 따라 말해보면 더 잘 외워져요!</div>
    </div>
  `;
}

function startFlashcard() {
  const cat = VOCAB[state.currentCategory];
  state.gameState = {
    words: shuffle(cat.words),
    idx: 0,
    flipped: false,
    seen: new Set()
  };
  state.screen = 'flashcard';
  render();
  setTimeout(() => speak(state.gameState.words[0].en), 300);
}

function flipCard() {
  state.gameState.flipped = !state.gameState.flipped;
  playSound('flip');
  render();
}

function nextCard() {
  const gs = state.gameState;
  gs.seen.add(gs.idx);
  gs.idx++;
  gs.flipped = false;
  playSound('flip');
  render();
  setTimeout(() => speak(gs.words[gs.idx].en), 300);
}

function prevCard() {
  state.gameState.idx--;
  state.gameState.flipped = false;
  playSound('flip');
  render();
  setTimeout(() => speak(state.gameState.words[state.gameState.idx].en), 300);
}

// ==========================================================
// MEANING QUIZ (English → Korean)
// ==========================================================
function startQuiz(mode) {
  const cat = VOCAB[state.currentCategory];
  const words = shuffle(cat.words).slice(0, Math.min(QUESTIONS_PER_ROUND, cat.words.length));
  state.gameState = {
    mode: mode,
    words: words,
    idx: 0,
    correct: 0,
    answered: false,
    selectedIdx: null
  };
  state.screen = mode;
  render();
  if (mode === 'meaning') setTimeout(() => speak(words[0].en), 300);
}

function renderMeaningQuiz() {
  const gs = state.gameState;
  const word = gs.words[gs.idx];
  const cat = VOCAB[state.currentCategory];

  // Generate options
  if (!gs.options) {
    const wrongs = shuffle(cat.words.filter(w => w.en !== word.en)).slice(0, 3);
    gs.options = shuffle([word, ...wrongs]);
  }

  return `
    ${renderHeader()}
    <div class="card">
      <div class="game-header">
        <button class="btn btn-ghost btn-sm" onclick="backToMode()">← 나가기</button>
        <div class="progress-pill">🎯 ${gs.idx + 1} / ${gs.words.length} · ✅ ${gs.correct}</div>
      </div>

      <div class="quiz-question">
        <div class="quiz-label">이 단어의 뜻은?</div>
        <div class="quiz-word">${word.en}</div>
        <button class="speak-btn" onclick="speak('${word.en}')" style="margin: 14px auto 0;">🔊</button>
      </div>

      <div class="quiz-options">
        ${gs.options.map((opt, i) => {
          let cls = '';
          if (gs.answered) {
            if (opt.en === word.en) cls = 'correct';
            else if (i === gs.selectedIdx) cls = 'wrong';
          }
          return `<div class="quiz-option ${cls}" onclick="answerMeaning(${i})">${opt.ko}</div>`;
        }).join('')}
      </div>

      ${gs.answered ? `
        <div class="feedback ${gs.options[gs.selectedIdx].en === word.en ? 'correct' : 'wrong'}">
          ${gs.options[gs.selectedIdx].en === word.en
            ? `🎉 정답! <b>${word.en}</b> = ${word.ko}`
            : `😢 아쉬워! <b>${word.en}</b>의 뜻은 <b>${word.ko}</b>야`}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-primary" onclick="nextQuestion()">
            ${gs.idx === gs.words.length - 1 ? '결과 보기 🏆' : '다음 문제 →'}
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function answerMeaning(i) {
  const gs = state.gameState;
  if (gs.answered) return;
  gs.answered = true;
  gs.selectedIdx = i;
  const word = gs.words[gs.idx];
  const isCorrect = gs.options[i].en === word.en;
  if (isCorrect) {
    gs.correct++;
    playSound('correct');
    markMastered(state.currentCategory, word.en);
  } else {
    playSound('wrong');
  }
  render();
}

// ==========================================================
// WORD QUIZ (Korean → English)
// ==========================================================
function renderWordQuiz() {
  const gs = state.gameState;
  const word = gs.words[gs.idx];
  const cat = VOCAB[state.currentCategory];

  if (!gs.options) {
    const wrongs = shuffle(cat.words.filter(w => w.en !== word.en)).slice(0, 3);
    gs.options = shuffle([word, ...wrongs]);
  }

  return `
    ${renderHeader()}
    <div class="card">
      <div class="game-header">
        <button class="btn btn-ghost btn-sm" onclick="backToMode()">← 나가기</button>
        <div class="progress-pill">🔤 ${gs.idx + 1} / ${gs.words.length} · ✅ ${gs.correct}</div>
      </div>

      <div class="quiz-question">
        <div class="quiz-label">이것을 영어로?</div>
        <div class="quiz-word-kr">${word.ko}</div>
      </div>

      <div class="quiz-options">
        ${gs.options.map((opt, i) => {
          let cls = '';
          if (gs.answered) {
            if (opt.en === word.en) cls = 'correct';
            else if (i === gs.selectedIdx) cls = 'wrong';
          }
          return `<div class="quiz-option ${cls}" style="font-family: 'Fredoka';" onclick="answerWord(${i})">${opt.en}</div>`;
        }).join('')}
      </div>

      ${gs.answered ? `
        <div class="feedback ${gs.options[gs.selectedIdx].en === word.en ? 'correct' : 'wrong'}">
          ${gs.options[gs.selectedIdx].en === word.en
            ? `🎉 정답! <b>${word.ko}</b> = ${word.en}`
            : `😢 아쉬워! <b>${word.ko}</b>는 영어로 <b>${word.en}</b>!`}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-accent" onclick="speak('${word.en}')" style="margin-right: 8px;">🔊 들어보기</button>
          <button class="btn btn-primary" onclick="nextQuestion()">
            ${gs.idx === gs.words.length - 1 ? '결과 보기 🏆' : '다음 문제 →'}
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function answerWord(i) {
  const gs = state.gameState;
  if (gs.answered) return;
  gs.answered = true;
  gs.selectedIdx = i;
  const word = gs.words[gs.idx];
  const isCorrect = gs.options[i].en === word.en;
  if (isCorrect) {
    gs.correct++;
    playSound('correct');
    markMastered(state.currentCategory, word.en);
  } else {
    playSound('wrong');
  }
  if (isCorrect) setTimeout(() => speak(word.en), 200);
  render();
}

function nextQuestion() {
  const gs = state.gameState;
  gs.idx++;
  gs.answered = false;
  gs.selectedIdx = null;
  gs.options = null;
  if (gs.idx >= gs.words.length) {
    finishQuiz();
  } else {
    render();
    if (gs.mode === 'meaning') setTimeout(() => speak(gs.words[gs.idx].en), 300);
  }
}

function finishQuiz() {
  const gs = state.gameState;
  let xpGained = gs.correct * XP_CORRECT;
  const isPerfect = gs.correct === gs.words.length;
  if (isPerfect) xpGained += XP_BONUS_PERFECT;
  addXP(xpGained);
  updateStreak();
  state.gameState = {
    mode: gs.mode,
    total: gs.words.length,
    correct: gs.correct,
    xpGained: xpGained,
    perfect: isPerfect
  };
  state.screen = 'result';
  render();
  if (isPerfect) {
    setTimeout(() => playSound('perfect'), 200);
    setTimeout(confetti, 300);
  } else if (gs.correct / gs.words.length >= 0.75) {
    setTimeout(() => playSound('streak'), 200);
  }
}

// ==========================================================
// SPELLING MODE
// ==========================================================
function renderSpelling() {
  const gs = state.gameState;
  const word = gs.words[gs.idx];

  const slots = word.en.split('').map(c =>
    c === ' ' ? '<div class="spell-slot space"></div>' : `<div class="spell-slot">?</div>`
  ).join('');

  return `
    ${renderHeader()}
    <div class="card">
      <div class="game-header">
        <button class="btn btn-ghost btn-sm" onclick="backToMode()">← 나가기</button>
        <div class="progress-pill">✍️ ${gs.idx + 1} / ${gs.words.length} · ✅ ${gs.correct}</div>
      </div>

      <div class="spell-display">
        <div class="spell-mean">${word.ko}</div>
        <div class="spell-hint">${slots}</div>
        <button class="speak-btn" onclick="speak('${word.en}')" style="margin: 12px auto 0;">🔊</button>
      </div>

      <input type="text"
             class="spell-input ${gs.answered ? (gs.isCorrect ? 'correct' : 'wrong') : ''}"
             id="spellInput"
             placeholder="${word.en.length}글자로 써보세요"
             ${gs.answered ? 'disabled' : ''}
             autocomplete="off"
             spellcheck="false"
             onkeydown="handleSpellKey(event)">

      ${gs.answered ? `
        <div class="feedback ${gs.isCorrect ? 'correct' : 'wrong'}">
          ${gs.isCorrect
            ? `🎉 완벽해! <b>${word.en}</b> = ${word.ko}`
            : `😢 정답은 <b>${word.en}</b>이었어!`}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-primary" onclick="nextQuestion()">
            ${gs.idx === gs.words.length - 1 ? '결과 보기 🏆' : '다음 문제 →'}
          </button>
        </div>
      ` : `
        <div class="controls-row" style="justify-content: center; margin-top: 12px;">
          <button class="btn btn-accent btn-sm" onclick="speak('${word.en}')">🔊 다시 듣기</button>
          <button class="btn btn-primary btn-sm" onclick="checkSpelling()">확인 ✓</button>
        </div>
      `}
      <div class="help-text">💡 모르겠으면 소리 버튼을 눌러 들어봐!</div>
    </div>
  `;
}

function checkSpelling() {
  const gs = state.gameState;
  if (gs.answered) return;
  const input = document.getElementById('spellInput').value.trim().toLowerCase();
  const word = gs.words[gs.idx];
  const correct = input === word.en.toLowerCase();
  gs.answered = true;
  gs.isCorrect = correct;
  if (correct) {
    gs.correct++;
    playSound('correct');
    markMastered(state.currentCategory, word.en);
    setTimeout(() => speak(word.en), 200);
  } else {
    playSound('wrong');
  }
  render();
}

function handleSpellKey(event) {
  if (event.key === 'Enter') {
    checkSpelling();
    return;
  }
  // 타이핑 사운드 - 글자/숫자/스페이스만
  if (event.key.length === 1 || event.key === 'Backspace') {
    playSound('type');
  }
}

// ==========================================================
// MATCHING MODE
// ==========================================================
function startMatching() {
  const cat = VOCAB[state.currentCategory];
  const pairs = shuffle(cat.words).slice(0, Math.min(6, cat.words.length));
  const tiles = [];
  pairs.forEach((p, i) => {
    tiles.push({ id: 'e' + i, pairId: i, text: p.en, type: 'eng', word: p });
    tiles.push({ id: 'k' + i, pairId: i, text: p.ko, type: 'kor', word: p });
  });
  state.gameState = {
    mode: 'matching',
    tiles: shuffle(tiles),
    selected: null,
    matched: [],
    mistakes: 0,
    startTime: Date.now(),
    totalPairs: pairs.length
  };
  state.screen = 'matching';
  render();
}

function renderMatching() {
  const gs = state.gameState;
  return `
    ${renderHeader()}
    <div class="card">
      <div class="game-header">
        <button class="btn btn-ghost btn-sm" onclick="backToMode()">← 나가기</button>
        <div class="progress-pill">🧩 ${gs.matched.length / 2} / ${gs.totalPairs} 쌍 · 실수 ${gs.mistakes}</div>
      </div>

      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-family: 'Fredoka'; font-weight: 600; color: var(--navy); font-size: 18px;">영어와 한국어 뜻을 짝지어봐! 🧩</div>
      </div>

      <div class="match-grid">
        ${gs.tiles.map(t => {
          let cls = t.type;
          if (gs.matched.includes(t.id)) cls += ' matched';
          if (gs.selected && gs.selected.id === t.id) cls += ' selected';
          if (gs.wrongPair && gs.wrongPair.includes(t.id)) cls += ' wrong-match';
          return `<div class="match-tile ${cls}" onclick="selectTile('${t.id}')">${t.text}</div>`;
        }).join('')}
      </div>

      ${gs.matched.length === gs.tiles.length ? `
        <div class="feedback correct" style="margin-top: 20px;">
          🎉 전부 다 맞혔어! 실수는 ${gs.mistakes}번!
        </div>
        <div style="text-align:center;">
          <button class="btn btn-primary" onclick="finishMatching()">결과 보기 🏆</button>
        </div>
      ` : ''}
    </div>
  `;
}

function selectTile(id) {
  const gs = state.gameState;
  if (gs.matched.includes(id)) return;
  if (gs.wrongPair) return; // Wait for wrong pair to clear
  const tile = gs.tiles.find(t => t.id === id);

  if (!gs.selected) {
    gs.selected = tile;
    playSound('select');
    render();
    return;
  }

  if (gs.selected.id === id) {
    gs.selected = null;
    playSound('click');
    render();
    return;
  }

  // Check match
  if (gs.selected.pairId === tile.pairId && gs.selected.type !== tile.type) {
    gs.matched.push(gs.selected.id, tile.id);
    playSound('match');
    markMastered(state.currentCategory, tile.word.en);
    setTimeout(() => speak(tile.word.en), 150);
    gs.selected = null;
    render();
  } else {
    gs.mistakes++;
    gs.wrongPair = [gs.selected.id, tile.id];
    playSound('wrong');
    render();
    setTimeout(() => {
      gs.selected = null;
      gs.wrongPair = null;
      render();
    }, 800);
  }
}

function finishMatching() {
  const gs = state.gameState;
  const isPerfect = gs.mistakes === 0;
  const xpGained = gs.totalPairs * XP_CORRECT + (isPerfect ? XP_BONUS_PERFECT : 0);
  addXP(xpGained);
  updateStreak();
  state.gameState = {
    mode: 'matching',
    total: gs.totalPairs,
    correct: gs.totalPairs,
    mistakes: gs.mistakes,
    xpGained: xpGained,
    perfect: isPerfect
  };
  state.screen = 'result';
  render();
  if (isPerfect) {
    setTimeout(() => playSound('perfect'), 200);
    setTimeout(confetti, 300);
  } else {
    setTimeout(() => playSound('streak'), 200);
  }
}

function finishFlashcard() {
  const gs = state.gameState;
  gs.seen.add(gs.idx);
  addXP(gs.seen.size * 3);
  updateStreak();
  state.gameState = {
    mode: 'flashcard',
    total: gs.words.length,
    correct: gs.seen.size,
    xpGained: gs.seen.size * 3,
    isFlashcard: true
  };
  state.screen = 'result';
  render();
  setTimeout(() => playSound('streak'), 200);
}

// ==========================================================
// MASTERED TRACKING
// ==========================================================
function markMastered(catKey, wordEn) {
  if (!state.mastered[catKey]) state.mastered[catKey] = [];
  if (!state.mastered[catKey].includes(wordEn)) {
    state.mastered[catKey].push(wordEn);
    saveState();
  }
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastDate = state.lastPlayed ? new Date(state.lastPlayed).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastDate !== today) {
    if (lastDate === yesterday) state.streak++;
    else state.streak = 1;
    state.lastPlayed = Date.now();
  }
  saveState();
}

// ==========================================================
// RESULT SCREEN
// ==========================================================
function renderResult() {
  const gs = state.gameState;
  let emoji, title, msg;

  if (gs.isFlashcard) {
    emoji = '📚'; title = '잘했어!'; msg = `${gs.correct}개 단어를 쭉 봤어. 이제 퀴즈로 실력을 확인해보자!`;
  } else {
    const pct = gs.correct / gs.total;
    if (gs.perfect || pct === 1) { emoji = '🏆'; title = '완벽해!!!'; msg = '전부 다 맞혔어! 넌 진짜 영어 천재야!'; }
    else if (pct >= 0.75) { emoji = '🌟'; title = '훌륭해!'; msg = '거의 다 맞혔어! 조금만 더 해보자!'; }
    else if (pct >= 0.5) { emoji = '💪'; title = '잘하고 있어!'; msg = '점점 좋아지고 있어. 계속 해보자!'; }
    else { emoji = '🌱'; title = '괜찮아!'; msg = '처음엔 누구나 어려워. 다시 해보면 더 잘할 거야!'; }
  }

  return `
    ${renderHeader()}
    <div class="card">
      <div class="result-hero">
        <div class="result-emoji">${emoji}</div>
        <div class="result-title">${title}</div>
        <div class="result-sub">${msg}</div>
      </div>

      <div class="result-stats">
        ${gs.isFlashcard ? `
          <div class="stat-box">
            <div class="stat-num">${gs.correct}</div>
            <div class="stat-label">본 단어</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">+${gs.xpGained}</div>
            <div class="stat-label">경험치</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">🔥${state.streak}</div>
            <div class="stat-label">연속일</div>
          </div>
        ` : `
          <div class="stat-box">
            <div class="stat-num">${gs.correct}/${gs.total}</div>
            <div class="stat-label">정답</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">+${gs.xpGained}</div>
            <div class="stat-label">경험치</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${Math.round(gs.correct/gs.total*100)}%</div>
            <div class="stat-label">정답률</div>
          </div>
        `}
      </div>

      <div class="controls-row" style="justify-content: center;">
        <button class="btn btn-accent" onclick="backToMode()">🔁 한번 더</button>
        <button class="btn btn-primary" onclick="goHome()">🏠 처음으로</button>
      </div>
    </div>
  `;
}

function renderWordList() {
  const cat = VOCAB[state.currentCategory];
  if (!cat) return '<div class="card">카테고리를 찾을 수 없어요.</div>';
  const words = cat.words || [];

  return `
    ${renderHeader()}
    <div class="card">
      <button class="btn btn-ghost btn-sm" onclick="backToMode()" style="margin-bottom:14px">← 돌아가기</button>
      <div style="text-align:center; margin: 8px 0 16px;">
        <div style="font-size: 60px;">${cat.emoji}</div>
        <div class="screen-title" style="color: #4CAF50;">📋 단어 목록</div>
        <div class="screen-sub">${cat.nameKr} · 총 ${words.length}개 단어 · 🔊 버튼을 누르면 발음을 들을 수 있어요</div>
      </div>

      <div style="border:3px solid var(--navy);border-radius:14px;background:white;overflow:hidden">
        ${words.length === 0
          ? '<div style="text-align:center;padding:30px;color:var(--navy-soft)">단어가 없어요. 단어를 추가해 보세요!</div>'
          : words.map((w, i) => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;${i < words.length - 1 ? 'border-bottom:1px solid #eee' : ''}">
            <div style="flex:1;min-width:0">
              <div style="font-family:'Fredoka';font-weight:600;font-size:18px;color:var(--navy)">${w.en}</div>
              <div style="color:var(--navy-soft);font-size:14px;margin-top:2px">${w.ko}</div>
            </div>
            <button class="btn btn-icon" onclick="speak('${w.en.replace(/'/g, "\\'")}'); event.stopPropagation();" aria-label="발음 듣기" style="flex-shrink:0">🔊</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==========================================================
// NAVIGATION
// ==========================================================
async function startGame() {
  const input = document.getElementById('nameInput').value.trim();
  if (!input) {
    alert('이름을 입력해줄래? 😊');
    return;
  }
  state.name = input;
  state.screen = 'home';
  await saveState();
  playSound('welcome');
  render();
}

function selectCategory(key) {
  state.currentCategory = key;
  state.screen = VOCAB[key]?.isCustom ? 'customManage' : 'modeSelect';
  playSound('category');
  render();
}

function startMode(mode) {
  if (mode === 'wordlist') {
    state.screen = 'wordlist';
    render();
    return;
  }
  state.currentMode = mode;
  playSound('gameStart');
  if (mode === 'flashcard') startFlashcard();
  else if (mode === 'matching') startMatching();
  else startQuiz(mode);
}

function goHome() {
  state.currentCategory = null;
  state.currentMode = null;
  state.gameState = null;
  state.screen = 'home';
  playSound('back');
  render();
}

function backToMode() {
  state.gameState = null;
  state.screen = 'modeSelect';
  playSound('back');
  render();
}

// ==========================================================
// MAIN RENDER
// ==========================================================
function render() {
  const app = document.getElementById('app');
  let html = '';
  switch (state.screen) {
    case 'welcome': html = renderWelcome(); break;
    case 'home': html = renderHome(); break;
    case 'modeSelect': html = renderModeSelect(); break;
    case 'customManage': html = renderCustomManage(); break;
    case 'flashcard': html = renderFlashcard(); break;
    case 'meaning': html = renderMeaningQuiz(); break;
    case 'word': html = renderWordQuiz(); break;
    case 'spelling': html = renderSpelling(); break;
    case 'matching': html = renderMatching(); break;
    case 'wordlist': html = renderWordList(); break;
    case 'result': html = renderResult(); break;
    case 'profile': html = renderProfile(); break;
    case 'admin': html = renderAdmin(); break;
    default: html = renderWelcome();
  }
  app.innerHTML = html;

  // Auto-focus inputs
  const spellInput = document.getElementById('spellInput');
  if (spellInput && !state.gameState?.answered) spellInput.focus();

  const nameInput = document.getElementById('nameInput');
  if (nameInput) {
    nameInput.focus();
    nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
  }

  const customEn = document.getElementById('customEnInput');
  const customKo = document.getElementById('customKoInput');
  if (customEn && customKo) {
    const onKey = e => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        if (e.target === customEn && !customKo.value.trim()) customKo.focus();
        else addCustomWord();
      }
    };
    customEn.addEventListener('keydown', onKey);
    customKo.addEventListener('keydown', onKey);
  }

  const avatarBtn = document.getElementById('avatarBtn');
  if (avatarBtn) avatarBtn.addEventListener('click', () => {
    state.screen = 'profile';
    render();
  });

  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) adminBtn.addEventListener('click', () => {
    resetAdminView();
    state.screen = 'admin';
    render();
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    await logout();
  });
  if (state.screen === 'profile') bindProfileHandlers();
  if (state.screen === 'admin') bindAdminHandlers();
}

// ==========================================================
// INIT
// ==========================================================
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

// 다른 모듈(profile.js, admin.js)에서 사용하는 심볼들 export
export { VOCAB, CATEGORIES, state, render };

// onclick="..." 인라인 핸들러가 동작하려면 함수들이 window에 노출되어야 함
const __exports = {
  addCustomWord,
  answerMeaning,
  answerWord,
  backToCustomManage,
  backToMode,
  checkSpelling,
  closeLevelUp,
  deleteCustomWord,
  finishFlashcard,
  finishMatching,
  flipCard,
  goHome,
  handleSpellKey,
  nextCard,
  nextQuestion,
  prevCard,
  selectCategory,
  selectTile,
  speak,
  startCustomStudy,
  startGame,
  startMode,
  toggleSound,
};
for (const [k, v] of Object.entries(__exports)) {
  window[k] = v;
}
