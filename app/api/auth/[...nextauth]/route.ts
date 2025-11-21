import { NextRequest, NextResponse } from 'next/server'


export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Auth endpoint - GET' }, { status: 200 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Auth endpoint - POST' }, { status: 200 })
}
