import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Construire l'endpoint avec les query params
    const queryString = searchParams?.toString()
    const endpoint = `admin/users${queryString ? `?${queryString}` : ''}`

    // Appel vers le backend via l'utilitaire harmonisé
    const response = await callBackendFromApi(request, endpoint, {
      method: 'GET',
    })

    if (response?.ok) {
      const responseData = await response?.json()
      // Le backend NestJS enveloppe dans {data: {...}, statusCode, message}
      // On veut extraire le contenu réel pour le frontend
      const actualData = responseData?.data || responseData
      return NextResponse?.json(actualData)
    } else {
      const includeGroups = searchParams?.get('includeGroups') === 'true'

      const mockUsers = [
        {
          id: '1',
          email: 'jean.dupont@topsteel.tech',
          firstName: 'Jean',
          lastName: 'Dupont',
          department: 'Production',
          role: 'ADMIN',
          isActive: true,
          lastLogin: '2024-01-15T10:30:00Z',
          currentGroups: includeGroups ? ['1', '2'] : undefined,
        },
        {
          id: '2',
          email: 'marie.martin@topsteel.tech',
          firstName: 'Marie',
          lastName: 'Martin',
          department: 'Commercial',
          role: 'MANAGER',
          isActive: true,
          lastLogin: '2024-01-14T14:20:00Z',
          currentGroups: includeGroups ? ['2'] : undefined,
        },
        {
          id: '3',
          email: 'pierre.bernard@topsteel.tech',
          firstName: 'Pierre',
          lastName: 'Bernard',
          department: 'Technique',
          role: 'USER',
          isActive: true,
          lastLogin: '2024-01-10T09:15:00Z',
          currentGroups: includeGroups ? [] : undefined,
        },
        {
          id: '4',
          email: 'sophie.rousseau@topsteel.tech',
          firstName: 'Sophie',
          lastName: 'Rousseau',
          department: 'Comptabilité',
          role: 'USER',
          isActive: true,
          lastLogin: '2024-01-12T16:45:00Z',
          currentGroups: includeGroups ? ['3'] : undefined,
        },
        {
          id: '5',
          email: 'julien.moreau@topsteel.tech',
          firstName: 'Julien',
          lastName: 'Moreau',
          department: 'Production',
          role: 'USER',
          isActive: false,
          lastLogin: '2024-01-08T11:20:00Z',
          currentGroups: includeGroups ? ['1'] : undefined,
        },
      ]

      return NextResponse?.json({
        success: true,
        data: mockUsers,
        meta: {
          total: mockUsers.length,
          page: 1,
          limit: 50,
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
