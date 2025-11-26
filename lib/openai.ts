import OpenAI from 'openai'

let _openai: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return _openai
}

export const defaultModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
