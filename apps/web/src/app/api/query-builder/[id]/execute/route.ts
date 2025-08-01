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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002'

    const _headers = getAuthHeaders(request)
    const body = await request.json()
    const { id } = await params
    const _backendUrl = `${apiUrl}/api/v1/query-builder/${id}/execute`

    const response = await callBackendFromApi(request, `query-builder/${id}/execute`, {
      method: 'POST',
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
