import { NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json()
    
    // 生成6位验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 发送短信
    await client.messages.create({
      body: `您的验证码是: ${verificationCode}`,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('发送短信失败:', error)
    return NextResponse.json(
      { error: '发送短信失败' },
      { status: 500 }
    )
  }
} 