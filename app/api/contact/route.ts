import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'krysyyds@gmail.com', // 你的 Gmail 地址
    pass: process.env.GMAIL_APP_PASSWORD // 需要在 Gmail 中生成的应用专用密码
  }
})

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    // 发送邮件
    await transporter.sendMail({
      from: 'krysyyds@gmail.com',
      to: 'krysyyds@gmail.com',
      subject: `来自 ${name} 的联系表单消息`,
      text: `
姓名: ${name}
邮箱: ${email}
消息: ${message}
      `,
      html: `
<h3>新的联系表单消息</h3>
<p><strong>姓名:</strong> ${name}</p>
<p><strong>邮箱:</strong> ${email}</p>
<p><strong>消息:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('发送邮件失败:', error)
    return NextResponse.json({ error: '发送失败' }, { status: 500 })
  }
} 