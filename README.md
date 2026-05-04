# 영어 단어 모험 (English Adventure)

초등 영어 단어 학습 웹앱. Firebase Auth(Google) + Firestore 기반.

## 개발

```bash
npx http-server . -p 8080 -c-1   # 로컬 서버
firebase deploy                    # 배포
```

관리자 이메일은 `js/firebase-init.js`의 `ADMIN_EMAIL` 및 `firestore.rules` 두 곳에 동시에 명시되어 있다.
