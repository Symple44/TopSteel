/**
 * Notification Center Stub - Socle
 */
'use client'

import { Bell } from 'lucide-react'

export function NotificationCenter() {
  return (
    <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
      <Bell className="h-5 w-5" />
    </button>
  )
}
