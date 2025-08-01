import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Valider les données importées
    if (!body.preferences || !body.version) {
      return NextResponse.json(
        { success: false, message: 'Format de données invalide' },
        { status: 400 }
      )
    }

    // Pour le moment, simuler l'import
    const importedPreferences = {
      ...body.preferences,
      id: '1',
      userId: 'current-user',
    }

    return NextResponse.json({
      success: true,
      data: importedPreferences,
      message: 'Préférences importées avec succès',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'import",
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
