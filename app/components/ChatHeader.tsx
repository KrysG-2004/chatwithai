'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import AboutModal from './AboutModal'

export default function ChatHeader() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <header className="fixed top-0 w-full bg-black/80 backdrop-blur-md border-b border-green-500/30 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image src="/ai-logo.svg" alt="AI Logo" width={32} height={32} priority className="filter invert hue-rotate-90" />
          <span className="text-xl font-mono text-green-400">AI Terminal</span>
        </div>
        
        <nav className="flex items-center space-x-4">
          <div 
            className="relative"
            onMouseEnter={() => setShowAbout(true)}
            onMouseLeave={() => setShowAbout(false)}
          >
            <button 
              className="px-3 py-1.5 text-green-400 hover:bg-green-500/20 rounded-md transition-colors font-mono text-sm"
            >
              About
            </button>
            {showAbout && <AboutModal />}
          </div>
          
          <Link 
            href="/pricing"
            className="px-3 py-1.5 text-green-400 hover:bg-green-500/20 rounded-md transition-colors font-mono text-sm"
          >
            Pricing
          </Link>
          
          <Link 
            href="/contact"
            className="px-3 py-1.5 text-green-400 hover:bg-green-500/20 rounded-md transition-colors font-mono text-sm"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
} 