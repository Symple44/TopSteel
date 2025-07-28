import { NextRequest, NextResponse } from 'next/server'
import { safeFetch } from '@/utils/fetch-safe'

export async function GET(request: NextRequest) {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/v1/admin/database/migrations/status`
    
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

    console.log(`[API Route] Tentative de connexion à: ${apiUrl}`)
    
    const response = await safeFetch(apiUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000)
    })

    console.log(`[API Route] Réponse reçue: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const responseData = await response.json()
      const actualData = responseData.data || responseData
      console.log(`[API Route] Données reçues:`, actualData)
      return NextResponse.json(actualData)
    } else {
      const errorText = await response.text()
      console.error(`[API Route] Erreur backend: ${response.status} - ${errorText}`)
      return NextResponse.json(
        { 
          error: 'API backend error', 
          status: response.status,
          details: errorText,
          url: apiUrl
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('[API Route] Erreur lors de la récupération des migrations:', error)
    console.error('[API Route] URL tentée:', apiUrl)
    
    // Plus de détails sur l'erreur
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      name: error instanceof Error ? error.name : 'UnknownError',
      url: apiUrl,
      env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    }
    
    return NextResponse.json(
      { 
        error: 'API backend non disponible',
        details: errorDetails
      },
      { status: 503 }
    )
  }
}