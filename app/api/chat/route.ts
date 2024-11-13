import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const API_KEY = 'sk-e13f13ba537e48c7b96fbb2e449aa84b'

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    const stream = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    })

    // 创建一个 ReadableStream
    const textStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          // 检查是否有新的内容
          if (chunk.choices[0]?.delta?.content) {
            // 将数据格式化为 SSE 格式
            const text = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(new TextEncoder().encode(text))
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      }
    })

    return new Response(textStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API 调用错误:', error)
    return NextResponse.json({ error: 'API 调用失败' }, { status: 500 })
  }
} 