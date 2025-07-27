import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://127.0.0.1:3002'
    
    // Récupérer les headers d'authentification
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    // Extraire le token d'accès du cookie si pas d'Authorization header
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
    
    // Priorité à l'Authorization header, sinon utiliser le token du cookie
    if (authHeader) {
      headers['Authorization'] = authHeader
    } else if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
    
    // Transmettre aussi les cookies pour compatibilité
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    // Construire l'URL avec les query params
    const queryString = searchParams.toString()
    const backendUrl = `${apiUrl}/api/v1/admin/users${queryString ? `?${queryString}` : ''}`

    // Appel vers le backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000) // 10 secondes
    })

    if (response.ok) {
      const responseData = await response.json()
      // Le backend NestJS enveloppe dans {data: {...}, statusCode, message}
      // On veut extraire le contenu réel pour le frontend
      const actualData = responseData.data || responseData
      return NextResponse.json(actualData)
    } else {
      return NextResponse.json(
        { error: `Backend responded with ${response.status}: ${response.statusText}` },
        { status: response.status }
      )
    }
    
  } catch (error) {
    console.error('[Admin Users API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}