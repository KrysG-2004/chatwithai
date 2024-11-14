'use client'

import { useEffect, useState } from 'react'
import IntroPage from './components/IntroPage'
import { auth } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/chat')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-indigo-300">Loading...</div>
    </div>
  }

  if (user) {
    return null
  }

  return <IntroPage onGetStarted={() => {}} />
}
