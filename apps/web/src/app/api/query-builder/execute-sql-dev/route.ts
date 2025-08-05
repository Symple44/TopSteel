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

// Route de développement qui appelle directement le backend SANS vérification stricte du company_id
export async function POST(request: NextRequest) {
  try {
    const _headers = getAuthHeaders(request)
    const body = await request.json()
    const { sql, limit = 100 } = body

    if (!sql) {
      return NextResponse.json({ error: 'SQL query is required' }, { status: 400 })
    }

    // 🛡️ Validation SQL basique côté frontend
    const sqlLower = sql.toLowerCase().trim()

    // Vérifier que c'est une requête SELECT
    if (!sqlLower.startsWith('select')) {
      return NextResponse.json({ error: 'Only SELECT queries are allowed' }, { status: 400 })
    }

    const response = await callBackendFromApi(request, 'query-builder/execute-sql', {
      method: 'POST',
      body: JSON.stringify({
        sql,
        limit,
        // Ne pas envoyer de companyId pour le mode dev
      }),
    })

    if (response.ok) {
      const responseData = await response.json()

      // La réponse peut être dans différents formats selon le backend
      const actualData = responseData.data || responseData.rows || responseData
      return NextResponse.json(actualData)
    } else {
      const errorText = await response.text()

      // Si le backend refuse, essayer une approche alternative
      if (response.status === 403 || response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication required. Please login and try again.' },
          { status: response.status }
        )
      }

      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
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
