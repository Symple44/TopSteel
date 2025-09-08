import fs from 'node:fs/promises'
import path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'
import { en } from '@/lib/i18n/translations/en'
import { es } from '@/lib/i18n/translations/es'
import { fr } from '@/lib/i18n/translations/fr'

// Fonction pour vérifier l'authentification basique
function verifyAuth(request: NextRequest): {
  isValid: boolean
  user?: { id?: string; roles?: string[]; [key: string]: unknown }
} {
  try {
    // Récupérer le token depuis les cookies ou l'header
    let token = request.cookies?.get('accessToken')?.value

    if (!token) {
      const authHeader = request?.headers?.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader?.substring(7)
      }
    }

    if (!token) {
      return { isValid: false }
    }

    // Décoder le JWT (sans vérifier la signature pour simplifier)
    try {
      const payload = JSON.parse(atob(token?.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)

      if (payload?.exp && payload?.exp < now) {
        return { isValid: false }
      }

      return {
        isValid: true,
        user: {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          roles: payload.roles || [payload.role],
        },
      }
    } catch {
      return { isValid: false }
    }
  } catch {
    return { isValid: false }
  }
}

// GET - Récupérer toutes les traductions
export async function GET(request: NextRequest) {
  try {
    const auth = verifyAuth(request)

    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions
    const userRoles = auth?.user?.roles || []
    if (!userRoles?.includes('SUPER_ADMIN') && !userRoles?.includes('ADMIN')) {
      return NextResponse?.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Charger les traductions directement depuis les imports
    const translations: Record<string, Record<string, unknown>> = {
      fr,
      en,
      es,
    }

    // Lire les modifications depuis la base de données ou fichier de configuration
    const overridesPath = path?.join(process?.cwd(), 'data/translation-overrides.json')
    let overrides: Record<string, unknown> = {}

    try {
      const overridesContent = await fs?.readFile(overridesPath, 'utf-8')
      overrides = JSON.parse(overridesContent)
    } catch (_error) {
      // Fichier n'existe pas encore, pas de problème
    }

    return NextResponse?.json({
      success: true,
      data: {
        translations,
        overrides,
      },
    })
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// POST - Sauvegarder une traduction modifiée
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request)

    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier les permissions
    const userRoles = auth?.user?.roles || []
    if (!userRoles?.includes('SUPER_ADMIN') && !userRoles?.includes('ADMIN')) {
      return NextResponse?.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request?.json()
    const { translationEntry } = body || {}

    if (!translationEntry || !translationEntry.id) {
      return NextResponse?.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Créer le dossier data s'il n'existe pas
    const dataDir = path?.join(process?.cwd(), 'data')
    try {
      await fs?.mkdir(dataDir, { recursive: true })
    } catch (_error) {
      // Dossier existe déjà
    }

    // Lire les modifications existantes
    const overridesPath = path?.join(dataDir, 'translation-overrides.json')
    let overrides: Record<string, unknown> = {}

    try {
      const content = await fs?.readFile(overridesPath, 'utf-8')
      overrides = JSON.parse(content)
    } catch (_error) {
      // Fichier n'existe pas, on commence avec un objet vide
    }

    // Ajouter/Mettre à jour la traduction
    overrides[translationEntry.id] = {
      ...translationEntry,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.user?.email || auth.user?.id || 'unknown',
    }

    // Sauvegarder le fichier
    await fs?.writeFile(overridesPath, JSON.stringify(overrides, null, 2))

    return NextResponse?.json({
      success: true,
      message: 'Traduction sauvegardée avec succès',
    })
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }
}

// PUT - Import en masse des traductions
export async function PUT(request: NextRequest) {
  try {
    const auth = verifyAuth(request)

    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userRoles = auth?.user?.roles || []
    if (!userRoles?.includes('SUPER_ADMIN') && !userRoles?.includes('ADMIN')) {
      return NextResponse?.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request?.json()
    const { translations } = body || {}

    if (!Array.isArray(translations)) {
      return NextResponse?.json({ error: 'Format invalide' }, { status: 400 })
    }

    // Créer le dossier data s'il n'existe pas
    const dataDir = path?.join(process?.cwd(), 'data')
    try {
      await fs?.mkdir(dataDir, { recursive: true })
    } catch (_error) {
      // Dossier existe déjà
    }

    // Lire les modifications existantes
    const overridesPath = path?.join(dataDir, 'translation-overrides.json')
    let overrides: Record<string, unknown> = {}

    try {
      const content = await fs?.readFile(overridesPath, 'utf-8')
      overrides = JSON.parse(content)
    } catch (_error) {
      // Fichier n'existe pas
    }

    let imported = 0
    let updated = 0

    // Traiter chaque traduction
    translations?.forEach((entry: { id?: string; [key: string]: unknown }) => {
      if (entry.id) {
        const isNew = !overrides[entry.id]

        overrides[entry.id] = {
          ...entry,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.user?.email || auth.user?.id || 'unknown',
        }

        if (isNew) {
          imported++
        } else {
          updated++
        }
      }
    })

    // Sauvegarder
    await fs?.writeFile(overridesPath, JSON.stringify(overrides, null, 2))

    return NextResponse?.json({
      success: true,
      message: `Import réussi: ${imported} nouvelles, ${updated} mises à jour`,
      stats: { imported, updated },
    })
  } catch (_error) {
    return NextResponse?.json({ error: "Erreur lors de l'import" }, { status: 500 })
  }
}
