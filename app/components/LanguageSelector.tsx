'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LanguageSelectorProps {
  onLanguageChange: (lang: 'zh' | 'en') => void
  currentLang: 'zh' | 'en'
}

export default function LanguageSelector({ onLanguageChange, currentLang }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const languages = {
    zh: { name: '中文', flag: '🇨🇳' },
    en: { name: 'English', flag: '🇬🇧' }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg 
          bg-green-500/10 text-green-400 hover:bg-green-500/20 
          transition-colors border border-green-500/30"
      >
        <span>{languages[currentLang].flag}</span>
        <span>{languages[currentLang].name}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-full bg-black/90 
                backdrop-blur-xl rounded-lg border border-green-500/30 
                overflow-hidden z-50"
            >
              {Object.entries(languages).map(([code, { name, flag }]) => (
                <button
                  key={code}
                  onClick={() => {
                    onLanguageChange(code as 'zh' | 'en')
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2
                    hover:bg-green-500/20 transition-colors
                    ${currentLang === code ? 'bg-green-500/10' : ''}`}
                >
                  <span>{flag}</span>
                  <span className="text-green-400">{name}</span>
                </button>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 