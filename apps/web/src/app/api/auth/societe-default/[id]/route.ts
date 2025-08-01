import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Rediriger vers l'API backend avec authentification automatique
    const response = await callBackendFromApi(req, `auth/societe-default/${id}`, {
      method: 'POST',
    })

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
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
