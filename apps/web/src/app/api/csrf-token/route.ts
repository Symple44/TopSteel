import { NextResponse } from 'next/server'
import { csrfProtection } from '@/lib/csrf-protection'

/**
 * GET /api/csrf-token
 * Endpoint pour obtenir un nouveau token CSRF
 */
export async function GET() {
  try {
    // Générer et retourner un nouveau token CSRF
    return csrfProtection.createTokenResponse()
  } catch (error) {
    console.error('Failed to generate CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}