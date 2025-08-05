import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    // Rediriger vers l'API backend
    const response = await callBackendFromApi(req, 'auth/user/default-company', {
      method: 'GET',
    })

    const data = await response.json()

    if (!response.ok) {
      // Si l'utilisateur n'est pas encore complètement authentifié (401),
      // retourner une réponse vide au lieu d'une erreur
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          message: 'No default company set yet',
        })
      }
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Rediriger vers l'API backend
    const response = await callBackendFromApi(req, 'auth/user/default-company', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
