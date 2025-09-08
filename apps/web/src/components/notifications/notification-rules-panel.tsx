'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useFormFieldIds,
} from '@erp/ui'
import {
  CheckCircle,
  Clock,
  Database,
  Edit,
  FileText,
  Filter,
  Mail,
  Package,
  Plus,
  Settings,
  Trash2,
  User,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { PermissionHide } from '@/components/auth/permission-guard'

// Types pour les règles de notification
interface NotificationRule {
  id: string
  name: string
  description: string
  isActive: boolean
  trigger: EventTrigger
  conditions: Condition[]
  notification: NotificationConfig
  createdAt: string
  lastTriggered?: string
  triggerCount: number
}

interface EventTrigger {
  type: 'user' | 'stock' | 'email' | 'project' | 'production' | 'system'
  event: string
  source?: string
}

interface Condition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: string | number | string[]
}

interface NotificationConfig {
  type: 'info' | 'success' | 'warning' | 'error'
  category: string
  titleTemplate: string
  messageTemplate: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  recipientType: 'all' | 'role' | 'user' | 'group'
  recipientIds?: string[]
  actionUrl?: string
  actionLabel?: string
  persistent: boolean
  expiresIn?: number // en heures
}

// Événements disponibles par catégorie
const AVAILABLE_EVENTS = {
  user: [
    { value: 'password_changed', label: 'Mot de passe modifié' },
    { value: 'user_created', label: 'Utilisateur créé' },
    { value: 'user_login', label: 'Connexion utilisateur' },
    { value: 'user_logout', label: 'Déconnexion utilisateur' },
    { value: 'user_deleted', label: 'Utilisateur supprimé' },
    { value: 'role_changed', label: 'Rôle modifié' },
  ],
  stock: [
    { value: 'stock_low', label: 'Stock faible' },
    { value: 'stock_empty', label: 'Rupture de stock' },
    { value: 'stock_received', label: 'Réception stock' },
    { value: 'stock_movement', label: 'Mouvement de stock' },
    { value: 'inventory_count', label: 'Inventaire effectué' },
  ],
  email: [
    { value: 'email_received', label: 'Email reçu' },
    { value: 'email_sent', label: 'Email envoyé' },
    { value: 'email_failed', label: 'Échec envoi email' },
    { value: 'email_bounce', label: 'Email rebondi' },
  ],
  project: [
    { value: 'project_created', label: 'Projet créé' },
    { value: 'project_updated', label: 'Projet modifié' },
    { value: 'project_completed', label: 'Projet terminé' },
    { value: 'project_comment', label: 'Commentaire ajouté' },
    { value: 'project_status_changed', label: 'Statut changé' },
  ],
  production: [
    { value: 'order_created', label: 'Commande créée' },
    { value: 'order_completed', label: 'Commande terminée' },
    { value: 'machine_error', label: 'Erreur machine' },
    { value: 'machine_maintenance', label: 'Maintenance machine' },
    { value: 'quality_check', label: 'Contrôle qualité' },
  ],
  system: [
    { value: 'backup_completed', label: 'Sauvegarde terminée' },
    { value: 'backup_failed', label: 'Échec sauvegarde' },
    { value: 'system_update', label: 'Mise à jour système' },
    { value: 'system_error', label: 'Erreur système' },
    { value: 'database_error', label: 'Erreur base de données' },
  ],
}

const CATEGORY_ICONS = {
  user: User,
  stock: Package,
  email: Mail,
  project: FileText,
  production: Settings,
  system: Database,
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

const TYPE_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
}

