'use client'

import { motion } from 'framer-motion'
import { useCredits } from '../hooks/useCredits'

export default function PriceSidebar() {
  const { credits } = useCredits()

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed right-0 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-xl
        border-l border-indigo-500/20 p-6 w-64 text-indigo-300"
    >
      <h3 className="text-xl font-medium mb-4">Your Credits</h3>
      
      <div className="space-y-4">
        <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
          <div className="text-2xl font-bold">{credits || 0}</div>
          <div className="text-xs text-indigo-300/70">Available Credits</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Credit Usage:</div>
          <div className="text-xs space-y-1 text-indigo-300/70">
            <div>• 1 credit per chat message</div>
            <div>• 5 credits per file analysis</div>
            <div>• Free credits for new users</div>
          </div>
        </div>

        <a
          href="/pricing"
          className="block w-full py-2 text-center rounded-xl bg-indigo-500/20
            hover:bg-indigo-500/30 transition-colors text-sm border border-indigo-500/30"
        >
          Get More Credits
        </a>
      </div>

      <div className="mt-6 text-xs text-indigo-300/50">
        <p>Need help with credits?</p>
        <a href="/contact" className="text-indigo-400 hover:text-indigo-300">
          Contact Support
        </a>
      </div>
    </motion.div>
  )
} 