import { type NextRequest, NextResponse } from 'next/server'
import { SYSTEM_MODULES, SYSTEM_PERMISSIONS } from '@/types/permissions'

// GET - Récupérer tous les modules avec leurs permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams.get('includePermissions') === 'true'
    const category = searchParams.get('category')

    let modules = SYSTEM_MODULES

    // Filtrer par catégorie si spécifiée
    if (category) {
      modules = modules.filter((module) => module.category === category)
    }

    // Ajouter les permissions si demandées
    const result = modules.map((module) => ({
      ...module,
      permissions: includePermissions ? SYSTEM_PERMISSIONS[module.id] || [] : [],
    }))

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        total: result.length,
        categories: [...new Set(SYSTEM_MODULES.map((m) => m.category))],
        byCategory: {
          CORE: SYSTEM_MODULES.filter((m) => m.category === 'CORE').length,
          BUSINESS: SYSTEM_MODULES.filter((m) => m.category === 'BUSINESS').length,
          ADMIN: SYSTEM_MODULES.filter((m) => m.category === 'ADMIN').length,
          REPORTS: SYSTEM_MODULES.filter((m) => m.category === 'REPORTS').length,
        },
      },
    })
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des modules' },
      { status: 500 }
    )
  }
}
