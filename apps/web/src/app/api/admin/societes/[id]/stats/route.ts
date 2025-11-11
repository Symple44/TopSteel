import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../../utils/backend-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const endpoint = `admin/societes/${id}/stats`

    // Appel vers le backend
    const response = await callBackendFromApi(request, endpoint, {
      method: 'GET',
    })

    if (response?.ok) {
      const responseData = await response?.json()
      return NextResponse?.json(responseData)
    } else {
      // Fallback avec des données mock
      const mockStats = {
        societeId: id,
        societeName: 'TopSteel Production',
        totalUsers: 12,
        activeUsers: 11,
        inactiveUsers: 1,
        roleDistribution: [
          {
            role: {
              id: 'SUPER_ADMIN',
              displayName: 'Super Admin',
              color: '#dc2626',
            },
            count: 1,
          },
          {
            role: {
              id: 'ADMIN',
              displayName: 'Admin',
              color: '#ea580c',
            },
            count: 2,
          },
          {
            role: {
              id: 'MANAGER',
              displayName: 'Manager',
              color: '#0ea5e9',
            },
            count: 3,
          },
          {
            role: {
              id: 'COMMERCIAL',
              displayName: 'Commercial',
              color: '#10b981',
            },
            count: 4,
          },
          {
            role: {
              id: 'TECHNICIEN',
              displayName: 'Technicien',
              color: '#8b5cf6',
            },
            count: 2,
          },
        ],
        sitesCount: 2,
      }

      return NextResponse?.json({
        success: true,
        data: mockStats,
      })
    }
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}
