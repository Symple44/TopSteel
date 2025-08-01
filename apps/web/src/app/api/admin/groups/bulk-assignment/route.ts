import { type NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignments } = body

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { success: false, error: 'Assignments array is required' },
        { status: 400 }
      )
    }

    // Traiter les assignations par batch pour éviter la surcharge
    const results = []
    const batchSize = 10 // Traiter 10 assignations à la fois

    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize)

      const batchPromises = batch.map(async (assignment) => {
        try {
          const response = await fetchBackend(
            `/admin/groups/${assignment.groupId}/users`,
            request,
            {
              method: 'POST',
              body: JSON.stringify({
                userId: assignment.userId,
                expiresAt: assignment.expiresAt,
              }),
            }
          )

          if (response.ok) {
            const data = await response.json()
            return {
              success: true,
              groupId: assignment.groupId,
              userId: assignment.userId,
              data: data?.data,
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            return {
              success: false,
              groupId: assignment.groupId,
              userId: assignment.userId,
              error: errorData.error || `HTTP ${response.status}`,
            }
          }
        } catch (error) {
          return {
            success: false,
            groupId: assignment.groupId,
            userId: assignment.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    const successCount = results.filter((r) => r.success).length
    const errorCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      data: {
        total: assignments.length,
        successful: successCount,
        failed: errorCount,
        results: results,
      },
      message: `${successCount} assignations réussies, ${errorCount} échecs`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'assignation en masse",
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
