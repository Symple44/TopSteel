'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'

export default function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSyncActivity, setLastSyncActivity] = useState<Date | null>(null)

  useEffect(() => {
    // Écouter les événements de connexion
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Écouter les activités de synchronisation
    const channel = new BroadcastChannel('topsteel-auth')

    const handleMessage = () => {
      setLastSyncActivity(new Date())
    }

    channel?.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      channel?.removeEventListener('message', handleMessage)
      channel?.close()
    }
  }, [])

  const getTitle = () => {
    if (!isOnline) return 'Hors ligne'
    if (lastSyncActivity) {
      return `Dernière synchronisation: ${lastSyncActivity?.toLocaleTimeString()}`
    }
    return 'En ligne'
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center w-6 h-6 rounded-full transition-colors',
        isOnline ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'
      )}
      title={getTitle()}
    >
      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
    </div>
  )
}
