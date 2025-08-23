/**
 * Route API pour la connexion avec cookies HttpOnly
 */

import { type NextRequest, NextResponse } from 'next/server'
import { saveTokensInCookies, saveUserInfoInCookie } from '@/lib/auth/cookie-auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, rememberMe = false } = body

    // Appeler l'API backend pour l'authentification
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!loginResponse.ok) {
      const error = await loginResponse.json()
      return NextResponse.json(
        { error: error.message || 'Authentication failed' },
        { status: loginResponse.status }
      )
    }

    const data = await loginResponse.json()
    const { user, accessToken, refreshToken, expiresIn } = data

    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        isSuperAdmin: user.isSuperAdmin,
      },
    })

    // Sauvegarder les tokens dans des cookies HttpOnly
    await saveTokensInCookies(
      {
        accessToken,
        refreshToken,
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
      },
      response,
      rememberMe
    )

    // Sauvegarder les infos utilisateur
    await saveUserInfoInCookie(user, null, response, rememberMe)

    return response
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
