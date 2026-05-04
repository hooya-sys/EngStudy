// Firebase 앱 초기화. 모든 다른 모듈은 여기서 export한 app/auth/db를 import해서 사용.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVPQZd_txKx0nCzUuVZ-22Pxj8D599WXk",
  authDomain: "ssunengstudy.firebaseapp.com",
  projectId: "ssunengstudy",
  storageBucket: "ssunengstudy.firebasestorage.app",
  messagingSenderId: "870056342973",
  appId: "1:870056342973:web:ffc8f20af0c4c159654ed4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// 어드민 화이트리스트 (단일 이메일). Security Rules와 반드시 동일하게 유지.
export const ADMIN_EMAIL = "imhooya@gmail.com";