'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs, updateDoc, doc, limit, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { Message } from '../types/chat'
import { ChatMessage, sendChatMessage } from '../utils/api-client'

interface ChatHistoryProps {
  onSelectChat: (messages: Message[]) => void
  onClearHistory?: () => void
  onNewChat?: () => void
  currentSessionId?: string | null
  onSessionChange?: (sessionId: string) => void
}

export default function ChatHistory({ 
  onSelectChat, 
  onClearHistory, 
  onNewChat,
  currentSessionId,
  onSessionChange 
}: ChatHistoryProps) {
  const [user] = useAuthState(auth)
  const [chatSessions, setChatSessions] = useState<{
    id: string, 
    title: string, 
    timestamp: Date,
    summary?: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [indexBuilding, setIndexBuilding] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null)

  const loadChatSessions = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setIndexBuilding(false)
      
      console.log('开始加载聊天历史, userId:', user.uid)
      
      const sessionsRef = collection(db, 'chatSessions')
      const q = query(
        sessionsRef,
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      )
      
      try {
        const querySnapshot = await getDocs(q)
        console.log('查询到的会话数量:', querySnapshot.size)
        
        const processedSessions = []
        
        for (const doc of querySnapshot.docs) {
          try {
            const data = doc.data()
            console.log('会话数据:', data)
            
            // 如果没有摘要，获取第一条消息作为标题
            if (!data.summary) {
              const messagesRef = collection(db, 'chatSessions', doc.id, 'messages')
              const messagesQuery = query(messagesRef, orderBy('timestamp'), limit(1))
              const messagesSnap = await getDocs(messagesQuery)
              const firstMessage = messagesSnap.docs[0]?.data()
              
              processedSessions.push({
                id: doc.id,
                title: firstMessage?.content?.slice(0, 50) + '...' || '新对话',
                timestamp: data.timestamp?.toDate() || new Date(),
                summary: data.summary
              })
            } else {
              processedSessions.push({
                id: doc.id,
                title: data.title || '新对话',
                timestamp: data.timestamp?.toDate() || new Date(),
                summary: data.summary
              })
            }
          } catch (err) {
            console.error('处理会话数据时出错:', err)
            continue
          }
        }
        
        console.log('处理后的会话数据:', processedSessions)
        setChatSessions(processedSessions)
        
      } catch (error: any) {
        // 检查是否是索引构建错误
        if (error?.message?.includes('requires an index') || 
            error?.message?.includes('index is currently building')) {
          console.log('索引正在构建中...')
          setIndexBuilding(true)
          // 尝试使用未排序的查询作为后备方案
          const fallbackQuery = query(
            sessionsRef,
            where('userId', '==', user.uid)
          )
          const fallbackSnapshot = await getDocs(fallbackQuery)
          const fallbackSessions = fallbackSnapshot.docs
            .map(doc => {
              const data = doc.data()
              return {
                id: doc.id,
                title: data.title || '新对话',
                timestamp: data.timestamp?.toDate() || new Date(),
                summary: data.summary
              }
            })
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          
          setChatSessions(fallbackSessions)
        } else {
          throw error
        }
      }
      
    } catch (error) {
      console.error('加载聊天历史失败:', error)
      setError(error instanceof Error ? error.message : '加载聊天历史失败')
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async (sessionId: string, messages: Message[]) => {
    try {
      setGeneratingSummary(sessionId)
      
      // 优化提示词，让 AI 更好地理解对话内容和生成更准确的摘要
      const prompt = `请分析以下对话内容，并生成一个简短的标题（15字以内）。标题应该：
1. 准确反映对话的主要主题
2. 包含具体的关键词，而不是泛泛而谈
3. 如果是编程相关，请标明具体的技术或问题
4. 如果是文件分析，请标明文件类型和主题

对话内容：
${messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content.slice(0, 100)}`).join('\n')}
${messages.length > 3 ? '\n[对话继续...]' : ''}

请直接返回标题，不要包含任何其他内容。`
      
      const apiMessages = [{
        role: 'user' as const,
        content: prompt
      }]

      const stream = await sendChatMessage(apiMessages)
      let summary = ''
      
      for await (const chunk of stream) {
        if (chunk.choices?.[0]?.delta?.content) {
          summary += chunk.choices[0].delta.content
        }
      }
      
      // 清理和格式化摘要
      summary = summary
        .replace(/^["']*|["']*$/g, '') // 移除引号
        .replace(/标题[:：]/g, '') // 移除可能的"标题："前缀
        .trim()
      
      // 如果摘要为空或太长，使用默认值
      if (!summary || summary.length > 15) {
        summary = messages[0]?.content.slice(0, 15) + '...'
      }
      
      // 更新会话摘要
      const sessionRef = doc(db, 'chatSessions', sessionId)
      await updateDoc(sessionRef, { 
        summary,
        lastUpdated: serverTimestamp() // 添加更新时间
      })
      
      // 更新本地状态
      setChatSessions(prev => prev.map(session => 
        session.id === sessionId ? { ...session, summary } : session
      ))
      
    } catch (error) {
      console.error('生成摘要失败:', error)
      // 设置一个后备的标题
      const fallbackTitle = messages[0]?.content.slice(0, 15) + '...'
      
      try {
        const sessionRef = doc(db, 'chatSessions', sessionId)
        await updateDoc(sessionRef, { 
          summary: fallbackTitle,
          lastUpdated: serverTimestamp()
        })
        
        setChatSessions(prev => prev.map(session => 
          session.id === sessionId ? { ...session, summary: fallbackTitle } : session
        ))
      } catch (err) {
        console.error('设置后备标题失败:', err)
      }
    } finally {
      setGeneratingSummary(null)
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止触发点击事件
    
    if (!window.confirm('确定要删除这个会话吗？')) return
    
    try {
      // 删除所有消息
      const messagesRef = collection(db, 'chatSessions', sessionId, 'messages')
      const messagesSnap = await getDocs(messagesRef)
      for (const doc of messagesSnap.docs) {
        await deleteDoc(doc.ref)
      }
      
      // 删除会话
      await deleteDoc(doc(db, 'chatSessions', sessionId))
      
      // 更新本地状态
      setChatSessions(prev => prev.filter(session => session.id !== sessionId))
      
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  const loadChatMessages = async (sessionId: string) => {
    try {
      const messagesRef = collection(db, 'chatSessions', sessionId, 'messages')
      const q = query(messagesRef, orderBy('timestamp'))
      
      // 使用 onSnapshot 实时监听消息变化
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          content: doc.data().content || '',
          role: doc.data().role || 'user',
          createdAt: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
          status: 'sent' as const
        }))
        
        onSelectChat(messages)
      })

      // 保存取消订阅函数
      return () => unsubscribe()
    } catch (error) {
      console.error('加载聊天消息失败:', error)
      setError(error instanceof Error ? error.message : '加载聊天消息失败')
    }
  }

  // 修改一键删除所有历史记录功能
  const handleDeleteAllSessions = async () => {
    if (!window.confirm('确定要删除所有聊天记录吗？此操作不可恢复！')) return
    
    try {
      setLoading(true)
      
      for (const session of chatSessions) {
        // 删除所有消息
        const messagesRef = collection(db, 'chatSessions', session.id, 'messages')
        const messagesSnap = await getDocs(messagesRef)
        for (const doc of messagesSnap.docs) {
          await deleteDoc(doc.ref)
        }
        
        // 删除会话
        await deleteDoc(doc(db, 'chatSessions', session.id))
      }
      
      // 清空本地状态
      setChatSessions([])
      
      // 调用回调函数清空当前消息
      onClearHistory?.()
      
    } catch (error) {
      console.error('删除所有会话失败:', error)
      setError('删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 使用 useEffect 监听 user 变化
  useEffect(() => {
    console.log('用户状态变化:', user?.uid) // 调试日志
    if (user) {
      loadChatSessions()
    } else {
      setChatSessions([])
      setLoading(false)
    }
  }, [user])

  // 添加实时更新功能
  useEffect(() => {
    if (!user) return;

    const sessionsRef = collection(db, 'chatSessions');
    const q = query(
      sessionsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || '新对话',
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        summary: doc.data().summary
      }));
      setChatSessions(updatedSessions);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="bg-black/20 m-4 p-4 rounded-xl border border-indigo-500/20 backdrop-blur-sm
      shadow-lg shadow-indigo-500/5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-indigo-300 font-medium text-sm">聊天记录</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onNewChat}
            className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 
              text-indigo-300 px-2 py-1 rounded-lg transition-colors
              border border-indigo-500/30"
          >
            新建聊天
          </button>
          {chatSessions.length > 0 && (
            <button
              onClick={handleDeleteAllSessions}
              className="text-xs text-red-400/80 hover:text-red-400 transition-colors"
            >
              清空历史
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="text-indigo-300/50 text-xs">加载中...</div>
      ) : error ? (
        <div className="text-red-400/80 text-xs">
          <div>加载失败: {error}</div>
          <button 
            onClick={loadChatSessions}
            className="mt-2 text-indigo-300 hover:text-indigo-200 underline"
          >
            重试
          </button>
        </div>
      ) : chatSessions.length === 0 ? (
        <div className="text-indigo-300/50 text-xs">暂无聊天记录</div>
      ) : (
        <div className="space-y-2 max-h-[calc(75vh-8rem)] overflow-y-auto">
          {chatSessions.map(session => (
            <div
              key={session.id}
              className={`group relative ${
                currentSessionId === session.id ? 'bg-indigo-500/10' : ''
              }`}
            >
              <button
                onClick={() => {
                  loadChatMessages(session.id);
                  onSessionChange?.(session.id);
                }}
                className="w-full text-left p-2.5 hover:bg-indigo-500/10 rounded-lg 
                  transition-all duration-200 text-indigo-300 border border-transparent
                  hover:border-indigo-500/20"
              >
                <div className="text-xs font-medium truncate">
                  {generatingSummary === session.id ? (
                    <span className="text-indigo-300/50">生成摘要中...</span>
                  ) : (
                    session.summary || session.title
                  )}
                </div>
                <div className="text-[10px] text-indigo-400/40 mt-1">
                  {new Date(session.timestamp).toLocaleString()}
                </div>
              </button>
              
              <button
                onClick={(e) => handleDeleteSession(session.id, e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 
                  group-hover:opacity-100 transition-all duration-200 p-1.5 
                  hover:bg-red-500/10 rounded-lg"
              >
                <svg className="w-3 h-3 text-red-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 