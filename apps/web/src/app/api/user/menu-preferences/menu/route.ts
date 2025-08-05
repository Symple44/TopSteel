import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentification requise',
        },
        { status: 401 }
      )
    }

    try {
      // Appeler le vrai backend NestJS
      const response = await callBackendFromApi(request, 'user/menu-preferences/menu', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()

        // Gérer les différentes structures de réponse possibles
        if (data.data?.success) {
          return NextResponse.json({
            success: data.data.success,
            data: data.data.data,
            message: data.message || 'Menu récupéré avec succès',
          })
        } else if (data.success) {
          return NextResponse.json(data)
        } else {
          return NextResponse.json(data)
        }
      } else {
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (_backendError) {
      // Fallback uniquement si le backend est indisponible
      // Format conforme à ce qui est attendu par useDynamicMenu
      const defaultCustomMenu = [
        {
          id: 'dashboard-custom',
          parentId: null,
          title: 'Mon Tableau de bord',
          titleKey: 'dashboard',
          href: '/dashboard',
          icon: 'Home',
          gradient: 'from-purple-500 to-pink-600',
          orderIndex: 0,
          isVisible: true,
          depth: 0,
          children: [],
          userPreferences: {
            isVisible: true,
            isFavorite: true,
            isPinned: true,
            customTitle: 'Mon Tableau de bord',
            customIcon: 'Home',
            customColor: 'purple',
          },
        },
        {
          id: 'query-builder-custom',
          parentId: null,
          title: 'Mes Requêtes',
          href: '/query-builder',
          icon: 'Search',
          gradient: 'from-green-500 to-emerald-600',
          orderIndex: 1,
          isVisible: true,
          depth: 0,
          children: [],
          userPreferences: {
            isVisible: true,
            isFavorite: false,
            isPinned: false,
            customTitle: 'Mes Requêtes',
          },
        },
        {
          id: 'admin-custom',
          parentId: null,
          title: 'Config Perso',
          href: '/admin',
          icon: 'Shield',
          gradient: 'from-orange-500 to-red-600',
          orderIndex: 2,
          isVisible: true,
          depth: 0,
          roles: ['ADMIN'],
          children: [
            {
              id: 'admin-users-custom',
              parentId: 'admin-custom',
              title: 'Mes Utilisateurs',
              href: '/admin/users',
              icon: 'Users',
              gradient: 'from-blue-500 to-indigo-600',
              orderIndex: 0,
              isVisible: true,
              depth: 1,
              roles: ['SUPER_ADMIN', 'ADMIN'],
              children: [],
              userPreferences: {
                isVisible: true,
                customTitle: 'Mes Utilisateurs',
              },
            },
          ],
          userPreferences: {
            isVisible: true,
            customTitle: 'Config Perso',
          },
        },
        {
          id: 'settings-custom',
          parentId: null,
          title: 'Mes Paramètres',
          href: '/settings',
          icon: 'Settings',
          gradient: 'from-indigo-500 to-purple-600',
          orderIndex: 3,
          isVisible: true,
          depth: 0,
          children: [
            {
              id: 'settings-appearance-custom',
              parentId: 'settings-custom',
              title: 'Mon Thème',
              href: '/settings/appearance',
              icon: 'Palette',
              gradient: 'from-pink-500 to-rose-600',
              orderIndex: 0,
              isVisible: true,
              depth: 1,
              children: [],
              userPreferences: {
                isVisible: true,
                customTitle: 'Mon Thème',
              },
            },
          ],
          userPreferences: {
            isVisible: true,
            customTitle: 'Mes Paramètres',
          },
        },
      ]

      return NextResponse.json({
        success: true,
        data: defaultCustomMenu,
        message: 'Menu personnalisé récupéré avec succès (fallback)',
        fallback: true,
      })
    }
  } catch (error) {
    // Error loading menu (silenced)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement du menu',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
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
          message: 'Authentification requise',
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    try {
      // Appeler le vrai backend NestJS pour la sauvegarde
      const response = await callBackendFromApi(request, 'user/menu-preferences/menu', {
        method: 'POST',
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (_backendError) {
      // Fallback : simuler la sauvegarde si backend indisponible
      return NextResponse.json({
        success: true,
        data: body,
        message: 'Préférences de menu sauvegardées (mode fallback)',
        fallback: true,
      })
    }
  } catch (error) {
    // Error saving menu preferences (silenced)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la sauvegarde des préférences',
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
