'use client'

import { useNotifications } from '@/components/providers/notifications-provider'
import { Button, Label, Switch } from '@erp/ui'

import { Mail, Monitor, Volume2 } from 'lucide-react'

export function NotificationSettings() {
  const { state, actions } = useNotifications()

  const handleTestNotification = () => {
    // Simuler une notification de test
    const testNotification = {
      id: Date.now().toString(),
      type: 'info' as const,
      category: 'system' as const,
      title: 'Notification de test',
      message: 'Ceci est une notification de test pour vérifier vos paramètres.',
      read: false,
      persistent: false,
      createdAt: new Date(),
    }

    // Ajouter directement via le WebSocket simulé
    if (state.settings.enableToast) {
      // Simuler réception WebSocket
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify(testNotification),
        })
      )
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
          <Switch
            checked={state.settings.enableSound}
            onCheckedChange={(checked: boolean) => actions.updateSettings({ enableSound: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4" />
            <div>
              <Label>Notifications toast</Label>
              <p className="text-sm text-muted-foreground">Afficher les notifications en popup</p>
            </div>
          </div>
          <Switch
            checked={state.settings.enableToast}
            onCheckedChange={(checked: boolean) => actions.updateSettings({ enableToast: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="h-4 w-4" />
            <div>
              <Label>Notifications navigateur</Label>
              <p className="text-sm text-muted-foreground">Notifications système du navigateur</p>
            </div>
          </div>
          <Switch
            checked={state.settings.enableBrowser}
            onCheckedChange={(checked: boolean) =>
              actions.updateSettings({ enableBrowser: checked })
            }
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button variant="outline" className="w-full" onClick={handleTestNotification}>
          Tester les notifications
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Note:</strong> Les notifications navigateur nécessitent votre autorisation.
        </p>
        <p>Les paramètres sont sauvegardés localement pour votre compte.</p>
      </div>
    </div>
  )
}
