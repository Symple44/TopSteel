'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../forms/form/form'
import { Button } from '../../../primitives/button/Button'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives/dialog/Dialog'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
import { Textarea } from '../../../primitives/textarea/Textarea'

// Validation schema for task creation
const taskFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().default(''),
  projectId: z.string().min(1, 'Le projet est requis'),
  // Task scheduling
  startDate: z.string().min(1, 'La date de début est requise'),
  dueDate: z.string().min(1, "La date d'échéance est requise"),
  estimatedHours: z.number().min(0).default(0),
  // Priority and status
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled']).default('not_started'),
  // Assignment
  assigneeId: z.string().default(''),
  assignees: z.array(z.string()).default([]),
  department: z.string().default(''),
  // Steel manufacturing specific
  taskType: z.enum([
    'production',
    'quality_control',
    'delivery',
    'maintenance',
    'design',
    'procurement',
    'inspection',
    'welding',
    'cutting',
    'assembly',
    'painting',
    'documentation',
  ]),
  // Dependencies
  dependencies: z.array(z.string()).default([]),
  blockedBy: z.array(z.string()).default([]),
  blocking: z.array(z.string()).default([]),
  // Materials and resources
  requiredMaterials: z
    .array(
      z.object({
        materialId: z.string(),
        quantity: z.number().min(0),
        unit: z.string(),
      })
    )
    .default([]),
  requiredTools: z.array(z.string()).default([]),
  location: z.string().default(''),
  // Quality requirements
  qualityChecks: z
    .array(
      z.object({
        checkType: z.string(),
        description: z.string(),
        required: z.boolean().default(false),
      })
    )
    .default([]),
  // Safety requirements
  safetyRequirements: z.array(z.string()).default([]),
  requiresSafetyBriefing: z.boolean().default(false),
  // Progress tracking
  milestones: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().default(''),
        targetDate: z.string(),
        completed: z.boolean().default(false),
      })
    )
    .default([]),
  // Budget and cost
  budgetAllocated: z.number().min(0).default(0),
  costCenter: z.string().default(''),
  // Notifications and reminders
  sendNotifications: z.boolean().default(true),
  reminderDays: z.number().min(0).default(1),
  // Documentation
  attachments: z.array(z.string()).default([]),
  notes: z.string().default(''),
  // Approval workflow
  requiresApproval: z.boolean().default(false),
  approver: z.string().default(''),
  // Recurring task
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('weekly'),
  recurrenceInterval: z.number().min(1).default(1),
  recurrenceEndDate: z.string().default(''),
})
type TaskFormData = z.infer<typeof taskFormSchema>
interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: TaskFormData) => void
  projectId?: string
  initialData?: Partial<TaskFormData>
  availableProjects?: Array<{ id: string; name: string; client: string }>
  availableUsers?: Array<{ id: string; name: string; role: string; department: string }>
  availableTaskDependencies?: Array<{ id: string; title: string; status: string }>
  availableMaterials?: Array<{ id: string; name: string; unit: string; stockQuantity: number }>
}
export function AddTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  projectId,
  initialData,
  availableProjects = [],
  availableUsers = [],
  availableTaskDependencies = [], // TODO: Implement task dependencies feature
  availableMaterials = [],
}: AddTaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'basic' | 'advanced' | 'resources' | 'quality'>(
    'basic'
  )
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      projectId: projectId || initialData?.projectId || '',
      startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate || '',
      estimatedHours: initialData?.estimatedHours || 0,
      priority: initialData?.priority || 'medium',
      status: initialData?.status || 'not_started',
      assigneeId: initialData?.assigneeId || '',
      assignees: initialData?.assignees || [],
      department: initialData?.department || '',
      taskType: initialData?.taskType || 'production',
      dependencies: initialData?.dependencies || [],
      blockedBy: initialData?.blockedBy || [],
      blocking: initialData?.blocking || [],
      requiredMaterials: initialData?.requiredMaterials || [],
      requiredTools: initialData?.requiredTools || [],
      location: initialData?.location || '',
      qualityChecks: initialData?.qualityChecks || [],
      safetyRequirements: initialData?.safetyRequirements || [],
      requiresSafetyBriefing: initialData?.requiresSafetyBriefing || false,
      milestones: initialData?.milestones || [],
      budgetAllocated: initialData?.budgetAllocated || 0,
      costCenter: initialData?.costCenter || '',
      sendNotifications: initialData?.sendNotifications ?? true,
      reminderDays: initialData?.reminderDays || 1,
      attachments: initialData?.attachments || [],
      notes: initialData?.notes || '',
      requiresApproval: initialData?.requiresApproval || false,
      approver: initialData?.approver || '',
      isRecurring: initialData?.isRecurring || false,
      recurrencePattern: initialData?.recurrencePattern || 'weekly',
      recurrenceInterval: initialData?.recurrenceInterval || 1,
      recurrenceEndDate: initialData?.recurrenceEndDate || '',
    },
  })
  const {
    fields: materialFields,
    append: addMaterial,
    remove: removeMaterial,
  } = useFieldArray({ control: form.control, name: 'requiredMaterials' })
  const {
    fields: milestoneFields,
    append: addMilestone,
    remove: removeMilestone,
  } = useFieldArray({ control: form.control, name: 'milestones' })
  const {
    fields: qualityFields,
    append: addQualityCheck,
    remove: removeQualityCheck,
  } = useFieldArray({ control: form.control, name: 'qualityChecks' })
  const isRecurring = form.watch('isRecurring')
  const requiresApproval = form.watch('requiresApproval')
  const _taskType = form.watch('taskType')
  const handleSubmit = async (data: TaskFormData) => {
    setLoading(true)
    try {
      await onSubmit?.(data)
      onOpenChange(false)
      form.reset()
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }
  const priorityOptions = [
    { value: 'low', label: 'Faible', color: 'text-green-600' },
    { value: 'medium', label: 'Moyenne', color: 'text-blue-600' },
    { value: 'high', label: 'Élevée', color: 'text-orange-600' },
    { value: 'critical', label: 'Critique', color: 'text-red-600' },
  ]
  const statusOptions = [
    { value: 'not_started', label: 'Non commencé' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
  ]
  const taskTypeOptions = [
    { value: 'production', label: 'Production' },
    { value: 'quality_control', label: 'Contrôle qualité' },
    { value: 'delivery', label: 'Livraison' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'design', label: 'Conception' },
    { value: 'procurement', label: 'Approvisionnement' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'welding', label: 'Soudure' },
    { value: 'cutting', label: 'Découpe' },
    { value: 'assembly', label: 'Assemblage' },
    { value: 'painting', label: 'Peinture' },
    { value: 'documentation', label: 'Documentation' },
  ]
  const recurrencePatternOptions = [
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'yearly', label: 'Annuelle' },
  ]
  const tabs = [
    { key: 'basic' as const, label: 'Informations de base' },
    { key: 'advanced' as const, label: 'Avancé' },
    { key: 'resources' as const, label: 'Ressources' },
    { key: 'quality' as const, label: 'Qualité & Sécurité' },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une tâche</DialogTitle>
        </DialogHeader>
        {/* Tab Navigation */}
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information Tab */}
            {selectedTab === 'basic' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre de la tâche *</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Découpe des poutres principales" {...field} />
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
                          placeholder="Description détaillée de la tâche..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
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
                                {project.name} ({project.client})
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
                    name="taskType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de tâche *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {taskTypeOptions.map((option) => (
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
                    name="priority"
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
                                <span className={option.color}>{option.label}</span>
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
                    name="status"
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
                  <FormField
                    control={form.control}
                    name="estimatedHours"
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
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
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'échéance *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsable principal</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un responsable" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.role})
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
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="quality">Contrôle Qualité</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="logistics">Logistique</SelectItem>
                            <SelectItem value="engineering">Ingénierie</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            {/* Advanced Tab */}
            {selectedTab === 'advanced' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localisation</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Atelier A, Zone de découpe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budgetAllocated"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget alloué (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
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
                    name="costCenter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Centre de coût</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: CC-PROD-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="requiresApproval"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Approbation requise</FormLabel>
                      </FormItem>
                    )}
                  />
                  {requiresApproval && (
                    <FormField
                      control={form.control}
                      name="approver"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approbateur</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un approbateur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableUsers
                                .filter((user) =>
                                  ['manager', 'supervisor', 'admin'].includes(user.role)
                                )
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} ({user.role})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Tâche récurrente</FormLabel>
                      </FormItem>
                    )}
                  />
                  {isRecurring && (
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="recurrencePattern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fréquence</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {recurrencePatternOptions.map((option) => (
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
                      <FormField
                        control={form.control}
                        name="recurrenceInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intervalle</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
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
                        name="recurrenceEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de fin</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes additionnelles</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notes et commentaires..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {/* Resources Tab */}
            {selectedTab === 'resources' && (
              <div className="space-y-6">
                {/* Required Materials */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Matériaux requis</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addMaterial({ materialId: '', quantity: 0, unit: '' })}
                    >
                      Ajouter un matériau
                    </Button>
                  </div>
                  {materialFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-4 gap-4 items-end p-3 border rounded"
                    >
                      <FormField
                        control={form.control}
                        name={`requiredMaterials.${index}.materialId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Matériau</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableMaterials.map((material) => (
                                  <SelectItem key={material.id} value={material.id}>
                                    {material.name} (Stock: {material.stockQuantity} {material.unit}
                                    )
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
                        name={`requiredMaterials.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantité</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
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
                        name={`requiredMaterials.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unité</FormLabel>
                            <FormControl>
                              <Input placeholder="kg, tonnes, m..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeMaterial(index)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                </div>
                {/* Milestones */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Jalons</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addMilestone({
                          name: '',
                          description: '',
                          targetDate: '',
                          completed: false,
                        })
                      }
                    >
                      Ajouter un jalon
                    </Button>
                  </div>
                  {milestoneFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-3 gap-4 items-end p-3 border rounded"
                    >
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du jalon</FormLabel>
                            <FormControl>
                              <Input placeholder="ex: Début de soudage" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`milestones.${index}.targetDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date cible</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeMilestone(index)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Quality & Safety Tab */}
            {selectedTab === 'quality' && (
              <div className="space-y-6">
                {/* Quality Checks */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Contrôles qualité</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addQualityCheck({
                          checkType: '',
                          description: '',
                          required: false,
                        })
                      }
                    >
                      Ajouter un contrôle
                    </Button>
                  </div>
                  {qualityFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-4 gap-4 items-end p-3 border rounded"
                    >
                      <FormField
                        control={form.control}
                        name={`qualityChecks.${index}.checkType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type de contrôle</FormLabel>
                            <FormControl>
                              <Input placeholder="ex: Vérification dimensionnelle" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`qualityChecks.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Description du contrôle" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`qualityChecks.${index}.required`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Obligatoire</FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeQualityCheck(index)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                </div>
                {/* Safety Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Exigences de sécurité</h3>
                  <FormField
                    control={form.control}
                    name="requiresSafetyBriefing"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel>Briefing sécurité requis</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer la tâche'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
