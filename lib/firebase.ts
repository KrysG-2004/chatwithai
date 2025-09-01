import { initializeApp, getApps } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// 初始化 Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// 获取 Auth 实例
const auth = getAuth(app)

// 设置持久化
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error('设置持久化失败:', error);
    });
}

// 导出服务实例
export { auth }
export const db = getFirestore(app)
export const storage = getStorage(app) 