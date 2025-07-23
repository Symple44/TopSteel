import { NextRequest, NextResponse } from 'next/server'
import { AuthHelper } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  const defaultPreferences = [
    { menuId: 'dashboard', isVisible: true, order: 1, customLabel: 'Tableau de bord' },
    { menuId: 'clients', isVisible: true, order: 2, customLabel: 'Clients' },
    { menuId: 'projets', isVisible: true, order: 3, customLabel: 'Projets' },
    { menuId: 'stocks', isVisible: true, order: 4, customLabel: 'Stocks' },
    { menuId: 'production', isVisible: true, order: 5, customLabel: 'Production' }
  ]

  try {
    // Essayer de faire la requête avec authentification
    const response = await AuthHelper.fetchWithAuth(
      `${apiUrl}/api/v1/user/menu-preferences`
    )
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      console.log(`Backend erreur: ${response.status}`)
      throw new Error(`Backend error: ${response.status}`)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des préférences:', error)
    
    // Si c'est un problème d'auth, retourner une erreur 401
    if (error instanceof Error && 
        (error.message === 'NO_AUTH' || error.message === 'INVALID_TOKEN')) {
      return AuthHelper.unauthorizedResponse('Authentification requise')
    }
    
    // Pour toute autre erreur, retourner une erreur 500
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement des préférences',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  try {
    const body = await request.json()
    
    // Essayer de faire la requête avec authentification
    const response = await AuthHelper.fetchWithAuth(
      `${apiUrl}/api/v1/user/menu-preferences`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      throw new Error(`Backend error: ${response.status}`)
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error)
    
    // Si c'est un problème d'auth
    if (error instanceof Error && 
        (error.message === 'NO_AUTH' || error.message === 'INVALID_TOKEN')) {
      return AuthHelper.unauthorizedResponse('Authentification requise pour modifier les préférences')
    }
    
    // Pour les autres erreurs, retourner une erreur 500
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la mise à jour des préférences',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}