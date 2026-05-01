import OpenAI from 'openai'

// Shared OpenAI client — সব blog writers এখান থেকে import করবে
// Bug #12 fix: code duplication দূর করা হয়েছে
let _client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return _client
}
