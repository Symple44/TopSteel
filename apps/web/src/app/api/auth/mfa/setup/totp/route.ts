import { type NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '../../../../../../lib/auth-helper'
import { callBackendFromApi } from '../../../../../../utils/backend-api'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const auth = await verifyAuthHelper(request)
    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request?.json()

    // Appeler l'API backend pour configurer TOTP
    const apiResponse = await callBackendFromApi(request, 'auth/mfa/setup/totp', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (!apiResponse?.ok) {
      const errorData = await apiResponse?.json().catch(() => ({ error: 'Erreur API backend' }))
      return NextResponse?.json(
        { error: errorData.error || 'Erreur lors de la configuration TOTP' },
        { status: apiResponse.status }
      )
    }

    const setupData = await apiResponse?.json()

    return NextResponse?.json({
      success: true,
      data: setupData?.data,
    })
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
