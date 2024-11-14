import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 加载用户积分
  const loadCredits = async () => {
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
        // 如果已有记录，使用现有积分
        setCredits(creditSnap.data().credits);
      }
    } catch (error) {
      console.error('加载积分失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 使用积分
  const useCredit = async () => {
    if (!auth.currentUser || credits === null) return false;
    
    if (credits <= 0) {
      router.push('/pricing');
      return false;
    }

    try {
      const newCredits = credits - 1;
      await updateDoc(doc(db, 'userCredits', auth.currentUser.uid), {
        credits: newCredits,
        lastUpdated: new Date()
      });
      setCredits(newCredits);
      return true;
    } catch (error) {
      console.error('使用积分失败:', error);
      return false;
    }
  };

  // 添加积分（付费后调用）
  const addCredits = async (amount: number) => {
    if (!auth.currentUser || credits === null) return;
    
    try {
      const newCredits = credits + amount;
      await updateDoc(doc(db, 'userCredits', auth.currentUser.uid), {
        credits: newCredits,
        lastUpdated: new Date()
      });
      setCredits(newCredits);
    } catch (error) {
      console.error('添加积分失败:', error);
    }
  };

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
  }, []);

  return { credits, loading, useCredit, addCredits };
} 