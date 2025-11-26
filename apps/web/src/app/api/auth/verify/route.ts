import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../utils/backend-api'

export async function GET(req: NextRequest) {
  console.log('========================================')
  console.log('[verify/route] Incoming request')
  console.log('[verify/route] URL:', req.url)

  // Log all headers for debugging
  const allHeaders: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    allHeaders[key] = key.toLowerCase() === 'authorization' ? `${value.substring(0, 30)}...` : value
  })
  console.log('[verify/route] All headers:', JSON.stringify(allHeaders, null, 2))

  try {
    // Try Authorization header first
    let authHeader = req?.headers?.get('authorization')
    console.log('[verify/route] Authorization header:', authHeader ? `YES (${authHeader.substring(0, 50)}...)` : 'NO')

    // If no Authorization header, try to get token from cookies
    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      const cookieHeader = req?.headers?.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((c) => c.trim())
        // Try multiple cookie names (frontend uses 'accessToken', server uses 'topsteel-access-token')
        const cookieNames = ['accessToken', 'topsteel-access-token']
        for (const cookieName of cookieNames) {
          const accessTokenCookie = cookies.find((c) => c.startsWith(`${cookieName}=`))
          if (accessTokenCookie) {
            const token = accessTokenCookie.split('=')[1]
            if (token) {
              authHeader = `Bearer ${token}`
              break
            }
          }
        }
      }
    }

    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
      console.log('[verify/route] No valid auth token found, returning 401')
      return NextResponse?.json({ error: 'No auth token' }, { status: 401 })
    }

    console.log('[verify/route] Valid auth token found, calling backend...')
    // Rediriger vers l'API backend pour vérifier le token
    const response = await callBackendFromApi(req, 'auth/verify', {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
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
