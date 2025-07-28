import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    frontend: {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      name: process.env.NEXT_PUBLIC_APP_NAME || 'TopSteel ERP',
      environment: process.env.NODE_ENV || 'development',
    },
    backend: {
      url: process.env.NEXT_PUBLIC_API_URL || 'Non configurée',
      configured: !!process.env.NEXT_PUBLIC_API_URL,
    },
    auth: {
      credentials: {
        email: 'admin@topsteel.tech',
        password: 'TopSteel44!',
        role: 'ADMIN'
      }
    },
    timestamp: new Date().toISOString()
  }

  // Log au démarrage
  console.log(`   Frontend: ${config.frontend.url}`)
  console.log(`   Backend: ${config.backend.url}`)
  
  return NextResponse.json(config, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}