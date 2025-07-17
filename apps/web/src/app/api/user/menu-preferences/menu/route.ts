import { NextRequest, NextResponse } from 'next/server'
import { menuStorage, allAvailablePages } from '@/lib/menu-storage'

export async function GET(request: NextRequest) {
  try {
    const userId = 'current-user' // Dans un vrai système, récupérer depuis l'auth
    const selectedPageIds = menuStorage.getSelectedPages(userId)
    
    // Filtrer les pages disponibles selon la sélection utilisateur
    const customMenu = allAvailablePages
      .filter(page => selectedPageIds.includes(page.id))
      .map(page => ({
        id: page.id,
        title: page.title,
        href: page.href,
        icon: page.icon,
        orderIndex: selectedPageIds.indexOf(page.id), // Ordre selon la sélection
        isVisible: true,
        children: [],
        depth: 0
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex) // Trier par ordre de sélection
    
    return NextResponse.json({
      success: true,
      data: customMenu,
      message: `Menu personnalisé chargé avec ${customMenu.length} pages`
    })
  } catch (error) {
    console.error('Erreur lors du chargement du menu personnalisé:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement du menu personnalisé',
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