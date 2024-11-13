import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// 创建上传文件存储目录
const uploadDir = path.join(process.cwd(), 'public/uploads')

// 确保上传目录存在
async function ensureUploadDir() {
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }
}

export async function POST(req: Request) {
  try {
    // 确保上传目录存在
    await ensureUploadDir()
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 })
    }

    // 创建唯一的文件名
    const uniqueFilename = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, uniqueFilename)
    
    // 将文件内容转换为 Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // 保存文件
    await writeFile(filePath, buffer)
    
    // 返回可访问的URL
    const fileUrl = `/uploads/${uniqueFilename}`
    
    return NextResponse.json({ 
      success: true, 
      filename: file.name,
      url: fileUrl
    })
  } catch (error) {
    console.error('文件上传错误:', error)
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 })
  }
} 