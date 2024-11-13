'use client'

import { useEffect, useState, useRef } from 'react'
import ChatInterface from './components/ChatInterface'
import AuthModal from './components/AuthModal'
import BeerAnimation from './components/BeerAnimation'
import IntroPage from './components/IntroPage'
import { auth } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'

export default function Home() {
  const [user, loading] = useAuthState(auth)
  const [showAuth, setShowAuth] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const prevUserRef = useRef<any>(null)
  
  useEffect(() => {
    if (!loading && user && !prevUserRef.current) {
      setShowWelcome(true)
    }
    prevUserRef.current = user
  }, [user, loading])

  const handleIntroComplete = () => {
    setShowIntro(false)
    if (!user) {
      setShowAuth(true)
    }
  }

  return (
    <>
      {showIntro && (
        <IntroPage onGetStarted={handleIntroComplete} />
      )}
      {!showIntro && (
        <>
          <AuthModal 
            isOpen={showAuth} 
            onClose={() => setShowAuth(false)} 
          />
          {showWelcome && (
            <BeerAnimation onComplete={() => setShowWelcome(false)} />
          )}
          {user && <ChatInterface />}
          {!user && !loading && !showAuth && (
            <div className="fixed inset-0 bg-black/95 flex items-center justify-center">
              <div className="text-center space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-indigo-300 font-mono">AI Terminal</h1>
                  <p className="text-indigo-300/70 font-mono">请登录后开始使用</p>
                </div>
                <div className="h-1 w-16 bg-indigo-500/30 mx-auto"></div>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-6 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 
                    rounded-lg hover:bg-indigo-500/30 transition-colors font-mono"
                >
                  登录
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
