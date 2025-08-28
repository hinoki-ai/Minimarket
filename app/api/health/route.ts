import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    app: 'minimarket-aramac',
    version: '0.1.0',
    domain: process.env.NEXT_PUBLIC_APP_URL || 'minimarket.aramac.dev'
  })
}