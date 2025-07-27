import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface UserMenuItem {
  id: string
  parentId?: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  orderIndex: number
  isVisible: boolean
  children: UserMenuItem[]
  icon?: string
  customTitle?: string
  customIcon?: string
  customIconColor?: string
  isUserCreated?: boolean
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentification requise'
        },
        { status: 401 }
      )
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

    try {
      // Appeler le backend NestJS pour récupérer le menu personnalisé
      const response = await fetch(`${apiUrl}/api/v1/user/menu-preferences/custom-menu`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        // Backend API error, utilisation du fallback
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (backendError) {
      // Backend indisponible pour custom-menu, utilisation du fallback
      
      // Fallback : retourner un menu vide par défaut
      return NextResponse.json({
        success: true,
        data: [], // Menu vide par défaut
        message: 'Menu personnalisé récupéré (fallback - menu vide)',
        fallback: true
      })
    }
    
  } catch (error) {
    // Erreur lors du chargement du menu personnalisé
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement du menu personnalisé',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentification requise'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { menuItems } = body
    
    // Validation des données
    if (!Array.isArray(menuItems)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format de données invalide: menuItems doit être un tableau'
        },
        { status: 400 }
      )
    }

    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
    
    try {
      // Appeler le backend NestJS pour sauvegarder
      const response = await fetch(`${apiUrl}/api/v1/user/menu-preferences/custom-menu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuItems: menuItems
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          success: true,
          data: data.data || menuItems,
          message: 'Menu personnalisé sauvegardé avec succès'
        })
      } else {
        const errorData = await response.text()
        // Backend API error
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (backendError) {
      // Backend indisponible pour la sauvegarde, utilisation du fallback
      
      // Fallback : simuler la sauvegarde si backend indisponible
      // En production, vous devriez enregistrer dans une base locale ou queue
      return NextResponse.json({
        success: true,
        data: menuItems,
        message: 'Menu personnalisé sauvegardé (mode fallback - attention: non persisté en BDD)',
        fallback: true,
        warning: 'Les modifications ne sont pas persistées en base de données'
      })
    }
    
  } catch (error) {
    // Erreur lors de la sauvegarde du menu personnalisé
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la sauvegarde du menu personnalisé',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Utiliser la même logique que POST pour les mises à jour
  return POST(request)
}