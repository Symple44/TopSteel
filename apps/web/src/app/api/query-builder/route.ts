import { NextRequest, NextResponse } from 'next/server'

// Fonction utilitaire pour récupérer l'authentification
function getAuthHeaders(request: NextRequest): Record<string, string> {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')
  
  let accessToken = null
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='))
    if (accessTokenCookie) {
      accessToken = accessTokenCookie.split('=')[1]
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (authHeader) {
    headers['Authorization'] = authHeader
  } else if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }
  
  return headers
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002'
    
    const headers = getAuthHeaders(request)
    const queryString = searchParams.toString()
    const backendUrl = `${apiUrl}/api/v1/query-builder${queryString ? `?${queryString}` : ''}`

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000)
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
    console.error('[Query Builder API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002'
    
    const headers = getAuthHeaders(request)
    const body = await request.json()
    const backendUrl = `${apiUrl}/api/v1/query-builder`

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
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
    console.error('[Query Builder API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}