import { type NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

// GET - Récupérer tous les rôles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams?.get('includePermissions') === 'true'

    // Construire l'URL avec les paramètres de requête
    const endpoint = `/admin/roles${includePermissions ? '?includePermissions=true' : ''}`
    const response = await fetchBackend(endpoint, request)

    if (!response?.ok) {
      throw new Error(`HTTP ${response?.status}: ${response?.statusText}`)
    }

    const data = await response?.json()

    return NextResponse?.json({
      success: true,
      data: data?.data || [],
      meta: data?.meta || {},
    })
  } catch (_error) {
    return NextResponse?.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des rôles',
        data: [],
      },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau rôle
export async function POST(request: NextRequest) {
  try {
    const body = await request?.json()

    const response = await fetchBackend('/admin/roles', request, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (!response?.ok) {
      const errorData = await response?.json()
      return NextResponse?.json(
        { success: false, error: errorData.error || 'Erreur lors de la création du rôle' },
        { status: response.status }
      )
    }

    const data = await response?.json()

    return NextResponse?.json({
      success: true,
      data: data?.data || {},
    })
  } catch (_error) {
    return NextResponse?.json(
      { success: false, error: 'Erreur lors de la création du rôle' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un rôle
export async function PUT(request: NextRequest) {
  try {
    const body = await request?.json()
    const { id, ...updates } = body || {}

    if (!id) {
      return NextResponse?.json({ success: false, error: 'ID du rôle requis' }, { status: 400 })
    }

    const response = await fetchBackend(`/admin/roles/${id}`, request, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })

    if (!response?.ok) {
      const errorData = await response?.json()
      return NextResponse?.json(
        { success: false, error: errorData.error || 'Erreur lors de la mise à jour du rôle' },
        { status: response.status }
      )
    }

    const data = await response?.json()

    return NextResponse?.json({
      success: true,
      data: data?.data || {},
    })
  } catch (_error) {
    return NextResponse?.json(
      { success: false, error: 'Erreur lors de la mise à jour du rôle' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un rôle
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams?.get('id')

    if (!id) {
      return NextResponse?.json({ success: false, error: 'ID du rôle requis' }, { status: 400 })
    }

    const response = await fetchBackend(`/admin/roles/${id}`, request, {
      method: 'DELETE',
    })

    if (!response?.ok) {
      const errorData = await response?.json()
      return NextResponse?.json(
        { success: false, error: errorData.error || 'Erreur lors de la suppression du rôle' },
        { status: response.status }
      )
    }

    const data = await response?.json()

    return NextResponse?.json({
      success: true,
      message: data?.message || 'Rôle supprimé avec succès',
    })
  } catch (_error) {
    return NextResponse?.json(
      { success: false, error: 'Erreur lors de la suppression du rôle' },
      { status: 500 }
    )
  }
}
