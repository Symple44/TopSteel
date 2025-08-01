import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const language = searchParams.get('language') || 'fr'

    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Appeler l'API backend pour récupérer les rôles depuis la base de données
    const _apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

    const response = await callBackendFromApi(
      req,
      `parameters/system/user_roles?language=${language}`,
      {
        method: 'GET',
      }
    )

    // Vérifier si la réponse est JSON
    let data
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      try {
        data = await response.json()
      } catch (_e) {
        data = { error: 'Invalid JSON response from API' }
      }
    } else {
      const textData = await response.text()
      data = { error: `API returned non-JSON response: ${textData}` }
    }

    if (!response.ok) {
      // Si le backend n'a pas encore cet endpoint (404), utiliser des données par défaut
      if (response.status === 404) {
        const defaultRoles = [
          {
            id: 'SUPER_ADMIN',
            name: 'Super Administrateur',
            description: 'Accès complet au système',
            category: 'administration',
          },
          {
            id: 'ADMIN',
            name: 'Administrateur',
            description: 'Gestion des utilisateurs et paramètres',
            category: 'administration',
          },
          {
            id: 'MANAGER',
            name: 'Gestionnaire',
            description: 'Gestion des projets et équipes',
            category: 'gestion',
          },
          {
            id: 'USER',
            name: 'Utilisateur',
            description: 'Accès standard aux fonctionnalités',
            category: 'standard',
          },
        ]
        return NextResponse.json(defaultRoles)
      }

      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
