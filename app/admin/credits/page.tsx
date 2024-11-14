'use client'

import { useState, useEffect } from 'react'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'

// 管理员用户ID列表
const ADMIN_IDS = [
  'fsBEyQByiPe1ReAlzFQmew9djqn2'  // 你的用户ID
]

export default function AdminCreditsPage() {
  const [user, loading] = useAuthState(auth)  // 添加 loading 状态
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [credits, setCredits] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  // 修改权限检查逻辑
  useEffect(() => {
    // 等待认证状态加载完成
    if (loading) return;

    // 如果用户未登录，显示登录提示
    if (!user) {
      console.log('用户未登录');
      return;
    }

    // 如果不是管理员，重定向到首页
    if (!ADMIN_IDS.includes(user.uid)) {
      console.log('非管理员访问');
      router.replace('/');  // 使用 replace 而不是 push
      return;
    }

    console.log('管理员访问成功');
  }, [user, loading, router]);

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-indigo-300">加载中...</div>
      </div>
    );
  }

  // 如果用户未登录，显示登录提示
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-indigo-300">请先登录</div>
      </div>
    );
  }

  // 如果不是管理员，显示无权限提示
  if (!ADMIN_IDS.includes(user.uid)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400">无权访问此页面</div>
      </div>
    );
  }

  const handleUpdateCredits = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    try {
      // 获取用户文档引用
      const userDoc = doc(db, 'userCredits', userId)
      const userSnap = await getDoc(userDoc)
      
      // 如果用户记录不存在，创建新记录
      if (!userSnap.exists()) {
        await setDoc(userDoc, {
          userId: userId,
          credits: Number(credits),
          lastUpdated: new Date()
        });
        setStatus('success')
        setMessage(`成功为用户 ${userId} 创建积分记录：${credits}`)
      } else {
        // 更新现有记录
        await updateDoc(userDoc, {
          credits: Number(credits),
          lastUpdated: new Date()
        })
        setStatus('success')
        setMessage(`成功更新用户 ${userId} 的积分为 ${credits}`)
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '更新失败')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black py-20">
      <div className="max-w-xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-purple-300 mb-8">管理员工具 - 积分调整</h1>
        
        <form onSubmit={handleUpdateCredits} className="space-y-6">
          <div>
            <label className="block text-purple-300 mb-2">用户 ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-black/40 text-purple-300 rounded-lg px-4 py-2 
                border border-purple-500/30 focus:border-purple-500/50
                focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              placeholder="输入用户ID"
              required
            />
          </div>
          
          <div>
            <label className="block text-purple-300 mb-2">新积分数量</label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="w-full bg-black/40 text-purple-300 rounded-lg px-4 py-2 
                border border-purple-500/30 focus:border-purple-500/50
                focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              placeholder="输入新的积分数量"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 rounded-lg bg-purple-500/20 text-purple-300 
              hover:bg-purple-500/30 transition-colors border border-purple-500/30
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? '更新中...' : '更新积分'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            status === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-purple-300/50 text-sm">
          <h2 className="font-medium mb-2">使用说明：</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>输入用户的 Firebase Auth ID</li>
            <li>如果用户不存在，将自动创建新记录</li>
            <li>输入想要设置的新积分数量</li>
            <li>点击更新按钮完成调整</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 