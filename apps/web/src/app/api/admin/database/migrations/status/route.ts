import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/admin/database/migrations/status`
    
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

    const response = await fetch(apiUrl, {
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
        { error: 'API backend error', status: response.status },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des migrations:', error)
    return NextResponse.json(
      { error: 'API backend non disponible' },
      { status: 503 }
    )
  }
}