import { type NextRequest, NextResponse } from 'next/server'
import { areTokensExpired, getTokensFromCookies, saveTokensInCookies } from '../../../../lib/auth/cookie-auth'
import { callBackendFromApi } from '../../../../utils/backend-api'

export async function POST(req: NextRequest) {
  try {
    // Récupérer les tokens depuis les cookies HttpOnly
    const tokens = await getTokensFromCookies(req)

    // Essayer aussi depuis le body pour la compatibilité
    const body = await req?.json().catch(() => ({}))
    const refreshToken = tokens?.refreshToken || body?.refreshToken

    if (!refreshToken) {
      return NextResponse?.json({ error: 'No refresh token found' }, { status: 401 })
    }

    // Rediriger vers l'API backend
    const response = await callBackendFromApi(req, 'auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response?.json()

    if (!response?.ok) {
      return NextResponse?.json(data, { status: response.status })
    }

    // Créer la réponse avec les nouvelles données
    const nextResponse = NextResponse?.json({
      success: true,
      accessToken: data.accessToken,
      expiresIn: data.expiresIn,
      expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
    })

    // Mettre à jour les tokens dans les cookies HttpOnly
    await saveTokensInCookies(
      {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || refreshToken,
        expiresIn: data.expiresIn || 3600,
        expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
      },
      nextResponse
    )

    return nextResponse
  } catch (_error) {
    return NextResponse?.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Vérifier si les tokens doivent être rafraîchis
 */
export async function GET(request: NextRequest) {
  try {
    const tokens = await getTokensFromCookies(request)

    if (!tokens) {
      return NextResponse?.json({
        needsRefresh: false,
        isAuthenticated: false,
      })
    }

    const needsRefresh = areTokensExpired(tokens)

    return NextResponse?.json({
      needsRefresh,
      isAuthenticated: true,
      expiresAt: tokens.expiresAt,
    })
  } catch {
    return NextResponse?.json({
      needsRefresh: false,
      isAuthenticated: false,
    })
  }
}
