import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No auth token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Rediriger vers l'API backend pour invalider le token
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
    const response = await fetch(`${apiUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Même si l'API échoue, on considère le logout comme réussi côté frontend
      console.warn('Backend logout failed, but proceeding with frontend logout')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Auth logout error:', error)
    // Même en cas d'erreur, on considère le logout comme réussi
    return NextResponse.json({ success: true })
  }
}