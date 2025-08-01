import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    }

    const _token = authHeader.substring(7)

    // Rediriger vers l'API backend pour invalider le token
    const response = await callBackendFromApi(req, 'auth/logout', {
      method: 'POST',
    })

    if (!response.ok) {
    }

    return NextResponse.json({ success: true })
  } catch (_error) {
    // Même en cas d'erreur, on considère le logout comme réussi
    return NextResponse.json({ success: true })
  }
}
