import { NextResponse } from 'next/server'

const samplePreferences = {
  id: '1',
  userId: 'current-user',
  useCustomLayout: false,
  layoutType: 'standard',
  showIcons: true,
  showBadges: true,
  allowCollapse: true,
  theme: 'auto',
  favoriteItems: [],
  hiddenItems: [],
  pinnedItems: [],
  customOrder: {},
  shortcuts: [],
}

export async function GET() {
  try {
    // Pour le moment, exporter les préférences par défaut
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      preferences: samplePreferences,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="menu-preferences.json"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'export",
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
