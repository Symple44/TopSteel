import { NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

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
    const response = await callBackendFromApi(req, 'auth/validate', {
      method: 'GET',
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