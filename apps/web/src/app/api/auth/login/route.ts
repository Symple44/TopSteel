import { NextRequest, NextResponse } from 'next/server'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Rediriger vers l'API backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
    const response = await safeFetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Vérifier si la réponse est JSON
    let data
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json()
      } catch (e) {
        data = { error: 'Invalid JSON response from API' }
      }
    } else {
      const textData = await response.text()
      data = { error: `API returned non-JSON response: ${textData}` }
    }
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Auth login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}