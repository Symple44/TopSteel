import { NextRequest, NextResponse } from 'next/server'
import { safeFetch } from '@/utils/fetch-safe'

export async function GET(
  request: NextRequest,
  { params }: { params: { database: string; migrationName: string } }
) {
  try {
    const { database, migrationName } = params
    
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/v1/admin/database/migrations/${database}/${migrationName}/details`
    
    const response = await safeFetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
      signal: AbortSignal.timeout(10000)
    })

    if (response.ok) {
      const responseData = await response.json()
      return NextResponse.json(responseData.data || responseData)
    } else {
      console.error('API Error:', response.status, response.statusText)
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'API backend non disponible - impossible de récupérer les détails de la migration' 
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de migration:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur interne - impossible de récupérer les détails de la migration' 
      },
      { status: 500 }
    )
  }
}