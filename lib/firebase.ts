import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
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

// 在开发环境中启用调试令牌
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// 导出服务实例
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app) 