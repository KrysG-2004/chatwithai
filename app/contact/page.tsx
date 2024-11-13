'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('发送失败')
      }

      setStatus('success')
      setFormData({ name: '', email: '', message: '' })
      
      // 3秒后重置状态
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      console.error('发送失败:', error)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-20">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-medium text-green-400 text-center mb-12">联系我们</h1>
        
        <div className="bg-gray-900 rounded-xl border border-green-500/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-green-400 mb-2 text-sm">姓名</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-black/40 text-green-400 rounded-lg px-4 py-2 border border-green-500/30 focus:outline-none focus:border-green-500/50 text-sm"
                placeholder="您的姓名"
              />
            </div>
            
            <div>
              <label className="block text-green-400 mb-2 text-sm">邮箱</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-black/40 text-green-400 rounded-lg px-4 py-2 border border-green-500/30 focus:outline-none focus:border-green-500/50 text-sm"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label className="block text-green-400 mb-2 text-sm">消息</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full bg-black/40 text-green-400 rounded-lg px-4 py-2 border border-green-500/30 focus:outline-none focus:border-green-500/50 h-32 text-sm"
                placeholder="请输入您的消息..."
              />
            </div>
            
            <button
              type="submit"
              disabled={status === 'sending'}
              className={`w-full py-2 rounded-lg border transition-colors text-sm
                ${status === 'sending' 
                  ? 'bg-green-500/20 text-green-400/50 border-green-500/20 cursor-not-allowed'
                  : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                }
              `}
            >
              {status === 'sending' ? '发送中...' : '发送消息'}
            </button>

            {status === 'success' && (
              <div className="text-green-400 text-sm text-center">
                消息已发送，我们会尽快回复您！
              </div>
            )}

            {status === 'error' && (
              <div className="text-red-400 text-sm text-center">
                发送失败，请稍后重试。
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
} 