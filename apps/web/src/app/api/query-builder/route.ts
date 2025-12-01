import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../utils/backend-api'

// Fonction utilitaire pour récupérer l'authentification
function getAuthHeaders(request: NextRequest): Record<string, string> {
  const authHeader = request?.headers?.get('authorization')
  const cookieHeader = request?.headers?.get('cookie')

  let accessToken: string | null = null
  if (cookieHeader) {
    const cookies = cookieHeader?.split(';').map((c) => c?.trim())
    const accessTokenCookie = cookies?.find((c) => c?.startsWith('accessToken='))
    if (accessTokenCookie) {
      accessToken = accessTokenCookie?.split('=')[1]
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
    const headers = getAuthHeaders(request)

    // Call the backend API to get query builders
    const response = await callBackendFromApi(request, 'query-builder', {
      method: 'GET',
      headers,
    })

    if (response?.ok) {
      const responseData = await response?.json()
      const actualData = responseData?.data || responseData
      return NextResponse?.json(actualData)
    } else {
      // If backend returns an error, return it
      const errorData = await response?.json().catch(() => ({}))
      return NextResponse?.json(
        { error: errorData?.message || `Backend responded with ${response?.status}` },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('[query-builder/GET] Error:', error)
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request)
    const body = await request?.json()

    const response = await callBackendFromApi(request, 'query-builder', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (response?.ok) {
      const responseData = await response?.json()
      const actualData = responseData?.data || responseData
      return NextResponse?.json(actualData)
    } else {
      return NextResponse?.json(
        { error: `Backend responded with ${response?.status}: ${response?.statusText}` },
        { status: response.status }
      )
    }
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}
