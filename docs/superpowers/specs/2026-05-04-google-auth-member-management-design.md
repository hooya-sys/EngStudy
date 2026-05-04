# 구글 로그인 + 회원관리 기능 설계

작성일: 2026-05-04
대상 프로젝트: EngStudy (영어 단어 모험 - 정적 HTML 학습 앱)

## 1. 배경 및 목표

현재 EngStudy는 단일 HTML 파일(`index.html`, 약 2,720줄)로 구성된 정적 학습 앱으로, `window.storage` API를 통해 단말 1대 = 사용자 1명을 가정한 상태를 저장한다. 이 프로젝트를 Firebase Hosting에 배포하면서 다음을 추가한다.

- **구글 계정 로그인**으로만 앱 이용 가능 (게이팅)
- 사용자를 **어드민(admin)** 과 **회원(member)** 으로 구분
- 신규 가입자는 **어드민 승인** 후에만 사용 가능
- 어드민에게는 **회원관리 화면** 제공 (목록·승인·차단·역할변경·삭제·진도 열람)
- 인증된 회원에게는 **"내 정보" 화면** 제공 (프로필 변경·진도 보기·진도 초기화·탈퇴)

## 2. 결정된 요구사항 요약

| 항목 | 결정 |
|---|---|
| 호스팅 | Firebase Hosting |
| 인증 | Firebase Authentication (Google Provider) |
| 데이터베이스 | Cloud Firestore |
| 가입 정책 | 어드민 승인제 (신규 = `pending`, 승인 후 `approved`) |
| 최초 어드민 | 코드에 이메일 하드코딩: `imhooya@gmail.com` |
| 사용자 데이터 저장 | Firestore에 사용자별 (XP / level / streak / mastered / customWords 모두) |
| 커스텀 단어장 가시성 | 본인만 |
| 기존 `window.storage` 데이터 | 폐기 (마이그레이션 없음) |
| 코드 구조 | ES 모듈로 분리, 빌드 도구 없음 |

## 3. 파일/모듈 구조

```
EngStudy/
├── index.html              # 앱 셸 + 게임 화면 HTML/CSS. 게임 JS는 모듈로 이동
├── firebase.json           # Firebase Hosting 설정
├── firestore.rules         # 보안 규칙
├── .firebaserc             # 프로젝트 ID
├── js/
│   ├── main.js             # 부팅 시퀀스 (firebase-init → auth → gating → 라우팅)
│   ├── firebase-init.js    # Firebase 앱 초기화 (apiKey 등 config)
│   ├── auth.js             # 구글 로그인/로그아웃, onAuthStateChanged, 역할/상태 결정
│   ├── store.js            # Firestore 읽기/쓰기 (loadState/saveState/loadCustomWords/saveCustomWords/addCustomWord/removeCustomWord)
│   ├── gating.js           # 화면 게이팅 (login / pending / blocked / approved 분기)
│   ├── admin.js            # 어드민 화면 렌더링 + 회원 CRUD 액션
│   ├── profile.js          # "내 정보" 화면 + 진도 초기화 + 탈퇴
│   └── game.js             # 기존 index.html `<script>` 안의 게임 로직 (이동)
└── docs/superpowers/specs/
    └── 2026-05-04-google-auth-member-management-design.md  # 본 문서
```

**책임 분리 원칙**

- `auth.js`만 Firebase Auth를 안다. 다른 모듈은 `auth.js`가 노출하는 `currentUser`, `currentRole`, `currentStatus`만 본다.
- `store.js`만 Firestore를 안다. 게임 코드는 기존과 동일하게 `loadState()` / `saveState()` 등 친근한 API만 호출한다.
- `game.js`는 인증을 모른다. 게이팅을 통과한 뒤에만 진입한다.

**기존 코드 호환성**

- `loadState/saveState/loadCustomWords/saveCustomWords` 시그니처를 유지하고 내부만 Firestore 호출로 교체한다 → 게임 로직 수정 최소화.
- 게임 코드의 전역 `state` 객체는 그대로 두되 `state.uid`를 추가한다.
- 기존 welcome 화면(이름 입력)은 제거하고, 표시 이름은 구글 계정의 `displayName`으로 초기화한다.

## 4. Firestore 데이터 모델

```
users/{uid}
  ├── email: string
  ├── displayName: string
  ├── photoURL: string | null
  ├── role: "admin" | "member"
  ├── status: "pending" | "approved" | "blocked"
  ├── createdAt: Timestamp
  ├── lastLoginAt: Timestamp
  ├── xp: number
  ├── level: number
  ├── streak: number
  ├── lastPlayed: Timestamp | null
  ├── soundEnabled: boolean
  └── mastered: { [categoryKey: string]: string[] }   # 마스터한 단어의 영어 표기 배열

users/{uid}/customWords/{wordId}
  ├── en: string
  ├── ko: string
  └── createdAt: Timestamp
```

**설계 근거**

