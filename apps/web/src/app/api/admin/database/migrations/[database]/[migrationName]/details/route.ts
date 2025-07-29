import { NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ database: string; migrationName: string }> }
) {
  try {
    const { database, migrationName } = await params
    
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/v1/admin/database/migrations/${database}/${migrationName}/details`
    
    const response = await callBackendFromApi(request, `admin/database/migrations/${database}/${migrationName}/details`, {
      method: 'GET',
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