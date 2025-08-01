import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi, callHealthApi } from '@/utils/backend-api'

export async function GET(request: NextRequest) {
  try {
    // Appel spécialisé pour le health check avec timeout court
    const response = await callHealthApi('health', { timeout: 5000 })

    if (response.ok) {
      const responseData = await response.json()
      const data = responseData.data || responseData

      // Essayer de récupérer le nombre d'utilisateurs connectés
      let activeUsers = null
      try {
        const usersResponse = await callBackendFromApi(request, 'admin/users', {
          timeout: 3000,
        } as RequestInit & { timeout?: number })

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const users = usersData.data?.data || usersData.data || []

          if (Array.isArray(users)) {
            const now = new Date()
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

            activeUsers = users.filter((user) => {
              const lastLogin =
                user.lastLogin || user.last_login || user.lastLoginAt || user.updatedAt
              if (!lastLogin) return false
              const lastLoginDate = new Date(lastLogin)
              return lastLoginDate > twentyFourHoursAgo
            }).length
          }
        }
      } catch (_error) {
        // Ne pas faire échouer le health check pour cela
      }

      return NextResponse.json({
        ...data,
        activeUsers,
      })
    } else {
      return NextResponse.json(
        {
          status: 'error',
          error: `Backend responded with ${response.status}: ${response.statusText}`,
          version: 'Unknown',
          environment: 'Unknown',
          uptime: null,
          database: {
            status: 'unknown',
            connectionStatus: 'unknown',
          },
          timestamp: new Date().toISOString(),
        },
        { status: response.status }
      )
    }
  } catch (error) {
    // En cas d'erreur de connexion, retourner un statut offline
    return NextResponse.json(
      {
        status: 'offline',
        error: error instanceof Error ? error.message : 'Connection failed',
        version: 'Unknown',
        environment: 'Unknown',
        uptime: null,
        database: {
          status: 'unknown',
          connectionStatus: 'unknown',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
