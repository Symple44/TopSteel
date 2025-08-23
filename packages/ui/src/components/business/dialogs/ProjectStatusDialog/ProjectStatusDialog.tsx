'use client'
import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Calendar, MessageSquare, Activity, Target, AlertTriangle } from 'lucide-react'
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
  Label
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
// Status update schema
const statusUpdateSchema = z.object({
  message: z.string().min(1, 'Le message est obligatoire'),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info')
})
// Timeline entry schema
const timelineEntrySchema = z.object({
  date: z.string().min(1, 'La date est obligatoire'),
  title: z.string().min(1, 'Le titre est obligatoire'),
  description: z.string().optional(),
  type: z.enum(['milestone', 'task', 'issue', 'note']).default('note')
})
// Project status schema
const projectStatusSchema = z.object({
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  progress: z.number().min(0).max(100),
  nextMilestone: z.string().optional(),
  estimatedCompletion: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).default('low'),
  statusUpdates: z.array(statusUpdateSchema).optional(),
  timelineEntries: z.array(timelineEntrySchema).optional(),
  blockers: z.string().optional(),
  achievements: z.string().optional(),
  nextSteps: z.string().optional(),
  notes: z.string().optional()
})
type ProjectStatusFormData = z.infer<typeof projectStatusSchema>
interface Project {
  id: string
  name: string
  reference: string
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  progress: number
  startDate: string
  endDate: string
  budget: number
  spentBudget: number
}
interface ProjectStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: ProjectStatusFormData) => void | Promise<void>
  project?: Project
}
export function ProjectStatusDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  project
}: ProjectStatusDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<ProjectStatusFormData>({
    resolver: zodResolver(projectStatusSchema),
    defaultValues: {
      status: project?.status || 'planning',
      progress: project?.progress || 0,
      nextMilestone: '',
      estimatedCompletion: '',
      riskLevel: 'low',
      statusUpdates: [{
        message: '',
        type: 'info'
      }],
      timelineEntries: [],
      blockers: '',
      achievements: '',
      nextSteps: '',
      notes: ''
    }
  })
  const { fields: updateFields, append: appendUpdate, remove: removeUpdate } = useFieldArray({
    control: form.control,
    name: 'statusUpdates'
  })
  const { fields: timelineFields, append: appendTimeline, remove: removeTimeline } = useFieldArray({
    control: form.control,
    name: 'timelineEntries'
  })
  const watchedStatus = form.watch('status')
  const watchedProgress = form.watch('progress')
  const watchedRiskLevel = form.watch('riskLevel')
  const handleSubmit = async (data: ProjectStatusFormData) => {
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
  const addStatusUpdate = () => {
    appendUpdate({
      message: '',
      type: 'info'
    })
  }
  const addTimelineEntry = () => {
    appendTimeline({
      date: new Date().toISOString().split('T')[0],
      title: '',
      description: '',
      type: 'note'
    })
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
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500'
    if (progress < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <Target className="w-4 h-4 text-green-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <MessageSquare className="w-4 h-4 text-blue-600" />
    }
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Mise à jour du statut de projet
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
                <h3 className="font-medium mb-3">{project.name}</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Statut actuel:</span>
                    <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
                      {project.status === 'in_progress' ? 'En cours' : 
                       project.status === 'completed' ? 'Terminé' : 
                       project.status === 'on_hold' ? 'En attente' : 'Planification'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Progrès:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{project.progress}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Budget:</span>
                    <div className="text-sm mt-1">
                      {project.spentBudget.toLocaleString()} / {project.budget.toLocaleString()} €
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Status and Progress */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Statut et avancement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau statut</FormLabel>
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
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progrès (%)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>0%</span>
                            <Badge className={getRiskColor(watchedRiskLevel)}>
                              {watchedProgress}%
                            </Badge>
                            <span>100%</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Planification</h3>
                <FormField
                  control={form.control}
                  name="nextMilestone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prochain jalon</FormLabel>
                      <FormControl>
                        <Input placeholder="Décrire le prochain objectif" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedCompletion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin estimée</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Estimation révisée de la date de fin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Status Updates */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Mises à jour
                </h3>
                <Button type="button" onClick={addStatusUpdate} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une mise à jour
                </Button>
              </div>
              {updateFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Mise à jour {index + 1}</span>
                    {updateFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeUpdate(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`statusUpdates.${index}.message`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Décrire la mise à jour ou l'événement..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`statusUpdates.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="success">Succès</SelectItem>
                              <SelectItem value="warning">Attention</SelectItem>
                              <SelectItem value="error">Problème</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Timeline Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Entrées chronologie
                </h3>
                <Button type="button" onClick={addTimelineEntry} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une entrée
                </Button>
              </div>
              {timelineFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Entrée {index + 1}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTimeline(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`timelineEntries.${index}.date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`timelineEntries.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Titre de l'événement" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`timelineEntries.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="milestone">Jalon</SelectItem>
                              <SelectItem value="task">Tâche</SelectItem>
                              <SelectItem value="issue">Problème</SelectItem>
                              <SelectItem value="note">Note</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`timelineEntries.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Détails de l'événement..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Additional Information */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="achievements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Réalisations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrire les réalisations importantes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Mettez en avant les progrès et succès
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nextSteps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prochaines étapes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Décrire les prochaines actions..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Planifiez les actions à venir
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="blockers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blocages</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Identifier les obstacles et difficultés..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Documentez les problèmes rencontrés
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes supplémentaires</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Autres informations pertinentes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                {loading ? 'Mise à jour en cours...' : 'Mettre à jour le statut'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
