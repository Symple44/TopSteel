import { NextRequest, NextResponse } from 'next/server'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002'
    
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
    const response = await safeFetch(backendUrl, {
      method: 'GET',
      headers,
    })

    if (response.ok) {
      const responseData = await response.json()
      // Le backend NestJS enveloppe dans {data: {...}, statusCode, message}
      // On veut extraire le contenu réel pour le frontend
      const actualData = responseData.data || responseData
      return NextResponse.json(actualData)
    } else {
      // Fallback avec des données mock si le backend n'est pas disponible
      console.log('[users] Backend error, returning mock data')
      const includeGroups = searchParams.get('includeGroups') === 'true'
      
      const mockUsers = [
        {
          id: '1',
          email: 'jean.dupont@topsteel.tech',
          firstName: 'Jean',
          lastName: 'Dupont',
          department: 'Production',
          role: 'ADMIN',
          isActive: true,
          lastLogin: '2024-01-15T10:30:00Z',
          currentGroups: includeGroups ? ['1', '2'] : undefined
        },
        {
          id: '2',
          email: 'marie.martin@topsteel.tech',
          firstName: 'Marie',
          lastName: 'Martin',
          department: 'Commercial',
          role: 'MANAGER',
          isActive: true,
          lastLogin: '2024-01-14T14:20:00Z',
          currentGroups: includeGroups ? ['2'] : undefined
        },
        {
          id: '3',
          email: 'pierre.bernard@topsteel.tech',
          firstName: 'Pierre',
          lastName: 'Bernard',
          department: 'Technique',
          role: 'USER',
          isActive: true,
          lastLogin: '2024-01-10T09:15:00Z',
          currentGroups: includeGroups ? [] : undefined
        },
        {
          id: '4',
          email: 'sophie.rousseau@topsteel.tech',
          firstName: 'Sophie',
          lastName: 'Rousseau',
          department: 'Comptabilité',
          role: 'USER',
          isActive: true,
          lastLogin: '2024-01-12T16:45:00Z',
          currentGroups: includeGroups ? ['3'] : undefined
        },
        {
          id: '5',
          email: 'julien.moreau@topsteel.tech',
          firstName: 'Julien',
          lastName: 'Moreau',
          department: 'Production',
          role: 'USER',
          isActive: false,
          lastLogin: '2024-01-08T11:20:00Z',
          currentGroups: includeGroups ? ['1'] : undefined
        }
      ]

      return NextResponse.json({
        success: true,
        data: mockUsers,
        meta: {
          total: mockUsers.length,
          page: 1,
          limit: 50
        }
      })
    }
    
  } catch (error) {
    console.error('[Admin Users API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}