'use client'

import { useEffect } from 'react'

export default function BeerAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
    >
      <div className="relative animate-welcome-beer">
        <div className="w-64 h-64 relative">
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full filter drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]"
          >
            {/* 瓶身 - 更现代的设计 */}
            <path
              d="M30 20 L25 35 C25 35 23 80 25 85 C27 92 35 95 50 95 C65 95 73 92 75 85 C77 80 75 35 75 35 L70 20 Z"
              className="fill-cyan-500/90"
              filter="url(#bottle-glow)"
            />
            {/* 瓶颈 - 更优雅的曲线 */}
            <path
              d="M38 10 L35 20 L65 20 L62 10 C62 5 38 5 38 10"
              className="fill-cyan-500/90"
            />
            
            {/* 装饰性图案 */}
            <g className="animate-pulse-slow">
              <circle cx="50" cy="50" r="15" className="fill-none stroke-cyan-300/30" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="20" className="fill-none stroke-cyan-300/20" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" className="fill-none stroke-cyan-300/10" strokeWidth="0.5" />
            </g>
            
            {/* 定义滤镜 */}
            <defs>
              <filter id="bottle-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="text-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="100%" stopColor="#00ffff" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* 文字效果 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400 animate-pulse-slow">
                Welcome
              </p>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400 animate-pulse-slow">
                to KChat
              </p>
            </div>
          </div>

          {/* 发光效果 */}
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/20 to-transparent opacity-50 animate-pulse-slow" />
        </div>
      </div>
    </div>
  )
} 