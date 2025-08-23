'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox
} from '../../../primitives'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../forms'
// Validation schema for project timeline
const timelineFormSchema = z.object({
  projectId: z.string().min(1, 'Le projet est requis'),
  milestones: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Le nom du jalon est requis'),
    description: z.string().optional(),
    startDate: z.string().min(1, 'La date de début est requise'),
    endDate: z.string().min(1, 'La date de fin est requise'),
    status: z.enum(['not_started', 'in_progress', 'completed', 'delayed']),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    dependencies: z.array(z.string()).optional(),
    assignedTo: z.array(z.string()).optional(),
    estimatedHours: z.number().min(0).optional(),
    actualHours: z.number().min(0).optional(),
    completionPercentage: z.number().min(0).max(100).optional(),
  })).min(1, 'Au moins un jalon est requis'),
  autoSchedule: z.boolean().default(false),
  baselineDate: z.string().optional(),
  criticalPath: z.boolean().default(false),
  resourceAllocation: z.boolean().default(false),
})
type TimelineFormData = z.infer<typeof timelineFormSchema>
interface ProjectTimelineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: TimelineFormData) => void
  projectId?: string
  initialData?: Partial<TimelineFormData>
  availableProjects?: Array<{ id: string; name: string }>
  availableUsers?: Array<{ id: string; name: string; role: string }>
}
export function ProjectTimelineDialog({
  open,
  onOpenChange,
  onSubmit,
  projectId,
  initialData,
  availableProjects = [],
  availableUsers = [],
}: ProjectTimelineDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<number>(0)
  const form = useForm<TimelineFormData>({
    resolver: zodResolver(timelineFormSchema),
    defaultValues: {
      projectId: projectId || initialData?.projectId || '',
      milestones: initialData?.milestones || [{
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'not_started',
        priority: 'medium',
        dependencies: [],
        assignedTo: [],
        estimatedHours: 0,
        actualHours: 0,
        completionPercentage: 0,
      }],
      autoSchedule: initialData?.autoSchedule || false,
      baselineDate: initialData?.baselineDate || '',
      criticalPath: initialData?.criticalPath || false,
      resourceAllocation: initialData?.resourceAllocation || false,
    },
  })
  const { fields: milestones, append: addMilestone, remove: removeMilestone } = 
    form.useFieldArray({ name: 'milestones' })
  const handleSubmit = async (data: TimelineFormData) => {
    setLoading(true)
    try {
      // Calculate critical path and resource allocation if enabled
      if (data.criticalPath) {
        // Add critical path calculation logic
        data.milestones = data.milestones.map(milestone => ({
          ...milestone,
          // Add critical path indicators
        }))
      }
      await onSubmit?.(data)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error updating project timeline:', error)
    } finally {
      setLoading(false)
    }
  }
  const addNewMilestone = () => {
    addMilestone({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'not_started',
      priority: 'medium',
      dependencies: [],
      assignedTo: [],
      estimatedHours: 0,
      actualHours: 0,
      completionPercentage: 0,
    })
    setSelectedMilestone(milestones.length)
  }
  const statusOptions = [
    { value: 'not_started', label: 'Non commencé' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'delayed', label: 'Retardé' },
  ]
  const priorityOptions = [
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Élevée' },
    { value: 'critical', label: 'Critique' },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timeline du projet - Vue Gantt</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Project Selection */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projet *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Timeline Options */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baselineDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de référence</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="autoSchedule"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Planification automatique</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="criticalPath"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Afficher le chemin critique</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resourceAllocation"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Allocation des ressources</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Milestones Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Jalons du projet</h3>
                <Button type="button" onClick={addNewMilestone} variant="outline">
                  Ajouter un jalon
                </Button>
              </div>
              {/* Milestone Tabs */}
              <div className="flex flex-wrap gap-2 border-b">
                {milestones.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedMilestone(index)}
                    className={`px-3 py-1 text-sm rounded-t-md ${
                      selectedMilestone === index
                        ? 'bg-blue-100 border-b-2 border-blue-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Jalon {index + 1}
                  </button>
                ))}
              </div>
              {/* Selected Milestone Form */}
              {milestones[selectedMilestone] && (
                <div className="p-4 border rounded-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Jalon {selectedMilestone + 1}</h4>
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          removeMilestone(selectedMilestone)
                          setSelectedMilestone(Math.max(0, selectedMilestone - 1))
                        }}
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`milestones.${selectedMilestone}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom du jalon *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ex: Fabrication des poutres"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${selectedMilestone}.priority`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priorité</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {priorityOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`milestones.${selectedMilestone}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description détaillée du jalon..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`milestones.${selectedMilestone}.startDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de début *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${selectedMilestone}.endDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de fin *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${selectedMilestone}.status`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`milestones.${selectedMilestone}.estimatedHours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heures estimées</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="0.5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${selectedMilestone}.actualHours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heures réelles</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              step="0.5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${selectedMilestone}.completionPercentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pourcentage accompli</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Export timeline to different formats
                    console.log('Exporting timeline...')
                  }}
                >
                  Exporter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Print timeline
                    console.log('Printing timeline...')
                  }}
                >
                  Imprimer
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Sauvegarde...' : 'Sauvegarder Timeline'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
