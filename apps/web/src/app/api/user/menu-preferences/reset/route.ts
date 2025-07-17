import { NextRequest, NextResponse } from 'next/server'
import { menuStorage } from '@/lib/menu-storage'

export async function POST(request: NextRequest) {
  try {
    const userId = 'current-user' // Dans un vrai système, récupérer depuis l'auth
    
    // Réinitialiser toutes les données utilisateur
    menuStorage.resetUser(userId)
    
    // Récupérer les nouvelles préférences par défaut
    const resetPreferences = menuStorage.getUserPreferences(userId)
    
    return NextResponse.json({
      success: true,
      data: resetPreferences,
      message: 'Préférences réinitialisées'
    })
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la réinitialisation',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}