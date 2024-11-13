import { useState, useEffect } from 'react';
import { auth, db } from '../utils/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  getDocs,
  where 
} from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  userId: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载聊天记录
  const loadChatHistory = async () => {
    if (!auth.currentUser) return;
    
    try {
      const q = query(
        collection(db, 'messages'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const loadedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      setMessages(loadedMessages);
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存新消息
  const saveMessage = async (content: string, role: 'user' | 'assistant') => {
    if (!auth.currentUser) return;

    try {
      const messageData = {
        content,
        role,
        userId: auth.currentUser.uid,
        timestamp: new Date()
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      setMessages(prev => [...prev, { id: docRef.id, ...messageData }]);
    } catch (error) {
      console.error('保存消息失败:', error);
    }
  };

  // 监听用户登录状态
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadChatHistory();
      } else {
        setMessages([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    messages,
    loading,
    saveMessage
  };
} 