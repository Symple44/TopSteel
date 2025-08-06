import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

// Fonction utilitaire pour récupérer l'authentification
function getAuthHeaders(request: NextRequest): Record<string, string> {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')

  let accessToken = null
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim())
    const accessTokenCookie = cookies.find((c) => c.startsWith('accessToken='))
    if (accessTokenCookie) {
      accessToken = accessTokenCookie.split('=')[1]
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authHeader) {
    headers.Authorization = authHeader
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  if (cookieHeader) {
    headers.Cookie = cookieHeader
  }

  return headers
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams: _ } = new URL(request.url)

    // Pour l'instant, retournons des données mock en attendant l'implémentation backend
    const mockQueryBuilders = [
      {
        id: '1',
        name: 'Users Analysis',
        description: 'Analyse des utilisateurs actifs',
        database: 'topsteel_auth',
        table: 'users',
        isPublic: false,
        maxRows: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin@topsteel.tech',
        columns: ['id', 'email', 'nom', 'prenom', 'created_at'],
        query:
          'SELECT id, email, nom, prenom, created_at FROM users WHERE created_at >= NOW() - INTERVAL 30 DAY',
      },
      {
        id: '2',
        name: 'Menu Configuration Report',
        description: 'Rapport des configurations de menu',
        database: 'topsteel_auth',
        table: 'menu_configurations',
        isPublic: true,
        maxRows: 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin@topsteel.tech',
        columns: ['id', 'name', 'is_active', 'created_at'],
        query:
          'SELECT id, name, is_active, created_at FROM menu_configurations ORDER BY created_at DESC',
      },
    ]

    return NextResponse.json(mockQueryBuilders)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request)
    const body = await request.json()

    const response = await callBackendFromApi(request, 'query-builder', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const responseData = await response.json()
      const actualData = responseData.data || responseData
      return NextResponse.json(actualData)
    } else {
      return NextResponse.json(
        { error: `Backend responded with ${response.status}: ${response.statusText}` },
        { status: response.status }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}
