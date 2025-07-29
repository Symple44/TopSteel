import { NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetchBackend(`/marketplace/modules/${id}`, request)

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const response = await fetchBackend(`/marketplace/modules/${id}/install`, request, {
      method: 'POST',
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