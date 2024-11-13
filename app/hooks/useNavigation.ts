'use client'

import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'

export function useNavigation() {
  const router = useRouter()
  const [user] = useAuthState(auth)

  const handleBack = () => {
    if (user) {
      router.push('/')  // 已登录用户返回聊天界面
    } else {
      router.push('/?showIntro=true')  // 未登录用户返回介绍界面
    }
  }

  return { handleBack }
} 