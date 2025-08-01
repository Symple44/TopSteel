import { type NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les statistiques depuis l'API backend
    const response = await fetchBackend('/marketplace/stats/overview', request)

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`)
    }

    const stats = await response.json()

    return NextResponse.json(stats)
  } catch (_error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
