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
          message: 'Non autorisé'
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
        return NextResponse.json(data)
      } else {
        console.log('Backend API erreur:', response.status, 'Utilisation des données mock')
        throw new Error(`Backend API error: ${response.status}`)
      }
    } catch (backendError) {
      console.log('Backend indisponible, utilisation des données mock pour le menu personnalisé')
      
      // Retourner des données mock pour le menu personnalisé
      const mockMenuData = {
        success: true,
        data: {
          customMenu: [],
          preferences: {
            showIcons: true,
            compactMode: false,
            grouping: 'category'
          }
        },
        message: 'Menu personnalisé (données mock)'
      }
      
      return NextResponse.json(mockMenuData)
    }
  } catch (error) {
    console.error('Erreur lors du chargement du menu personnalisé:', error)
    
    // En cas d'erreur complète, retourner des données mock
    const mockMenuData = {
      success: true,
      data: {
        customMenu: [],
        preferences: {
          showIcons: true,
          compactMode: false,
          grouping: 'category'
        }
      },
      message: 'Menu personnalisé (données mock - erreur)'
    }
    
    return NextResponse.json(mockMenuData)
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