- 게임 state는 한 문서에 통째로: 기존 `loadState()`가 한 번에 다 읽으므로 호환이 쉽고, Firestore 1MB/문서 한도에 한참 못 미친다 (학습 데이터는 KB 단위).
- 커스텀 단어는 서브컬렉션: 단어 단위 추가/삭제가 잦아 사용자 문서 전체를 매번 다시 쓰는 것보다 효율적.

## 5. 인증 + 권한 + 게이팅 흐름

```
[페이지 로드]
   ↓
firebase-init.js → Firebase 앱 초기화
   ↓
auth.js → onAuthStateChanged 구독
   ↓
┌─────────────────────────────────────────┐
│ user === null  →  로그인 화면만 노출     │
│                   (Google 로그인 버튼 1개)│
└─────────────────────────────────────────┘
   ↓ 로그인 성공 (signInWithPopup)
auth.js → users/{uid} 문서 조회
   ├─ 없음 (첫 로그인)
   │    ├─ email == "imhooya@gmail.com"  → role:"admin",  status:"approved" 로 생성
   │    └─ 그 외                         → role:"member", status:"pending"  로 생성
   └─ 있음 → lastLoginAt 만 업데이트

   ↓ status에 따라 분기 (gating.js)
┌────────────────────────────────────────────────┐
│ pending  → "승인 대기 중" 안내 화면            │
│ blocked  → "차단됨" 안내 화면 (로그아웃 버튼만)│
│ approved → 게임 화면 + (admin이면) 어드민 메뉴 │
└────────────────────────────────────────────────┘
```

**라우팅**: 단일 페이지 안에서 `state.screen` 값으로만 화면 전환 (`'login' | 'pending' | 'blocked' | 'home' | 'admin' | 'profile' | 기존 게임 화면들`). URL 라우팅은 도입하지 않는다 (YAGNI).

**onAuthStateChanged**: 앱 어디에서든 차단/삭제되면 즉시 게이팅 화면으로 튕기도록 항상 활성 구독을 유지한다.

## 6. 어드민 화면

**진입**: 헤더에 어드민에게만 보이는 "🛡️ 회원관리" 버튼 → `state.screen = 'admin'`.

**탭 구성**

- **승인 대기 탭**: `where('status', '==', 'pending')` 쿼리. 각 행에 [승인] [거절] 버튼.
- **전체 회원 탭**: 전체 목록. 컬럼: 사진, 표시이름, 이메일, 역할, 상태, 레벨, 마지막 접속.
  - 행 클릭 → 상세 모달: 카테고리별 마스터 진도 요약, 커스텀 단어 수, [차단/해제] [어드민 ↔ 회원] [삭제] 액션.

**액션 → Firestore 쓰기 매핑**

| 액션 | 변경 |
|---|---|
| 승인 | `status: "approved"` |
| 거절 | user 문서 삭제 (재가입 가능, 재로그인 시 다시 pending) |
| 차단 | `status: "blocked"` |
| 차단 해제 | `status: "approved"` |
| 역할 변경 | `role: "admin"` ↔ `"member"` |
| 삭제 | user 문서 + customWords 서브컬렉션 일괄 삭제 (Auth 계정은 제거하지 않음 — 재로그인 시 재가입 흐름) |

**자기 자신 보호**

- 어드민이 본인 역할 강등 / 차단 / 삭제 시도 시 confirm 다이얼로그.
- **어드민이 1명뿐일 때** 본인 강등 / 차단 / 삭제 시도는 차단 (lockout 방지).

## 7. 회원 "내 정보" 화면

**진입**: 헤더의 아바타 클릭 → `state.screen = 'profile'`.

**구성**

- 프로필 카드: 구글 사진, displayName, email, createdAt, level/xp/streak 요약
- "표시 이름 변경" 인라인 편집 → `users/{uid}.displayName` 업데이트
- "진도 보기" 섹션: 카테고리별 마스터한 단어 수 / 전체 단어 수 진행 바
- **위험 액션 영역** (시각적으로 빨간 박스):
  - **[진도 초기화]** confirm 후 `xp:0, level:1, streak:0, mastered:{}`. 커스텀 단어는 유지.
  - **[탈퇴하기]** confirm 후:
    1. customWords 서브컬렉션 모두 삭제
    2. user 문서 삭제
    3. Firebase Auth 계정 삭제 (`user.delete()`)
    4. 로그인 화면으로 복귀
    - 다시 가입하면 `status: pending` 부터 재시작.

## 8. 기존 게임 코드 변경

**최소 침습 원칙** — 게임 로직 자체(랜덤 출제, 정답 판정, UI 렌더링)는 손대지 않는다.

| 파일 | 변경 |
|---|---|
| `index.html` | 인라인 `<script>...</script>` 안의 게임 로직을 `js/game.js`로 옮긴다. 본문에는 `<script type="module" src="./js/main.js">` 한 줄만 둔다. CSS와 HTML 구조는 유지. |
| `js/main.js` (신규) | 부팅 시퀀스: firebase-init → auth 구독 → gating → 화면 라우팅. |
| `js/store.js` | 기존 `loadState/saveState/loadCustomWords/saveCustomWords` API 시그니처 유지. 내부만 Firestore (`getDoc`, `setDoc`, `updateDoc`, `addDoc`, `deleteDoc`, `getDocs`, `collection`)로 교체. 추가 API: `addCustomWord`, `removeCustomWord` (서브컬렉션 단위 작업). |
| `js/game.js` | welcome 화면 진입 로직 제거. `state.name`은 Google `displayName`로 초기화. 화면 라우팅에 'admin' / 'profile' 분기 추가는 main.js가 담당하므로 game.js는 게임 화면들만 책임. |

