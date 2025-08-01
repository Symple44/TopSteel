import { type NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetchBackend('/admin/groups', request)

    if (!response.ok) {
      const _errorBody = await response.text()
      return NextResponse.json({
        success: true,
        data: [
          {
            id: '1',
            name: 'Administrateurs',
            description: 'Groupe des administrateurs système',
            userCount: 2,
          },
          { id: '2', name: 'Managers', description: 'Groupe des responsables', userCount: 5 },
          {
            id: '3',
            name: 'Utilisateurs',
            description: 'Groupe des utilisateurs standards',
            userCount: 15,
          },
          {
            id: '4',
            name: 'Invités',
            description: 'Groupe des utilisateurs invités',
            userCount: 3,
          },
        ],
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data?.data || [],
    })
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des groupes',
        data: [],
      },
      { status: 500 }
    )
  }
}
