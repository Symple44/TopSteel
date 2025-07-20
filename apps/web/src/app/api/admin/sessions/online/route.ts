import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
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

    // Appeler l'API backend pour récupérer les sessions actives
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const apiResponse = await fetch(`${backendUrl}/api/auth/sessions/active`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json'
      }
    })

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({ error: 'Erreur API backend' }))
      return NextResponse.json(
        { error: errorData.error || 'Erreur lors de la récupération des sessions actives' },
        { status: apiResponse.status }
      )
    }

    const sessionsData = await apiResponse.json()

    return NextResponse.json({
      success: true,
      data: sessionsData.data || sessionsData
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs en ligne:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}