export function NotificationRulesPanel() {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('rules')

  // Données mockées pour la démonstration
  useEffect(() => {
    const mockRules: NotificationRule[] = [
      {
        id: '1',
        name: 'Alerte Stock Critique',
        description: "Notifier quand le stock d'un matériau passe sous le seuil critique",
        isActive: true,
        trigger: {
          type: 'stock',
          event: 'stock_low',
          source: 'inventory-service',
        },
        conditions: [
          { field: 'quantity', operator: 'less_than', value: 10 },
          { field: 'category', operator: 'in', value: ['metal', 'steel'] },
        ],
        notification: {
          type: 'warning',
          category: 'stock',
          titleTemplate: 'Stock critique: {{material_name}}',
          messageTemplate:
            'Le stock de {{material_name}} est maintenant de {{quantity}} unités (seuil: {{threshold}})',
          priority: 'HIGH',
          recipientType: 'role',
          recipientIds: ['stock_manager', 'admin'],
          actionUrl: '/stock/materials/{{material_id}}',
          actionLabel: 'Voir le stock',
          persistent: true,
          expiresIn: 24,
        },
        createdAt: '2024-01-15T10:30:00Z',
        lastTriggered: '2024-01-16T14:22:00Z',
        triggerCount: 15,
      },
      {
        id: '2',
        name: 'Nouveau Projet',
        description: "Notifier l'équipe quand un nouveau projet est créé",
        isActive: true,
        trigger: {
          type: 'project',
          event: 'project_created',
          source: 'project-service',
        },
        conditions: [{ field: 'priority', operator: 'in', value: ['HIGH', 'URGENT'] }],
        notification: {
          type: 'info',
          category: 'projet',
          titleTemplate: 'Nouveau projet: {{project_name}}',
          messageTemplate: 'Un nouveau projet "{{project_name}}" a été créé par {{created_by}}',
          priority: 'NORMAL',
          recipientType: 'role',
          recipientIds: ['project_manager', 'team_lead'],
          actionUrl: '/projets/{{project_id}}',
          actionLabel: 'Voir le projet',
          persistent: true,
          expiresIn: 48,
        },
        createdAt: '2024-01-10T09:15:00Z',
        lastTriggered: '2024-01-16T11:45:00Z',
        triggerCount: 8,
      },
      {
        id: '3',
        name: 'Changement Mot de Passe',
        description: 'Notifier les administrateurs des changements de mot de passe',
        isActive: false,
        trigger: {
          type: 'user',
          event: 'password_changed',
          source: 'auth-service',
        },
        conditions: [{ field: 'role', operator: 'in', value: ['admin', 'manager'] }],
        notification: {
          type: 'info',
          category: 'utilisateur',
          titleTemplate: 'Mot de passe modifié',
          messageTemplate: "L'utilisateur {{username}} a modifié son mot de passe",
          priority: 'LOW',
          recipientType: 'role',
          recipientIds: ['admin'],
          persistent: false,
          expiresIn: 6,
        },
        createdAt: '2024-01-12T16:20:00Z',
        triggerCount: 3,
      },
    ]
    setRules(mockRules)
  }, [])

  const handleToggleRule = (ruleId: string) => {
    setRules(
      rules?.map((rule) => (rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule))
    )
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules?.filter((rule) => rule.id !== ruleId))
  }

  const getEventLabel = (trigger: EventTrigger) => {
    const events = AVAILABLE_EVENTS[trigger.type]
    const event = events?.find((e) => e.value === trigger.event)
    return event?.label || trigger.event
  }

  const _IconComponent = CATEGORY_ICONS[selectedRule?.trigger.type || 'system']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Règles de Notification</h2>
          <p className="text-muted-foreground">
            Créez des règles automatiques pour générer des notifications basées sur des événements
            système
          </p>
        </div>
        <PermissionHide permission="NOTIFICATION_RULES" roles={['ADMIN', 'MANAGER']}>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle règle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle règle</DialogTitle>
              </DialogHeader>
              <RuleForm onSave={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </PermissionHide>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Règles actives</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {rules?.map((rule) => (
              <Card key={rule.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        {(() => {
                          const Icon = CATEGORY_ICONS[rule?.trigger?.type]
                          return <Icon className="h-5 w-5 text-gray-600" />
                        })()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Actif
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactif
                          </>
                        )}
                      </Badge>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Informations sur le déclencheur */}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Événement:</span>
                        <Badge variant="outline">{getEventLabel(rule.trigger)}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge className={TYPE_COLORS[rule?.notification?.type]}>
                          {rule?.notification?.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Priorité:</span>
                        <Badge className={PRIORITY_COLORS[rule?.notification?.priority]}>
                          {rule?.notification?.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Conditions */}
                    {rule?.conditions?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Filter className="h-4 w-4" />
                          <span>Conditions:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rule?.conditions?.map((condition, index) => (
                            <Badge
                              key={`${condition.field}-${condition.operator}-${index}`}
                              variant="outline"
                              className="text-xs"
                            >
                              {condition.field} {condition.operator}{' '}
                              {Array.isArray(condition.value)
                                ? condition?.value?.join(', ')
                                : condition.value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Statistiques */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Déclenchements: {rule.triggerCount}</span>
                        </div>
                        {rule.lastTriggered && (
                          <span>
                            Dernière fois: {new Date(rule.lastTriggered).toLocaleString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <PermissionHide
                          permission="NOTIFICATION_RULES"
                          roles={['ADMIN', 'MANAGER']}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRule(rule)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionHide>
                        <PermissionHide permission="NOTIFICATION_ADMIN" roles={['ADMIN']}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionHide>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des notifications</CardTitle>
              <CardDescription>
                Consultez l'historique des notifications générées par vos règles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Fonctionnalité à venir...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de notification</CardTitle>
              <CardDescription>Gérez vos templates de notification réutilisables</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Fonctionnalité à venir...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la règle</DialogTitle>
          </DialogHeader>
          {selectedRule && (
            <RuleForm rule={selectedRule} onSave={() => setIsEditDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Types pour le formulaire
interface FormData {
  name: string
  description: string
  isActive: boolean
  triggerType: 'user' | 'stock' | 'email' | 'project' | 'production' | 'system'
  triggerEvent: string
  notificationType: 'info' | 'success' | 'warning' | 'error'
  notificationCategory: string
  titleTemplate: string
  messageTemplate: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  recipientType: 'all' | 'role' | 'user' | 'group'
  actionUrl: string
  actionLabel: string
  persistent: boolean
  expiresIn: number
}

// Composant formulaire pour créer/éditer une règle
function RuleForm({ rule, onSave }: { rule?: NotificationRule; onSave: () => void }) {
  const ids = useFormFieldIds([
    'name',
    'isActive',
    'description',
    'titleTemplate',
    'messageTemplate',
    'actionUrl',
    'actionLabel',
  ])
  const [formData, setFormData] = useState<FormData>({
    name: rule?.name || '',
    description: rule?.description || '',
    isActive: rule?.isActive ?? true,
    triggerType: rule?.trigger.type || 'user',
    triggerEvent: rule?.trigger.event || '',
    notificationType: rule?.notification.type || 'info',
    notificationCategory: rule?.notification.category || '',
    titleTemplate: rule?.notification.titleTemplate || '',
    messageTemplate: rule?.notification.messageTemplate || '',
    priority: rule?.notification.priority || 'NORMAL',
    recipientType: rule?.notification.recipientType || 'all',
    actionUrl: rule?.notification.actionUrl || '',
    actionLabel: rule?.notification.actionLabel || '',
    persistent: rule?.notification.persistent || true,
    expiresIn: rule?.notification.expiresIn || 24,
  })

  const handleSave = () => {
    // Logique de sauvegarde
    onSave()
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Informations</TabsTrigger>
          <TabsTrigger value="trigger">Déclencheur</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="notification">Notification</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={ids.name}>Nom de la règle</Label>
              <Input
                id={ids.name}
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, name: e?.target?.value }))
                }
                placeholder="Ex: Alerte stock critique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={ids.isActive}>Statut</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={ids.isActive}
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor={ids.isActive}>{formData.isActive ? 'Actif' : 'Inactif'}</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={ids.description}>Description</Label>
            <Textarea
              id={ids.description}
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, description: e?.target?.value }))
              }
              placeholder="Décrivez quand cette règle doit s'activer..."
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="trigger" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="triggerType">Type d'événement</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({
                    ...prev,
                    triggerType: value as FormData['triggerType'],
                    triggerEvent: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="project">Projet</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="triggerEvent">Événement</Label>
              <Select
                value={formData.triggerEvent}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, triggerEvent: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un événement" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_EVENTS[formData.triggerType as keyof typeof AVAILABLE_EVENTS]?.map(
                    (event) => (
                      <SelectItem key={event?.value} value={event?.value}>
                        {event?.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Conditions</h3>
              <Button type="button" variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une condition
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Définissez les conditions qui doivent être remplies pour déclencher cette règle
            </p>
            {/* Ici sera la logique pour ajouter/modifier les conditions */}
          </div>
        </TabsContent>

        <TabsContent value="notification" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notificationType">Type de notification</Label>
              <Select
                value={formData.notificationType}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({
                    ...prev,
                    notificationType: value as FormData['notificationType'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, priority: value as FormData['priority'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="NORMAL">Normale</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={ids.titleTemplate}>Template du titre</Label>
            <Input
              id={ids.titleTemplate}
              value={formData.titleTemplate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, titleTemplate: e?.target?.value }))
              }
              placeholder="Ex: Stock critique: {{material_name}}"
            />
            <p className="text-xs text-muted-foreground">
              Utilisez des variables entre accolades comme {`{{variable_name}}`}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={ids.messageTemplate}>Template du message</Label>
            <Textarea
              id={ids.messageTemplate}
              value={formData.messageTemplate}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, messageTemplate: e?.target?.value }))
              }
              placeholder="Ex: Le stock de {{material_name}} est maintenant de {{quantity}} unités"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={ids.actionUrl}>URL d'action</Label>
              <Input
                id={ids.actionUrl}
                value={formData.actionUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, actionUrl: e?.target?.value }))
                }
                placeholder="Ex: /stock/materials/{{material_id}}"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={ids.actionLabel}>Label du bouton</Label>
              <Input
                id={ids.actionLabel}
                value={formData.actionLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, actionLabel: e?.target?.value }))
                }
                placeholder="Ex: Voir le stock"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSave}>
          Annuler
        </Button>
        <Button type="button" onClick={handleSave}>
          {rule ? 'Modifier' : 'Créer'} la règle
        </Button>
      </div>
    </div>
  )
}
