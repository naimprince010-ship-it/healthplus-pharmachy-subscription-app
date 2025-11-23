import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev',
    commitRef: process.env.VERCEL_GIT_COMMIT_REF || 'local-dev',
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'local-dev',
    environment: process.env.VERCEL_ENV || 'local-dev',
    timestamp: new Date().toISOString(),
  })
}
