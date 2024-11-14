'use client'

import { useState, useRef, useEffect } from 'react'
import FileUpload from './FileUpload'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onFileSelect?: (file: File) => void
}

export default function ChatInput({ onSendMessage, onFileSelect }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    onSendMessage(message)
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="border-t border-indigo-500/20 bg-black/40 p-2 sm:p-4">
      <div className="relative flex items-center gap-2">
        {onFileSelect && (
          <div className="relative z-20">
            <FileUpload onFileSelect={onFileSelect} />
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          className="flex-1 bg-black/40 text-indigo-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3
            border border-indigo-500/30 focus:border-indigo-500/50
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            placeholder-indigo-500/50 text-xs sm:text-sm resize-none"
          rows={1}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!message.trim()}
          className="px-3 sm:px-4 py-2 sm:py-3 bg-indigo-500/20 text-indigo-300 
            rounded-xl hover:bg-indigo-500/30 transition-colors
            border border-indigo-500/30 text-xs sm:text-sm
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
    </div>
  )
} 