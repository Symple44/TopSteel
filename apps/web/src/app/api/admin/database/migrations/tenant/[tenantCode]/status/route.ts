import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantCode: string }> }
) {
  try {
    const { tenantCode } = await params

    // Récupérer les headers d'authentification
    const authHeader = request?.headers?.get('authorization')
    const cookieHeader = request?.headers?.get('cookie')

    // Extraire le token d'accès du cookie si pas d'Authorization header
    let accessToken: string | null = null
    if (cookieHeader) {
      const cookies = cookieHeader?.split(';').map((c) => c?.trim())
      const accessTokenCookie = cookies?.find((c) => c?.startsWith('accessToken='))
      if (accessTokenCookie) {
        accessToken = accessTokenCookie?.split('=')[1]
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Priorité à l'Authorization header, sinon utiliser le token du cookie
    if (authHeader) {
      headers.Authorization = authHeader
    } else if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    // Transmettre aussi les cookies pour compatibilité
    if (cookieHeader) {
      headers.Cookie = cookieHeader
    }

    const response = await callBackendFromApi(
      request,
      `admin/database/migrations/tenant/${tenantCode}/status`,
      {
        method: 'GET',
        signal: AbortSignal?.timeout(10000),
      }
    )

    if (response?.ok) {
      const responseData = await response?.json()
      const actualData = responseData?.data || responseData
      return NextResponse?.json(actualData)
    } else {
      return NextResponse?.json(
        { error: 'API backend error', status: response.status },
        { status: response.status }
      )
    }
  } catch (_error) {
    return NextResponse?.json({ error: 'API backend non disponible' }, { status: 503 })
  }
}
