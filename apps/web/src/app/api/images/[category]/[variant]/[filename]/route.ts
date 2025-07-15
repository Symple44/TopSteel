import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { stat } from 'fs/promises'

interface RouteParams {
  category: string
  variant: string
  filename: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { category, variant, filename } = await params

    // Validation des paramètres
    const validCategories = ['avatar', 'logo', 'document']
    const validVariants = ['original', 'thumbnail', 'medium', 'large']

    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    if (!validVariants.includes(variant)) {
      return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
    }

    // Construction du chemin du fichier
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const filePath = path.join(uploadsDir, 'images', category, variant, filename)

    // Vérification de l'existence du fichier
    try {
      await stat(filePath)
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Lecture du fichier
    const fileBuffer = await fs.readFile(filePath)

    // Détermination du type MIME
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf'
    }

    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    // Configuration du cache
    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    headers.set('Content-Length', fileBuffer.length.toString())

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Image serve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}