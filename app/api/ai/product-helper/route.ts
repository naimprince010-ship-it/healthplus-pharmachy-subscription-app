import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { requireAdmin } from '@/lib/requireAdmin'
import { sanitizeAiProductPayload } from '@/lib/ai/product-helper-seo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  productName: z.string().min(1).max(500),
  brandName: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
  language: z.enum(['en', 'bn']).default('en'),
  /** Pack / size line, e.g. 400 g, 100 ml */
  sizeLabel: z.string().max(120).optional(),
  unit: z.string().max(40).optional(),
  productType: z.enum(['GENERAL', 'MEDICINE']).optional(),
  /** Ground truth the model must respect when present */
  existingDescription: z.string().max(12000).optional(),
  contextKeyFeatures: z.string().max(8000).optional(),
  ingredients: z.string().max(8000).optional(),
  contextSpecSummary: z.string().max(8000).optional(),
})

const responseSchema = z.object({
  description: z.string(),
  keyFeatures: z.array(z.string()),
  specsSummary: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  seoKeywords: z.array(z.string()),
})

function buildPrompts(input: z.infer<typeof requestSchema>): { system: string; user: string } {
  const {
    productName,
    brandName,
    category,
    language,
    sizeLabel,
    unit,
    productType,
    existingDescription,
    contextKeyFeatures,
    ingredients,
    contextSpecSummary,
  } = input

  const languageInstruction =
    language === 'bn'
      ? `LANGUAGE: Primary output in natural **Bangla** (বাংলা), matching how Bangladeshi shoppers search — clear, conversational, not stiff translation. 
Use **English** where standard in BD retail: brand names, SKUs, mg/ml/g, INCI/chemical names, RX wording, and internationally known product terms. 
Do not romanize whole sentences unnecessarily; prefer readable Bangla prose with necessary English loanwords.`
      : `LANGUAGE: Natural **English** suitable for Bangladesh e-commerce (delivery in BD, BDT context where relevant). Still allow Bangla terms in seoKeywords if shoppers use them when searching from Bangladesh.`

  const factualBlock =
    [
      ingredients && `Listed ingredients / উপাদান (must stay factually aligned; do not contradict): ${ingredients}`,
      contextKeyFeatures && `Existing feature notes (reuse and polish; do not invent conflicting claims): ${contextKeyFeatures}`,
      contextSpecSummary && `Specification notes: ${contextSpecSummary}`,
      existingDescription &&
        `Existing description (preserve facts and tone; rewrite for clarity/SEO — do NOT add unsubstantiated health claims beyond this): ${existingDescription}`,
    ]
      .filter(Boolean)
      .join('\n') || 'No extra factual fields supplied — derive only from Product Name / Brand / Category and general product commonsense.'

  const systemPrompt = `You write product copy and metadata for **Halalzi** (Bangladesh pharmacy, cosmetics & grocery ecommerce).

GOALS (Bangladesh / BD search behaviour):
• Help **Bangla-first and Banglish** shoppers: natural keyword coverage (spoken & typed queries), avoid robotic keyword stuffing.
• **SEO title**: include the exact product identity (brand + product type + variant/pack/size when supplied). Aim ~50–58 characters visually; NEVER exceed ~60 graphemes-equivalent characters; no ALL-CAPS shout, no misleading clickbait.
• **SEO description**: 148–160 characters (strict). One clear benefit + factual hook + subtle trust (authentic / fast delivery) without fake guarantees ("100% cure", "FDA approved" unless present in factual inputs — do NOT invent certifications).
• **SEO keywords**: 6–${language === 'bn' ? '12' : '10'} items — mix Bangladesh-relevant queries: Bangla phrases, informal Banglish/latin spellings shoppers type, plus English/category terms where useful. Prefer specific long-tail phrases over generic one-word stuffing. Dedupe synonyms.
• If **Category** is clearly mismatched versus **Product Name** (example: staples product under "Chocolate"), prioritise correctness from the **product name**: do NOT describe wrong category fiction; optionally add ONE short caveat in specsSummary if category seems wrong ("ক্যাটাগরি যাচাই করুন" / verify category tone) without being rude.

${languageInstruction}

MEDICAL / OTC GUARDRAILS:
• Product type MEDICINE: informational tone only — uses, dosage class suggestions as "যেমন চিকিৎসকের পরামর্শ" framing; NEVER fabricate prescribing text or replace professional advice.

OUTPUT: Reply with ONLY valid JSON:
{
  "description": "string (for product page — 2–4 short sentences)",
  "keyFeatures": ["3–6 bullet-ish lines"],
  "specsSummary": "string — compact factual paragraph (sizes, suitability, usage class)",
  "seoTitle": "string ≤60 chars incl. brand & pack when known",
  "seoDescription": "string 148–160 chars STRICT",
  "seoKeywords": ["keyword1","keyword2",...]
}`

  const userPrompt = `Generate product content.

Product Name: ${productName}
Brand: ${brandName || '(not specified)'}
Category label in admin: ${category || '(unspecified — infer carefully from name)'}
Product record type hint: ${productType || '(unspecified — infer from category & name)'}
${sizeLabel ? `Pack / Size: ${sizeLabel}` : ''}
${unit ? `Unit label: ${unit}` : ''}

FACTUAL CONTEXT (obey strictly when present — do NOT contradict):
${factualBlock}

Quality checks before you answer:
• Title/description match the real product suggested by its name (${productName}); include pack/size in title if provided.
• Description & features coherent with factual context; no hallucinated allergens or medical cure claims unless given.
• Keywords reflect how Bangladesh shoppers find this SKU (Bangla / Banglish / English mix as suitable).
• JSON only — no markdown, no preamble.`

  return { system: systemPrompt, user: userPrompt }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.authorized) {
      return authResult.response
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured. Please set OPENAI_API_KEY in environment variables.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const validationResult = requestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const payload = validationResult.data
    const { system: systemPrompt, user: userPrompt } = buildPrompts(payload)

    let completion
    try {
      const openai = getOpenAIClient()
      completion = await openai.chat.completions.create({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.45,
        max_tokens: 1100,
      })
    } catch (openaiError: unknown) {
      console.error('OpenAI API error:', openaiError)
      return NextResponse.json(
        { error: 'AI generation failed. Please try again.' },
        { status: 500 }
      )
    }

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'AI returned empty response' },
        { status: 500 }
      )
    }

    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      return NextResponse.json(
        { error: 'AI returned invalid JSON' },
        { status: 500 }
      )
    }

    const validatedResponse = responseSchema.safeParse(parsedContent)
    if (!validatedResponse.success) {
      console.error('AI response validation failed:', validatedResponse.error)

      try {
        const openai = getOpenAIClient()
        const retryCompletion = await openai.chat.completions.create({
          model: defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            {
              role: 'assistant',
              content: content,
            },
            {
              role: 'user',
              content:
                'Your JSON failed schema validation. Return ONLY one JSON object with keys: description (string), keyFeatures (string array), specsSummary (string), seoTitle (string, max 60 chars), seoDescription (string, 148-160 chars), seoKeywords (string array). No markdown.',
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.35,
          max_tokens: 1100,
        })

        const retryContent = retryCompletion.choices[0]?.message?.content
        if (retryContent) {
          parsedContent = JSON.parse(retryContent)
          const retryValidation = responseSchema.safeParse(parsedContent)
          if (retryValidation.success) {
            return NextResponse.json(sanitizeAiProductPayload(retryValidation.data))
          }
        }
      } catch (retryError) {
        console.error('Retry failed:', retryError)
      }

      return NextResponse.json(
        { error: 'AI generated invalid response format' },
        { status: 500 }
      )
    }

    return NextResponse.json(sanitizeAiProductPayload(validatedResponse.data))
  } catch (error) {
    console.error('Product helper API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
