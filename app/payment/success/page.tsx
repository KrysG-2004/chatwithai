'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCredits } from '@/app/hooks/useCredits'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addCredits } = useCredits()
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (sessionId) {
      // 验证支付状态并添加积分
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          addCredits(data.credits)
          setTimeout(() => {
            router.push('/chat')
          }, 3000)
        }
      })
      .catch(console.error)
    }
  }, [searchParams, addCredits, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black 
      flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-400 mb-4">支付成功！</h1>
        <p className="text-green-300/70">
          您的积分已经添加到账户中，正在返回聊天页面...
        </p>
      </div>
    </div>
  )
} 