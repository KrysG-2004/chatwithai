export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  createdAt: string
  status: 'sending' | 'sent' | 'error'
} 