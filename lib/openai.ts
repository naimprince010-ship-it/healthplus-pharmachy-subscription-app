import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const defaultModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
