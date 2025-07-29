import { NextRequest, NextResponse } from 'next/server'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantCode: string }> }
) {
  try {
    const { tenantCode } = await params
    
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/v1/admin/database/connections/tenant/${tenantCode}/close`
    
    const response = await safeFetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
    })

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText)
      
      // Simuler une réponse d'erreur
      return NextResponse.json(
        { 
          success: false, 
          message: `API backend non disponible - impossible de fermer la connexion pour le tenant ${tenantCode}` 
        },
        { status: 503 }
      )
    }

    const responseData = await response.json()
    return NextResponse.json(responseData.data || responseData)
  } catch (error) {
    console.error('Erreur lors de la fermeture de la connexion du tenant:', error)
    
    // Simuler une réponse d'erreur
    return NextResponse.json(
      { 
        success: false, 
        message: `Erreur interne - impossible de fermer la connexion pour le tenant ${(await params).tenantCode}` 
      },
      { status: 500 }
    )
  }
}