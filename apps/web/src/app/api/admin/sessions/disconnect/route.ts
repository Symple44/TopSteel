import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions
    const auth = await verifyAuthHelper(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (!auth.user?.roles?.some((role: string) => ['SUPER_ADMIN', 'ADMIN'].includes(role))) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request.json()
    const { sessionId, userId, reason } = body

    // Importer callBackendFromApi
    const { callBackendFromApi } = await import('@/utils/backend-api')
    
    const endpoint = sessionId ? 'auth/sessions/disconnect-session' : 'auth/sessions/disconnect-user'
    
    const payload = sessionId 
      ? { sessionId, reason: reason || 'Déconnexion administrative' }
      : { userId, reason: reason || 'Déconnexion administrative' }

    if (!sessionId && !userId) {
      return NextResponse.json({ error: 'SessionId ou userId requis' }, { status: 400 })
    }

    const apiResponse = await callBackendFromApi(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(payload)
    })

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({ error: 'Erreur API backend' }))
      return NextResponse.json(
        { error: errorData.error || 'Erreur lors de la déconnexion forcée' },
        { status: apiResponse.status }
      )
    }

    const result = await apiResponse.json()

    return NextResponse.json({
      success: true,
      message: result.message || 'Utilisateur déconnecté avec succès',
      data: result.data
    })
  } catch (error) {
    console.error('Erreur lors de la déconnexion forcée:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}