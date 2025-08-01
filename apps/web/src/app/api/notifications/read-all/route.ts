import { type NextRequest, NextResponse } from 'next/server'

// Stockage temporaire - en production, utiliser une base de données
let notifications: any[] = []

export async function PATCH(_request: NextRequest) {
  try {
    const readAt = new Date().toISOString()

    // Marquer toutes les notifications comme lues
    notifications = notifications.map((notification) => ({
      ...notification,
      isRead: true,
      readAt,
    }))

    return NextResponse.json({
      success: true,
      updatedCount: notifications.length,
      readAt,
    })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
  }
}
