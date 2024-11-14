import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/firebase'
import { doc, updateDoc, increment } from 'firebase/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()
    
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status === 'paid') {
      const { userId, credits } = session.metadata!
      
      // 更新用户积分
      const userCreditsRef = doc(db, 'userCredits', userId)
      await updateDoc(userCreditsRef, {
        credits: increment(Number(credits)),
        lastUpdated: new Date()
      })

      return NextResponse.json({ 
        success: true, 
        credits: Number(credits)
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: '支付未完成' 
    })
  } catch (error) {
    console.error('验证支付失败:', error)
    return NextResponse.json(
      { error: '验证支付失败' },
      { status: 500 }
    )
  }
} 