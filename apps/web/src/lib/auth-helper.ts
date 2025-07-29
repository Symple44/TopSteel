import { cookies } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import { callBackendApi } from '@/utils/backend-api'

export interface AuthResult {
  token: string | null
  isValid: boolean
  error?: string
}

/**
 * Helper pour gérer l'authentification dans les API routes
 */
export class AuthHelper {
  /**
   * Récupère et valide le token depuis les cookies
   */
  static async getToken(): Promise<AuthResult> {
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get('accessToken')?.value

      if (!token) {
        return { token: null, isValid: false, error: 'Pas de token' }
      }

      // Vérifier si le token est expiré (decode JWT sans vérifier la signature)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        
        if (payload.exp && payload.exp < now) {
          return { token: null, isValid: false, error: 'Token expiré' }
        }

        return { token, isValid: true }
      } catch {
        // Si on ne peut pas décoder le token, on le considère comme invalide
        return { token, isValid: true } // On laisse le backend décider
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error)
      return { token: null, isValid: false, error: 'Erreur système' }
    }
  }

  /**
   * Fait une requête au backend avec gestion des erreurs
   */
  static async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const { token, isValid, error } = await this.getToken()

    if (!token || !isValid) {
      console.log(`Auth: ${error || 'Pas de token valide'}`)
      throw new Error('NO_AUTH')
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }

    try {
      // Extraire l'endpoint depuis l'URL complète
      const endpoint = url.replace(/^.*\/api\/v1\//, '').replace(/^.*\/api\//, '')
      
      const response = await callBackendApi(endpoint, {
        ...options,
        headers
      })

      // Si 401, le token est invalide
      if (response.status === 401) {
        console.log('Token rejeté par le backend (401)')
        throw new Error('INVALID_TOKEN')
      }

      return response
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_TOKEN') {
        throw error
      }
      console.error('Erreur réseau:', error)
      throw new Error('NETWORK_ERROR')
    }
  }

  /**
   * Retourne une réponse d'erreur d'authentification standard
   */
  static unauthorizedResponse(message: string = 'Non autorisé') {
    return NextResponse.json(
      {
        success: false,
        message,
        requiresAuth: true
      },
      { status: 401 }
    )
  }

  /**
   * Retourne des données par défaut en cas d'absence d'auth
   */
  static defaultDataResponse(data: any, message: string = 'Données par défaut (sans authentification)') {
    return NextResponse.json({
      success: true,
      data,
      message,
      isDefault: true
    })
  }

  /**
   * Valide un token donné
   */
  static validateToken(token: string): { isValid: boolean; error?: string } {
    if (!token) {
      return { isValid: false, error: 'Pas de token' }
    }

    try {
      // Vérifier si le token est expiré (decode JWT sans vérifier la signature)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      
      if (payload.exp && payload.exp < now) {
        return { isValid: false, error: 'Token expiré' }
      }

      return { isValid: true }
    } catch {
      // Si on ne peut pas décoder le token, on le considère comme valide
      // et on laisse le backend décider
      return { isValid: true }
    }
  }
}

/**
 * Helper pour vérifier l'authentification depuis une NextRequest
 * Utilisé dans les API routes MFA et autres
 */
export async function verifyAuthHelper(request: NextRequest): Promise<{
  isValid: boolean
  token?: string
  error?: string
  user?: any
}> {
  try {
    // Récupérer le token depuis les cookies ou l'header Authorization
    let token = request.cookies.get('accessToken')?.value

    // Si pas de token dans les cookies, vérifier l'header Authorization
    if (!token) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return { isValid: false, error: 'Pas de token d\'authentification' }
    }

    // Valider le token
    const validation = AuthHelper.validateToken(token)
    
    if (!validation.isValid) {
      return { isValid: false, error: validation.error }
    }

    // Extraire les informations utilisateur du token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        roles: payload.roles || [payload.role], // Support pour les deux formats
        sessionId: payload.sessionId
      }

      return { isValid: true, token, user }
    } catch (decodeError) {
      console.error('Erreur lors du décodage du token:', decodeError)
      return { isValid: false, error: 'Token invalide' }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification d\'authentification:', error)
    return { isValid: false, error: 'Erreur de validation' }
  }
}