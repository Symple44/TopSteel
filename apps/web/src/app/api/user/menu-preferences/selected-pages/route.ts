import { NextRequest, NextResponse } from 'next/server'
import { menuStorage } from '@/lib/menu-storage'

export async function GET(request: NextRequest) {
  try {
    const userId = 'current-user' // Dans un vrai système, récupérer depuis l'auth
    
    const selectedPages = menuStorage.getSelectedPages(userId)
    
    return NextResponse.json({
      success: true,
      data: selectedPages,
      message: 'Pages sélectionnées récupérées'
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des pages sélectionnées:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la récupération',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { selectedPages } = body
    const userId = 'current-user' // Dans un vrai système, récupérer depuis l'auth
    
    // Valider les données
    if (!Array.isArray(selectedPages)) {
      return NextResponse.json(
        { success: false, message: 'selectedPages doit être un tableau' },
        { status: 400 }
      )
    }
    
    // Sauvegarder les pages sélectionnées
    menuStorage.setSelectedPages(userId, selectedPages)
    
    return NextResponse.json({
      success: true,
      data: selectedPages,
      message: 'Pages sélectionnées sauvegardées'
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