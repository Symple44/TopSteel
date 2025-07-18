import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Non autorisé'
        },
        { status: 401 }
      )
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur lors du chargement des préférences:', error)
    
    // Retourner des données par défaut au lieu d'une erreur 500
    return NextResponse.json({
      success: true,
      data: [
        { menuId: 'dashboard', isVisible: true, order: 1, customLabel: 'Dashboard' },
        { menuId: 'clients', isVisible: true, order: 2, customLabel: 'Clients' },
        { menuId: 'projets', isVisible: true, order: 3, customLabel: 'Projets' },
        { menuId: 'stocks', isVisible: true, order: 4, customLabel: 'Stocks' },
        { menuId: 'production', isVisible: true, order: 5, customLabel: 'Production' }
      ],
      message: 'Préférences par défaut (erreur backend)'
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Non autorisé'
        },
        { status: 401 }
      )
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/menu-preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error)
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