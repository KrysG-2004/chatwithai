'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, doc, onSnapshot, increment } from 'firebase/firestore'
import { useCredits } from '../hooks/useCredits'

interface SetMessagesAction {
  (updater: (prev: Message[]) => Message[]): void;
}

const useHandleSendMessage = (
  user: any, 
  currentSessionId: string | null, 
  messages: Message[], 
  setMessages: SetMessagesAction,
  setCurrentSessionId: (id: string | null) => void,
  setIsGenerating: (value: boolean) => void,
  abortControllerRef: { current: AbortController | null },
  checkCredit: () => Promise<boolean>
) => {
  return async (content: string) => {
    if (!user) return;
    
    // 检查积分
    const canProceed = await checkCredit();
    if (!canProceed) {
      // 如果积分不足，添加一条系统消息提示用户
      const systemMessage: Message = {
        id: crypto.randomUUID(),
        content: '您的积分不足，请前往充值页面购买积分。',
        role: 'system',
        createdAt: new Date().toISOString(),
        status: 'sent'
      };
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    if (!content.trim()) return;

    try {
      // 如果没有当前会话，创建一个新的
      let sessionId = currentSessionId;
      if (!sessionId) {
        const sessionRef = await addDoc(collection(db, 'chatSessions'), {
          userId: user.uid,
          title: content.slice(0, 50) + '...',
          timestamp: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
        sessionId = sessionRef.id;
        setCurrentSessionId(sessionId);
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: 'user',
        createdAt: new Date().toISOString(),
        status: 'sent'
      };

      // 保存用户消息到当前会话
      await addDoc(collection(db, 'chatSessions', sessionId, 'messages'), {
        content: userMessage.content,
        role: userMessage.role,
        timestamp: serverTimestamp(),
        status: userMessage.status
      });

      // 更新会话的最后更新时间
      await updateDoc(doc(db, 'chatSessions', sessionId), {
        lastUpdated: serverTimestamp()
      });

      setMessages((prev: Message[]) => [...prev, userMessage]);

      // AI 回复
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: '',
        role: 'assistant',
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      
      setMessages((prev: Message[]) => [...prev, aiMessage]);
      setIsGenerating(true);

      try {
        const apiMessages = messages.concat(userMessage).map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        }));

        abortControllerRef.current = new AbortController();
        const stream = await sendChatMessage(apiMessages, abortControllerRef.current.signal);
        let fullContent = '';
        
        for await (const chunk of stream) {
          if (chunk.choices?.[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            fullContent += content;
            setMessages((prev: Message[]) => 
              prev.map((msg: Message) => 
                msg.id === aiMessage.id 
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
          }
        }

        // 保存完整的 AI 回复到数据库
        await addDoc(collection(db, 'chatSessions', sessionId, 'messages'), {
          content: fullContent,
          role: 'assistant',
          timestamp: serverTimestamp(),
          status: 'sent'
        });

        // 更新会话的最后更新时间
        await updateDoc(doc(db, 'chatSessions', sessionId), {
          lastUpdated: serverTimestamp()
        });

        setMessages((prev: Message[]) => 
          prev.map((msg: Message) => 
            msg.id === aiMessage.id 
              ? { ...msg, content: fullContent, status: 'sent' }
              : msg
          )
        );

      } catch (error) {
        console.error('AI 回复失败:', error);
        setMessages((prev: Message[]) => 
          prev.map((msg: Message) => 
            msg.id === aiMessage.id 
              ? { ...msg, status: 'error' }
              : msg
          )
        );
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }

    } catch (error) {
      console.error('保存消息失败:', error);
    }
  };
};

export default function ChatInterface() {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { credits, useCredit } = useCredits()
  const [isGenerating, setIsGenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null) as { current: AbortController | null }
  const [creditCheckResult, setCreditCheckResult] = useState<{
    canProceed: boolean;
    canAnalyze: boolean;
  }>({ canProceed: false, canAnalyze: false });

  const handleNewChat = useCallback(async () => {
    if (!user) return;

    try {
      // 创建新会话
      const sessionRef = await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        title: '新对话',
        timestamp: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        messageCount: 1  // 添加消息计数
      });

      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        content: '你好！我是 AI 助手，有什么我可以帮你的吗？',
        role: 'assistant',
        createdAt: new Date().toISOString(),
        status: 'sent'
      };

      // 保存欢迎消息
      await addDoc(collection(db, 'chatSessions', sessionRef.id, 'messages'), {
        content: welcomeMessage.content,
        role: welcomeMessage.role,
        timestamp: serverTimestamp(),
        status: welcomeMessage.status
      });

      setCurrentSessionId(sessionRef.id);
      setMessages([welcomeMessage]);
      setShowHistory(false);
    } catch (error) {
      console.error('创建新聊天失败:', error);
    }
  }, [user]);

  const loadRecentChat = useCallback(async () => {
    if (!user) return;

    try {
      const sessionsRef = collection(db, 'chatSessions');
      const q = query(
        sessionsRef,
        where('userId', '==', user.uid),
        orderBy('lastUpdated', 'desc'),
        orderBy('__name__', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        handleNewChat();
      } else {
        const sessionDoc = snapshot.docs[0];
        setCurrentSessionId(sessionDoc.id);
        
        const messagesRef = collection(db, 'chatSessions', sessionDoc.id, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
        const messagesSnap = await getDocs(messagesQuery);
        
        const messages = messagesSnap.docs.map(doc => ({
          id: doc.id,
          content: doc.data().content || '',
          role: doc.data().role || 'user',
          createdAt: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
          status: 'sent' as const
        }));
        
        setMessages(messages);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('加载最近聊天失败:', error);
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [user, handleNewChat]);

  useEffect(() => {
    if (!user) {
      router.push('/')
    } else {
      loadRecentChat()
    }
  }, [user, router, loadRecentChat])

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

  // 定义检查积分的函数
  const checkCreditsForFile = useCallback(async () => {
    try {
      // 检查积分（需要2个积分：1个用于文件上传，1个用于AI分析）
      const checkCredit = async () => {
        try {
          // 在这里扣减积分
          const creditDoc = doc(db, 'userCredits', user?.uid || '');
          await updateDoc(creditDoc, {
            credits: increment(-1),
            lastUpdated: new Date()
          });
          return true;
        } catch (error) {
          console.error('使用积分失败:', error);
          return false;
        }
      };

      const [result1, result2] = await Promise.all([
        checkCredit(),
        checkCredit()
      ]);

      return result1 && result2;
    } catch (error) {
      console.error('积分检查失败:', error);
      return false;
    }
  }, [user]);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    if (!user) return;
    
    // 检查积分
    const hasEnoughCredits = await checkCreditsForFile();
    if (!hasEnoughCredits) {
      const systemMessage: Message = {
        id: crypto.randomUUID(),
        content: '上传和分析文件需要2个积分。您的积分不足，请前往充值页面购买积分。',
        role: 'system',
        createdAt: new Date().toISOString(),
        status: 'sent'
      };
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    const uploadingMessageId = crypto.randomUUID();
    const uploadingMessage: Message = {
      id: uploadingMessageId,
      content: `正在上传文件: ${file.name}...`,
      role: 'system',
      createdAt: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, uploadingMessage]);

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': user.uid
        }
      })

      if (!response.ok) {
        throw new Error('文件上传失败')
      }

      const data = await response.json()
      
      if (!data.fileContent || data.fileContent === '无法提取文件内容') {
        throw new Error('无法提取文件内容')
      }

      // 更新消息列表
      setMessages(prev => prev.filter(msg => msg.id !== uploadingMessageId))

      // 添加用户消息（只显示文件名）
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: `我上传了文件：${file.name}`,
        role: 'user',
        createdAt: new Date().toISOString(),
        status: 'sent'
      }

      // 自动发送给 AI 分析（包含完整内容）
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: '',
        role: 'assistant',
        createdAt: new Date().toISOString(),
        status: 'sending'
      }
      
      setMessages(prev => [...prev, userMessage, aiMessage])

      try {
        const apiMessages = [
          ...messages,
          {
            role: 'user' as const,
            content: `我上传了文件：${file.name}\n\n文件内容：\n${data.fileContent}`
          }
        ]

        // 创建新的 AbortController
        abortControllerRef.current = new AbortController();
        setIsGenerating(true);

        try {
          const stream = await sendChatMessage(apiMessages, abortControllerRef.current.signal)
          let fullContent = ''
          let wasAborted = false
          
          try {
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
          } catch (error) {
            // 检查是否是用户手动停止
            if (error instanceof Error && error.name === 'AbortError') {
              wasAborted = true
              // 添加停止生成的提示
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === aiMessage.id 
                    ? { 
                        ...msg, 
                        content: fullContent + '\n\n[已停止生成]',
                        status: 'sent'
                      }
                    : msg
                )
              )
              return // 不抛出错误，直接返回
            }
            throw error // 其他错误继续抛出
          }

          // 更新AI消息状态
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: fullContent, status: 'sent' }
                : msg
            )
          )

        } catch (error) {
          console.error('AI 分析失败:', error)
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: '分析文件内容时出错', status: 'error' }
                : msg
            )
          )
        } finally {
          setIsGenerating(false);
          abortControllerRef.current = null;
        }

      } catch (error) {
        console.error('文件处理失败:', error)
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          content: `文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
          role: 'system',
          createdAt: new Date().toISOString(),
          status: 'error'
        }
        setMessages(prev => prev.filter(msg => msg.id !== uploadingMessageId).concat(errorMessage))
      }

    } catch (error) {
      console.error('文件处理失败:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: `文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        role: 'system',
        createdAt: new Date().toISOString(),
        status: 'error'
      }
      setMessages(prev => prev.filter(msg => msg.id !== uploadingMessageId).concat(errorMessage))
    }
  }, [user, checkCreditsForFile, setMessages, messages]);

  // 在组件级别监听积分变化
  useEffect(() => {
    if (creditCheckResult.canProceed && creditCheckResult.canAnalyze) {
      // 可以在这里处理积分充足的情况
    }
  }, [creditCheckResult]);

  // 添加清空当前消息的处理函数
  const handleClearHistory = () => {
    setMessages([])
    setCurrentSessionId(null)
    setHasUnsavedChanges(false)
  }

  // 添加会话变更处理函数
  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  // 添加停止生成的函数
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsGenerating(false)
    }
  }

  // 添加处理选择聊天的函数
  const handleSelectChat = useCallback(async (sessionId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // 获取选中会话的消息
      const messagesRef = collection(db, 'chatSessions', sessionId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
      const messagesSnap = await getDocs(messagesQuery);
      
      const messages = messagesSnap.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content || '',
        role: doc.data().role || 'user',
        createdAt: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
        status: 'sent' as const
      }));

      // 更新状态
      setCurrentSessionId(sessionId);
      setMessages(messages);
      setHasUnsavedChanges(false);
      setShowHistory(false); // 在移动端选择后自动关闭侧边栏
      
    } catch (error) {
      console.error('加载聊天记录失败:', error);
      setError('加载聊天记录失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 添加保存聊天的函数
  const handleSaveChat = useCallback(async () => {
    if (!user || !currentSessionId) return;

    try {
      setLoading(true);
      
      // 保存所有消息到当前会话
      const messagesRef = collection(db, 'chatSessions', currentSessionId, 'messages');
      
      // 清除现有消息
      const existingMessages = await getDocs(messagesRef);
      const deletePromises = existingMessages.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // 添加新消息
      const savePromises = messages.map(message => 
        addDoc(messagesRef, {
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
      
    } catch (error) {
      console.error('保存聊天记录失败:', error);
      setError('保存聊天记录失败');
    } finally {
      setLoading(false);
    }
  }, [user, currentSessionId, messages]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user) return;

    // 检查积分
    const canProceed = await useCredit();
    if (!canProceed) {
      const systemMessage: Message = {
        id: crypto.randomUUID(),
        content: '您的积分不足，请前往充值页面购买积分。',
        role: 'system',
        createdAt: new Date().toISOString(),
        status: 'sent'
      };
      setMessages(prev => [...prev, systemMessage]);
      return;
    }

    // 确保有当前会话ID
    let sessionId = currentSessionId;
    if (!sessionId) {
      const sessionRef = await addDoc(collection(db, 'chatSessions'), {
        userId: user.uid,
        title: '新对话',
        timestamp: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        messageCount: 0  // 初始化消息计数
      });
      sessionId = sessionRef.id;
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      createdAt: new Date().toISOString(),
      status: 'sent'
    }

    const aiMessage: Message = {
      id: crypto.randomUUID(),
      content: '',
      role: 'assistant',
      createdAt: new Date().toISOString(),
      status: 'sending'
    }

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setIsGenerating(true);

    // 保存用户消息到数据库
    await addDoc(collection(db, 'chatSessions', sessionId, 'messages'), {
      content: userMessage.content,
      role: userMessage.role,
      timestamp: serverTimestamp(),
      status: userMessage.status
    });

    // 更新会话的消息计数和最后更新时间
    await updateDoc(doc(db, 'chatSessions', sessionId), {
      lastUpdated: serverTimestamp(),
      messageCount: increment(1)  // 增加消息计数
    });

    try {
      const apiMessages = messages.concat(userMessage).map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      abortControllerRef.current = new AbortController();
      const stream = await sendChatMessage(apiMessages, abortControllerRef.current.signal);
      let fullContent = '';
      let wasAborted = false;

      try {
        for await (const chunk of stream) {
          if (chunk.choices?.[0]?.delta?.content) {
            const content = chunk.choices[0].delta.content;
            fullContent += content;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === aiMessage.id 
                  ? { ...msg, content: fullContent }
                  : msg
              )
            );
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          wasAborted = true;
          fullContent += '\n\n[已停止生成]';
        } else {
          throw error;
        }
      }

      // 保存 AI 回复到数据库
      await addDoc(collection(db, 'chatSessions', sessionId, 'messages'), {
        content: fullContent,
        role: 'assistant',
        timestamp: serverTimestamp(),
        status: 'sent'
      });

      // 更新会话的消息计数和最后更新时间
      await updateDoc(doc(db, 'chatSessions', sessionId), {
        lastUpdated: serverTimestamp(),
        messageCount: increment(1)  // 增加消息计数
      });

      // 更新AI消息状态
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: fullContent, status: 'sent' }
            : msg
        )
      );

    } catch (error) {
      console.error('AI 回复失败:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: '生成回复时出错，请重试', status: 'error' }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [user, messages, currentSessionId, useCredit]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 to-black">
      <ChatHeader />
      <div className="flex-1 w-full max-w-6xl mx-auto px-2 md:px-4 pt-16 md:pt-20 pb-4 flex gap-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="fixed left-2 md:left-4 top-[4.5rem] md:top-24 z-30 p-2 md:p-2.5 
            bg-black/60 rounded-xl border border-indigo-500/20 
            text-indigo-300 hover:bg-indigo-500/10 transition-all duration-300 
            backdrop-blur-lg shadow-lg shadow-indigo-500/10"
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
            fixed left-0 top-0 h-full 
            w-full md:w-64
            transform transition-all duration-300 ease-out z-20
            ${showHistory ? 'translate-x-0' : '-translate-x-full'}
            pt-16 md:pt-20 
            bg-black/95 md:bg-black/80 backdrop-blur-xl
            border-r border-indigo-500/10
          `}
        >
          <ChatHistory 
            onSelectChat={handleSelectChat} 
            onClearHistory={handleClearHistory}
            onNewChat={handleNewChat}
          />
        </div>
        
        {showHistory && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setShowHistory(false)}
          />
        )}
        
        <div className={`
          flex-1 bg-black/40 rounded-xl md:rounded-2xl border border-indigo-500/20 
          shadow-lg shadow-indigo-500/5
          h-[calc(100vh-4rem)] md:h-[75vh] 
          min-h-[400px] md:min-h-[500px] 
          max-h-[calc(100vh-4rem)] md:max-h-[800px] 
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out backdrop-blur-md
          ${showHistory ? 'ml-0 md:ml-64' : 'ml-0'}
        `}>
          <div className="bg-black/40 p-3 md:p-4 border-b border-indigo-500/20 
            flex justify-between items-center">
            <h2 className="text-indigo-300 font-medium text-sm">Chat with AI</h2>
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveChat}
                disabled={loading}
                className="px-2 md:px-3 py-1 md:py-1.5 text-xs bg-purple-500/20 
                  text-purple-300 rounded-lg hover:bg-purple-500/30 
                  transition-colors border border-purple-500/30"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            )}
          </div>
          <MessageList 
            messages={messages} 
            onStopGeneration={handleStopGeneration}
            isGenerating={isGenerating}
          />
          <ChatInput 
            onSendMessage={handleSendMessage} 
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>
    </div>
  )
} 