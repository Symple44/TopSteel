import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentification requise'
        },
        { status: 401 }
      )
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences/menu`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Gérer les différentes structures de réponse possibles
        if (data.data && data.data.success) {
          // Structure: { data: { success: true, data: [...] } }
          return NextResponse.json({
            success: data.data.success,
            data: data.data.data,
            message: data.message || 'Menu récupéré avec succès'
          })
        } else if (data.success) {
          // Structure: { success: true, data: [...] }
          return NextResponse.json(data)
        } else {
          // Structure directe ou autre
          return NextResponse.json(data)
        }
      } else {
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (backendError) {
      console.error('Backend indisponible:', backendError)
      throw backendError
    }
  } catch (error) {
    console.error('Erreur lors du chargement du menu personnalisé:', error)
    
    // Retourner une erreur 500
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement du menu',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Pour le moment, simuler la sauvegarde
    console.log('Sauvegarde des préférences menu:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Préférences de menu sauvegardées'
    })
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la sauvegarde des préférences',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}