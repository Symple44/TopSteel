import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    // Appeler l'API backend pour récupérer la configuration de menu active
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
    
    const response = await safeFetch(`${apiUrl}/api/v1/admin/menu-raw/configurations/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    // Vérifier si la réponse est JSON
    let data
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json()
      } catch (e) {
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
    console.error('Erreur lors de la récupération de la configuration de menu active:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}