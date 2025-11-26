/**
 * Route API pour l'inscription
 */

import { type NextRequest, NextResponse } from 'next/server'

const API_URL = process?.env?.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'

export async function POST(request: NextRequest) {
  try {
    const body = await request?.json()
    const { firstName, lastName, email, company, password } = body || {}

    // Appeler l'API backend pour l'inscription
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName, lastName, email, company, password }),
    })

    const responseData = await registerResponse?.json()

    if (!registerResponse?.ok) {
      return NextResponse?.json(
        { error: responseData?.message || 'Registration failed' },
        { status: registerResponse.status }
      )
    }

    return NextResponse?.json(responseData)
  } catch (error) {
    console.error('[Register Route] Unexpected error:', error)
    return NextResponse?.json({ error: 'Internal server error' }, { status: 500 })
  }
}
