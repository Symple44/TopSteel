import { type NextRequest, NextResponse } from 'next/server'

// Interface pour les paramètres de notification
interface NotificationSettings {
  enableSound: boolean
  enableToast: boolean
  enableBrowser: boolean
  enableEmail: boolean
  categories: {
    system: boolean
    stock: boolean
    projet: boolean
    production: boolean
    maintenance: boolean
    qualite: boolean
    facturation: boolean
    sauvegarde: boolean
    utilisateur: boolean
  }
  priority: {
    low: boolean
    normal: boolean
    high: boolean
    urgent: boolean
  }
  schedules: {
    workingHours: {
      enabled: boolean
      start: string // Format: "09:00"
      end: string // Format: "18:00"
    }
    weekdays: {
      enabled: boolean
      days: number[] // 0=dimanche, 1=lundi, etc.
    }
  }
}

// Paramètres par défaut
const defaultSettings: NotificationSettings = {
  enableSound: true,
  enableToast: true,
  enableBrowser: true,
  enableEmail: false,
  categories: {
    system: true,
    stock: true,
    projet: true,
    production: true,
    maintenance: true,
    qualite: true,
    facturation: true,
    sauvegarde: false, // Désactivé par défaut car moins important
    utilisateur: true,
  },
  priority: {
    low: false, // Désactivé par défaut
    normal: true,
    high: true,
    urgent: true,
  },
  schedules: {
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '18:00',
    },
    weekdays: {
      enabled: false,
      days: [1, 2, 3, 4, 5], // Lundi à vendredi
    },
  },
}

// Stockage temporaire - en production, utiliser une base de données liée à l'utilisateur
let userSettings = { ...defaultSettings }

export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json(userSettings)
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json()

    // Fusionner les paramètres mis à jour
    userSettings = {
      ...userSettings,
      ...updates,
      // Fusionner les objets imbriqués
      categories: {
        ...userSettings.categories,
        ...(updates.categories || {}),
      },
      priority: {
        ...userSettings.priority,
        ...(updates.priority || {}),
      },
      schedules: {
        ...userSettings.schedules,
        ...(updates.schedules || {}),
        workingHours: {
          ...userSettings.schedules.workingHours,
          ...(updates.schedules?.workingHours || {}),
        },
        weekdays: {
          ...userSettings.schedules.weekdays,
          ...(updates.schedules?.weekdays || {}),
        },
      },
    }

    return NextResponse.json(userSettings)
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
  }
}

export async function POST(_request: NextRequest) {
  try {
    // Réinitialiser aux paramètres par défaut
    userSettings = { ...defaultSettings }

    return NextResponse.json(userSettings)
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to reset notification settings' }, { status: 500 })
  }
}
