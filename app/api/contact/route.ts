import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'krysyyds@gmail.com',
    pass: 'dqlwieeclcbeihmq' // Gmail 应用专用密码
  }
})

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    // 添加一些基本验证
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '所有字段都是必填的' },
        { status: 400 }
      )
    }

    // 发送邮件
    await transporter.sendMail({
      from: `"AI Chat Contact" <krysyyds@gmail.com>`,
      to: 'krysyyds@gmail.com',
      subject: `chatwithaiwebste-来自 ${name} 的反馈`,
      text: `
姓名: ${name}
邮箱: ${email}
消息: ${message}
      `,
      html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #22c55e;">新的联系表单消息</h2>
  <p><strong>姓名:</strong> ${name}</p>
  <p><strong>邮箱:</strong> ${email}</p>
  <p><strong>消息:</strong></p>
  <p style="white-space: pre-line;">${message}</p>
</div>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('发送邮件失败:', error)
    return NextResponse.json(
      { error: '发送失败，请稍后重试' },
      { status: 500 }
    )
  }
} 