'use client'
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, User, DollarSign, FolderOpen, TrendingUp, Clock, Target } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Badge,
  Switch
} from '../../../primitives'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../../../forms'
// Project edit schema
const editProjectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est obligatoire'),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
  progress: z.number().min(0, 'Le progrès doit être positif').max(100, 'Le progrès ne peut pas dépasser 100%'),
  managerId: z.string().min(1, 'Le chef de projet est obligatoire'),
  startDate: z.string().min(1, 'La date de début est obligatoire'),
  endDate: z.string().min(1, 'La date de fin est obligatoire'),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  budget: z.number().positive('Le budget doit être positif'),
  spentBudget: z.number().min(0, 'Le budget dépensé doit être positif ou nul'),
  estimatedHours: z.number().min(0, 'Les heures estimées doivent être positives ou nulles').optional(),
  actualHours: z.number().min(0, 'Les heures réelles doivent être positives ou nulles').optional(),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).default('low'),
  nextMilestone: z.string().optional(),
  blockers: z.string().optional()
})
type EditProjectFormData = z.infer<typeof editProjectSchema>
interface Project {
  id: string
  name: string
  reference: string
  description?: string
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  progress: number
  managerId: string
  clientId: string
  startDate: string
  endDate: string
  actualStartDate?: string
  actualEndDate?: string
  budget: number
  spentBudget: number
  estimatedHours?: number
  actualHours?: number
  tags?: string
  isActive: boolean
  notes?: string
  riskLevel: 'low' | 'medium' | 'high'
  nextMilestone?: string
  blockers?: string
  createdAt: string
  updatedAt: string
}
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}
interface EditProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: EditProjectFormData) => void | Promise<void>
  project?: Project
  users?: User[]
}
export function EditProjectDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  project,
  users = []
}: EditProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mock users
  const mockUsers: User[] = useMemo(() => [
    { id: '1', firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@company.com', role: 'Chef de projet' },
    { id: '2', firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@company.com', role: 'Ingénieur' },
    { id: '3', firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@company.com', role: 'Technicien' }
  ], [])
  const availableUsers = users.length > 0 ? users : mockUsers
  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      progress: 0,
      managerId: '',
      startDate: '',
      endDate: '',
      actualStartDate: '',
      actualEndDate: '',
      budget: 0,
      spentBudget: 0,
      estimatedHours: 0,
      actualHours: 0,
      tags: '',
      isActive: true,
      notes: '',
      riskLevel: 'low',
      nextMilestone: '',
      blockers: ''
    }
  })
  // Update form when project changes
  useEffect(() => {
    if (project && open) {
      form.reset({
        name: project.name,
        description: project.description || '',
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        managerId: project.managerId,
        startDate: project.startDate,
        endDate: project.endDate,
        actualStartDate: project.actualStartDate || '',
        actualEndDate: project.actualEndDate || '',
        budget: project.budget,
        spentBudget: project.spentBudget,
        estimatedHours: project.estimatedHours || 0,
        actualHours: project.actualHours || 0,
        tags: project.tags || '',
        isActive: project.isActive,
        notes: project.notes || '',
        riskLevel: project.riskLevel,
        nextMilestone: project.nextMilestone || '',
        blockers: project.blockers || ''
      })
    }
  }, [project, open, form])
  const watchedStatus = form.watch('status')
  const watchedProgress = form.watch('progress')
  const watchedBudget = form.watch('budget')
  const watchedSpentBudget = form.watch('spentBudget')
  const handleSubmit = async (data: EditProjectFormData) => {
    setLoading(true)
    setError(null)
    try {
      await onSubmit?.(data)
      onOpenChange(false)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }
  const handleClose = () => {
    if (!loading) {
      form.reset()
      setError(null)
      onOpenChange(false)
    }
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-200 text-red-800'
    if (progress < 70) return 'bg-yellow-200 text-yellow-800'
    return 'bg-green-200 text-green-800'
  }
  const budgetUsagePercentage = watchedBudget > 0 ? (watchedSpentBudget / watchedBudget) * 100 : 0
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Modifier le projet
            {project && (
              <Badge variant="outline" className="ml-2">
                {project.reference}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {/* Project Overview */}
            {project && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Statut:</span>
                    <Badge className={`ml-2 ${getStatusColor(watchedStatus)}`}>
                      {watchedStatus === 'planning' && 'Planification'}
                      {watchedStatus === 'in_progress' && 'En cours'}
                      {watchedStatus === 'on_hold' && 'En attente'}
                      {watchedStatus === 'completed' && 'Terminé'}
                      {watchedStatus === 'cancelled' && 'Annulé'}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Progrès:</span>
                    <Badge className={`ml-2 ${getProgressColor(watchedProgress)}`}>
                      {watchedProgress}%
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Budget:</span>
                    <span className="ml-2">{watchedBudget.toLocaleString()} €</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Dépensé:</span>
                    <span className={`ml-2 ${budgetUsagePercentage > 90 ? 'text-red-600 font-semibold' : ''}`}>
                      {watchedSpentBudget.toLocaleString()} € ({budgetUsagePercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations générales</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du projet *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du projet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description du projet"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chef de projet *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Statut et priorité</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planning">Planification</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="on_hold">En attente</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorité</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progrès (%)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                          <div className="text-center text-sm font-medium">
                            {field.value}%
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niveau de risque</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyen</SelectItem>
                          <SelectItem value="high">Élevé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Timeline */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dates planifiées
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Début prévu *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fin prévue *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Dates réelles
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="actualStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Début réel</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actualEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fin réelle</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            {/* Budget and Hours */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget total (€) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="spentBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget dépensé (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Heures
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heures estimées</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="0"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actualHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heures réelles</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="0"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            {/* Project Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Gestion de projet
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nextMilestone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prochain jalon</FormLabel>
                      <FormControl>
                        <Input placeholder="Décrire le prochain jalon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="séparer par des virgules" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="blockers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blocages identifiés</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Décrire les éventuels blocages ou difficultés rencontrés..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Identifiez les obstacles qui ralentissent le projet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Additional Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Projet actif</FormLabel>
                      <FormDescription>
                        Le projet est actif et visible dans l'interface
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes et commentaires sur le projet..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Modification en cours...' : 'Modifier le projet'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
