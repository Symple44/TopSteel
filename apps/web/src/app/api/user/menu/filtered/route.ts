import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le profil utilisateur pour obtenir les rôles et permissions
    const userResponse = await safeFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userData = await userResponse.json()
    const userId = userData.id
    const userRoles = userData.roles || []
    const userPermissions = userData.permissions || []

    // Appeler l'API backend pour récupérer le menu filtré pour cet utilisateur
    const response = await safeFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/admin/menu-raw/filtered-menu`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        userRoles,
        userPermissions
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const menuData = await response.json()

    return NextResponse.json({
      success: true,
      data: menuData.data || []
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération du menu filtré:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Erreur serveur',
      data: []
    }, { 
      status: error.response?.status || 500 
    })
  }
}