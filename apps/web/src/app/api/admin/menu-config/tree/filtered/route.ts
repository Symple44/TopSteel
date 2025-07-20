import { NextRequest, NextResponse } from 'next/server'
import { AuthHelper } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et faire la requête
    const response = await AuthHelper.fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/menu-config/tree/filtered`
    )

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      console.error('API Error:', response.status, response.statusText)
      throw new Error(`Backend error: ${response.status}`)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du menu filtré:', error)
    
    // Gérer les erreurs d'authentification
    if (error instanceof Error && 
        (error.message === 'NO_AUTH' || error.message === 'INVALID_TOKEN')) {
      return AuthHelper.unauthorizedResponse('Authentification requise pour accéder au menu admin')
    }
    
    // Pour les autres erreurs, retourner une erreur 500
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la récupération du menu',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}