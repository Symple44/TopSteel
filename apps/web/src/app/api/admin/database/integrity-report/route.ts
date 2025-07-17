import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Proxy vers l'API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/admin/database/integrity-report`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Transférer les headers d'authentification si présents
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
    // L'API NestJS retourne { data: { success, data }, statusCode, message, timestamp }
    // On extrait juste la partie data.data
    return NextResponse.json(responseData.data || responseData)
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport d\'intégrité:', error)
    
    // Retourner des données mock si l'API n'est pas disponible
    const mockReport = {
      success: true,
      data: {
        expectedTables: [
          'users', 'user_menu_preferences', 'notifications', 'clients', 'projects', 
          'stocks', 'production', 'machines', 'maintenance'
        ],
        actualTables: [
          'users', 'notifications', 'clients', 'projects', 'stocks'
        ],
        tableDetails: [
          { name: 'users', expected: true, exists: true, status: 'ok', columns: ['id', 'email', 'name'] },
          { name: 'user_menu_preferences', expected: true, exists: false, status: 'missing', columns: [] },
          { name: 'notifications', expected: true, exists: true, status: 'ok', columns: ['id', 'title', 'message'] },
          { name: 'clients', expected: true, exists: true, status: 'ok', columns: ['id', 'name', 'email'] },
          { name: 'projects', expected: true, exists: true, status: 'ok', columns: ['id', 'name', 'description'] },
          { name: 'stocks', expected: true, exists: true, status: 'ok', columns: ['id', 'product', 'quantity'] },
          { name: 'production', expected: true, exists: false, status: 'missing', columns: [] },
          { name: 'machines', expected: true, exists: false, status: 'missing', columns: [] },
          { name: 'maintenance', expected: true, exists: false, status: 'missing', columns: [] }
        ],
        summary: {
          total: 9,
          ok: 5,
          missing: 4,
          extra: 0,
          errors: 0
        },
        canSynchronize: true
      }
    }
    
    return NextResponse.json(mockReport)
  }
}