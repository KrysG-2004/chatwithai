'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : '认证失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setIsLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      onClose()
    } catch (error) {
      if (error instanceof Error) {
        if (error.code === 'auth/popup-blocked') {
          setError('请允许弹窗以继续登录')
        } else if (error.code === 'auth/popup-closed-by-user') {
          setError('登录已取消')
        } else {
          setError(error.message)
        }
      } else {
        setError('Google 登录失败')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-black/60 p-8 rounded-2xl border border-purple-500/30 w-full max-w-md 
            shadow-2xl shadow-purple-500/10 backdrop-blur-xl"
        >
          <h2 className="text-3xl font-bold text-purple-300 mb-8 font-mono text-center">
            {isLogin ? '欢迎回来' : '创建账号'}
          </h2>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱地址"
                className="w-full bg-black/50 text-purple-300 placeholder-purple-500/50 rounded-xl px-4 py-3 
                  border border-purple-500/30 focus:outline-none focus:border-purple-500/50 font-mono
                  focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
              />
            </div>
            
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full bg-black/50 text-purple-300 placeholder-purple-500/50 rounded-xl px-4 py-3 
                  border border-purple-500/30 focus:outline-none focus:border-purple-500/50 font-mono
                  focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 
                hover:bg-purple-500/30 transition-all duration-300 font-mono
                shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </motion.button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-purple-500/20"></div>
            <span className="px-4 text-purple-500/50 text-sm font-mono">或</span>
            <div className="flex-1 border-t border-purple-500/20"></div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-white/5 text-purple-300 border border-purple-500/30 
              hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 font-mono
              shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            {isLoading ? '处理中...' : '使用 Google 账号登录'}
          </motion.button>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-400/70 hover:text-purple-400 text-sm font-mono transition-colors"
            >
              {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
            </button>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-red-400 text-sm text-center font-mono"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 