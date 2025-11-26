/**
 * Route API pour la demande de réinitialisation de mot de passe
 */

import { type NextRequest, NextResponse } from 'next/server'

const API_URL = process?.env?.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'

export async function POST(request: NextRequest) {
  try {
    const body = await request?.json()
    const { email } = body || {}

    // Appeler l'API backend pour envoyer l'email de réinitialisation
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const responseData = await response?.json()

    if (!response?.ok) {
      return NextResponse?.json(
        { error: responseData?.message || 'Request failed' },
        { status: response.status }
      )
    }

    return NextResponse?.json(responseData)
  } catch (error) {
    console.error('[Forgot Password Route] Unexpected error:', error)
    return NextResponse?.json({ error: 'Internal server error' }, { status: 500 })
  }
}
