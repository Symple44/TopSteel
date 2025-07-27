import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value
    
    // Appeler directement l'API backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/admin/menu-raw/tree`, {
      headers: {
        'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    // Adapter la réponse pour correspondre au format attendu par le frontend
    if (data.success && data.data) {
      return NextResponse.json({
        success: true,
        data: data.data
      })
    }
    
    return NextResponse.json(data, { status: response.status })

  } catch (error: any) {
    console.error('Erreur lors de la récupération du menu:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Erreur serveur',
      data: []
    }, { 
      status: 500 
    })
  }
}