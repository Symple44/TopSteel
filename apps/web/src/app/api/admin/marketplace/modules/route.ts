import { NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetchBackend('/marketplace/modules', request)

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