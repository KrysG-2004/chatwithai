import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import mammoth from 'mammoth'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = request.headers.get('x-user-id')
    
    if (!file || !userId) {
      return NextResponse.json({ error: '无效的请求' }, { status: 400 })
    }

    // 提取文件内容
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    let fileContent = ''

    try {
      // 先提取文件内容
      if (file.type === 'application/pdf') {
        const data = await pdf(buffer)
        fileContent = data.text
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer })
        fileContent = result.value
      } else if (file.type === 'text/plain') {
        fileContent = buffer.toString('utf-8')
      } else {
        throw new Error('不支持的文件类型')
      }

      // 清理和截断文本
      fileContent = fileContent
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 10000)

      try {
        // 尝试上传到 Firebase Storage
        const timestamp = Date.now()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storageRef = ref(storage, `uploads/${userId}/${timestamp}-${safeFileName}`)
        
        await uploadBytes(storageRef, buffer)
        const downloadURL = await getDownloadURL(storageRef)

        return NextResponse.json({
          success: true,
          fileUrl: downloadURL,
          fileContent,
          fileType: file.type,
          fileName: file.name
        })
      } catch (storageError) {
        console.error('Storage error:', storageError)
        // 即使存储失败，也返回提取的内容
        return NextResponse.json({
          success: true,
          fileContent,
          fileType: file.type,
          fileName: file.name,
          storageError: '文件存储失败，但内容已提取'
        })
      }

    } catch (error) {
      console.error('文件处理失败:', error)
      return NextResponse.json({
        error: '文件处理失败',
        details: error instanceof Error ? error.message : '未知错误'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('请求处理失败:', error)
    return NextResponse.json({ 
      error: '请求处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' 