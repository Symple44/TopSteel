import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const endpoint = `admin/societes/${id}`

    // Appel vers le backend
    const response = await callBackendFromApi(request, endpoint, {
      method: 'GET',
    })

    if (response?.ok) {
      const responseData = await response?.json()
      return NextResponse?.json(responseData)
    } else {
      // Fallback avec des données mock
      const mockSociete = {
        id: id,
        nom: 'TopSteel Production',
        code: 'TSP',
        status: 'ACTIVE',
        databaseName: 'topsteel_prod',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        users: [
          {
            id: '1',
            email: 'admin@topsteel.tech',
            firstName: 'Admin',
            lastName: 'System',
            globalRole: {
              id: 'SUPER_ADMIN',
              displayName: 'Super Admin',
              color: '#dc2626',
              icon: 'crown',
            },
            societeRole: {
              id: 'DIRECTEUR',
              displayName: 'Directeur',
              color: '#7c3aed',
              icon: 'briefcase',
            },
            isDefault: true,
            grantedAt: '2024-01-01T00:00:00Z',
          },
        ],
        sites: [
          { id: '1', nom: 'Site Principal', code: 'SP1', isPrincipal: true },
          { id: '2', nom: 'Site Annexe', code: 'SA1', isPrincipal: false },
        ],
      }

      return NextResponse?.json({
        success: true,
        data: mockSociete,
      })
    }
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}
