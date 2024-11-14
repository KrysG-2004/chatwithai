'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import AboutModal from './AboutModal'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useCredits } from '../hooks/useCredits'

export default function ChatHeader() {
  const [showAbout, setShowAbout] = useState(false)
  const [user] = useAuthState(auth)
  const router = useRouter()
  const { credits } = useCredits()

  const handleNavigation = (path: string) => {
    if (path === '/') {
      if (user) {
        router.push('/chat')
      } else {
        router.push('/')
      }
    } else {
      router.push(path)
    }
  }

  const handleSignOut = () => {
    auth.signOut()
  }

  return (
    <header className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-indigo-500/30 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image 
            src="/ai-logo.svg" 
            alt="AI Logo" 
            width={32} 
            height={32} 
            priority 
            className="filter hue-rotate-180 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" 
          />
          <span className="text-xl font-mono text-indigo-300">AI Terminal</span>
        </div>
        
        <nav className="flex-1 flex items-center justify-center space-x-6">
          <button 
            onClick={() => handleNavigation('/pricing')}
            className="px-3 py-1.5 text-indigo-300 hover:bg-indigo-500/20 rounded-md 
              transition-colors font-mono text-sm border border-transparent
              hover:border-indigo-500/30"
          >
            Pricing
          </button>
          
          <button 
            onClick={() => handleNavigation('/contact')}
            className="px-3 py-1.5 text-indigo-300 hover:bg-indigo-500/20 rounded-md 
              transition-colors font-mono text-sm border border-transparent
              hover:border-indigo-500/30"
          >
            Contact
          </button>
          
          <div 
            className="relative"
            onMouseEnter={() => setShowAbout(true)}
            onMouseLeave={() => setShowAbout(false)}
          >
            <button 
              className="px-3 py-1.5 text-indigo-300 hover:bg-indigo-500/20 rounded-md 
                transition-colors font-mono text-sm border border-transparent
                hover:border-indigo-500/30"
            >
              About
            </button>
            <AnimatePresence>
              {showAbout && <AboutModal />}
            </AnimatePresence>
          </div>
        </nav>
        
        <div className="flex items-center">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-indigo-300/70 font-mono text-sm">
                  积分: {credits ?? '加载中...'}
                </span>
                <Link
                  href="/pricing"
                  className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded 
                    hover:bg-indigo-500/30 transition-colors border border-indigo-500/30"
                >
                  充值
                </Link>
              </div>
              <span className="text-indigo-300/70 font-mono text-sm truncate max-w-[200px]">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-red-400 hover:bg-red-500/20 rounded-md 
                  transition-colors font-mono text-sm border border-red-500/30"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 