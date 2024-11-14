import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const API_KEY = process.env.DEEPSEEK_API_KEY

const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
  dangerouslyAllowBrowser: true
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的AI助手，请帮助用户解答问题。'
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    })

    // 创建一个 ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              // 发送数据
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                choices: [{
                  delta: { content: text }
                }]
              })}\n\n`))
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          // 在所有数据处理完成后关闭控制器
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('API 调用错误:', error)
    return NextResponse.json({ 
      error: 'API 调用失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' 