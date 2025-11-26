/**
 * Route API pour la réinitialisation de mot de passe avec token
 */

import { type NextRequest, NextResponse } from 'next/server'

const API_URL = process?.env?.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'

export async function POST(request: NextRequest) {
  try {
    const body = await request?.json()
    const { token, newPassword } = body || {}

    // Appeler l'API backend pour réinitialiser le mot de passe
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    })

    const responseData = await response?.json()

    if (!response?.ok) {
      return NextResponse?.json(
        { error: responseData?.message || 'Reset failed' },
        { status: response.status }
      )
    }

    return NextResponse?.json(responseData)
  } catch (error) {
    console.error('[Reset Password Route] Unexpected error:', error)
    return NextResponse?.json({ error: 'Internal server error' }, { status: 500 })
  }
}
