const MEDEX_HOSTS = new Set(['medex.com.bd', 'www.medex.com.bd'])

/** Returns a parsed https URL only when the host is exactly Medex; blocks SSRF via look-alike strings. */
export function parseMedexUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:') return null
    if (parsed.username || parsed.password || parsed.port) return null
    return MEDEX_HOSTS.has(parsed.hostname.toLowerCase()) ? parsed : null
  } catch {
    return null
  }
}
