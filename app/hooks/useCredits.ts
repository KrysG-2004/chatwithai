import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 加载用户积分
  useEffect(() => {
    if (!auth.currentUser) {
      setCredits(null);
      setLoading(false);
      return;
    }

    const creditDoc = doc(db, 'userCredits', auth.currentUser.uid);
    
    // 实时监听积分变化
    const unsubscribe = onSnapshot(creditDoc, (doc) => {
      if (doc.exists()) {
        setCredits(doc.data().credits);
      } else {
        // 如果文档不存在，创建初始积分
        setDoc(creditDoc, {
          userId: auth.currentUser!.uid,
          credits: 100,
          lastUpdated: new Date(),
          isNewUser: true
        }).catch(console.error);
      }
      setLoading(false);
    }, (error) => {
      console.error('监听积分失败:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 检查并使用积分
  const useCredit = async () => {
    if (!auth.currentUser || credits === null) return false;
    
    if (credits <= 0) {
      // 如果积分不足，提示用户并跳转到充值页面
      const confirmPurchase = window.confirm(
        '您的积分不足，是否前往充值页面？'
      );
      if (confirmPurchase) {
        router.push('/pricing');
      }
      return false;
    }

    try {
      // 扣减积分
      const creditDoc = doc(db, 'userCredits', auth.currentUser.uid);
      await updateDoc(creditDoc, {
        credits: increment(-1),
        lastUpdated: new Date()
      });
      
      // 由于添加了实时监听，这里不需要手动更新本地状态
      return true;
    } catch (error) {
      console.error('使用积分失败:', error);
      return false;
    }
  };

  // 添加积分
  const addCredits = async (amount: number) => {
    if (!auth.currentUser || credits === null) return;
    
    try {
      const creditDoc = doc(db, 'userCredits', auth.currentUser.uid);
      await updateDoc(creditDoc, {
        credits: increment(amount),
        lastUpdated: new Date()
      });
      
      // 由于添加了实时监听，这里不需要手动更新本地状态
    } catch (error) {
      console.error('添加积分失败:', error);
    }
  };

  return { credits, loading, useCredit, addCredits };
} 