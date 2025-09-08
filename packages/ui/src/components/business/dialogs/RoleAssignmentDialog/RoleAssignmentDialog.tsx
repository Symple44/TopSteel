'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Calendar, Shield, Users } from 'lucide-react'
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
const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "L'utilisateur est requis"),
  newRole: z.enum(USER_ROLES),
  department: z.enum(DEPARTMENTS).optional(),
  team: z.string().optional(),
  manager: z.string().optional(),
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  reason: z.string().min(1, 'La raison est requise'),
  temporaryAssignment: z.boolean().default(false),
  notifyUser: z.boolean().default(true),
})
type RoleAssignmentFormData = z.infer<typeof roleAssignmentSchema>
interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department: string
}
interface RoleAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: RoleAssignmentFormData) => void | Promise<void>
  userData?: UserData | null
  availableUsers?: Array<{ id: string; name: string; role: string }>
  availableManagers?: Array<{ id: string; name: string }>
  availableTeams?: Array<{ id: string; name: string }>
}
export function RoleAssignmentDialog({
  open,
  onOpenChange,
  onSubmit,
  userData,
  availableUsers = [],
  availableManagers = [],
  availableTeams = [],
}: RoleAssignmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      temporaryAssignment: false,
      notifyUser: true,
    },
  })
  const watchTemporaryAssignment = form.watch('temporaryAssignment')
  const watchSelectedUser = form.watch('userId')
  useEffect(() => {
    if (userData && open) {
      form.reset({
        userId: userData.id,
        newRole: 'employee',
        department: userData.department as unknown,
        temporaryAssignment: false,
        notifyUser: true,
      })
    }
  }, [userData, open, form])
  const handleSubmit = async (data: RoleAssignmentFormData) => {
    try {
      setLoading(true)
      setError(null)
      if (data.temporaryAssignment && data.effectiveDate && data.expirationDate) {
        if (new Date(data.expirationDate) <= new Date(data.effectiveDate)) {
          setError("La date d'expiration doit être postérieure à la date d'effet")
          return
        }
      }
      await onSubmit?.(data)
      form.reset()
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
  const selectedUser =
    availableUsers.find((u) => u.id === watchSelectedUser) ||
    (userData
      ? { id: userData.id, name: `${userData.firstName} ${userData.lastName}`, role: userData.role }
      : null)
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assigner un rôle
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <div>{error}</div>
                </Alert>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Sélection de l'utilisateur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!userData && (
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilisateur *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un utilisateur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} -{' '}
                                  <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {selectedUser && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium">Utilisateur sélectionné</p>
                          <p className="text-sm text-muted-foreground">{selectedUser.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Rôle actuel</p>
                          <Badge>{getRoleLabel(selectedUser.role)}</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Nouveau rôle et département
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="newRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau rôle *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un rôle" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Département</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un département" />
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
                      control={form.control}
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
                      control={form.control}
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Configuration temporelle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="temporaryAssignment"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div>
                          <FormLabel className="text-sm font-normal">
                            Attribution temporaire
                          </FormLabel>
                          <FormDescription>
                            Le rôle sera automatiquement révoqué à l'expiration
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  {watchTemporaryAssignment && (
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
                        <FormLabel>Raison de l'attribution *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez la raison de ce changement de rôle..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Requis pour l'audit et la traçabilité</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notifyUser"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Notifier l'utilisateur par email
                        </FormLabel>
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
                  {loading ? 'Attribution en cours...' : 'Assigner le rôle'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
