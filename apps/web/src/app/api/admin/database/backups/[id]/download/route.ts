import { NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const response = await callBackendFromApi(`admin/database/backups/${id}/download`, {
      method: 'GET',
      headers: {
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

    // Pour les téléchargements, on retourne directement la réponse
    return response
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors du téléchargement' },
      { status: 500 }
    )
  }
}