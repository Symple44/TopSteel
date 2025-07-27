import { NextRequest, NextResponse } from 'next/server'
import { getAuthServer } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authServer = await getAuthServer()
    
    if (!authServer) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const response = await fetch(`${process.env.API_URL}/marketplace/modules/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${authServer.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
      }
      throw new Error(`Erreur API: ${response.status}`)
    }

    const module = await response.json()
    return NextResponse.json(module)
  } catch (error) {
    console.error('Erreur lors de la récupération du module:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du module' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authServer = await getAuthServer()
    
    if (!authServer) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${process.env.API_URL}/marketplace/modules/${params.id}/install`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authServer.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur lors de l\'installation du module:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'installation du module' },
      { status: 500 }
    )
  }
}