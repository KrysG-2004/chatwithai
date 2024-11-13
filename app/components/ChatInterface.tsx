'use client'

import { useState, useEffect } from 'react'
import ChatHeader from './ChatHeader'
import ChatInput from './ChatInput'
import MessageList from './MessageList'
import { Message } from '../types/chat'
import { sendChatMessage } from '../utils/api-client'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import ChatHistory from './ChatHistory'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, doc } from 'firebase/firestore'

export default function ChatInterface() {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 如果用户登录，重定向到首页
  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // 处理页面关闭/刷新前的保存提示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = '您有未保存的聊天记录，确定要离开吗？'
        e.preventDefault()
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // 加载最近的聊天记录
  useEffect(() => {
    if (user) {
      loadRecentChat()
    }
  }, [user])

  const loadRecentChat = async () => {
    try {
      const sessionsRef = collection(db, 'chatSessions')
      const q = query(
        sessionsRef,
        where('userId', '==', user?.uid),
        orderBy('timestamp', 'desc'),
        limit(1)
      )
      
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const sessionDoc = querySnapshot.docs[0]
        setCurrentSessionId(sessionDoc.id)
        
        // 加载该会话的消息
        const messagesRef = collection(db, 'chatSessions', sessionDoc.id, 'messages')
        const messagesQuery = query(messagesRef, orderBy('timestamp'))
        const messagesSnap = await getDocs(messagesQuery)
        
        const loadedMessages = messagesSnap.docs.map(doc => ({
          id: doc.id,
          content: doc.data().content,
          role: doc.data().role,
          createdAt: doc.data().timestamp.toDate().toISOString(),
          status: 'sent' as const
        }))
        
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error('加载最近聊天记录失败:', error)
    }
  }

  const saveMessageToFirestore = async (message: Message) => {
    if (!user) return null;

    try {
      // 如果是新对话，先创建会话
      if (!currentSessionId) {
        const sessionRef = await addDoc(collection(db, 'chatSessions'), {
          userId: user.uid,
          title: message.content.slice(0, 50) + '...',
          timestamp: serverTimestamp(),
          summary: null, // 等待AI生成摘要
          lastUpdated: serverTimestamp() // 添加最后更新时间
        });
        setCurrentSessionId(sessionRef.id);
        
        // 保存第一条消息
        await addDoc(collection(db, 'chatSessions', sessionRef.id, 'messages'), {
          content: message.content,
          role: message.role,
          timestamp: serverTimestamp(),
          status: message.status
        });
        
        return sessionRef.id;
      }

      // 保存消息到现有会话
      await addDoc(collection(db, 'chatSessions', currentSessionId, 'messages'), {
        content: message.content,
        role: message.role,
        timestamp: serverTimestamp(),
        status: message.status
      });

      // 更新会话的最后更新时间
      await updateDoc(doc(db, 'chatSessions', currentSessionId), {
        lastUpdated: serverTimestamp()
      });

      return currentSessionId;
    } catch (error) {
      console.error('保存消息失败:', error);
      setError('保存失败，请重试');
      return null;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return
    setHasUnsavedChanges(true)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      createdAt: new Date().toISOString(),
      status: 'sent'
    }

    setMessages(prev => [...prev, userMessage])

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
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))

      const stream = await sendChatMessage(apiMessages)
      let fullContent = ''
      
      for await (const chunk of stream) {
        if (chunk.choices?.[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content
          fullContent += content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          )
        }
      }

      // 更新AI消息状态
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: fullContent, status: 'sent' }
            : msg
        )
      )

      // 修改这里：使用同一个会话ID保存消息
      try {
        // 如果没有当前会话ID，创建新会话
        if (!currentSessionId) {
          const sessionRef = await addDoc(collection(db, 'chatSessions'), {
            userId: user?.uid,
            title: userMessage.content.slice(0, 50) + '...',
            timestamp: serverTimestamp(),
            summary: null,
            lastUpdated: serverTimestamp()
          });
          setCurrentSessionId(sessionRef.id);
          
          // 保存用户消息
          await addDoc(collection(db, 'chatSessions', sessionRef.id, 'messages'), {
            content: userMessage.content,
            role: userMessage.role,
            timestamp: serverTimestamp(),
            status: userMessage.status
          });
          
          // 保存AI回复
          await addDoc(collection(db, 'chatSessions', sessionRef.id, 'messages'), {
            content: fullContent,
            role: 'assistant',
            timestamp: serverTimestamp(),
            status: 'sent'
          });
        } else {
          // 使用现有会话ID保存消息
          await addDoc(collection(db, 'chatSessions', currentSessionId, 'messages'), {
            content: userMessage.content,
            role: userMessage.role,
            timestamp: serverTimestamp(),
            status: userMessage.status
          });
          
          await addDoc(collection(db, 'chatSessions', currentSessionId, 'messages'), {
            content: fullContent,
            role: 'assistant',
            timestamp: serverTimestamp(),
            status: 'sent'
          });

          // 更新会话的最后更新时间
          await updateDoc(doc(db, 'chatSessions', currentSessionId), {
            lastUpdated: serverTimestamp()
          });
        }
        
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('保存消息失败:', error);
        setHasUnsavedChanges(true);
      }

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

  const handleSelectChat = (historicalMessages: Message[]) => {
    setMessages(historicalMessages)
    setHasUnsavedChanges(false)
  }

  // 手动保存当前聊天记录
  const handleSaveChat = async () => {
    if (!currentSessionId || !user) {
      console.error('无法保存：没有当前会话ID或用户未登录');
      return;
    }

    try {
      setLoading(true);
      
      // 先删除现有消息
      const messagesRef = collection(db, 'chatSessions', currentSessionId, 'messages');
      const existingMessages = await getDocs(messagesRef);
      const deletePromises = existingMessages.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 重新保存所有消息
      const savePromises = messages.map(message => 
        addDoc(collection(db, 'chatSessions', currentSessionId, 'messages'), {
          content: message.content,
          role: message.role,
          timestamp: serverTimestamp(),
          status: message.status
        })
      );
      await Promise.all(savePromises);

      // 更新会话的最后更新时间
      await updateDoc(doc(db, 'chatSessions', currentSessionId), {
        lastUpdated: serverTimestamp()
      });

      setHasUnsavedChanges(false);
      // 可以添加一个成功提示
      const successMessage: Message = {
        id: crypto.randomUUID(),
        content: '聊记录已保存',
        role: 'system',
        createdAt: new Date().toISOString(),
        status: 'sent'
      };
      setMessages(prev => [...prev, successMessage]);
      
    } catch (error) {
      console.error('保存聊天记录失败:', error);
      // 添加错误提示消息
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: '保存失败，请重试',
        role: 'system',
        createdAt: new Date().toISOString(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      // 添加上传状态消息
      const uploadingMessage: Message = {
        id: crypto.randomUUID(),
        content: `正在上传文件: ${file.name}...`,
        role: 'system',
        createdAt: new Date().toISOString(),
        status: 'sending'
      }
      setMessages(prev => [...prev, uploadingMessage])

      // 检查文件类型和大小
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('文件大小不能超过10MB')
      }

      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('只支持PDF、TXT和Word文档格式')
      }

      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('文件上传失败')
      }

      const data = await response.json()
      
      // 更新上传成功消息
      const fileMessage: Message = {
        id: crypto.randomUUID(),
        content: `已上传文件: ${file.name}\n文件路径: ${data.filePath}`,
        role: 'user',
        createdAt: new Date().toISOString(),
        status: 'sent'
      }

      // 除上传中消息，添加成功消息
      setMessages(prev => prev.filter(msg => msg.id !== uploadingMessage.id)
        .concat(fileMessage))
      await saveMessageToFirestore(fileMessage)

      // 添加 AI 分析消息
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: '',
        role: 'assistant',
        createdAt: new Date().toISOString(),
        status: 'sending'
      }
      
      setMessages(prev => [...prev, aiMessage])

      // 发送文件内容给 AI 分析
      const apiMessages = [
        {
          role: 'user' as const,
          content: `我上传了一个文件：${file.name}，请帮我分析文件内容。\n文件路径：${data.filePath}`
        }
      ]

      const stream = await sendChatMessage(apiMessages)
      let fullContent = ''
      
      for await (const chunk of stream) {
        if (chunk.choices?.[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content
          fullContent += content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          )
        }
      }

      // 更新 AI 消息状态
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: fullContent, status: 'sent' }
            : msg
        )
      )

      await saveMessageToFirestore({...aiMessage, content: fullContent})

    } catch (error) {
      // 显示错误消息
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: `文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`,
        role: 'system',
        createdAt: new Date().toISOString(),
        status: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // 添加清空当前消息的处理函数
  const handleClearHistory = () => {
    setMessages([])
    setCurrentSessionId(null)
    setHasUnsavedChanges(false)
  }

  // 添加新建聊天的处理函数
  const handleNewChat = () => {
    setMessages([])
    setCurrentSessionId(null)
    setHasUnsavedChanges(false)
    
    // 可以添加一个欢迎消息
    const welcomeMessage: Message = {
      id: crypto.randomUUID(),
      content: '你好！我是 AI 助手，有什么我可以帮你的吗？',
      role: 'assistant',
      createdAt: new Date().toISOString(),
      status: 'sent'
    }
    setMessages([welcomeMessage])
  }

  // 添加会话变更处理函数
  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 to-black">
      <ChatHeader />
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 pt-20 pb-4 flex gap-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="fixed left-4 top-24 z-10 p-2.5 bg-black/60 rounded-xl border border-indigo-500/20 
          text-indigo-300 hover:bg-indigo-500/10 transition-all duration-300 backdrop-blur-lg
          shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {showHistory ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        <div 
          className={`
            fixed left-0 top-0 h-full w-64
            transform transition-all duration-300 ease-out z-20
            ${showHistory ? 'translate-x-0' : '-translate-x-full'}
            pt-20 bg-black/80 backdrop-blur-xl
            border-r border-indigo-500/10
          `}
        >
          <ChatHistory 
            onSelectChat={handleSelectChat} 
            onClearHistory={handleClearHistory}
            onNewChat={handleNewChat}
            currentSessionId={currentSessionId}
            onSessionChange={handleSessionChange}
          />
        </div>
        
        {showHistory && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 transition-opacity duration-300"
            onClick={() => setShowHistory(false)}
          />
        )}
        
        <div className={`
          flex-1 bg-black/40 rounded-2xl border border-indigo-500/20 
          shadow-lg shadow-indigo-500/5
          h-[75vh] min-h-[500px] max-h-[800px] flex flex-col overflow-hidden
          transition-all duration-300 ease-out backdrop-blur-md
          ${showHistory ? 'ml-64' : 'ml-0'}
        `}>
          <div className="bg-black/40 p-4 border-b border-indigo-500/20 flex justify-between items-center">
            <h2 className="text-indigo-300 font-medium text-sm">Chat with AI</h2>
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveChat}
                disabled={loading}
                className={`px-3 py-1.5 text-xs ${
                  loading 
                    ? 'bg-purple-500/10 text-purple-300/50 cursor-not-allowed' 
                    : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                } rounded-lg transition-colors border border-purple-500/30`}
              >
                {loading ? '保存中...' : '保存聊天记录'}
              </button>
            )}
          </div>
          <MessageList messages={messages} />
          <ChatInput onSendMessage={handleSendMessage} onFileSelect={handleFileSelect} />
        </div>
      </div>
    </div>
  )
} 