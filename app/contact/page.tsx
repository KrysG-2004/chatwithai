'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useEffect } from 'react'

export default function ContactPage() {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (user) {
      window.history.pushState({ from: 'contact' }, '', '/contact')
    }

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      if (user) {
        router.push('/chat')
      } else {
        router.push('/')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      })

      if (!res.ok) throw new Error('Failed to send message')
      
      setStatus('success')
      setName('')
      setEmail('')
      setMessage('')
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-black text-indigo-300 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r 
          from-indigo-400 to-purple-400 text-transparent bg-clip-text">
          Contact Us
        </h1>
        
        <p className="text-center mb-12 text-indigo-300/70">
          Have questions or suggestions? We'd love to hear from you.
          Fill out the form below and we'll get back to you as soon as possible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3
                focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
                text-indigo-300 placeholder-indigo-500/50"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3
                focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
                text-indigo-300 placeholder-indigo-500/50"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full bg-black/50 border border-indigo-500/30 rounded-xl px-4 py-3
                focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
                text-indigo-300 placeholder-indigo-500/50 resize-none"
              placeholder="What would you like to tell us?"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className={`w-full py-3 rounded-xl bg-indigo-500/20 text-indigo-300 
              hover:bg-indigo-500/30 transition-colors duration-300
              border border-indigo-500/30 font-medium
              disabled:opacity-50 disabled:cursor-not-allowed
              ${status === 'sending' ? 'bg-indigo-500/20 text-indigo-400/50' : ''}
              ${status === 'success' ? 'bg-green-500/20 text-green-400' : ''}
              ${status === 'error' ? 'bg-red-500/20 text-red-400' : ''}`}
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {status === 'success' && (
            <div className="text-green-400 text-sm text-center">
              Message sent successfully! We'll get back to you soon.
            </div>
          )}

          {status === 'error' && (
            <div className="text-red-400 text-sm text-center">
              Failed to send message. Please try again later.
            </div>
          )}
        </form>
      </div>
    </div>
  )
} 