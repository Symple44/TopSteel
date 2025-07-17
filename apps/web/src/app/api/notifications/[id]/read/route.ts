import { NextRequest, NextResponse } from 'next/server'

// Stockage temporaire - en production, utiliser une base de données
let notifications: any[] = []

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Trouver la notification
    const notificationIndex = notifications.findIndex(n => n.id === id)
    
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Marquer comme lue
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      isRead: true,
      readAt: new Date().toISOString(),
    }


    return NextResponse.json(notifications[notificationIndex])

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}