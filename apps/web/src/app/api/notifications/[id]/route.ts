import { NextRequest, NextResponse } from 'next/server'

// Stockage temporaire - en production, utiliser une base de données
let notifications: any[] = []

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Trouver la notification
    const notificationIndex = notifications.findIndex(n => n.id === id)
    
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Mettre à jour la notification
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }


    return NextResponse.json(notifications[notificationIndex])

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Supprimer la notification
    const initialLength = notifications.length
    notifications = notifications.filter(n => n.id !== id)

    if (notifications.length === initialLength) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }


    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}