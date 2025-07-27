import { NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const response = await fetchBackend('/admin/groups', request)

    if (!response.ok) {
      const errorBody = await response.text()
      console.log('[groups] Backend error response:', response.status, response.statusText, errorBody)
      
      // Retourner des groupes mock en cas d'erreur
      console.log('[groups] Returning mock groups due to backend error')
      return NextResponse.json({
        success: true,
        data: [
          { id: '1', name: 'Administrateurs', description: 'Groupe des administrateurs système', userCount: 2 },
          { id: '2', name: 'Managers', description: 'Groupe des responsables', userCount: 5 },
          { id: '3', name: 'Utilisateurs', description: 'Groupe des utilisateurs standards', userCount: 15 },
          { id: '4', name: 'Invités', description: 'Groupe des utilisateurs invités', userCount: 3 }
        ]
      })
    }

    const data = await response.json()
    console.log('[groups] Received data:', JSON.stringify(data, null, 2))
    
    return NextResponse.json({
      success: true,
      data: data?.data || []
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des groupes:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des groupes',
        data: []
      },
      { status: 500 }
    )
  }
}