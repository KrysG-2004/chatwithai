export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function sendChatMessage(messages: ChatMessage[]) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    return {
      [Symbol.asyncIterator]: async function* () {
        if (!reader) return
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (!data || data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    yield parsed
                  }
                } catch (e) {
                  console.error('解析响应数据失败:', e)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      }
    }
  } catch (error) {
    console.error('API 调用错误:', error)
    throw error
  }
} 