import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002'
    
    // Récupérer le token d'authentification comme les autres routes
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Appel vers le backend
    const response = await fetch(`${apiUrl}/api/v1/health`, {
      method: 'GET',
      headers,
      // Timeout de 5 secondes
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const responseData = await response.json()
      // Le backend renvoie { data: {...}, statusCode, message }, on ne veut que data
      const data = responseData.data || responseData
      
      // Essayer de récupérer le nombre d'utilisateurs connectés
      let activeUsers = null
      try {
        if (token) {
          const usersResponse = await fetch(`${apiUrl}/api/v1/admin/users`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(3000)
          })
          
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            const users = usersData.data?.data || usersData.data || []
            
            if (Array.isArray(users)) {
              const now = new Date()
              const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 heures
              
              activeUsers = users.filter(user => {
                const lastLogin = user.lastLogin || user.last_login || user.lastLoginAt || user.updatedAt
                if (!lastLogin) return false
                const lastLoginDate = new Date(lastLogin)
                return lastLoginDate > twentyFourHoursAgo
              }).length
            }
          }
        }
      } catch (error) {
        // Ne pas faire échouer le health check pour cela
      }
      
      return NextResponse.json({
        ...data,
        activeUsers
      })
    } else {
      // En cas d'erreur HTTP, retourner des informations basiques
      return NextResponse.json({
        status: 'error',
        error: `Backend responded with ${response.status}: ${response.statusText}`,
        version: 'Unknown',
        environment: 'Unknown',
        uptime: null,
        database: {
          status: 'unknown',
          connectionStatus: 'unknown'
        },
        timestamp: new Date().toISOString()
      }, { status: response.status })
    }
    
  } catch (error) {
    console.error('[Health Check] Error:', error)
    
    // En cas d'erreur de connexion, retourner un statut offline
    return NextResponse.json({
      status: 'offline',
      error: error instanceof Error ? error.message : 'Connection failed',
      version: 'Unknown',
      environment: 'Unknown', 
      uptime: null,
      database: {
        status: 'unknown',
        connectionStatus: 'unknown'
      },
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}