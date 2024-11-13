import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// 创建邮件传输器，使用更安全的配置
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // 使用 SSL
  auth: {
    user: 'krysyyds@gmail.com',
    pass: 'dqlwieeclcbeihmq'
  },
  tls: {
    // 添加必要的 SSL/TLS 配置
    rejectUnauthorized: true,
    minVersion: "TLSv1.2"
  }
})

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '所有字段都是必填的' },
        { status: 400 }
      )
    }

    // 验证连接
    await transporter.verify()

    // 发送邮件
    await transporter.sendMail({
      from: `"AI Chat Contact" <krysyyds@gmail.com>`,
      to: 'krysyyds@gmail.com',
      subject: `来自 ${name} 的联系表单消息`,
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
      { error: error instanceof Error ? error.message : '发送失败，请稍后重试' },
      { status: 500 }
    )
  }
} 