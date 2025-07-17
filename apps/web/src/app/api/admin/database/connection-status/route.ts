import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/admin/database/connection-status`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
    })

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'appel à l\'API' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion:', error)
    
    // Retourner des données mock si l'API n'est pas disponible
    const mockStatus = {
      success: true,
      data: {
        connected: false,
        error: 'API backend non disponible - utilisation des données mock',
        version: 'Mock Database v1.0'
      }
    }
    
    return NextResponse.json(mockStatus)
  }
}