'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Building, Clock, Eye, EyeOff, Key, Shield, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Badge } from '../../../data-display/badge'
import { Alert } from '../../../feedback/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../forms/form/form'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card/Card'
import { ScrollArea } from '../../../layout/scroll-area/ScrollArea'
import { Separator } from '../../../layout/separator'
import { Button } from '../../../primitives/button/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives/dialog/Dialog'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
import { Switch } from '../../../primitives/switch/switch'
import { Textarea } from '../../../primitives/textarea/Textarea'

// User roles for steel manufacturing ERP
const USER_ROLES = [
  'admin',
  'manager',
  'production_manager',
  'quality_manager',
  'inventory_manager',
  'sales_manager',
  'project_manager',
  'accountant',
  'technician',
  'operator',
  'supervisor',
  'analyst',
  'employee',
] as const
// Departments specific to steel manufacturing
const DEPARTMENTS = [
  'administration',
  'production',
  'quality_control',
  'inventory_management',
  'sales_marketing',
  'engineering',
  'finance_accounting',
  'procurement',
  'logistics',
  'maintenance',
  'research_development',
  'safety_environment',
  'human_resources',
] as const
// Permissions categories for steel manufacturing ERP
const PERMISSION_CATEGORIES = {
  users: ['view', 'create', 'edit', 'delete', 'manage_roles'],
  clients: ['view', 'create', 'edit', 'delete', 'manage_credit'],
  materials: ['view', 'create', 'edit', 'delete', 'manage_pricing'],
  inventory: ['view', 'create', 'edit', 'adjust', 'transfer'],
  production: ['view', 'create', 'edit', 'manage_processes', 'quality_control'],
  sales: ['view', 'create', 'edit', 'approve_quotes', 'manage_pricing'],
  finance: ['view', 'create', 'edit', 'approve_payments', 'manage_budgets'],
  projects: ['view', 'create', 'edit', 'assign_resources', 'manage_timeline'],
  reports: ['view', 'create', 'export', 'advanced_analytics'],
  administration: ['system_settings', 'backup_restore', 'audit_logs'],
} as const
// User validation schema for editing
const editUserSchema = z
  .object({
    id: z.string(),
    // Personal Information
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Email invalide').min(1, "L'email est requis"),
    phone: z.string().optional(),
    position: z.string().optional(),
    // Account Information
    username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
    resetPassword: z.boolean().default(false),
    newPassword: z.string().optional(),
    mustChangePassword: z.boolean().default(false),
    // Role and Department
    role: z.enum(USER_ROLES),
    department: z.enum(DEPARTMENTS),
    manager: z.string().optional(),
    team: z.string().optional(),
    // Permissions
    permissions: z
      .object({
        users: z.array(z.string()).default([]),
        clients: z.array(z.string()).default([]),
        materials: z.array(z.string()).default([]),
        inventory: z.array(z.string()).default([]),
        production: z.array(z.string()).default([]),
        sales: z.array(z.string()).default([]),
        finance: z.array(z.string()).default([]),
        projects: z.array(z.string()).default([]),
        reports: z.array(z.string()).default([]),
        administration: z.array(z.string()).default([]),
      })
      .default({
        users: [],
        clients: [],
        materials: [],
        inventory: [],
        production: [],
        sales: [],
        finance: [],
        projects: [],
        reports: [],
        administration: [],
      }),
    // Work Information
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    contractType: z.enum(['full_time', 'part_time', 'contractor', 'intern']),
    hourlyRate: z.number().min(0).optional(),
    // Status Information
    isActive: z.boolean(),
    canAccessMobileApp: z.boolean(),
    maxSessionDuration: z.number().min(1).max(24),
    lastLoginAt: z.string().optional(),
    // Additional Information
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // If reset password is enabled, new password is required
      if (data.resetPassword && (!data.newPassword || data.newPassword.length < 6)) {
        return false
      }
      // End date must be after start date if both are provided
      if (data.startDate && data.endDate && data.endDate <= data.startDate) {
        return false
      }
      return true
    },
    {
      message: 'Validation des données échouée',
      path: ['newPassword'],
    }
  )
