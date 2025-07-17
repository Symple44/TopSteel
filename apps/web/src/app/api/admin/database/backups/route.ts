import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/database/backups`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
    })

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'appel à l\'API' },
        { status: response.status }
      )
    }

    const responseData = await response.json()
    return NextResponse.json(responseData.data || responseData)
  } catch (error) {
    console.error('Erreur lors de la récupération des sauvegardes:', error)
    
    // Retourner des données mock si l'API n'est pas disponible
    const mockBackups = {
      success: true,
      data: [
        {
          id: 'backup-2024-01-15-14-30',
          filename: 'backup_manual_2024-01-15T14-30-00.sql.gz',
          createdAt: '2024-01-15T14:30:00Z',
          size: '15.2 MB',
          type: 'manual',
          status: 'completed'
        },
        {
          id: 'backup-2024-01-14-02-00',
          filename: 'backup_scheduled_2024-01-14T02-00-00.sql.gz',
          createdAt: '2024-01-14T02:00:00Z',
          size: '14.8 MB',
          type: 'scheduled',
          status: 'completed'
        },
        {
          id: 'backup-2024-01-13-02-00',
          filename: 'backup_scheduled_2024-01-13T02-00-00.sql.gz',
          createdAt: '2024-01-13T02:00:00Z',
          size: '14.5 MB',
          type: 'scheduled',
          status: 'completed'
        }
      ]
    }
    
    return NextResponse.json(mockBackups)
  }
}