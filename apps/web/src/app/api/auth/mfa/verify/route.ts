import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, mfaType, code, webauthnResponse } = body

    // Validation des données
    if (!userId || !mfaType) {
      return NextResponse.json(
        { error: 'Données manquantes: userId et mfaType requis' },
        { status: 400 }
      )
    }

    // Appeler l'API backend pour vérifier le code MFA
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const apiResponse = await fetch(`${backendUrl}/api/auth/mfa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        mfaType,
        code,
        webauthnResponse
      })
    })

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({ error: 'Erreur API backend' }))
      return NextResponse.json(
        { error: errorData.error || 'Erreur lors de la vérification MFA' },
        { status: apiResponse.status }
      )
    }

    const verificationData = await apiResponse.json()

    return NextResponse.json({
      success: true,
      data: verificationData.data
    })
  } catch (error) {
    console.error('Erreur lors de la vérification MFA:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}