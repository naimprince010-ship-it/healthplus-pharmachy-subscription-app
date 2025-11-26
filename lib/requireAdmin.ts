import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function requireAdmin() {
  const session = await auth()
  
  if (!session || session.user.role !== 'ADMIN') {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
    }
  }
  
  return {
    authorized: true,
    session,
  }
}
