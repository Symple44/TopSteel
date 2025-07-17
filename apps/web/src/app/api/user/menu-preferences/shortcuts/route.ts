import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, href, title } = body
    
    console.log('Ajout du raccourci:', { key, href, title })
    
    // Valider les données
    if (!key || !href || !title) {
      return NextResponse.json(
        { success: false, message: 'Données de raccourci invalides' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Raccourci ajouté avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de l\'ajout du raccourci:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de l\'ajout du raccourci',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}