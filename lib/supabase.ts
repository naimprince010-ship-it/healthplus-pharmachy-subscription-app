import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!isConfigured) {
  console.warn('Supabase credentials not configured - file upload will not work')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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

/**
 * Validate medicine image file
 */
export function validateMedicineImage(file: File): { valid: boolean; error?: string } {
  const maxSize = 1 * 1024 * 1024 // 1MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']

  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 1MB' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG and PNG images are allowed' }
  }

  return { valid: true }
}

/**
 * Upload medicine image to Supabase Storage
 * Returns the public URL and storage path
 */
export async function uploadMedicineImage(
  file: File,
  medicineId?: string
): Promise<{ url: string; path: string; mimeType: string; size: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured in production environment')
  }
  
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in production environment')
  }

  const bucket = process.env.SUPABASE_MEDICINE_BUCKET || 'medicine-images'
  
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === bucket)
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 1024 * 1024, // 1MB
        allowedMimeTypes: ['image/jpeg', 'image/png'],
      })
    }
  } catch (error) {
    console.error('Bucket check/create error:', error)
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const uuid = `${Date.now()}-${Math.random().toString(36).substring(7)}`
  const fileName = `${uuid}.${fileExt}`
  const filePath = medicineId 
    ? `medicines/${medicineId}/${fileName}`
    : `medicines/${fileName}`

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
    mimeType: file.type,
    size: file.size,
  }
}

/**
 * Delete medicine image from Supabase Storage
 */
export async function deleteMedicineImage(path: string): Promise<void> {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  const bucket = process.env.SUPABASE_MEDICINE_BUCKET || 'medicine-images'

  const { error } = await supabaseAdmin.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Upload prescription file to Supabase Storage using admin client
 * Returns the public URL, storage path, MIME type, and file size
 */
export async function uploadPrescriptionFile(
  file: File
): Promise<{ url: string; path: string; mimeType: string; size: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured in production environment')
  }
  
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in production environment')
  }

  const bucket = 'healthplus'
  
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === bucket)
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      })
    }
  } catch (error) {
    console.error('Bucket check/create error:', error)
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const uuid = `${Date.now()}-${Math.random().toString(36).substring(7)}`
  const fileName = `${uuid}.${fileExt}`
  const filePath = `prescriptions/${fileName}`

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
    mimeType: file.type,
    size: file.size,
  }
}

/**
 * Delete prescription file from Supabase Storage using admin client
 */
export async function deletePrescriptionFile(path: string): Promise<void> {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  const bucket = 'healthplus'

  const { error } = await supabaseAdmin.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}
