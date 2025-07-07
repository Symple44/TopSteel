'use client'

import { useNotifications } from '@/components/providers/notifications-provider'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Mail, Monitor, Volume2 } from 'lucide-react'

// Composant Switch inline pour éviter les problèmes de props
function CustomSwitch({ 
  checked, 
  onChange, 
  className = '',
  ...props 
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <label className={cn("relative inline-flex cursor-pointer items-center", className)} {...props}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="relative h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
    </label>
  )
}

export function NotificationSettings() {
  const { state, actions } = useNotifications()

  const _handleTestNotification = () => {
    // Simuler une notification de test
    const _testNotification = {
      id: Date.now().toString(),
      type: 'info' as const,
      category: 'system' as const,
      title: 'Notification de test',
      message: 'Ceci est une notification de test pour vérifier vos paramètres.',
      read: false,
      persistent: false,
      createdAt: new Date()
    }

    // Ajouter directement via le WebSocket simulé
    if (state.settings.enableToast) {
      // Simuler réception WebSocket
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify(testNotification)
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4" />
            <div>
              <Label>Sons de notification</Label>
              <p className="text-sm text-muted-foreground">
                Jouer un son lors de nouvelles notifications
              </p>
            </div>
          </div>
          <CustomSwitch
            checked={state.settings.enableSound}
            onChange={(checked) => 
              actions.updateSettings({ enableSound: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4" />
            <div>
              <Label>Notifications toast</Label>
              <p className="text-sm text-muted-foreground">
                Afficher les notifications en popup
              </p>
            </div>
          </div>
          <CustomSwitch
            checked={state.settings.enableToast}
            onChange={(checked) => 
              actions.updateSettings({ enableToast: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="h-4 w-4" />
            <div>
              <Label>Notifications navigateur</Label>
              <p className="text-sm text-muted-foreground">
                Notifications système du navigateur
              </p>
            </div>
          </div>
          <CustomSwitch
            checked={state.settings.enableBrowser}
            onChange={(checked) => 
              actions.updateSettings({ enableBrowser: checked })
            }
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleTestNotification}
        >
          Tester les notifications
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Note:</strong> Les notifications navigateur nécessitent votre autorisation.</p>
        <p>Les paramètres sont sauvegardés localement pour votre compte.</p>
      </div>
    </div>
  )
}
