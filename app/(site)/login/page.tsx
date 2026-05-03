import { redirect } from 'next/navigation'

/** Legacy / bookmarked links used `/login`; app sign-in lives at `/auth/signin`. */
export default async function LoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}) {
  const sp = await searchParams
  const raw = sp.callbackUrl
  const callbackUrl = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined
  if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }
  redirect('/auth/signin')
}
