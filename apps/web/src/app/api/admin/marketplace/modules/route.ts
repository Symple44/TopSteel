import { NextRequest, NextResponse } from 'next/server'
import { getAuthServer } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const authServer = await getAuthServer()
    
    if (!authServer) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les modules depuis l'API backend
    const response = await fetch(`${process.env.API_URL}/marketplace/modules`, {
      headers: {
        'Authorization': `Bearer ${authServer.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`)
    }

    const modules = await response.json()
    
    return NextResponse.json(modules)
  } catch (error) {
    console.error('Erreur lors de la récupération des modules:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des modules' },
      { status: 500 }
    )
  }
}