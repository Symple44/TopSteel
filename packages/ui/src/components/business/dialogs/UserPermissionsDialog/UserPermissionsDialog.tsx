'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { Shield, User, Check, X, Search, Copy, RotateCcw, AlertTriangle, Info } from 'lucide-react'
import { Button } from '../../../primitives/button/Button'
import { DialogTrigger } from '../../../primitives/dialog/Dialog'
import { Input } from '../../../primitives/input/Input'
import { FormMessage } from '../../../forms/form/form'
import { CardFooter } from '../../../layout/card'
import { SelectValue } from '../../../primitives/select/select'
import { Switch } from '../../../primitives/switch/switch'
import { Badge } from '../../../data-display/badge'
import { ScrollArea } from '../../../layout/scroll-area/ScrollArea'
import {
  FormDescription,
  Alert,
  Separator,
} from '../../../'
// Extended permissions with resource-level controls
const DETAILED_PERMISSIONS = {
  users: {
    label: 'Gestion des utilisateurs',
    permissions: {
      view: { label: 'Voir les utilisateurs', description: 'Consulter la liste et les détails des utilisateurs' },
      create: { label: 'Créer des utilisateurs', description: 'Ajouter de nouveaux utilisateurs au système' },
      edit: { label: 'Modifier les utilisateurs', description: 'Éditer les informations des utilisateurs existants' },
      delete: { label: 'Supprimer des utilisateurs', description: 'Supprimer définitivement des utilisateurs' },
      manage_roles: { label: 'Gérer les rôles', description: 'Assigner et modifier les rôles des utilisateurs' },
      view_activity: { label: 'Voir l\'activité', description: 'Consulter les logs d\'activité des utilisateurs' },
      reset_passwords: { label: 'Réinitialiser mots de passe', description: 'Forcer la réinitialisation des mots de passe' },
      manage_sessions: { label: 'Gérer les sessions', description: 'Terminer ou prolonger les sessions utilisateur' }
    }
  },
  clients: {
    label: 'Gestion des clients',
    permissions: {
      view: { label: 'Voir les clients', description: 'Consulter la liste et les détails des clients' },
      create: { label: 'Créer des clients', description: 'Ajouter de nouveaux clients' },
      edit: { label: 'Modifier les clients', description: 'Éditer les informations clients' },
      delete: { label: 'Supprimer des clients', description: 'Supprimer des clients du système' },
      manage_credit: { label: 'Gérer le crédit', description: 'Modifier les limites et conditions de crédit' },
      view_finances: { label: 'Voir les finances', description: 'Consulter les données financières des clients' },
      export_data: { label: 'Exporter données', description: 'Exporter les informations clients' },
      merge_clients: { label: 'Fusionner clients', description: 'Fusionner des fiches clients dupliquées' }
    }
  },
  materials: {
    label: 'Gestion des matériaux',
    permissions: {
      view: { label: 'Voir les matériaux', description: 'Consulter le catalogue des matériaux' },
      create: { label: 'Créer des matériaux', description: 'Ajouter de nouveaux matériaux au catalogue' },
      edit: { label: 'Modifier les matériaux', description: 'Éditer les spécifications des matériaux' },
      delete: { label: 'Supprimer des matériaux', description: 'Retirer des matériaux du catalogue' },
      manage_pricing: { label: 'Gérer les prix', description: 'Modifier les prix et conditions tarifaires' },
      view_costs: { label: 'Voir les coûts', description: 'Consulter les coûts d\'achat et marges' },
      bulk_import: { label: 'Import en lot', description: 'Importer des matériaux en masse' },
      manage_suppliers: { label: 'Gérer fournisseurs', description: 'Associer et gérer les fournisseurs de matériaux' }
    }
  },
  inventory: {
    label: 'Gestion des stocks',
    permissions: {
      view: { label: 'Voir les stocks', description: 'Consulter les niveaux de stock en temps réel' },
      create: { label: 'Créer entrées stock', description: 'Enregistrer de nouvelles entrées de stock' },
      edit: { label: 'Modifier mouvements', description: 'Corriger les mouvements de stock' },
      adjust: { label: 'Ajuster les stocks', description: 'Effectuer des ajustements d\'inventaire' },
      transfer: { label: 'Transférer stock', description: 'Transférer des matériaux entre emplacements' },
      view_movements: { label: 'Voir mouvements', description: 'Consulter l\'historique des mouvements' },
      manage_locations: { label: 'Gérer emplacements', description: 'Créer et modifier les emplacements de stockage' },
      set_alerts: { label: 'Configurer alertes', description: 'Définir les seuils d\'alerte de stock' }
    }
  },
  production: {
    label: 'Gestion de production',
    permissions: {
      view: { label: 'Voir production', description: 'Consulter les ordres et statuts de production' },
      create: { label: 'Créer ordres', description: 'Créer de nouveaux ordres de production' },
      edit: { label: 'Modifier ordres', description: 'Modifier les ordres de production existants' },
      manage_processes: { label: 'Gérer processus', description: 'Définir et modifier les processus de production' },
      quality_control: { label: 'Contrôle qualité', description: 'Effectuer et valider les contrôles qualité' },
      view_performance: { label: 'Voir performance', description: 'Consulter les métriques de performance' },
      manage_resources: { label: 'Gérer ressources', description: 'Allouer machines et personnel aux productions' },
      approve_changes: { label: 'Approuver modifications', description: 'Valider les changements de production' }
    }
  },
  sales: {
    label: 'Gestion commerciale',
    permissions: {
      view: { label: 'Voir ventes', description: 'Consulter les devis, commandes et factures' },
      create: { label: 'Créer devis/commandes', description: 'Créer de nouveaux devis et commandes' },
      edit: { label: 'Modifier documents', description: 'Modifier les documents commerciaux' },
      approve_quotes: { label: 'Approuver devis', description: 'Valider et approuver les devis clients' },
      manage_pricing: { label: 'Gérer tarification', description: 'Modifier les prix de vente et remises' },
      view_margins: { label: 'Voir marges', description: 'Consulter les marges bénéficiaires' },
      manage_contracts: { label: 'Gérer contrats', description: 'Créer et modifier les contrats clients' },
      export_documents: { label: 'Exporter documents', description: 'Exporter les documents commerciaux' }
    }
  },
  finance: {
    label: 'Gestion financière',
    permissions: {
      view: { label: 'Voir finances', description: 'Consulter les données financières générales' },
      create: { label: 'Créer écritures', description: 'Enregistrer de nouvelles écritures comptables' },
      edit: { label: 'Modifier écritures', description: 'Corriger les écritures comptables' },
      approve_payments: { label: 'Approuver paiements', description: 'Valider les paiements et virements' },
      manage_budgets: { label: 'Gérer budgets', description: 'Créer et modifier les budgets prévisionnels' },
      view_reports: { label: 'Voir rapports', description: 'Consulter les rapports financiers détaillés' },
      manage_accounts: { label: 'Gérer comptes', description: 'Administrer les comptes comptables' },
      audit_access: { label: 'Accès audit', description: 'Consulter les pistes d\'audit financières' }
    }
  },
  projects: {
    label: 'Gestion de projets',
    permissions: {
      view: { label: 'Voir projets', description: 'Consulter la liste et détails des projets' },
      create: { label: 'Créer projets', description: 'Créer de nouveaux projets' },
      edit: { label: 'Modifier projets', description: 'Éditer les informations des projets' },
      assign_resources: { label: 'Assigner ressources', description: 'Allouer personnel et matériel aux projets' },
      manage_timeline: { label: 'Gérer planning', description: 'Modifier les échéances et jalons' },
      view_costs: { label: 'Voir coûts', description: 'Consulter les coûts et budgets des projets' },
      manage_tasks: { label: 'Gérer tâches', description: 'Créer et assigner des tâches' },
      approve_milestones: { label: 'Approuver jalons', description: 'Valider l\'achèvement des jalons' }
    }
  },
  reports: {
    label: 'Rapports et analyses',
    permissions: {
      view: { label: 'Voir rapports', description: 'Consulter les rapports standards' },
      create: { label: 'Créer rapports', description: 'Générer de nouveaux rapports personnalisés' },
      export: { label: 'Exporter données', description: 'Exporter les données vers différents formats' },
      advanced_analytics: { label: 'Analytics avancés', description: 'Accéder aux outils d\'analyse avancée' },
      schedule_reports: { label: 'Programmer rapports', description: 'Automatiser l\'envoi de rapports' },
      share_reports: { label: 'Partager rapports', description: 'Partager les rapports avec des tiers' },
      manage_dashboards: { label: 'Gérer tableaux de bord', description: 'Créer et modifier les tableaux de bord' },
      real_time_data: { label: 'Données temps réel', description: 'Accéder aux données en temps réel' }
    }
  },
  administration: {
    label: 'Administration système',
    permissions: {
      system_settings: { label: 'Paramètres système', description: 'Modifier la configuration générale du système' },
      backup_restore: { label: 'Sauvegarde/Restauration', description: 'Gérer les sauvegardes et restaurations' },
      audit_logs: { label: 'Logs d\'audit', description: 'Consulter les logs d\'audit système' },
      manage_integrations: { label: 'Gérer intégrations', description: 'Configurer les intégrations externes' },
      security_settings: { label: 'Paramètres sécurité', description: 'Modifier les paramètres de sécurité' },
      license_management: { label: 'Gestion licences', description: 'Administrer les licences et abonnements' },
      system_monitoring: { label: 'Monitoring système', description: 'Surveiller les performances système' },
      maintenance_mode: { label: 'Mode maintenance', description: 'Activer/désactiver le mode maintenance' }
    }
  }
} as const
// Role templates for quick assignment
const ROLE_TEMPLATES = {
  admin: {
    label: 'Administrateur complet',
    description: 'Toutes les permissions sur tous les modules',
    permissions: Object.keys(DETAILED_PERMISSIONS).reduce((acc, module) => {
      acc[module] = Object.keys(DETAILED_PERMISSIONS[module as keyof typeof DETAILED_PERMISSIONS].permissions)
      return acc
    }, {} as Record<string, string[]>)
  },
  manager: {
    label: 'Manager général',
    description: 'Permissions de gestion et consultation',
    permissions: {
      users: ['view', 'create', 'edit'],
      clients: ['view', 'create', 'edit', 'view_finances'],
      materials: ['view', 'create', 'edit'],
      inventory: ['view', 'create', 'edit', 'adjust', 'transfer'],
      production: ['view', 'create', 'edit', 'manage_processes'],
      sales: ['view', 'create', 'edit', 'approve_quotes'],
      finance: ['view', 'view_reports'],
      projects: ['view', 'create', 'edit', 'assign_resources', 'manage_timeline'],
      reports: ['view', 'create', 'export'],
      administration: []
    }
  },
  production_supervisor: {
    label: 'Superviseur production',
    description: 'Permissions centrées sur la production et qualité',
    permissions: {
      users: ['view'],
      clients: ['view'],
      materials: ['view'],
      inventory: ['view', 'create', 'transfer', 'view_movements'],
      production: ['view', 'create', 'edit', 'manage_processes', 'quality_control', 'view_performance'],
      sales: ['view'],
      finance: [],
      projects: ['view', 'manage_tasks'],
      reports: ['view', 'create'],
      administration: []
    }
  },
  sales_representative: {
    label: 'Commercial',
    description: 'Permissions commerciales et clients',
    permissions: {
      users: ['view'],
      clients: ['view', 'create', 'edit'],
      materials: ['view'],
      inventory: ['view'],
      production: ['view'],
      sales: ['view', 'create', 'edit', 'manage_contracts'],
      finance: ['view'],
      projects: ['view'],
      reports: ['view', 'create'],
      administration: []
    }
  },
  employee: {
    label: 'Employé standard',
    description: 'Permissions de base en consultation',
    permissions: {
      users: ['view'],
      clients: ['view'],
      materials: ['view'],
      inventory: ['view'],
      production: ['view'],
      sales: ['view'],
      finance: [],
      projects: ['view'],
      reports: ['view'],
      administration: []
    }
  }
}
// Permission validation schema
const permissionsSchema = z.object({
  userId: z.string().min(1, 'L\'ID utilisateur est requis'),
  permissions: z.object({
    users: z.array(z.string()).default([]),
    clients: z.array(z.string()).default([]),
    materials: z.array(z.string()).default([]),
    inventory: z.array(z.string()).default([]),
    production: z.array(z.string()).default([]),
    sales: z.array(z.string()).default([]),
    finance: z.array(z.string()).default([]),
    projects: z.array(z.string()).default([]),
    reports: z.array(z.string()).default([]),
    administration: z.array(z.string()).default([])
  }),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  reason: z.string().optional(),
  temporaryAccess: z.boolean().default(false),
})
type PermissionsFormData = z.infer<typeof permissionsSchema>
interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department: string
}
interface UserPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: PermissionsFormData) => void | Promise<void>
  userData?: UserData | null
  currentPermissions?: Record<string, string[]>
}
export function UserPermissionsDialog({
  open,
  onOpenChange,
  onSubmit,
  userData,
  currentPermissions = {}
}: UserPermissionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const form = useForm<PermissionsFormData>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: {
      userId: '',
      permissions: {
        users: [],
        clients: [],
        materials: [],
        inventory: [],
        production: [],
        sales: [],
        finance: [],
        projects: [],
        reports: [],
        administration: []
      },
      temporaryAccess: false,
    },
  })
  const watchTemporaryAccess = form.watch('temporaryAccess')
  // Load user data and permissions when dialog opens
  useEffect(() => {
    if (userData && open) {
      form.reset({
        userId: userData.id,
        permissions: {
          users: currentPermissions.users || [],
          clients: currentPermissions.clients || [],
          materials: currentPermissions.materials || [],
          inventory: currentPermissions.inventory || [],
          production: currentPermissions.production || [],
          sales: currentPermissions.sales || [],
          finance: currentPermissions.finance || [],
          projects: currentPermissions.projects || [],
          reports: currentPermissions.reports || [],
          administration: currentPermissions.administration || []
        },
        temporaryAccess: false,
      })
    }
  }, [userData, currentPermissions, open, form])
  const applyTemplate = (templateKey: string) => {
    const template = ROLE_TEMPLATES[templateKey as keyof typeof ROLE_TEMPLATES]
    if (template) {
      form.setValue('permissions', template.permissions as any)
      setSelectedTemplate(templateKey)
    }
  }
  const clearAllPermissions = () => {
    const emptyPermissions = Object.keys(DETAILED_PERMISSIONS).reduce((acc, module) => {
      acc[module] = []
      return acc
    }, {} as Record<string, string[]>)
    form.setValue('permissions', emptyPermissions as any)
    setSelectedTemplate('')
  }
  const copyFromCurrentRole = () => {
    // This would copy permissions from the user's current role template
    if (userData?.role && ROLE_TEMPLATES[userData.role as keyof typeof ROLE_TEMPLATES]) {
      applyTemplate(userData.role)
    }
  }
  const handleSubmit = async (data: PermissionsFormData) => {
    try {
      setLoading(true)
      setError(null)
      // Validate temporal permissions
      if (data.temporaryAccess && data.effectiveDate && data.expirationDate) {
        if (new Date(data.expirationDate) <= new Date(data.effectiveDate)) {
          setError('La date d\'expiration doit être postérieure à la date d\'effet')
          return
        }
      }
      await onSubmit?.(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }
  const handleClose = () => {
    form.reset()
    setError(null)
    setSearchTerm('')
    setSelectedTemplate('')
    onOpenChange(false)
  }
  const getPermissionCount = () => {
    const permissions = form.getValues('permissions')
    return Object.values(permissions).reduce((total, modulePerms) => total + modulePerms.length, 0)
  }
  const filterPermissions = (permissions: Record<string, any>) => {
    if (!searchTerm) return permissions
    return Object.entries(permissions).reduce((acc, [key, permData]) => {
      const matchingPerms = Object.entries(permData.permissions).filter(
        ([permKey, permValue]: [string, any]) =>
          permValue.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          permValue.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (matchingPerms.length > 0 || permData.label.toLowerCase().includes(searchTerm.toLowerCase())) {
        acc[key] = {
          ...permData,
          permissions: Object.fromEntries(matchingPerms.length > 0 ? matchingPerms : Object.entries(permData.permissions))
        }
      }
      return acc
    }, {} as Record<string, any>)
  }
  if (!userData) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permissions utilisateur</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <div>Aucun utilisateur sélectionné</div>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions détaillées - {userData.firstName} {userData.lastName}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <div>{error}</div>
                </Alert>
              )}
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations utilisateur
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm font-medium">Nom complet</p>
                    <p className="text-sm text-muted-foreground">{userData.firstName} {userData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rôle actuel</p>
                    <Badge>{userData.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Département</p>
                    <Badge variant="outline">{userData.department}</Badge>
                  </div>
                </CardContent>
              </Card>
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions rapides</CardTitle>
                  <FormDescription>
                    Permissions actuelles: <Badge variant="secondary">{getPermissionCount()} permissions actives</Badge>
                  </FormDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Select onValueChange={applyTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Appliquer un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_TEMPLATES).map(([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyFromCurrentRole}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copier du rôle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearAllPermissions}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Tout effacer
                    </Button>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  {selectedTemplate && (
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Modèle appliqué: {ROLE_TEMPLATES[selectedTemplate as keyof typeof ROLE_TEMPLATES].label}</p>
                        <p className="text-sm text-muted-foreground">{ROLE_TEMPLATES[selectedTemplate as keyof typeof ROLE_TEMPLATES].description}</p>
                      </div>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              {/* Permissions Detail */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permissions détaillées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(filterPermissions(DETAILED_PERMISSIONS)).map(([moduleKey, moduleData]) => (
                    <div key={moduleKey} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-base">{moduleData.label}</h4>
                        <Badge variant="outline">
                          {form.watch(`permissions.${moduleKey as keyof PermissionsFormData['permissions']}`).length} / {Object.keys(moduleData.permissions).length}
                        </Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(moduleData.permissions).map(([permKey, permData]: [string, any]) => (
                          <FormField
                            key={`${moduleKey}-${permKey}`}
                            control={form.control}
                            name={`permissions.${moduleKey as keyof PermissionsFormData['permissions']}`}
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 p-3 border rounded-lg">
                                <FormControl>
                                  <Switch
                                    checked={field.value?.includes(permKey) || false}
                                    onCheckedChange={(checked) => {
                                      const currentPerms = field.value || []
                                      if (checked) {
                                        field.onChange([...currentPerms, permKey])
                                      } else {
                                        field.onChange(currentPerms.filter(p => p !== permKey))
                                      }
                                    }}
                                  />
                                </FormControl>
                                <div className="flex-1 min-w-0">
                                  <FormLabel className="text-sm font-medium leading-tight cursor-pointer">
                                    {permData.label}
                                  </FormLabel>
                                  <FormDescription className="text-xs text-muted-foreground mt-1">
                                    {permData.description}
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      {moduleKey !== Object.keys(filterPermissions(DETAILED_PERMISSIONS))[Object.keys(filterPermissions(DETAILED_PERMISSIONS)).length - 1] && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              {/* Temporal Access */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Accès temporaire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="temporaryAccess"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div>
                          <FormLabel className="text-sm font-normal">
                            Configurer un accès temporaire
                          </FormLabel>
                          <FormDescription>
                            Les permissions seront automatiquement révoquées à l'expiration
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  {watchTemporaryAccess && (
                    <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2">
                      <FormField
                        control={form.control}
                        name="effectiveDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date d'effet</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="expirationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date d'expiration</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Raison de la modification</FormLabel>
                        <FormControl>
                          <Input placeholder="Raison de cette modification des permissions..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Optionnel - pour traçabilité et audit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Application en cours...' : 'Appliquer les permissions'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
