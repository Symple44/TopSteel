import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    
    // Appeler directement l'API backend
    const response = await callBackendFromApi(req, 'admin/menu-raw/configurations', {
      method: 'GET',
    })

    const data = await response.json()
    
    // Extraire les données de la structure imbriquée
    if (data && data.data && data.data.data) {
      return NextResponse.json({
        success: true,
        data: data.data.data
      })
    }
    
    // Si structure différente, retourner tel quel
    return NextResponse.json(data, { status: response.status })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des configurations:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Erreur serveur',
      data: []
    }, { 
      status: 500 
    })
  }
}