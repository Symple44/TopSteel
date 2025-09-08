import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

// Force dynamic pour éviter les problèmes de cache
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore?.get('accessToken')?.value

    if (!token) {
      return NextResponse?.json(
        {
          success: false,
          message: 'Authentification requise',
        },
        { status: 401 }
      )
    }

    try {
      const response = await callBackendFromApi(request, 'user/menu-preferences/custom-menu', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response?.ok) {
        const data = await response?.json()

        // Déterminer où se trouvent les données du menu
        // Note: menuItems pourrait être utilisé pour validation future
        // const menuItems = data?.data || data || []

        return NextResponse?.json(data)
      } else {
        // Backend API error, utilisation du fallback
        const errorText = await response?.text()
        throw new Error(`Backend API error: ${response?.status} - ${errorText}`)
      }
    } catch (_backendError) {
      // Fallback : retourner un menu vide par défaut
      return NextResponse?.json({
        success: true,
        data: [], // Menu vide par défaut
        message: 'Menu personnalisé récupéré (fallback - menu vide)',
        fallback: true,
      })
    }
  } catch (error) {
    // Erreur lors du chargement du menu personnalisé
    return NextResponse?.json(
      {
        success: false,
        message: 'Erreur lors du chargement du menu personnalisé',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore?.get('accessToken')?.value

    if (!token) {
      return NextResponse?.json(
        {
          success: false,
          message: 'Authentification requise',
        },
        { status: 401 }
      )
    }

    const body = await request?.json()
    const { menuItems } = body || {}

    // Validation des données
    if (!Array.isArray(menuItems)) {
      return NextResponse?.json(
        {
          success: false,
          message: 'Format de données invalide: menuItems doit être un tableau',
        },
        { status: 400 }
      )
    }

    try {
      // Appeler le backend NestJS pour sauvegarder
      const response = await callBackendFromApi(request, 'user/menu-preferences/custom-menu', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menuItems: menuItems,
        }),
      })

      if (response?.ok) {
        const data = await response?.json()
        return NextResponse?.json({
          success: true,
          data: data.data || menuItems,
          message: 'Menu personnalisé sauvegardé avec succès',
        })
      } else {
        const _errorData = await response?.text()
        // Backend API error
        throw new Error(`Backend API error: ${response?.status}`)
      }
    } catch (_backendError) {
      // Backend indisponible pour la sauvegarde, utilisation du fallback

      // Fallback : simuler la sauvegarde si backend indisponible
      // En production, vous devriez enregistrer dans une base locale ou queue
      return NextResponse?.json({
        success: true,
        data: menuItems,
        message: 'Menu personnalisé sauvegardé (mode fallback - attention: non persisté en BDD)',
        fallback: true,
        warning: 'Les modifications ne sont pas persistées en base de données',
      })
    }
  } catch (error) {
    // Erreur lors de la sauvegarde du menu personnalisé
    return NextResponse?.json(
      {
        success: false,
        message: 'Erreur lors de la sauvegarde du menu personnalisé',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Utiliser la même logique que POST pour les mises à jour
  return POST(request)
}
