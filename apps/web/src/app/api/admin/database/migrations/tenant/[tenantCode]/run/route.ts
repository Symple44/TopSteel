import { NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantCode: string }> }
) {
  try {
    const { tenantCode } = await params
    console.log(`[NextJS Route] Exécution des migrations pour le tenant: ${tenantCode}`)
    
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/v1/admin/database/migrations/tenant/${tenantCode}/run`
    console.log(`[NextJS Route] URL de l'API backend: ${apiUrl}`)
    
    const response = await callBackendFromApi(request, `admin/database/migrations/tenant/${tenantCode}/run`, {
      method: 'POST',
    })

    console.log(`[NextJS Route] Réponse du backend: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      console.error('[NextJS Route] API Error:', response.status, response.statusText)
      
      // Essayer de récupérer le détail de l'erreur
      let errorDetail = 'Erreur inconnue'
      try {
        const errorData = await response.text()
        console.error('[NextJS Route] Détail de l\'erreur:', errorData)
        errorDetail = errorData
      } catch (e) {
        console.error('[NextJS Route] Impossible de lire le détail de l\'erreur:', e)
      }
      
      // Simuler une réponse d'erreur
      return NextResponse.json(
        { 
          success: false, 
          message: `API backend non disponible - impossible d'exécuter les migrations pour le tenant ${tenantCode}`,
          error: errorDetail,
          status: response.status
        },
        { status: 503 }
      )
    }

    const responseData = await response.json()
    console.log(`[NextJS Route] Données de réponse:`, responseData)
    return NextResponse.json(responseData.data || responseData)
  } catch (error) {
    console.error('[NextJS Route] Erreur lors de l\'exécution des migrations du tenant:', error)
    
    // Simuler une réponse d'erreur
    return NextResponse.json(
      { 
        success: false, 
        message: `Erreur interne - impossible d'exécuter les migrations pour le tenant` 
      },
      { status: 500 }
    )
  }
}