import { NextRequest, NextResponse } from 'next/server'

// Image générique pour tous les produits sans image
const fallbackSVG = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bgGradient)"/>
  
  <!-- Icône produit générique -->
  <g transform="translate(200, 150)">
    <circle cx="0" cy="0" r="40" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
    <rect x="-20" y="-15" width="40" height="30" fill="#64748b" rx="4"/>
    <rect x="-15" y="-10" width="30" height="20" fill="#475569" rx="2"/>
    <circle cx="-10" cy="-5" r="2" fill="#e2e8f0"/>
    <circle cx="10" cy="-5" r="2" fill="#e2e8f0"/>
    <rect x="-8" y="2" width="16" height="4" fill="#e2e8f0" rx="2"/>
  </g>
  
  <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b" font-weight="500">Produit</text>
  <text x="200" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Image non disponible</text>
</svg>
`

export async function GET(req: NextRequest) {
  // Convertir le SVG en Buffer
  const buffer = Buffer.from(fallbackSVG)

  // Retourner l'image avec les bons headers
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Content-Security-Policy': "default-src 'self'; script-src 'none'; sandbox;",
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}