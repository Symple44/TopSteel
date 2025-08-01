import { type NextRequest, NextResponse } from 'next/server'
import type { ReorderableListConfig } from '@erp/ui'

// Mock database - À remplacer par votre vraie base de données
const mockDB = new Map<string, ReorderableListConfig>()

// GET - Récupérer la configuration d'un composant
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ componentId: string }> }
) {
  try {
    const { componentId } = await params

    // TODO: Récupérer l'utilisateur depuis la session/JWT
    const userId = 'mock-user-id' // À remplacer par la vraie logique d'auth

    const configKey = `${userId}-${componentId}`
    const config = mockDB.get(configKey)

    if (!config) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 })
    }

    return NextResponse.json(config)
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Sauvegarder/Mettre à jour la configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ componentId: string }> }
) {
  try {
    const { componentId } = await params
    const body = (await request.json()) as ReorderableListConfig

    // Validation basique
    if (!body || !body.componentId || body.componentId !== componentId) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    // TODO: Récupérer l'utilisateur depuis la session/JWT
    const userId = 'mock-user-id' // À remplacer par la vraie logique d'auth

    // Enrichir avec les métadonnées
    const config: ReorderableListConfig = {
      ...body,
      userId,
      componentId,
      updatedAt: new Date(),
    }

    // Si pas d'ID, c'est une création
    if (!config.id) {
      config.id = `${componentId}-${userId}-${Date.now()}`
      config.createdAt = new Date()
    }

    const configKey = `${userId}-${componentId}`
    mockDB.set(configKey, config)

    // TODO: Sauvegarder en base de données
    /*
    const savedConfig = await db.uiPreferences.upsert({
      where: {
        userId_componentId: {
          userId,
          componentId
        }
      },
      update: {
        theme: config.theme,
        preferences: config.preferences,
        layout: config.layout,
        updatedAt: config.updatedAt
      },
      create: config
    })
    */

    return NextResponse.json(config)
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer la configuration (reset)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ componentId: string }> }
) {
  try {
    const { componentId } = await params

    // TODO: Récupérer l'utilisateur depuis la session/JWT
    const userId = 'mock-user-id'

    const configKey = `${userId}-${componentId}`
    const deleted = mockDB.delete(configKey)

    if (!deleted) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
