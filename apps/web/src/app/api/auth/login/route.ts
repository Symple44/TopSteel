/**
 * Route API pour la connexion avec cookies HttpOnly
 */

import { type NextRequest, NextResponse } from 'next/server'
import { saveTokensInCookies, saveUserInfoInCookie } from '../../../../lib/auth/cookie-auth'

const API_URL = process?.env?.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'

export async function POST(request: NextRequest) {
  try {
    const body = await request?.json()
    const { email, password, rememberMe = false } = body || {}

    // Récupérer le token CSRF depuis le backend
    const csrfResponse = await fetch(`${API_URL}/api/csrf/token`, {
      method: 'GET',
    })

    if (!csrfResponse?.ok) {
      console.error('[Login Route] Failed to get CSRF token:', csrfResponse.status)
      return NextResponse?.json({ error: 'Failed to get CSRF token' }, { status: 500 })
    }

    const csrfData = await csrfResponse?.json()
    const csrfToken = csrfData?.token

    // Récupérer tous les cookies set-cookie et les dédupliquer
    const setCookieHeaders = csrfResponse?.headers?.getSetCookie?.() || []

    // Utiliser un Map pour dédupliquer les cookies (garder la dernière valeur pour chaque nom)
    const cookieMap = new Map<string, string>()
    for (const setCookie of setCookieHeaders) {
      const cookieValue = setCookie.split(';')[0] // Prendre seulement la partie name=value
      const [name] = cookieValue.split('=')
      if (name) {
        cookieMap.set(name.trim(), cookieValue)
      }
    }

    // Joindre les cookies dédupliqués
    const cookieHeader = Array.from(cookieMap.values()).join('; ')

    console.log('[Login Route] CSRF Token:', csrfToken?.substring(0, 20) + '...')
    console.log('[Login Route] Cookies to send:', cookieHeader)

    // Appeler l'API backend pour l'authentification
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ email, password }),
    })

    if (!loginResponse?.ok) {
      console.log('[Login Route] Backend returned error status:', loginResponse.status)
      let errorMessage = 'Authentication failed'
      try {
        const error = await loginResponse?.json()
        errorMessage = error.message || error.error || errorMessage
        console.log('[Login Route] Backend error:', error)
      } catch (e) {
        // Si le backend ne retourne pas de JSON valide
        const textError = await loginResponse?.text()
        console.log('[Login Route] Backend returned non-JSON error:', textError)
        errorMessage = textError || errorMessage
      }
      return NextResponse?.json({ error: errorMessage }, { status: loginResponse.status })
    }

    const response_data = await loginResponse?.json()
    console.log('[Login Route] Backend success response:', JSON.stringify(response_data, null, 2))

    // Le backend retourne { data: { user, accessToken, ... } }
    const { user, accessToken, refreshToken, expiresIn } = response_data?.data || {}

    if (!user) {
      console.error('[Login Route] User object is missing in backend response')
      return NextResponse?.json({ error: 'Invalid response from server' }, { status: 500 })
    }

    // Créer la réponse avec les tokens dans le JSON (AuthService en a besoin)
    const response = NextResponse?.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          prenom: user.prenom,
          nom: user.nom,
          role: user.role,
          isActive: true,
        },
        accessToken,
        refreshToken,
        expiresIn,
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
  } catch (error) {
    console.error('[Login Route] Unexpected error:', error)
    return NextResponse?.json({ error: 'Internal server error' }, { status: 500 })
  }
}
