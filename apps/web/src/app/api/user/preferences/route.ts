import { type NextRequest, NextResponse } from 'next/server'

// Interface pour les préférences utilisateur
interface UserPreferences {
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

// Données mockées
const mockPreferences: UserPreferences = {
  language: 'fr',
  timezone: 'Europe/Paris',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
}

// Stockage temporaire
let userPreferences = { ...mockPreferences }

export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return NextResponse.json(userPreferences)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json()

    userPreferences = {
      ...userPreferences,
      ...updates,
    }

    await new Promise((resolve) => setTimeout(resolve, 200))

    return NextResponse.json(userPreferences)
  } catch {
    return NextResponse.json({ error: 'Failed to update user preferences' }, { status: 500 })
  }
}