**제거되는 것**

- 기존 welcome 화면(이름 입력) HTML/JS
- `window.storage.get/set` 직접 호출 (모두 store.js 경유)

## 9. Firestore Security Rules

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
      // 본인 또는 어드민만 읽기. 어드민은 전체 목록도 읽기 가능.
      allow get: if isSelf(uid) || isAdmin();
      allow list: if isAdmin();

      // 첫 생성: 본인만, 그리고 role/status는 이메일 화이트리스트에 따라 강제.
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

      // 본인 업데이트: role/status/email은 못 바꿈 (displayName, xp, level, mastered 등만)
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
      allow read, write: if isSelf(uid) && isApproved();
    }
  }
}
```

**보안 핵심**

- 클라이언트가 자기 문서를 임의로 admin / approved로 위조 생성 못 하도록 **이메일 화이트리스트 ↔ role/status 매핑을 룰에서 강제**.
- 클라이언트의 어드민 분기 코드는 UX용일 뿐 — 실제 차단은 Security Rules가 담당.
- 차단된 사용자가 클라 우회 시도 → 어떤 쓰기도 룰에 막힘 (`isApproved()`가 false).

## 10. 에러처리

| 상황 | 처리 |
|---|---|
| Firebase 초기화 실패 (네트워크 등) | 화면에 "서버 연결 실패, 잠시 후 다시 시도해 주세요" 안내 + 재시도 버튼 |
| 로그인 팝업 차단/취소 | 토스트 안내, 로그인 화면 유지 |
| Firestore 쓰기 실패 | 토스트 안내, 로컬 state는 유지 (다음 액션에서 재시도) |
| Security Rules 거절 (예: 차단된 사용자가 우회) | onAuthStateChanged에서 강제 로그아웃 + 안내 |
| user.delete() 시 최근 로그인 만료 (`requires-recent-login`) | 안내 후 재로그인 → 자동 재시도 |

## 11. 수동 테스트 시나리오

자동 테스트 인프라는 도입하지 않는다 (기존 프로젝트도 테스트 없고, YAGNI). 배포 전 다음 시나리오를 수동 검증한다.

1. **최초 어드민 부트스트랩**: `imhooya@gmail.com`로 첫 로그인 → 즉시 게임 화면 + 헤더에 회원관리 버튼.
2. **신규 가입자 게이팅**: 다른 구글 계정으로 로그인 → "승인 대기" 화면만 노출, 게임 진입 불가.
3. **승인 흐름**: 어드민이 승인 탭에서 [승인] → 신규 사용자 새로고침 시 게임 가능.
4. **차단 흐름**: 어드민이 [차단] → 그 사용자 화면이 즉시 "차단됨"으로 전환 (onAuthStateChanged 또는 다음 쓰기 시).
5. **탈퇴 흐름**: 회원이 [탈퇴] → user 문서/customWords/Auth 계정 모두 삭제됨을 Firebase Console에서 확인. 같은 계정 재로그인 시 status:pending으로 처음부터.
6. **진도 초기화**: XP/streak/mastered만 초기화, customWords 유지 확인.
7. **마지막 어드민 락아웃 방지**: 어드민이 1명뿐일 때 본인 강등/삭제 시도 → UI에서 차단됨.
8. **다중 기기 동기화**: 같은 계정으로 다른 브라우저에서 로그인 → XP·진도 동일하게 보임.
9. **위조 시도**: Firestore Console에서 다른 사용자 문서를 admin으로 직접 수정 시도 → Security Rules가 거절. (또는 클라이언트에서 `setDoc` 위조 → 거절)

## 12. 설정 사전 작업 (구현 전 사람 손이 필요한 단계)

구현 계획에 포함되지 않는 외부 콘솔 작업:

1. Firebase Console에서 프로젝트 생성
2. Authentication → Sign-in method → Google 활성화
3. Firestore Database 생성 (프로덕션 모드 권장)
4. Firebase CLI 설치 및 `firebase init hosting,firestore` 실행
5. `imhooya@gmail.com`로 첫 로그인 → users/{uid} 문서가 admin/approved로 생성되는지 확인

## 13. 범위 외 (Non-goals)

- 학급/그룹 단위 회원 관리
- 회원 간 랭킹/소셜 기능
- 비밀번호 로그인, 이메일 가입 (구글 OAuth 단일 채널)
- 다국어 (현재 한국어 UI 그대로)
- 이메일 알림 (승인됨 등)
- 자동화 테스트 / CI
- URL 라우팅 / 딥링크
- PWA / 오프라인 모드
- 기존 `window.storage` 데이터 마이그레이션
