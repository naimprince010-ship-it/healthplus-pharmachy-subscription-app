import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!isConfigured) {
  console.warn('Supabase credentials not configured - file upload will not work')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadPrescription(file: File): Promise<string> {
  if (!isConfigured) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `prescriptions/${fileName}`

  const { data, error } = await supabase.storage
    .from('healthplus')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return data.path
}

export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  if (!isConfigured) {
    throw new Error('Supabase is not configured')
  }

  const { data, error } = await supabase.storage
    .from('healthplus')
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }

  return data.signedUrl
}

export async function deletePrescription(path: string): Promise<void> {
  if (!isConfigured) {
    throw new Error('Supabase is not configured')
  }

  const { error } = await supabase.storage.from('healthplus').remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export function validatePrescriptionFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and PDF files are allowed' }
  }

  return { valid: true }
}
