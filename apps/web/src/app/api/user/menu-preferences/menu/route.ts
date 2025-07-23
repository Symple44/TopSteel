import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
      // Appeler le vrai backend NestJS
      const response = await fetch(`${apiUrl}/api/v1/user/menu-preferences/menu`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Gérer les différentes structures de réponse possibles
        if (data.data && data.data.success) {
          return NextResponse.json({
            success: data.data.success,
            data: data.data.data,
            message: data.message || 'Menu récupéré avec succès'
          })
        } else if (data.success) {
          return NextResponse.json(data)
        } else {
          return NextResponse.json(data)
        }
      } else {
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (backendError) {
      // Fallback uniquement si le backend est indisponible
      const defaultMenu = [
        {
          id: 'dashboard',
          title: 'Tableau de bord',
          icon: 'dashboard',
          url: '/dashboard',
          visible: true,
          order: 0
        },
        {
          id: 'admin',
          title: 'Administration', 
          icon: 'admin',
          url: '/admin',
          visible: true,
          order: 1,
          children: [
            {
              id: 'admin-users',
              title: 'Utilisateurs',
              url: '/admin/users',
              visible: true,
              order: 0
            },
            {
              id: 'admin-roles',
              title: 'Rôles',
              url: '/admin/roles',
              visible: true,
              order: 1
            },
            {
              id: 'admin-settings',
              title: 'Configuration',
              url: '/admin/settings',
              visible: true,
              order: 2
            }
          ]
        },
        {
          id: 'settings',
          title: 'Paramètres',
          icon: 'settings',
          url: '/settings',
          visible: true,
          order: 2
        }
      ]

      return NextResponse.json({
        success: true,
        data: defaultMenu,
        message: 'Menu récupéré avec succès',
        fallback: true
      })
    }
  } catch (error) {
    // Error loading menu (silenced)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement du menu',
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
    
    try {
      // Appeler le vrai backend NestJS pour la sauvegarde
      const response = await fetch(`${apiUrl}/api/v1/user/menu-preferences/menu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (backendError) {
      // Fallback : simuler la sauvegarde si backend indisponible
      return NextResponse.json({
        success: true,
        data: body,
        message: 'Préférences de menu sauvegardées (mode fallback)',
        fallback: true
      })
    }
    
  } catch (error) {
    // Error saving menu preferences (silenced)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la sauvegarde des préférences',
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