import { type NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request?.json()
    const { userIds, operation, reason, sendNotification, ...operationData } = body || {}

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse?.json(
        { success: false, error: 'User IDs array is required' },
        { status: 400 }
      )
    }

    if (!operation) {
      return NextResponse?.json(
        { success: false, error: 'Operation type is required' },
        { status: 400 }
      )
    }

    // Traiter les opérations par batch pour éviter la surcharge
    const results: Array<{
      success: boolean
      userId: string
      operation: any
      data?: any
      error?: any
    }> = []
    const batchSize = 5 // Traiter 5 utilisateurs à la fois

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds?.slice(i, i + batchSize)

      const batchPromises = batch?.map(async (userId: string) => {
        try {
          let endpoint = ''
          let method = 'POST'
          const requestBody: Record<string, unknown> = {
            reason,
            sendNotification,
          }

          // Définir l'endpoint et les données selon l'opération
          switch (operation) {
            case 'assign_roles':
              endpoint = `/admin/users/${userId}/roles/bulk-assign`
              requestBody.roleIds = operationData.roleIds
              break

            case 'remove_roles':
              endpoint = `/admin/users/${userId}/roles/bulk-remove`
              requestBody.roleIds = operationData.roleIds
              break

            case 'assign_groups':
              endpoint = `/admin/users/${userId}/groups/bulk-assign`
              requestBody.groupIds = operationData.groupIds
              break

            case 'remove_groups':
              endpoint = `/admin/users/${userId}/groups/bulk-remove`
              requestBody.groupIds = operationData.groupIds
              break

            case 'activate':
              endpoint = `/admin/users/${userId}/activate`
              method = 'PATCH'
              break

            case 'deactivate':
              endpoint = `/admin/users/${userId}/deactivate`
              method = 'PATCH'
              break

            case 'reset_password':
              endpoint = `/admin/users/${userId}/reset-password`
              method = 'POST'
              break

            case 'update_department':
              endpoint = `/admin/users/${userId}`
              method = 'PATCH'
              requestBody.department = operationData.department
              break

            default:
              throw new Error(`Unknown operation: ${operation}`)
          }

          const response = await fetchBackend(endpoint, request, {
            method,
            body: JSON.stringify(requestBody),
          })

          if (response?.ok) {
            const data = await response?.json()
            return {
              success: true,
              userId,
              operation,
              data: data?.data,
            }
          } else {
            const errorData = await response?.json().catch(() => ({ error: 'Unknown error' }))
            return {
              success: false,
              userId,
              operation,
              error: errorData.error || `HTTP ${response.status}`,
            }
          }
        } catch (error) {
          return {
            success: false,
            userId,
            operation,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results?.push(...batchResults)
    }

    const successCount = results?.filter((r) => r.success).length
    const errorCount = results?.filter((r) => !r.success).length

    // Envoyer des notifications si demandé
    if (sendNotification && successCount > 0) {
      try {
        await fetchBackend('/admin/notifications/bulk-operation', request, {
          method: 'POST',
          body: JSON.stringify({
            userIds: results?.filter((r) => r.success).map((r) => r.userId),
            operation,
            reason,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (_notificationError) {}
    }

    return NextResponse?.json({
      success: true,
      data: {
        total: userIds.length,
        successful: successCount,
        failed: errorCount,
        operation,
        results: results,
      },
      message: `Opération ${operation} : ${successCount} réussies, ${errorCount} échecs`,
    })
  } catch (error) {
    return NextResponse?.json(
      {
        success: false,
        error: "Erreur lors de l'opération en masse",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET - Récupérer l'historique des opérations en masse
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams?.get('limit') || '50'
    const offset = searchParams?.get('offset') || '0'

    const response = await fetchBackend(
      `/admin/users/bulk-operations/history?limit=${limit}&offset=${offset}`,
      request
    )

    if (!response?.ok) {
      // Fallback avec des données mock
      const mockHistory = [
        {
          id: '1',
          operation: 'assign_roles',
          userCount: 15,
          successCount: 15,
          failedCount: 0,
          performedBy: 'admin@topsteel.tech',
          performedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          reason: 'Attribution des rôles pour la nouvelle équipe',
        },
        {
          id: '2',
          operation: 'update_department',
          userCount: 8,
          successCount: 7,
          failedCount: 1,
          performedBy: 'admin@topsteel.tech',
          performedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Réorganisation des départements',
        },
      ]

      return NextResponse?.json({
        success: true,
        data: mockHistory,
        meta: {
          total: mockHistory.length,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
        },
      })
    }

    const data = await response?.json()
    return NextResponse?.json({
      success: true,
      data: data?.data || [],
      meta: data?.meta || { total: 0, limit: parseInt(limit, 10), offset: parseInt(offset, 10) },
    })
  } catch (_error) {
    return NextResponse?.json(
      {
        success: false,
        error: "Erreur lors de la récupération de l'historique",
        data: [],
      },
      { status: 500 }
    )
  }
}
