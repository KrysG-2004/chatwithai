import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成安全的文件名
    const timestamp = Date.now()
    const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const filePath = path.join(process.cwd(), 'public/uploads', safeName)
    
    await writeFile(filePath, buffer)
    
    return NextResponse.json({ 
      success: true,
      filePath: `/uploads/${safeName}`
    })
    
  } catch (error) {
    console.error('文件上传错误:', error)
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    )
  }
} 