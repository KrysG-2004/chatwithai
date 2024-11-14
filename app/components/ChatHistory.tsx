'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs, updateDoc, doc, limit, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { Message } from '../types/chat'

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
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null)

  // 添加生成摘要的函数
  const generateSummary = async (sessionId: string, messages: Message[]) => {
    if (messages.length === 0) return;
    
    try {
      setGeneratingSummary(sessionId);
      
      // 找到第一条用户消息
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (!firstUserMessage) return;

      // 如果是简单的问候语，直接使用特定标题
      const greetings = ['你好', '您好', 'hello', 'hi', '嗨', '在吗'];
      if (greetings.some(greeting => 
        firstUserMessage.content.toLowerCase().trim() === greeting.toLowerCase()
      )) {
        const summary = '新的对话';
        // 更新会话摘要
        const sessionRef = doc(db, 'chatSessions', sessionId);
        await updateDoc(sessionRef, {
          summary,
          lastUpdated: serverTimestamp()
        });
        return;
      }

      // 找到第一条用户消息后的两条消息
      const messageIndex = messages.indexOf(firstUserMessage);
      const relevantMessages = messages.slice(messageIndex, messageIndex + 3);
      
      // 构建提示词
      const prompt = `请为以下对话生成一个简短的标题（15字以内）。要求：
1. 标题必须严格基于用户的实际问题内容
2. 不要使用"AI助手"、"对话"、"聊天"等词
3. 如果是文件分析，要说明是什么类型的文件分析
4. 如果是编程相关，必须用户实际问了编程问题才能用编程相关标题
5. 如果是简单问候或简短对话，使用"新的对话"作为标题

对话内容：
${relevantMessages.map(m => 
  `${m.role === 'user' ? '用户' : 'AI'}: ${m.content.slice(0, 150)}`
).join('\n')}

注意：标题必须真实反映用户的问题，不要过度推测或泛化。`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) throw new Error('生成摘要失败');

      const reader = response.body?.getReader();
      let summary = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  summary += parsed.choices[0].delta.content;
                }
              } catch (e) {
                console.error('解析响应数据失败:', e);
              }
            }
          }
        }
      }

      // 清理和格式化摘要
      summary = summary
        .replace(/^["']*|["']*$/g, '') // 移除引号
        .replace(/标题[:：]/g, '') // 移除可能的"标题："前缀
        .replace(/[【】\[\]]/g, '') // 移除方括号
        .trim();

      // 如果摘要为空或太长，使用智能提取的默认值
      if (!summary || summary.length > 15) {
        const content = firstUserMessage.content.toLowerCase();
        
        if (content.includes('上传了文件')) {
          // 如果是文件分析，提取文件名和类型
          const match = content.match(/上传了文件：(.+?)$/);
          const fileName = match ? match[1] : '';
          const fileType = fileName.split('.').pop()?.toUpperCase() || '';
          summary = `${fileType}文件分析：${fileName.slice(0, 10)}`;
        } else if (content.length <= 10) {
          // 如果是短消息，直接使用"新的对话"
          summary = '新的对话';
        } else {
          // 分析用户消息的内容类型，但要更严格的匹配
          if (content.includes('javascript') || content.includes('js')) {
            summary = content.includes('问题') ? 'JavaScript问题解答' : content.slice(0, 15);
          } else if (content.includes('react')) {
            summary = content.includes('问题') ? 'React开发问题' : content.slice(0, 15);
          } else if (content.includes('python')) {
            summary = content.includes('问题') ? 'Python编程指导' : content.slice(0, 15);
          } else if (content.includes('sql') || content.includes('数据库')) {
            summary = content.includes('问题') ? '数据库问题解答' : content.slice(0, 15);
          } else if (content.includes('css') || content.includes('样式')) {
            summary = content.includes('问题') ? 'CSS样式问题' : content.slice(0, 15);
          } else {
            // 直接使用用户消息的前15个字符
            summary = content.slice(0, 15) + (content.length > 15 ? '...' : '');
          }
        }
      }

      // 更新会话摘要
      const sessionRef = doc(db, 'chatSessions', sessionId);
      await updateDoc(sessionRef, {
        summary,
        lastUpdated: serverTimestamp()
      });

    } catch (error) {
      console.error('生成摘要失败:', error);
    } finally {
      setGeneratingSummary(null);
    }
  };

  // 修改实时监听逻辑
  useEffect(() => {
    if (!user) {
      setChatSessions([])
      setLoading(false)
      return
    }

    const sessionsRef = collection(db, 'chatSessions')
    const q = query(
      sessionsRef,
      where('userId', '==', user.uid),
      orderBy('lastUpdated', 'desc'),
      orderBy('__name__', 'desc')
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const sessions = await Promise.all(snapshot.docs.map(async doc => {
        const data = doc.data();
        
        // 如果没有摘要，生成一个
        if (!data.summary) {
          const messagesRef = collection(db, 'chatSessions', doc.id, 'messages');
          const messagesSnap = await getDocs(query(messagesRef, orderBy('timestamp')));
          const messages = messagesSnap.docs.map(msgDoc => ({
            id: msgDoc.id,
            content: msgDoc.data().content || '',
            role: msgDoc.data().role || 'user',
            createdAt: msgDoc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
            status: 'sent' as const
          }));
          
          if (messages.length > 0) {
            generateSummary(doc.id, messages);
          }
        }

        return {
          id: doc.id,
          title: data.title || '新对话',
          timestamp: data.timestamp?.toDate() || new Date(),
          summary: data.summary
        };
      }));

      setChatSessions(sessions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const loadChatMessages = async (sessionId: string) => {
    try {
      const messagesRef = collection(db, 'chatSessions', sessionId, 'messages')
      const q = query(messagesRef, orderBy('timestamp'))
      
      // 先获取一次所有消息
      const snapshot = await getDocs(q)
      const initialMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content || '',
        role: doc.data().role || 'user',
        createdAt: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
        status: 'sent' as const
      }))
      
      // 立即更新消息列表
      onSelectChat(initialMessages)
      
      // 然后设置实时监听
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          content: doc.data().content || '',
          role: doc.data().role || 'user',
          createdAt: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
          status: 'sent' as const
        }))
        
        // 只有当消息数量或内容发生变化时才更新
        const hasChanges = messages.length !== initialMessages.length ||
          messages.some((msg, i) => msg.content !== initialMessages[i]?.content)
        
        if (hasChanges) {
          onSelectChat(messages)
        }
      }, (error) => {
        console.error('监听消息变化失败:', error)
      })

      // 返回取消订阅函数
      return () => unsubscribe()
    } catch (error) {
      console.error('加载聊天消息失败:', error)
      setError(error instanceof Error ? error.message : '加载聊天消息失败')
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!window.confirm('确定要删除这个会话吗？')) return
    
    try {
      setLoading(true)
      
      // 删除会话中的所有消息
      const messagesRef = collection(db, 'chatSessions', sessionId, 'messages')
      const messagesSnap = await getDocs(messagesRef)
      const deletePromises = messagesSnap.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      // 删除会话本身
      await deleteDoc(doc(db, 'chatSessions', sessionId))
      
      // 如果删除的是当前会话，清空当前消息
      if (currentSessionId === sessionId) {
        onClearHistory?.()
      }
      
      // 从本地状态中移除该会话
      setChatSessions(prev => prev.filter(session => session.id !== sessionId))
      
    } catch (error) {
      console.error('删除会话失败:', error)
      setError('删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAllSessions = async () => {
    if (!window.confirm('确定要删除所有聊天记录吗？此操作不可恢复！')) return
    
    try {
      setLoading(true)
      
      // 获取所有会话
      const sessionsRef = collection(db, 'chatSessions')
      const q = query(sessionsRef, where('userId', '==', user?.uid))
      const snapshot = await getDocs(q)
      
      // 批量删除所有会话及其消息
      for (const doc of snapshot.docs) {
        // 先删除会话中的所有消息
        const messagesRef = collection(db, 'chatSessions', doc.id, 'messages')
        const messagesSnap = await getDocs(messagesRef)
        const deletePromises = messagesSnap.docs.map(msgDoc => deleteDoc(msgDoc.ref))
        await Promise.all(deletePromises)
        
        // 然后删除会话本身
        await deleteDoc(doc.ref)
      }
      
      // 清空当前状态
      setChatSessions([])
      onClearHistory?.()
      
    } catch (error) {
      console.error('删除所有会话失败:', error)
      setError('删除失败，请重试')
    } finally {
      setLoading(false)
    }
  }

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
                  loadChatMessages(session.id)
                  onSessionChange?.(session.id)
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