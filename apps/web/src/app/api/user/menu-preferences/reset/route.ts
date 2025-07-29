import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
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
    
    const response = await safeFetch(`${apiUrl}/api/v1/user/menu-preferences/reset`, {
      method: 'POST',
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
    console.error('Erreur lors de la réinitialisation:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la réinitialisation',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}