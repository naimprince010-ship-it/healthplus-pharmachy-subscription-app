import OpenAI from 'openai'
import { getOpenAIClient } from './openaiClient'
import { prisma } from '@/lib/prisma'

type ChatCompletionMessageParam = OpenAI.Chat.ChatCompletionMessageParam
type ChatCompletionTool = OpenAI.Chat.ChatCompletionTool

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'searchProducts',
      description: 'Search the Halalzi database for real products by name, category, or keyword. Use this tool if you need a specific product that is not in the provided Quick Reference list. DO NOT invent product IDs.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query (e.g. "niacinamide", "cerave face wash", "basmati rice", "sunscreen")',
          },
        },
        required: ['query'],
      },
    },
  },
]

export async function runAgenticChat(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const openai = getOpenAIClient()
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  let iterations = 0
  const maxIterations = 10

  while (iterations < maxIterations) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      tools,
      tool_choice: 'auto',
    })

    const message = response.choices[0]?.message
    if (!message) return null

    // Cast message to ChatCompletionMessageParam to satisfy TypeScript, as API response message 
    // has slightly different properties than the input param types
    messages.push(message as ChatCompletionMessageParam)

    if (message.tool_calls && message.tool_calls.length > 0) {
      // Process tool calls
      for (const tc of message.tool_calls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toolCall = tc as any
        if (toolCall.function?.name === 'searchProducts') {
          try {
            const { query } = JSON.parse(toolCall.function.arguments)
            
            const products = await prisma.product.findMany({
              where: {
                isActive: true,
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { category: { name: { contains: query, mode: 'insensitive' } } }
                ],
              },
              take: 12,
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                category: { select: { name: true } },
              },
            })

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(
                products.length > 0
                  ? products.map(p => ({
                      id: p.id,
                      name: p.name,
                      price: `৳${p.sellingPrice}`,
                      category: p.category?.name,
                    }))
                  : { message: 'No products found for this query. Try a broader search or a different term.' }
              ),
            })
          } catch (err) {
            console.error('Tool call error:', err)
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: 'Tool execution failed' }),
            })
          }
        }
      }
    } else {
      // Finished generating content
      return message.content
    }

    iterations++
  }

  console.warn('[Agent] Reached max iterations without finishing')
  // Return the last message content if it was text
  const lastMsg = messages[messages.length - 1]
  if (lastMsg.role === 'assistant' && lastMsg.content) {
    return lastMsg.content as string
  }
  return null
}
