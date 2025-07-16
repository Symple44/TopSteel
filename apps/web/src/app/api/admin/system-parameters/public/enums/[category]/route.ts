import { NextRequest, NextResponse } from 'next/server'

// Définitions des enums par catégorie
const enumDefinitions: Record<string, string[]> = {
  currency: ['EUR', 'USD', 'GBP'],
  weight: ['kg', 't', 'g'],
  length: ['mm', 'cm', 'm'],
  material: ['Acier', 'Inox', 'Aluminium', 'Cuivre'],
  status: ['Actif', 'Inactif', 'En attente'],
  priority: ['Faible', 'Moyenne', 'Élevée', 'Urgente'],
  type: ['Commande', 'Devis', 'Facture', 'Avoir'],
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      )
    }

    const enumValues = enumDefinitions[category.toLowerCase()]

    if (!enumValues) {
      return NextResponse.json(
        { error: `Enum category '${category}' not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(enumValues)
  } catch (error) {
    console.error('Error fetching enum values:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enum values' },
      { status: 500 }
    )
  }
}