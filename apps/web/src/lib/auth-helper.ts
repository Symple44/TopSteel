import type { NextRequest } from 'next/server'

interface AuthResult {
  isValid: boolean
  user?: {
    id: string
    email: string
    roles?: string[]
    [key: string]: any
  }
}

export class AuthHelper {
  static async verify(request: NextRequest): Promise<AuthResult> {
    return verifyAuthHelper(request)
  }

  static async fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
    const apiUrl =
      process?.env?.NEXT_PUBLIC_API_URL || process?.env?.API_URL || 'http://localhost:3002'
    return fetch(`${apiUrl}/${url}`, options)
  }

  static unauthorizedResponse(message?: string) {
    return new Response(JSON.stringify({ error: message || 'Non autorisé' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function verifyAuthHelper(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = request?.headers?.get('authorization')
    const cookieHeader = request?.headers?.get('cookie')

    let token: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader?.substring(7)
    } else if (cookieHeader) {
      const cookies = cookieHeader?.split(';').map((c) => c?.trim())
      const accessTokenCookie = cookies?.find((c) => c?.startsWith('accessToken='))
      if (accessTokenCookie) {
        token = accessTokenCookie?.split('=')[1]
      }
    }

    if (!token) {
      return { isValid: false }
    }

    // For now, return a mock valid response
    // In production, you would validate the token against your auth service
    return {
      isValid: true,
      user: {
        id: 'mock-user-id',
        email: 'admin@topsteel.fr',
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
    }
  } catch (_error) {
    return { isValid: false }
  }
}
