'use client'

import { useState } from 'react'
import FileUpload from './FileUpload'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onFileSelect?: (file: File) => void
}

export default function ChatInput({ onSendMessage, onFileSelect }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSendMessage(input)
    setInput('')
  }

  const handleFileSelect = (file: File) => {
    if (onFileSelect) {
      onFileSelect(file)
      setShowUpload(false)
    }
  }

  return (
    <div className="border-t border-green-500/20 bg-black/20">
      {showUpload && (
        <div className="p-4">
          <FileUpload onFileSelect={handleFileSelect} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-black/40 text-green-400 placeholder-green-700 rounded-lg px-4 py-2 border border-green-500/30 focus:outline-none focus:border-green-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
} 