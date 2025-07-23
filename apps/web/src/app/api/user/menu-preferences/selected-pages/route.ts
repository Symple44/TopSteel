import { NextRequest, NextResponse } from 'next/server'
import { AuthHelper } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  const defaultPages = ['dashboard', 'clients', 'projets', 'stocks', 'production']
  
  try {
    // Utiliser l'endpoint standard et filtrer les pages visibles
    const response = await AuthHelper.fetchWithAuth(
      `${apiUrl}/api/v1/user/menu-preferences`
    )
    
    if (response.ok) {
      const data = await response.json()
      
      // Vérifier la structure des données et extraire les pages visibles
      let menuPreferences = []
      
      // Gérer la structure imbriquée du backend : { data: { success: true, data: [...] } }
      if (data.data && data.data.success && Array.isArray(data.data.data)) {
        menuPreferences = data.data.data
      } else if (Array.isArray(data.data)) {
        menuPreferences = data.data
      } else if (Array.isArray(data)) {
        menuPreferences = data
      } else if (data.preferences && Array.isArray(data.preferences)) {
        menuPreferences = data.preferences
      } else {
        menuPreferences = []
      }
      
      const selectedPages = menuPreferences
        .filter((p: any) => p.isVisible)
        .map((p: any) => p.menuId)
      
      return NextResponse.json({
        success: true,
        data: selectedPages,
        message: 'Pages sélectionnées depuis la base de données'
      })
    } else {
      throw new Error(`Backend API error: ${response.status}`)
    }
  } catch (error) {
    
    // Gérer les différents types d'erreurs
    if (error instanceof Error) {
      if (error.message === 'NO_AUTH' || error.message === 'INVALID_TOKEN') {
        return AuthHelper.unauthorizedResponse('Authentification requise')
      }
    }
    
    // Pour toute autre erreur
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la récupération des pages',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  try {
    const body = await request.json()
    const { selectedPages = [] } = body
    
    // Utiliser directement l'endpoint backend qui gère tout
    const response = await AuthHelper.fetchWithAuth(
      `${apiUrl}/api/v1/user/menu-preferences/selected-pages`,
      {
        method: 'POST',
        body: JSON.stringify({ selectedPages }),
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      
      // Vérifier la structure de la réponse du backend
      const isSuccess = data.success || (data.data && data.data.success)
      
      if (isSuccess) {
        return NextResponse.json({
          success: true,
          data: selectedPages,
          message: 'Pages sélectionnées sauvegardées avec succès'
        })
      } else {
        throw new Error('Backend returned success: false')
      }
    } else {
      const errorText = await response.text()
      throw new Error(`Backend API error: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    
    // Gérer les différents types d'erreurs
    if (error instanceof Error) {
      if (error.message === 'NO_AUTH' || error.message === 'INVALID_TOKEN') {
        return AuthHelper.unauthorizedResponse('Authentification requise pour sauvegarder les préférences')
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la sauvegarde des pages sélectionnées',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}