import { NextRequest, NextResponse } from 'next/server'

const templates = {
  minimal: {
    useCustomLayout: true,
    layoutType: 'minimal',
    showIcons: false,
    showBadges: false,
    allowCollapse: true,
    theme: 'light'
  },
  business: {
    useCustomLayout: true,
    layoutType: 'standard',
    showIcons: true,
    showBadges: true,
    allowCollapse: true,
    theme: 'auto'
  },
  admin: {
    useCustomLayout: true,
    layoutType: 'expanded',
    showIcons: true,
    showBadges: true,
    allowCollapse: false,
    theme: 'dark'
  },
  developer: {
    useCustomLayout: true,
    layoutType: 'compact',
    showIcons: true,
    showBadges: false,
    allowCollapse: true,
    theme: 'dark'
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { template: string } }
) {
  try {
    const { template } = params
    
    if (!templates[template as keyof typeof templates]) {
      return NextResponse.json(
        { success: false, message: 'Template inconnu' },
        { status: 400 }
      )
    }
    
    console.log(`Application du template ${template}`)
    
    const templateConfig = templates[template as keyof typeof templates]
    
    const updatedPreferences = {
      id: '1',
      userId: 'current-user',
      ...templateConfig,
      favoriteItems: [],
      hiddenItems: [],
      pinnedItems: [],
      customOrder: {},
      shortcuts: []
    }
    
    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: `Template ${template} appliqué`
    })
  } catch (error) {
    console.error('Erreur lors de l\'application du template:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de l\'application du template',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}