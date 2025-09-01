'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import AuthModal from './AuthModal'
import BeerAnimation from './BeerAnimation'
import LanguageSelector from './LanguageSelector'

interface IntroPageProps {
  onGetStarted: () => void
}

const crossWords = {
  zh: {
    0: ["Build-", "Smart-", "--AI", "-Chat"],
    1: ["", "快速", "响应", "--Now"],
    2: ["创造", "---未来", "对话"],
    3: ["智能", "对话", "--助手"]
  },
  en: {
    0: ["Build-", "Smart-", "--AI", "-Chat"],
    1: ["", "Fast", "Response", "--Now"],
    2: ["Create", "---the", "Future"],
    3: ["Chat", "that", "--Thinks"]
  }
}

const content = {
  zh: {
    title: 'AI Terminal Chat',
    description: '体验下一代AI对话系统，通过终端风格界面与AI进行自然交流。支持实时对话、代码高亮、文件上传等多种功能。',
    startButton: 'Try It Now'
  },
  en: {
    title: 'AI Terminal Chat',
    description: 'Experience the next generation AI chat system with a terminal-style interface. Features real-time dialogue, code highlighting, file upload, and more.',
    startButton: 'Get Started'
  }
}

export default function IntroPage({ onGetStarted }: IntroPageProps) {
  const [user, loading] = useAuthState(auth)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [language, setLanguage] = useState<'zh' | 'en'>('zh')

  useEffect(() => {
    setShowContent(true)
  }, [])

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      router.push('/chat');
    }
  }, [user, loading, router]);

  const handleGetStarted = () => {
    setShowAuth(true)
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* 语言选择器 */}
      <div className="absolute top-4 right-4">
        <LanguageSelector 
          onLanguageChange={setLanguage}
          currentLang={language}
        />
      </div>

      <div className={`content-wrap ${showContent ? 'content-visible' : ''}`}>
        <div className="layer" id="wordGrid">
          {Object.values(crossWords[language]).map((group, groupIndex) => (
            <div key={groupIndex} className="word-group">
              {group.map(word => 
                word.padEnd(6, " ").split("").map((char, charIndex) => (
                  <div key={charIndex} className="cell">
                    {char === "-" ? " " : char}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
        
        <div className="side-section">
          <h2 className="text-green-400">{content[language].title}</h2>
          <p className="text-green-400/80 mt-4">
            {content[language].description}
          </p>
          <button
            onClick={handleGetStarted}
            className="button mt-6"
          >
            {content[language].startButton}
          </button>
        </div>
      </div>

      {showAuth && (
        <AuthModal 
          isOpen={showAuth} 
          onClose={() => setShowAuth(false)}
          language={language}
        />
      )}
    </div>
  )
} 