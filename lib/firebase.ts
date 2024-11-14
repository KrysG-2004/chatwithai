import { initializeApp, getApps } from 'firebase/app'
import { getAuth, RecaptchaVerifier } from 'firebase/auth'
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

let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// 在开发环境中使用调试令牌
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = 'e852deff-b4e8-4404-99b3-083f358d683d'
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app) 