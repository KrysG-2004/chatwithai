'use client'

import { useState } from 'react'
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import MessageList from './MessageList'
import { Message } from '../types/chat'
import { sendChatMessage } from '../utils/api-client'

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      createdAt: new Date().toISOString(),
      status: 'sent'
    }

    setMessages(prev => [...prev, userMessage])

    // 创建初始的 AI 消息
    const aiMessage: Message = {
      id: crypto.randomUUID(),
      content: '',
      role: 'assistant',
      createdAt: new Date().toISOString(),
      status: 'sending'
    }
    
    setMessages(prev => [...prev, aiMessage])

    try {
      const apiMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const stream = await sendChatMessage(apiMessages)
      
      // 处理流式响应
      let fullContent = ''
      for await (const chunk of stream) {
        if (chunk.choices?.[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content
          fullContent += content
          
          // 更新 AI 消息的内容
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          )
        }
      }

      // 完成后更新状态
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      )

    } catch (error) {
      console.error('API 调用错误:', error)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, status: 'error' }
            : msg
        )
      )
    }
  }

  const handleFileSelect = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('文件上传失败')
      }
      
      const data = await response.json()
      
      // 发送包含文件信息的消息给 AI
      handleSendMessage(`我上传了一个文件：${file.name}\n文件地址：${data.url}\n请帮我分析这个文件的内容。`)
      
    } catch (error) {
      console.error('文件上传错误:', error)
      // 处理错误
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <ChatHeader />
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 pt-20 pb-4 flex items-center">
        <div className="bg-gray-900 rounded-xl border border-green-500/20 shadow-lg w-full h-[70vh] min-h-[500px] max-h-[800px] flex flex-col overflow-hidden">
          <div className="bg-black/40 p-3 border-b border-green-500/20">
            <h2 className="text-green-400 font-medium text-sm">Chat with AI</h2>
          </div>
          <MessageList messages={messages} />
          <ChatInput onSendMessage={handleSendMessage} onFileSelect={handleFileSelect} />
        </div>
      </div>
    </div>
  )
} 