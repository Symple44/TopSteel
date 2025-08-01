import { type NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '@/lib/auth-helper'

interface HierarchyOrderItem {
  item_id: string
  parent_id?: string | null
  display_order: number
  level: number
  path: string
}

interface HierarchyUpdateRequest {
  items: HierarchyOrderItem[]
}

// GET - Récupérer l'ordre hiérarchique pour une table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const auth = await verifyAuthHelper(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { tableId } = await params

    // Simuler la récupération depuis la base de données
    // En production, remplacer par une vraie requête DB
    const mockHierarchyOrder: HierarchyOrderItem[] = [
      {
        item_id: 'item-1',
        parent_id: null,
        display_order: 1,
        level: 0,
        path: '1',
      },
      {
        item_id: 'item-1-1',
        parent_id: 'item-1',
        display_order: 1,
        level: 1,
        path: '1.1',
      },
      {
        item_id: 'item-1-2',
        parent_id: 'item-1',
        display_order: 2,
        level: 1,
        path: '1.2',
      },
      {
        item_id: 'item-2',
        parent_id: null,
        display_order: 2,
        level: 0,
        path: '2',
      },
    ]

    return NextResponse.json({
      table_id: tableId,
      user_id: 'mock-user',
      items: mockHierarchyOrder,
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour l'ordre hiérarchique complet
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const auth = await verifyAuthHelper(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { tableId } = await params
    const { items }: HierarchyUpdateRequest = await request.json()

    // Valider les données
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Format de données invalide' }, { status: 400 })
    }

    // Valider chaque élément
    for (const item of items) {
      if (
        !item.item_id ||
        typeof item.display_order !== 'number' ||
        typeof item.level !== 'number'
      ) {
        return NextResponse.json({ error: "Données d'élément invalides" }, { status: 400 })
      }
    }

    // Générer les chemins hiérarchiques
    const processedItems = items.map((item) => ({
      ...item,
      path: generatePath(item, items),
    }))

    return NextResponse.json({
      success: true,
      table_id: tableId,
      user_id: 'mock-user',
      items: processedItems,
      updated_at: new Date().toISOString(),
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Ajouter un nouvel élément à la hiérarchie
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const auth = await verifyAuthHelper(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { tableId } = await params
    const newItem: Omit<HierarchyOrderItem, 'path'> = await request.json()

    // Valider les données
    if (
      !newItem.item_id ||
      typeof newItem.display_order !== 'number' ||
      typeof newItem.level !== 'number'
    ) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Simuler l'ajout en base de données
    const processedItem: HierarchyOrderItem = {
      ...newItem,
      path: newItem.parent_id
        ? `${newItem.parent_id}.${newItem.display_order}`
        : `${newItem.display_order}`,
    }

    return NextResponse.json(
      {
        success: true,
        item: processedItem,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un élément de la hiérarchie
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const auth = await verifyAuthHelper(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { tableId } = await params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: "ID d'élément requis" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      deleted_item_id: itemId,
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Fonction utilitaire pour générer les chemins hiérarchiques
function generatePath(item: HierarchyOrderItem, allItems: HierarchyOrderItem[]): string {
  if (!item.parent_id) {
    return item.display_order.toString()
  }

  const parent = allItems.find((i) => i.item_id === item.parent_id)
  if (!parent) {
    return item.display_order.toString()
  }

  const parentPath = generatePath(parent, allItems)
  return `${parentPath}.${item.display_order}`
}
