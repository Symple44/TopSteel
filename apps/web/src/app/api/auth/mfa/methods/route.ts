import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '@/lib/auth-helper'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const auth = await verifyAuthHelper(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Appeler l'API backend pour récupérer les méthodes MFA
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
    const apiResponse = await safeFetch(`${backendUrl}/api/auth/mfa/methods`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json'
      }
    })

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({ error: 'Erreur API backend' }))
      return NextResponse.json(
        { error: errorData.error || 'Erreur lors de la récupération des méthodes MFA' },
        { status: apiResponse.status }
      )
    }

    const methodsData = await apiResponse.json()

    return NextResponse.json({
      success: true,
      data: methodsData.data
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des méthodes MFA:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}