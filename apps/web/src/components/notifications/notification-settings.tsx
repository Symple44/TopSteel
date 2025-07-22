'use client'

import { useNotifications } from '@/components/providers/notifications-provider'
import { Button, Label, Switch, Separator, Badge } from '@erp/ui'
import { useTranslation } from '@/lib/i18n'

import { 
  Mail, 
  Monitor, 
  Volume2, 
  Settings2, 
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Clock,
  Factory,
  Package,
  FileText,
  Users,
  Database,
  Wrench
} from 'lucide-react'
import { useState } from 'react'

export function NotificationSettings() {
  const { state, actions } = useNotifications()
  const { t } = useTranslation('settings')
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'priority' | 'schedule'>('general')


  const categoryIcons = {
    system: Settings2,
    stock: Package,
    projet: FileText,
    production: Factory,
    maintenance: Wrench,
    qualite: CheckCircle,
    facturation: FileText,
    sauvegarde: Database,
    utilisateur: Users,
  }

  const categoryLabels = {
    system: 'Système',
    stock: 'Gestion des stocks',
    projet: 'Projets',
    production: 'Production',
    maintenance: 'Maintenance',
    qualite: 'Contrôle qualité',
    facturation: 'Facturation',
    sauvegarde: 'Sauvegardes',
    utilisateur: 'Messages utilisateurs',
  }

  const priorityIcons = {
    low: Info,
    normal: Bell,
    high: AlertTriangle,
    urgent: X,
  }

  const priorityLabels = {
    low: 'Faible',
    normal: 'Normale',
    high: 'Élevée',
    urgent: 'Urgente',
  }

  const priorityColors = {
    low: 'text-blue-500',
    normal: 'text-green-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings2 },
    { id: 'categories', label: 'Catégories', icon: FileText },
    { id: 'priority', label: 'Priorités', icon: AlertTriangle },
    { id: 'schedule', label: 'Horaires', icon: Clock },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
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
                <Bell className="h-4 w-4" />
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <div>
                  <Label>Notifications email</Label>
                  <p className="text-sm text-muted-foreground">Recevoir des notifications par email</p>
                </div>
              </div>
              <Switch
                checked={state.settings.enableEmail}
                onCheckedChange={(checked: boolean) =>
                  actions.updateSettings({ enableEmail: checked })
                }
              />
            </div>
          </div>
        )

      case 'categories':
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Choisissez les types de notifications que vous souhaitez recevoir
            </div>
            {Object.entries(categoryLabels).map(([key, label]) => {
              const IconComponent = categoryIcons[key as keyof typeof categoryIcons]
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-4 w-4" />
                    <div>
                      <Label>{label}</Label>
                    </div>
                  </div>
                  <Switch
                    checked={state.settings.categories[key as keyof typeof state.settings.categories]}
                    onCheckedChange={(checked: boolean) =>
                      actions.updateSettings({
                        categories: {
                          ...state.settings.categories,
                          [key]: checked,
                        },
                      })
                    }
                  />
                </div>
              )
            })}
          </div>
        )

      case 'priority':
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Définissez les niveaux de priorité des notifications à recevoir
            </div>
            {Object.entries(priorityLabels).map(([key, label]) => {
              const IconComponent = priorityIcons[key as keyof typeof priorityIcons]
              const colorClass = priorityColors[key as keyof typeof priorityColors]
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-4 w-4 ${colorClass}`} />
                    <div>
                      <Label>{label}</Label>
                    </div>
                  </div>
                  <Switch
                    checked={state.settings.priority[key as keyof typeof state.settings.priority]}
                    onCheckedChange={(checked: boolean) =>
                      actions.updateSettings({
                        priority: {
                          ...state.settings.priority,
                          [key]: checked,
                        },
                      })
                    }
                  />
                </div>
              )
            })}
          </div>
        )

      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-center p-4 text-muted-foreground">
                <p>Configuration des horaires disponible dans les paramètres utilisateur</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 text-muted-foreground">
                <p>Configuration des jours ouvrables disponible dans les paramètres utilisateur</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenu de l'onglet */}
      <div className="min-h-[300px]">
        {renderTabContent()}
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-4">

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Note:</strong> Les notifications navigateur nécessitent votre autorisation.
          </p>
          <p>Les paramètres sont automatiquement sauvegardés.</p>
        </div>
      </div>
    </div>
  )
}
