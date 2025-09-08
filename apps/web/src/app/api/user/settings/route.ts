import { type NextRequest, NextResponse } from 'next/server'

// Interface pour les paramètres utilisateur
interface UserSettings {
  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string
    position: string
    department: string
  }
  company: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  preferences: {
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
}

// Données mockées pour le développement
const mockUserSettings: UserSettings = {
  profile: {
    firstName: 'Jean',
    lastName: 'Dubois',
    email: 'jean.dubois@topsteel.tech',
    phone: '01 23 45 67 89',
    position: 'Responsable Production',
    department: 'Production',
  },
  company: {
    name: 'TopSteel SARL',
    address: '123 Rue de la Métallurgie',
    city: 'Paris',
    postalCode: '75000',
    country: 'France',
  },
  preferences: {
    language: 'fr',
    timezone: 'Europe/Paris',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  },
}

// Stockage temporaire (en production, utiliser une base de données)
let userSettings = { ...mockUserSettings }

export async function GET() {
  try {
    // Simuler une récupération depuis la base de données
    await new Promise((resolve) => setTimeout(resolve, 100))

    return NextResponse?.json(userSettings)
  } catch {
    return NextResponse?.json({ error: 'Failed to fetch user settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request?.json()

    // Mettre à jour les paramètres utilisateur
    userSettings = {
      ...userSettings,
      ...updates,
    }

    // Simuler une sauvegarde en base de données
    await new Promise((resolve) => setTimeout(resolve, 200))

    return NextResponse?.json(userSettings)
  } catch {
    return NextResponse?.json({ error: 'Failed to update user settings' }, { status: 500 })
  }
}
