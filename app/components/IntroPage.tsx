'use client'

import { useState, useEffect } from 'react'
import AuthModal from './AuthModal'

interface IntroPageProps {
  onGetStarted: () => void
}

const crossWords = {
  0: ["Build-", "Smart-", "--AI", "-Chat"],
  1: ["", "Fast", "Response", "--Now"],
  2: ["Create", "---the", "Future"],
  3: ["Chat", "that", "--Thinks"]
}

export default function IntroPage({ onGetStarted }: IntroPageProps) {
  const [showContent, setShowContent] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    setShowContent(true)
  }, [])

  const handleGetStarted = () => {
    setShowAuth(true)  // 显示登录/注册模态框
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className={`content-wrap ${showContent ? 'content-visible' : ''}`}>
        <div className="layer" id="wordGrid">
          {Object.values(crossWords).map((group, groupIndex) => (
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
          <h2 className="text-green-400">AI Terminal Chat</h2>
          <p className="text-green-400/80 mt-4">
            体验下一代AI对话系统，通过终端风格界面与AI进行自然交流。
            支持实时对话、代码高亮、文件上传等多种功能。
          </p>
          <button
            onClick={handleGetStarted}
            className="button mt-6"
          >
            开始使用
          </button>
        </div>
      </div>

      {/* 登录/注册模态框 */}
      {showAuth && (
        <AuthModal 
          isOpen={showAuth} 
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  )
} 