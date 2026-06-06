import { NextRequest, NextResponse } from 'next/server'

type CronAuthOptions = {
  additionalSecrets?: Array<string | undefined>
}

export function requireCronAuth(
  request: NextRequest,
  options: CronAuthOptions = {}
): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  const allowedSecrets = [
    process.env.CRON_SECRET,
    ...(options.additionalSecrets ?? []),
  ].filter((value): value is string => Boolean(value && value.trim()))

  if (allowedSecrets.length === 0) {
    return NextResponse.json(
      { error: 'Cron secret is not configured' },
      { status: 503 }
    )
  }

  if (!token || !allowedSecrets.includes(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}