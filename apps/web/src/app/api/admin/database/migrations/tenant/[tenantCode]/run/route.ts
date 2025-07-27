import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantCode: string } }
) {
  try {
    const { tenantCode } = params
    
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/admin/database/migrations/tenant/${tenantCode}/run`
    
    const response = await fetch(apiUrl, {
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
          message: `API backend non disponible - impossible d'exécuter les migrations pour le tenant ${tenantCode}` 
        },
        { status: 503 }
      )
    }

    const responseData = await response.json()
    return NextResponse.json(responseData.data || responseData)
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations du tenant:', error)
    
    // Simuler une réponse d'erreur
    return NextResponse.json(
      { 
        success: false, 
        message: `Erreur interne - impossible d'exécuter les migrations pour le tenant ${params.tenantCode}` 
      },
      { status: 500 }
    )
  }
}