type EditUserFormData = z.infer<typeof editUserSchema>
interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  position?: string
  username: string
  role: string
  department: string
  manager?: string
  team?: string
  permissions: {
    users?: string[]
    clients?: string[]
    materials?: string[]
    inventory?: string[]
    production?: string[]
    sales?: string[]
    finance?: string[]
    projects?: string[]
    reports?: string[]
    administration?: string[]
  }
  startDate?: string
  endDate?: string
  contractType: string
  hourlyRate?: number
  isActive: boolean
  canAccessMobileApp: boolean
  maxSessionDuration: number
  lastLoginAt?: string
  notes?: string
}
interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: EditUserFormData) => void | Promise<void>
  userData?: UserData | null
  availableManagers?: Array<{ id: string; name: string }>
  availableTeams?: Array<{ id: string; name: string }>
}
export function EditUserDialog({
  open,
  onOpenChange,
  onSubmit,
  userData,
  availableManagers = [],
  availableTeams = [],
}: EditUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema) as any,
    defaultValues: {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      username: '',
      resetPassword: false,
      newPassword: '',
      mustChangePassword: false,
      role: 'employee',
      department: 'administration',
      manager: '',
      team: '',
      contractType: 'full_time',
      hourlyRate: undefined,
      isActive: true,
      canAccessMobileApp: false,
      maxSessionDuration: 8,
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
        administration: [],
      },
      notes: '',
    },
  })
  const watchResetPassword = form.watch('resetPassword')
  const _watchRole = form.watch('role')
  // Load user data when dialog opens
  useEffect(() => {
    if (userData && open) {
      form.reset({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone || '',
        position: userData.position || '',
        username: userData.username,
        resetPassword: false,
        newPassword: '',
        mustChangePassword: false,
        role: (userData.role as any) || 'employee',
        department: (userData.department as any) || 'administration',
        manager: userData.manager || '',
        team: userData.team || '',
        contractType: (userData.contractType as any) || 'full_time',
        hourlyRate: userData.hourlyRate,
        isActive: userData.isActive,
        canAccessMobileApp: userData.canAccessMobileApp,
        maxSessionDuration: userData.maxSessionDuration,
        startDate: userData.startDate,
        endDate: userData.endDate,
        lastLoginAt: userData.lastLoginAt,
        permissions: {
          users: userData.permissions.users || [],
          clients: userData.permissions.clients || [],
          materials: userData.permissions.materials || [],
          inventory: userData.permissions.inventory || [],
          production: userData.permissions.production || [],
          sales: userData.permissions.sales || [],
          finance: userData.permissions.finance || [],
          projects: userData.permissions.projects || [],
          reports: userData.permissions.reports || [],
          administration: userData.permissions.administration || [],
        },
        notes: userData.notes || '',
      })
    }
  }, [userData, open, form])
  // Auto-assign default permissions based on role
  const assignDefaultPermissions = (role: string) => {
    const defaultPermissions: Record<string, Partial<EditUserFormData['permissions']>> = {
      admin: {
        users: ['view', 'create', 'edit', 'delete', 'manage_roles'],
        clients: ['view', 'create', 'edit', 'delete', 'manage_credit'],
        materials: ['view', 'create', 'edit', 'delete', 'manage_pricing'],
        inventory: ['view', 'create', 'edit', 'adjust', 'transfer'],
        production: ['view', 'create', 'edit', 'manage_processes', 'quality_control'],
        sales: ['view', 'create', 'edit', 'approve_quotes', 'manage_pricing'],
        finance: ['view', 'create', 'edit', 'approve_payments', 'manage_budgets'],
        projects: ['view', 'create', 'edit', 'assign_resources', 'manage_timeline'],
        reports: ['view', 'create', 'export', 'advanced_analytics'],
        administration: ['system_settings', 'backup_restore', 'audit_logs'],
      },
      manager: {
        users: ['view', 'create', 'edit'],
        clients: ['view', 'create', 'edit'],
        materials: ['view', 'create', 'edit'],
        inventory: ['view', 'create', 'edit', 'adjust'],
        production: ['view', 'create', 'edit'],
        sales: ['view', 'create', 'edit'],
        finance: ['view'],
        projects: ['view', 'create', 'edit', 'assign_resources'],
        reports: ['view', 'create', 'export'],
      },
      employee: {
        clients: ['view'],
        materials: ['view'],
        inventory: ['view'],
        production: ['view'],
        sales: ['view'],
        projects: ['view'],
        reports: ['view'],
      },
    }
    const permissions = defaultPermissions[role] || defaultPermissions.employee
    form.setValue('permissions', permissions as EditUserFormData['permissions'])
  }
  const handleSubmit = async (data: EditUserFormData) => {
    try {
      setLoading(true)
      setError(null)
      // Remove new password if reset is not requested
      if (!data.resetPassword) {
        data.newPassword = undefined
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
    onOpenChange(false)
  }
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      manager: 'Manager',
      production_manager: 'Manager de production',
      quality_manager: 'Manager qualité',
      inventory_manager: 'Manager stock',
      sales_manager: 'Manager commercial',
      project_manager: 'Chef de projet',
      accountant: 'Comptable',
      technician: 'Technicien',
      operator: 'Opérateur',
      supervisor: 'Superviseur',
      analyst: 'Analyste',
      employee: 'Employé',
    }
    return labels[role] || role
  }
  const getDepartmentLabel = (department: string) => {
    const labels: Record<string, string> = {
      administration: 'Administration',
      production: 'Production',
      quality_control: 'Contrôle qualité',
      inventory_management: 'Gestion des stocks',
      sales_marketing: 'Ventes & Marketing',
      engineering: 'Ingénierie',
      finance_accounting: 'Finance & Comptabilité',
      procurement: 'Achats',
      logistics: 'Logistique',
      maintenance: 'Maintenance',
      research_development: 'R&D',
      safety_environment: 'Sécurité & Environnement',
      human_resources: 'Ressources humaines',
    }
    return labels[department] || department
  }
  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      view: 'Voir',
      create: 'Créer',
      edit: 'Modifier',
      delete: 'Supprimer',
      manage_roles: 'Gérer les rôles',
      manage_credit: 'Gérer le crédit',
      manage_pricing: 'Gérer les prix',
      adjust: 'Ajuster',
      transfer: 'Transférer',
      manage_processes: 'Gérer les processus',
      quality_control: 'Contrôle qualité',
      approve_quotes: 'Approuver devis',
      approve_payments: 'Approuver paiements',
      manage_budgets: 'Gérer budgets',
      assign_resources: 'Assigner ressources',
      manage_timeline: 'Gérer planning',
      export: 'Exporter',
      advanced_analytics: 'Analytics avancés',
      system_settings: 'Paramètres système',
      backup_restore: 'Sauvegarde/Restauration',
      audit_logs: "Logs d'audit",
    }
    return labels[permission] || permission
  }
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non défini'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Modifier l'utilisateur
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <div>{error}</div>
                </Alert>
              )}
              {/* Status Information */}
              {userData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Informations de compte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium">ID Utilisateur</p>
                      <p className="text-sm text-muted-foreground">{userData.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Dernière connexion</p>
                      <p className="text-sm text-muted-foreground">
                        {userData.lastLoginAt
                          ? formatDate(userData.lastLoginAt)
                          : 'Jamais connecté'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Statut</p>
                      <Badge variant={userData.isActive ? 'default' : 'secondary'}>
                        {userData.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de famille" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="utilisateur@entreprise.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="01 23 45 67 89" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="position"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Poste</FormLabel>
                        <FormControl>
                          <Input placeholder="Intitulé du poste" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Informations de connexion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control as any}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="max-w-md">
                        <FormLabel>Nom d'utilisateur *</FormLabel>
                        <FormControl>
                          <Input placeholder="nom.utilisateur" {...field} />
                        </FormControl>
                        <FormDescription>Utilisé pour se connecter au système</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator />
                  <div className="space-y-4">
                    <FormField
                      control={form.control as any}
                      name="resetPassword"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div>
                            <FormLabel className="text-sm font-normal">
                              Réinitialiser le mot de passe
                            </FormLabel>
                            <FormDescription>
                              Définir un nouveau mot de passe temporaire pour l'utilisateur
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    {watchResetPassword && (
                      <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2">
                        <FormField
                          control={form.control as any}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nouveau mot de passe *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control as any}
                          name="mustChangePassword"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Obliger le changement à la prochaine connexion
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  <FormField
                    control={form.control as any}
                    name="maxSessionDuration"
                    render={({ field }) => (
                      <FormItem className="max-w-xs">
                        <FormLabel>Durée max de session (heures)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="24"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 8)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Role and Department */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Rôle et département
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rôle *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            assignDefaultPermissions(value)
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {USER_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {getRoleLabel(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Changer le rôle modifiera les permissions par défaut
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Département *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {getDepartmentLabel(dept)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {availableManagers.length > 0 && (
                    <FormField
                      control={form.control as any}
                      name="manager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un manager" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Aucun manager</SelectItem>
                              {availableManagers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  {manager.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {availableTeams.length > 0 && (
                    <FormField
                      control={form.control as any}
                      name="team"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Équipe</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une équipe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Aucune équipe</SelectItem>
                              {availableTeams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
              {/* Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm capitalize">
                        {category.replace('_', ' ')}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {permissions.map((permission) => (
                          <FormField
                            key={`${category}-${permission}`}
                            control={form.control as any}
                            name={`permissions.${category as keyof EditUserFormData['permissions']}`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value?.includes(permission) || false}
                                    onCheckedChange={(checked) => {
                                      const currentPerms = field.value || []
                                      if (checked) {
                                        field.onChange([...currentPerms, permission])
                                      } else {
                                        field.onChange(currentPerms.filter((p: string) => p !== permission))
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-normal">
                                  {getPermissionLabel(permission)}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {/* Work Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de travail</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optionnel - pour les contrats à durée déterminée
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de contrat</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full_time">Temps plein</SelectItem>
                            <SelectItem value="part_time">Temps partiel</SelectItem>
                            <SelectItem value="contractor">Prestataire</SelectItem>
                            <SelectItem value="intern">Stagiaire</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux horaire (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Optionnel - pour les prestataires et calculs de coûts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Options et notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-6">
                    <FormField
                      control={form.control as any}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Compte actif</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="canAccessMobileApp"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Accès application mobile
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control as any}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations complémentaires sur l'utilisateur..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
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
                  {loading ? 'Modification en cours...' : "Modifier l'utilisateur"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
