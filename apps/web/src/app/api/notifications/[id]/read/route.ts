import { type NextRequest, NextResponse } from 'next/server'

// Stockage temporaire - en production, utiliser une base de données
const notifications: { id: string; isRead?: boolean; readAt?: string }[] = []

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Trouver la notification
    const notificationIndex = notifications.findIndex((n) => n.id === id)

    if (notificationIndex === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Marquer comme lue
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      isRead: true,
      readAt: new Date().toISOString(),
    }

    return NextResponse.json(notifications[notificationIndex])
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
