import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Informations de la société (données mock)
    const companyInfo = {
      name: 'TopSteel SARL',
      address: '123 Rue de la Métallurgie, 75000 Paris',
      phone: '01 23 45 67 89',
      email: 'contact@topsteel.com',
      siret: '12345678901234',
      tva: 'FR12345678901',
    }

    return NextResponse.json(companyInfo)
  } catch (error) {
    console.error('Error fetching company info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company info' },
      { status: 500 }
    )
  }
}