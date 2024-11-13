import { Message } from '../types/chat'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto py-4 px-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="text-center text-green-500/50 py-8">
              <h2 className="text-lg font-medium mb-2 text-green-400">欢迎使用 AI Chat</h2>
              <p className="text-sm">开始输入您的问题，AI 助手将为您解答。</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`${
                  message.role === 'user' 
                    ? 'ml-auto max-w-[85%]' 
                    : 'mr-auto max-w-[85%]'
                }`}
              >
                <div className={`rounded-lg p-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : 'bg-gray-800/50 text-green-300 border border-green-400/20'
                }`}>
                  {message.role === 'assistant' ? (
                    message.content ? (
                      <ReactMarkdown
                        className="markdown-body text-sm"
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-green-500/50">AI is thinking</span>
                        <span className="loading-dots"/>
                      </div>
                    )
                  ) : (
                    <div>{message.content}</div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 