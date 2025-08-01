import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionToken } = body

    // Validation des données
    if (!userId || !sessionToken) {
      return NextResponse.json(
        { error: 'Données manquantes: userId et sessionToken requis' },
        { status: 400 }
      )
    }

    // Appeler l'API backend pour finaliser la connexion après MFA
    const apiResponse = await callBackendFromApi(request, 'auth/mfa/complete', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        sessionToken,
      }),
    })

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({ error: 'Erreur API backend' }))
      return NextResponse.json(
        { error: errorData.error || 'Erreur lors de la finalisation de la connexion' },
        { status: apiResponse.status }
      )
    }

    const loginData = await apiResponse.json()

    return NextResponse.json({
      success: true,
      data: loginData.data,
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
