import type { ReorderableListConfig } from '@erp/ui'
import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/jwt-utils-server'
import { UIPreferencesService } from '@/lib/services/ui-preferences.service'

// GET - Récupérer la configuration d'un composant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ componentId: string }> }
) {
  try {
    const { componentId } = await params

    // Récupérer l'utilisateur authentifié
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Récupérer la configuration depuis la base de données
    const config = await UIPreferencesService.getConfig(user.id, componentId)

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    return NextResponse.json(config)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Sauvegarder/Mettre à jour la configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ componentId: string }> }
) {
  try {
    const { componentId } = await params
    const body = (await request.json()) as Partial<ReorderableListConfig>

    // Validation basique
    if (!body || (body.componentId && body.componentId !== componentId)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Récupérer l'utilisateur authentifié
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Sauvegarder en base de données
    const savedConfig = await UIPreferencesService.saveConfig(user.id, componentId, {
      theme: body.theme,
      preferences: body.preferences,
      layout: body.layout,
    })

    return NextResponse.json(savedConfig)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Supprimer la configuration (reset)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ componentId: string }> }
) {
  try {
    const { componentId } = await params

    // Récupérer l'utilisateur authentifié
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Supprimer de la base de données
    const deleted = await UIPreferencesService.deleteConfig(user.id, componentId)

    if (!deleted) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
