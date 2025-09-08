import { type NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  // Route stub pour éviter les erreurs 404
  return NextResponse?.json(
    {
      name: 'TopSteel ERP',
      address: '123 Steel Avenue',
      city: 'Industrial City',
      country: 'France',
      website: 'https://topsteel.example',
      logo: null,
    },
    { status: 200 }
  )
}
