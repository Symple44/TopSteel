import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Login attempt for:', body.login)

    // Rediriger vers l'API backend
    const response = await callBackendFromApi(req, 'auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
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
  } catch (error) {
    console.error('Auth login error:', error)
    return NextResponse.json(
      {
        message: 'Une erreur inattendue est survenue',
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
