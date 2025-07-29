import { NextRequest, NextResponse } from 'next/server'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function GET(req: NextRequest) {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Valider avec le backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
    const response = await safeFetch(`${apiUrl}/api/v1/auth/validate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      message: 'Token valide'
    })
    
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Erreur de validation' },
      { status: 500 }
    )
  }
}