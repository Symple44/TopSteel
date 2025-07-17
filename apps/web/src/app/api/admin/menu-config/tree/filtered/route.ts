import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/menu-config/tree/filtered`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
    })

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'appel à l\'API' },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    // L'API NestJS retourne { data: { success, data }, statusCode, message, timestamp }
    // On extrait juste la partie data.data
    return NextResponse.json(responseData.data || responseData)
  } catch (error) {
    console.error('Erreur lors de la récupération du menu filtré:', error)
    
    // Retourner des données mock si l'API n'est pas disponible
    const mockMenu = {
      success: true,
      data: [
        {
          id: 'dashboard',
          title: 'Tableau de bord',
          href: '/dashboard',
          icon: 'Home',
          orderIndex: 1,
          isVisible: true,
          children: [],
          depth: 0
        },
        {
          id: 'production',
          title: 'Production',
          href: '/production',
          icon: 'Factory',
          orderIndex: 2,
          isVisible: true,
          children: [
            {
              id: 'production-orders',
              title: 'Ordres de fabrication',
              href: '/production/orders',
              icon: 'FileText',
              orderIndex: 1,
              isVisible: true,
              children: [],
              depth: 1
            }
          ],
          depth: 0
        },
        {
          id: 'admin',
          title: 'Administration',
          href: '/admin',
          icon: 'Shield',
          orderIndex: 100,
          isVisible: true,
          children: [
            {
              id: 'admin-users',
              title: 'Gestion des utilisateurs',
              href: '/admin/users',
              icon: 'Users',
              orderIndex: 1,
              isVisible: true,
              children: [],
              depth: 1
            },
            {
              id: 'admin-database',
              title: 'Base de données',
              href: '/admin/database',
              icon: 'Database',
              orderIndex: 2,
              isVisible: true,
              children: [],
              depth: 1
            }
          ],
          depth: 0
        }
      ]
    }
    
    return NextResponse.json(mockMenu)
  }
}