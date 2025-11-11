import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../utils/backend-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Construire l'endpoint avec les query params
    const queryString = searchParams?.toString()
    const endpoint = `admin/societes${queryString ? `?${queryString}` : ''}`

    // Appel vers le backend
    const response = await callBackendFromApi(request, endpoint, {
      method: 'GET',
    })

    if (response?.ok) {
      const responseData = await response?.json()
      return NextResponse?.json(responseData)
    } else {
      // Fallback avec des données mock en cas d'erreur backend
      const mockSocietes = [
        {
          id: '1',
          nom: 'TopSteel Production',
          code: 'TSP',
          status: 'ACTIVE',
          databaseName: 'topsteel_prod',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          userCount: 12,
          sites: [
            { id: '1', nom: 'Site Principal', code: 'SP1', isPrincipal: true },
            { id: '2', nom: 'Site Annexe', code: 'SA1', isPrincipal: false },
          ],
        },
        {
          id: '2',
          nom: 'TopSteel Commercial',
          code: 'TSC',
          status: 'ACTIVE',
          databaseName: 'topsteel_commercial',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          userCount: 8,
          sites: [{ id: '3', nom: 'Bureau Commercial', code: 'BC1', isPrincipal: true }],
        },
      ]

      return NextResponse?.json({
        success: true,
        data: mockSocietes,
        meta: {
          total: mockSocietes.length,
          page: 1,
          limit: 10,
          totalPages: 1,
          includeUsers: false,
        },
      })
    }
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}
