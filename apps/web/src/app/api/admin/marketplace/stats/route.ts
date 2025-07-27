import { NextRequest, NextResponse } from 'next/server'
import { getAuthServer } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const authServer = await getAuthServer()
    
    if (!authServer) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les statistiques depuis l'API backend
    const response = await fetch(`${process.env.API_URL}/marketplace/stats/overview`, {
      headers: {
        'Authorization': `Bearer ${authServer.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`)
    }

    const stats = await response.json()
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}