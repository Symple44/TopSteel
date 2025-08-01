import fs from 'node:fs/promises'
import path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'

// GET - Récupérer les overrides de traduction (public, pas d'auth requise)
export async function GET(_request: NextRequest) {
  try {
    // Lire les overrides depuis le fichier
    const overridesPath = path.join(process.cwd(), 'data/translation-overrides.json')
    let overrides: Record<string, any> = {}

    try {
      const overridesContent = await fs.readFile(overridesPath, 'utf-8')
      overrides = JSON.parse(overridesContent)
    } catch (_error) {
      // Fichier n'existe pas encore, retourner un objet vide
      return NextResponse.json({
        success: true,
        overrides: {},
      })
    }

    return NextResponse.json({
      success: true,
      overrides,
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
