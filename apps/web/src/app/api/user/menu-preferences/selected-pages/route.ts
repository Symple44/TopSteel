import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { serverStorage } from '@/lib/server-storage'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    if (!token) {
      console.log('Pas de token, utilisation du stockage local')
      // Continuer sans token en mode dev
    }
    
    try {
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences/selected-pages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        } else {
          console.log('Backend API erreur:', response.status, 'Utilisation du stockage local')
          throw new Error(`Backend API error: ${response.status}`)
        }
      } else {
        throw new Error('Pas de token')
      }
    } catch (backendError) {
      console.log('Backend indisponible, utilisation du stockage local')
      
      // Utiliser le stockage serveur local
      const savedPages = await serverStorage.getSelectedPages()
      
      return NextResponse.json({
        success: true,
        data: savedPages,
        message: 'Pages sélectionnées (stockage local)'
      })
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des pages sélectionnées:', error)
    
    // En cas d'erreur, utiliser les valeurs par défaut
    try {
      const defaultPages = await serverStorage.getSelectedPages()
      return NextResponse.json({
        success: true,
        data: defaultPages,
        message: 'Pages sélectionnées (valeurs par défaut)'
      })
    } catch {
      return NextResponse.json({
        success: true,
        data: ['dashboard', 'clients', 'projets', 'stocks', 'production'],
        message: 'Pages sélectionnées (valeurs par défaut)'
      })
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    if (!token) {
      // En mode dev, continuer même sans token
      console.log('Pas de token, sauvegarde locale des pages sélectionnées')
    }
    
    try {
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences/selected-pages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      }
    } catch (backendError) {
      console.log('Backend indisponible, sauvegarde locale')
    }
    
    // Sauvegarder les pages sélectionnées dans le stockage local
    const selectedPages = body.selectedPages || []
    await serverStorage.saveSelectedPages(selectedPages)
    
    console.log('Pages sélectionnées sauvegardées:', selectedPages.length, 'pages')
    return NextResponse.json({
      success: true,
      data: selectedPages,
      message: 'Pages sélectionnées sauvegardées avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des pages sélectionnées:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la sauvegarde',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}