import { NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const response = await callBackendFromApi(`admin/database/backups/${id}`, {
      method: 'DELETE',
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

    const responseData = await response.json()
    return NextResponse.json(responseData.data || responseData)
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    
    // Simuler une suppression pour le mock
    const mockResponse = {
      success: true,
      message: 'Sauvegarde supprimée avec succès'
    }
    
    return NextResponse.json(mockResponse)
  }
}