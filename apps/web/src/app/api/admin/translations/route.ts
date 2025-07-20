import { NextRequest, NextResponse } from 'next/server'
import { authFromRequest, hasAnyRole } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

// GET - Récupérer toutes les traductions
export async function GET(request: NextRequest) {
  try {
    const session = await authFromRequest(request)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions
    if (!hasAnyRole(session, ['SUPER_ADMIN', 'ADMIN'])) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Lire les fichiers de traduction
    const translationsDir = path.join(process.cwd(), 'apps/web/src/lib/i18n/translations')
    
    const translations: Record<string, any> = {}
    
    // Lire tous les fichiers de langue
    const files = await fs.readdir(translationsDir)
    
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const lang = file.replace('.ts', '')
        const filePath = path.join(translationsDir, file)
        
        try {
          // Dynamiquement importer le fichier de traduction
          const module = await import(filePath)
          translations[lang] = module[lang] || module.default
        } catch (error) {
          console.error(`Erreur lors du chargement de ${file}:`, error)
        }
      }
    }

    // Lire les modifications depuis la base de données ou fichier de configuration
    const overridesPath = path.join(process.cwd(), 'data/translation-overrides.json')
    let overrides: Record<string, any> = {}
    
    try {
      const overridesContent = await fs.readFile(overridesPath, 'utf-8')
      overrides = JSON.parse(overridesContent)
    } catch (error) {
      // Fichier n'existe pas encore, pas de problème
    }

    return NextResponse.json({
      success: true,
      data: {
        translations,
        overrides
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des traductions:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Sauvegarder une traduction modifiée
export async function POST(request: NextRequest) {
  try {
    const session = await authFromRequest(request)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions
    if (!hasAnyRole(session, ['SUPER_ADMIN', 'ADMIN'])) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request.json()
    const { translationEntry } = body

    if (!translationEntry || !translationEntry.id) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Créer le dossier data s'il n'existe pas
    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.mkdir(dataDir, { recursive: true })
    } catch (error) {
      // Dossier existe déjà
    }

    // Lire les modifications existantes
    const overridesPath = path.join(dataDir, 'translation-overrides.json')
    let overrides: Record<string, any> = {}
    
    try {
      const content = await fs.readFile(overridesPath, 'utf-8')
      overrides = JSON.parse(content)
    } catch (error) {
      // Fichier n'existe pas, on commence avec un objet vide
    }

    // Ajouter/Mettre à jour la traduction
    overrides[translationEntry.id] = {
      ...translationEntry,
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.email || session.user.id
    }

    // Sauvegarder le fichier
    await fs.writeFile(overridesPath, JSON.stringify(overrides, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Traduction sauvegardée avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    )
  }
}

// PUT - Import en masse des traductions
export async function PUT(request: NextRequest) {
  try {
    const session = await authFromRequest(request)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!hasAnyRole(session, ['SUPER_ADMIN', 'ADMIN'])) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request.json()
    const { translations } = body

    if (!Array.isArray(translations)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
    }

    // Créer le dossier data s'il n'existe pas
    const dataDir = path.join(process.cwd(), 'data')
    try {
      await fs.mkdir(dataDir, { recursive: true })
    } catch (error) {
      // Dossier existe déjà
    }

    // Lire les modifications existantes
    const overridesPath = path.join(dataDir, 'translation-overrides.json')
    let overrides: Record<string, any> = {}
    
    try {
      const content = await fs.readFile(overridesPath, 'utf-8')
      overrides = JSON.parse(content)
    } catch (error) {
      // Fichier n'existe pas
    }

    let imported = 0
    let updated = 0

    // Traiter chaque traduction
    translations.forEach((entry: any) => {
      if (entry.id) {
        const isNew = !overrides[entry.id]
        
        overrides[entry.id] = {
          ...entry,
          updatedAt: new Date().toISOString(),
          updatedBy: session.user.email || session.user.id
        }

        if (isNew) {
          imported++
        } else {
          updated++
        }
      }
    })

    // Sauvegarder
    await fs.writeFile(overridesPath, JSON.stringify(overrides, null, 2))

    return NextResponse.json({
      success: true,
      message: `Import réussi: ${imported} nouvelles, ${updated} mises à jour`,
      stats: { imported, updated }
    })

  } catch (error) {
    console.error('Erreur lors de l\'import:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import' },
      { status: 500 }
    )
  }
}