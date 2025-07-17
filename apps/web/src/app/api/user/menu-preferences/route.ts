import { NextRequest, NextResponse } from 'next/server'
import { menuStorage } from '@/lib/menu-storage'

export async function GET(request: NextRequest) {
  try {
    const userId = 'current-user' // Dans un vrai système, récupérer depuis l'auth
    
    const preferences = menuStorage.getUserPreferences(userId)
    
    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'Préférences chargées'
    })
  } catch (error) {
    console.error('Erreur lors du chargement des préférences:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement des préférences',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = 'current-user' // Dans un vrai système, récupérer depuis l'auth
    
    // Récupérer les préférences existantes
    const currentPreferences = menuStorage.getUserPreferences(userId)
    
    // Fusionner avec les nouvelles données
    const updatedPreferences = {
      ...currentPreferences,
      ...body,
      id: currentPreferences.id,
      userId: currentPreferences.userId
    }
    
    // Sauvegarder
    menuStorage.setUserPreferences(userId, updatedPreferences)
    
    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: 'Préférences mises à jour'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la mise à jour des préférences',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}