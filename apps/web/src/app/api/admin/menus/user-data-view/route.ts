import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()

    // Appeler l'API backend pour ajouter la vue au menu utilisateur
    const response = await safeFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/admin/menus/user-data-view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()

    return NextResponse.json({
      success: true,
      data: responseData.data
    })

  } catch (error: any) {
    console.error('Erreur lors de l\'ajout de la vue au menu:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error.response?.data?.message || 'Erreur serveur' 
    }, { 
      status: error.response?.status || 500 
    })
  }
}