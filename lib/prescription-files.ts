import { supabaseAdmin } from '@/lib/supabase'

export const PRESCRIPTION_BUCKET = 'healthplus'
export const PRESCRIPTION_SIGNED_URL_TTL_SECONDS = 10 * 60

const STORAGE_PATH_MARKERS = [
  `/storage/v1/object/public/${PRESCRIPTION_BUCKET}/`,
  `/storage/v1/object/sign/${PRESCRIPTION_BUCKET}/`,
]

/**
 * Normalizes `Prescription.fileUrl` to a bucket-relative object path.
 * New rows store the path; legacy rows store a permanent public URL.
 */
export function toPrescriptionObjectPath(stored: string | null | undefined): string | null {
  if (!stored) return null
  if (!/^https?:\/\//i.test(stored)) {
    const path = stored.replace(/^\/+/, '')
    return path && !path.split('/').includes('..') ? path : null
  }
  try {
    const { pathname } = new URL(stored)
    for (const marker of STORAGE_PATH_MARKERS) {
      const index = pathname.indexOf(marker)
      if (index >= 0) return decodeURIComponent(pathname.slice(index + marker.length)) || null
    }
    return null
  } catch {
    return null
  }
}

/** Short-lived signed URL for an authorized viewer; null when the object cannot be signed. */
export async function createPrescriptionSignedUrl(
  stored: string | null | undefined,
  expiresInSeconds: number = PRESCRIPTION_SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  const path = toPrescriptionObjectPath(stored)
  if (!path) return null
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(PRESCRIPTION_BUCKET)
      .createSignedUrl(path, expiresInSeconds)
    if (error || !data?.signedUrl) {
      console.error('[prescription] failed to sign file URL:', error?.message ?? 'no URL returned')
      return null
    }
    return data.signedUrl
  } catch (error) {
    console.error('[prescription] failed to sign file URL:', error)
    return null
  }
}

/** Replaces the stored file reference with a short-lived signed URL before sending to a client. */
export async function withSignedPrescriptionFile<T extends { fileUrl: string }>(
  prescription: T
): Promise<Omit<T, 'fileUrl'> & { fileUrl: string | null }> {
  return { ...prescription, fileUrl: await createPrescriptionSignedUrl(prescription.fileUrl) }
}
