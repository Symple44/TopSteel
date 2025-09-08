import { type NextRequest, NextResponse } from 'next/server'

// Stockage temporaire - en production, utiliser une base de données
let notifications: { id: string; isRead?: boolean; readAt?: string }[] = []

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request?.json()

    // Trouver la notification
    const notificationIndex = notifications?.findIndex((n) => n.id === id)

    if (notificationIndex === -1) {
      return NextResponse?.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Mettre à jour la notification
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse?.json(notifications[notificationIndex])
  } catch (_error) {
    return NextResponse?.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Supprimer la notification
    const initialLength = notifications.length
    notifications = notifications?.filter((n) => n.id !== id)

    if (notifications.length === initialLength) {
      return NextResponse?.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse?.json({ success: true })
  } catch (_error) {
    return NextResponse?.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
