import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Appeler l'API backend pour récupérer la configuration active
    const response = await callBackendFromApi(req, 'admin/menu-raw/configurations/active', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()

    if (!responseData.data) {
      return NextResponse.json({ 
        success: false, 
        message: 'Aucune configuration active trouvée' 
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        configuration: responseData.data.configuration,
        menuTree: responseData.data.menuTree || []
      }
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération de la configuration active:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Erreur serveur' 
    }, { 
      status: error.response?.status || 500 
    })
  }
}