import { NextRequest, NextResponse } from 'next/server'

// Fonction pour extraire la désignation depuis le nom de fichier
function extractDesignation(filename: string): string {
  // Retirer l'extension
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|svg)$/i, '')

  // Remplacer les tirets/underscores par des espaces et capitaliser
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Générateur d'image SVG générique avec la désignation de l'article
function generateGenericProductSVG(filename: string): string {
  const designation = extractDesignation(filename)

  return `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f1f5f9;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bgGradient)"/>
      
      <!-- Carte de produit centrale -->
      <g transform="translate(200, 150)">
        <!-- Fond de la carte avec ombre -->
        <rect x="-160" y="-80" width="320" height="160" fill="#0000000d" rx="12" transform="translate(4, 4)"/>
        <rect x="-160" y="-80" width="320" height="160" fill="url(#cardGradient)" stroke="#e2e8f0" stroke-width="1" rx="12"/>
        
        <!-- Icône produit générique -->
        <g transform="translate(0, -20)">
          <circle cx="0" cy="0" r="32" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
          <rect x="-16" y="-12" width="32" height="24" fill="#64748b" rx="3"/>
          <rect x="-12" y="-8" width="24" height="16" fill="#94a3b8" rx="2"/>
          <circle cx="-8" cy="-2" r="1.5" fill="#f1f5f9"/>
          <circle cx="8" cy="-2" r="1.5" fill="#f1f5f9"/>
          <rect x="-6" y="2" width="12" height="3" fill="#f1f5f9" rx="1.5"/>
        </g>
        
        <!-- Texte avec la désignation -->
        <text x="0" y="35" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#1f2937" font-weight="600">${designation}</text>
        <text x="0" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Image non disponible</text>
      </g>
    </svg>
  `
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params

  // Générer l'image SVG générique avec la désignation
  const svg = generateGenericProductSVG(filename)

  // Convertir le SVG en Buffer
  const buffer = Buffer.from(svg)

  // Retourner l'image avec les bons headers
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'self'; script-src 'none'; sandbox;",
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
