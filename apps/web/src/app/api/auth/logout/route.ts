import { type NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, getTokensFromCookies } from '@/lib/auth/cookie-auth'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(req: NextRequest) {
  try {
    // Récupérer le token depuis les cookies HttpOnly
    const tokens = await getTokensFromCookies(req)

    // Essayer aussi depuis l'en-tête Authorization pour la compatibilité
    const authHeader = req.headers.get('authorization')
    const token =
      tokens?.accessToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null)

    if (token) {
      // Rediriger vers l'API backend pour invalider le token
      try {
        await callBackendFromApi(req, 'auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch {
        // Continuer même si l'invalidation côté serveur échoue
      }
    }

    // Créer la réponse
    const response = NextResponse.json({ success: true })

    // Effacer tous les cookies d'authentification
    clearAuthCookies(response)

    return response
  } catch (_error) {
    // Même en cas d'erreur, on considère le logout comme réussi
    const response = NextResponse.json({ success: true })
    clearAuthCookies(response)
    return response
  }
}
