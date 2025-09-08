'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { FolderOpen, Plus, Target, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../forms/form/form'
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

// Team member schema
const teamMemberSchema = z.object({
  userId: z.string().min(1, "L'utilisateur est obligatoire"),
  role: z.string().min(1, 'Le rôle est obligatoire'),
  hourlyRate: z.number().min(0, 'Le taux horaire doit être positif ou nul').optional(),
})
// Milestone schema
const milestoneSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  description: z.string().optional(),
  dueDate: z.string().min(1, "La date d'échéance est obligatoire"),
  budget: z.number().min(0, 'Le budget doit être positif ou nul').optional(),
})
// Main project schema
const projectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est obligatoire'),
  reference: z.string().min(1, 'La référence est obligatoire'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Le client est obligatoire'),
  managerId: z.string().min(1, 'Le chef de projet est obligatoire'),
  startDate: z.string().min(1, 'La date de début est obligatoire'),
  endDate: z.string().min(1, 'La date de fin est obligatoire'),
  budget: z.number().positive('Le budget doit être positif'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  type: z.string().min(1, 'Le type de projet est obligatoire'),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
  teamMembers: z.array(teamMemberSchema).optional(),
  milestones: z.array(milestoneSchema).optional(),
  notes: z.string().optional(),
})
type ProjectFormData = z.infer<typeof projectSchema>
interface Client {
  id: string
  name: string
  email: string
}
interface ProjectUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}
interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: ProjectFormData) => void | Promise<void>
  clients?: Client[]
  users?: ProjectUser[]
  defaultClientId?: string
}
export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit,
  clients = [],
  users = [],
  defaultClientId,
}: CreateProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Utiliser directement les données réelles, pas de mocks
  const availableClients = clients || []
  const availableUsers = users || []
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      reference: '',
      description: '',
      clientId: defaultClientId || '',
      managerId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: 0,
      priority: 'medium',
      type: '',
      tags: '',
      isActive: true,
      teamMembers: [],
      milestones: [],
      notes: '',
    },
  })
  const {
    fields: teamFields,
    append: appendTeam,
    remove: removeTeam,
  } = useFieldArray({
    control: form.control,
    name: 'teamMembers',
  })
  const {
    fields: milestoneFields,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({
    control: form.control,
    name: 'milestones',
  })
  const handleSubmit = async (data: ProjectFormData) => {
    setLoading(true)
    setError(null)
    try {
      // Generate reference if empty
      if (!data.reference) {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        data.reference = `PRJ-${year}${month}-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0')}`
      }
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
  const addTeamMember = () => {
    appendTeam({
      userId: '',
      role: '',
      hourlyRate: 0,
    })
  }
  const addMilestone = () => {
    appendMilestone({
      name: '',
      description: '',
      dueDate: '',
      budget: 0,
    })
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Créer un projet
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
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
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence *</FormLabel>
                      <FormControl>
                        <Input placeholder="PRJ-2024-001" {...field} />
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
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Client et responsable</h3>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
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
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chef de projet *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un chef de projet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableUsers.map((user) => (
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="renovation">Rénovation</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="etude">Etude</SelectItem>
                            <SelectItem value="fabrication">Fabrication</SelectItem>
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
                            <SelectItem value="high">Elevée</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            {/* Timeline and Budget */}
            <div className="grid grid-cols-3 gap-4">
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
                name="endDate"
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
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (€) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Team Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Equipe projet
                </h3>
                <Button type="button" onClick={addTeamMember} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un membre
                </Button>
              </div>
              {teamFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Membre {index + 1}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTeam(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`teamMembers.${index}.userId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilisateur *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableUsers.map((user) => (
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
                    <FormField
                      control={form.control}
                      name={`teamMembers.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rôle *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ingénieur, Technicien..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`teamMembers.${index}.hourlyRate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taux horaire (€/h)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Milestones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Jalons
                </h3>
                <Button type="button" onClick={addMilestone} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un jalon
                </Button>
              </div>
              {milestoneFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Jalon {index + 1}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du jalon" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.dueDate`}
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
                    <FormField
                      control={form.control}
                      name={`milestones.${index}.budget`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Additional Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="séparer par des virgules" {...field} />
                    </FormControl>
                    <FormDescription>
                      Mots-clés pour faciliter la recherche et l'organisation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer le projet'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
