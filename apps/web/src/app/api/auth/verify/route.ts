import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req?.headers?.get('authorization')

    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      return NextResponse?.json({ error: 'No auth token' }, { status: 401 })
    }

    const _token = authHeader?.substring(7)

    // Rediriger vers l'API backend pour vérifier le token
    const response = await callBackendFromApi(req, 'auth/verify', {
      method: 'GET',
    })

    if (!response?.ok) {
      return NextResponse?.json({ error: 'Token verification failed' }, { status: 401 })
    }

    const data = await response?.json()
    return NextResponse?.json(data)
  } catch (_error) {
    return NextResponse?.json({ error: 'Internal server error' }, { status: 500 })
  }
}
