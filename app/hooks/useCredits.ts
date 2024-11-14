import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 加载用户积分
  const loadCredits = useCallback(async () => {
    if (!auth.currentUser) return;
    
    try {
      const creditDoc = doc(db, 'userCredits', auth.currentUser.uid);
      const creditSnap = await getDoc(creditDoc);
      
      if (!creditSnap.exists()) {
        // 新用户奖励策略
        const initialCredits = 100;
        const welcomeBonus = 5;
        const totalCredits = initialCredits + welcomeBonus;
        
        await setDoc(creditDoc, {
          userId: auth.currentUser.uid,
          credits: totalCredits,
          lastUpdated: new Date(),
          isNewUser: true
        });
        setCredits(totalCredits);
      } else {
        setCredits(creditSnap.data().credits);
      }
    } catch (error) {
      console.error('加载积分失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 实时监听积分变化
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, 'userCredits', auth.currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          setCredits(doc.data().credits);
        }
      },
      (error) => {
        console.error('监听积分变化失败:', error);
      }
    );

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

  // 监听用户登录状态
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadCredits();
      } else {
        setCredits(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [loadCredits]);

  return { credits, loading, useCredit, addCredits };
} 