export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  createdAt: string
  status: 'sending' | 'sent' | 'error'
}

export interface UserCredits {
  userId: string;
  credits: number;
  lastUpdated: Date;
} 