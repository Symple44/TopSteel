import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    // Rediriger vers l'API backend via l'utilitaire harmonisé
    const response = await callBackendFromApi(req, 'auth/societes', {
      method: 'GET',
    })

    // Vérifier si la réponse est JSON
    let data: unknown
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
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
