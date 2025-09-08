import { type NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '@/lib/auth-helper'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Vérifier l'authentification et les permissions
    const auth = await verifyAuthHelper(request)
    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (!auth.user?.roles?.some((role: string) => ['SUPER_ADMIN', 'ADMIN'].includes(role))) {
      return NextResponse?.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { id: userId } = await params

    if (!userId) {
      return NextResponse?.json({ error: 'ID utilisateur requis' }, { status: 400 })
    }

    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url)
    const limit = searchParams?.get('limit') || '50'

    // Importer callBackendFromApi
    const { callBackendFromApi } = (await import('@/utils/backend-api')) || {}

    const apiResponse = await callBackendFromApi(
      request,
      `auth/sessions/user/${userId}/history?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: request?.headers?.get('Authorization') || '',
        },
      }
    )

    if (!apiResponse?.ok) {
      const errorData = await apiResponse?.json().catch(() => ({ error: 'Erreur API backend' }))
      return NextResponse?.json(
        { error: errorData.error || "Erreur lors de la récupération de l'historique utilisateur" },
        { status: apiResponse.status }
      )
    }

    const historyData = await apiResponse?.json()

    return NextResponse?.json({
      success: true,
      data: historyData?.data || historyData,
      stats: historyData.stats,
    })
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
