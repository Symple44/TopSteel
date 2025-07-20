import { NextRequest, NextResponse } from 'next/server'
import { AuthHelper } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  const defaultPages = ['dashboard', 'clients', 'projets', 'stocks', 'production']
  
  try {
    // Utiliser l'endpoint standard et filtrer les pages visibles
    const response = await AuthHelper.fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences`
    )
    
    if (response.ok) {
      const data = await response.json()
      // Extraire seulement les pages visibles
      const selectedPages = data.data
        .filter((p: any) => p.isVisible)
        .map((p: any) => p.menuId)
      
      return NextResponse.json({
        success: true,
        data: selectedPages,
        message: 'Pages sélectionnées depuis la base de données'
      })
    } else {
      console.log('Backend API erreur:', response.status)
      throw new Error(`Backend API error: ${response.status}`)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des pages sélectionnées:', error)
    
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
  try {
    const body = await request.json()
    const { selectedPages = [] } = body
    
    try {
      // D'abord, récupérer les pages actuellement sélectionnées
      const currentResponse = await AuthHelper.fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences`
      )
      
      if (!currentResponse.ok) {
        throw new Error(`Failed to get current preferences: ${currentResponse.status}`)
      }
      
      const currentData = await currentResponse.json()
      const currentSelectedPages = currentData.data
        .filter((p: any) => p.isVisible)
        .map((p: any) => p.menuId)
      
      // Déterminer quelles pages ajouter/retirer
      const pagesToAdd = selectedPages.filter((p: string) => !currentSelectedPages.includes(p))
      const pagesToRemove = currentSelectedPages.filter((p: string) => !selectedPages.includes(p))
      
      let allSuccess = true
      
      // Ajouter les nouvelles pages
      for (const pageId of pagesToAdd) {
        const res = await AuthHelper.fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences/toggle-page`,
          {
            method: 'POST',
            body: JSON.stringify({ pageId }),
          }
        )
        if (!res.ok) allSuccess = false
      }
      
      // Retirer les pages désélectionnées
      for (const pageId of pagesToRemove) {
        const res = await AuthHelper.fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences/toggle-page`,
          {
            method: 'POST',
            body: JSON.stringify({ pageId }),
          }
        )
        if (!res.ok) allSuccess = false
      }
      
      if (allSuccess) {
        return NextResponse.json({
          success: true,
          data: selectedPages,
          message: 'Pages sélectionnées sauvegardées en base'
        })
      } else {
        throw new Error('Erreur lors de la sauvegarde de certaines pages')
      }
    } catch (backendError) {
      console.log('Erreur lors de la sauvegarde:', backendError)
      
      // Gérer les différents types d'erreurs
      if (backendError instanceof Error) {
        if (backendError.message === 'NO_AUTH' || backendError.message === 'INVALID_TOKEN') {
          return AuthHelper.unauthorizedResponse('Authentification requise pour sauvegarder les préférences')
        }
      }
      
      // Pour les autres erreurs, retourner une erreur 500
      return NextResponse.json(
        {
          success: false,
          message: 'Erreur lors de la sauvegarde',
          error: backendError instanceof Error ? backendError.message : 'Erreur inconnue'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des pages sélectionnées:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la sauvegarde',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}