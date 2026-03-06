import { getOpenAIClient, defaultModel, isOpenAIConfigured } from '@/lib/openai'
import { z } from 'zod'

export const MedicineExtractionSchema = z.object({
    genericName: z.string().nullable(),
    strength: z.string().nullable(),
    dosageForm: z.string().nullable(),
    brandName: z.string().nullable(),
    packSize: z.string().nullable(),
})

export type MedicineExtraction = z.infer<typeof MedicineExtractionSchema>

export async function extractMedicineFields(productName: string): Promise<MedicineExtraction> {
    if (!isOpenAIConfigured()) {
        return {
            genericName: null,
            strength: null,
            dosageForm: null,
            brandName: null,
            packSize: null,
        }
    }

    const systemPrompt = `You are a medical data extraction expert. 
Your task is to extract pharmaceutical fields from a product name.
Fields to extract:
1. genericName: The scientific name of the medicine (e.g., Paracetamol, Omeprazole).
2. strength: The concentration (e.g., 500mg, 20mg, 10ml).
3. dosageForm: The form of the medicine (e.g., Tablet, Capsule, Syrup, Injection, Cream).
4. brandName: The commercial name (e.g., Napa, Losec).
5. packSize: The packaging information if present in the name (e.g., 10's, 100ml).

Reply with ONLY valid JSON matching this structure:
{
  "genericName": "string or null",
  "strength": "string or null",
  "dosageForm": "string or null",
  "brandName": "string or null",
  "packSize": "string or null"
}`

    const userPrompt = `Extract fields from this product name: "${productName}"`

    try {
        const openai = getOpenAIClient()
        const completion = await openai.chat.completions.create({
            model: defaultModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) return { genericName: null, strength: null, dosageForm: null, brandName: null, packSize: null }

        const parsed = JSON.parse(content)
        return MedicineExtractionSchema.parse(parsed)
    } catch (error) {
        console.error('Medicine extraction error:', error)
        return { genericName: null, strength: null, dosageForm: null, brandName: null, packSize: null }
    }
}
