'use client'
import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Textarea } from '../../../primitives'
import { AlertTriangle, Package, Users, Calendar, Database, FileText, Factory } from 'lucide-react'
export interface ProjectDependency {
  id: string
  name: string
  type: 'order' | 'supplier_contract' | 'production_line' | 'document' | 'user_assignment'
  description?: string
  impact: 'low' | 'medium' | 'high'
  canBeReassigned?: boolean
  alternativeOptions?: string[]
}
export interface ProjectDetails {
  id: string
  name: string
  code: string
  status: 'active' | 'on_hold' | 'completed' | 'cancelled'
  createdDate: string
  lastModified: string
  dependencies: ProjectDependency[]
  totalOrders: number
  totalValue: number
  associatedUsers: string[]
  documentsCount: number
}
export interface DeleteProjectConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ProjectDetails
  onConfirm: (data: { 
    projectId: string; 
    reason: string; 
    handleDependencies: 'delete' | 'reassign' | 'archive';
    reassignmentOptions?: Record<string, string>;
  }) => Promise<void>
}
const dependencyTypeConfig = {
  order: {
    icon: Package,
    label: 'Commandes',
    color: 'text-blue-600'
  },
  supplier_contract: {
    icon: Users,
    label: 'Contrats fournisseurs',
    color: 'text-green-600'
  },
  production_line: {
    icon: Factory,
    label: 'Lignes de production',
    color: 'text-orange-600'
  },
  document: {
    icon: FileText,
    label: 'Documents',
    color: 'text-purple-600'
  },
  user_assignment: {
    icon: Users,
    label: 'Assignations utilisateurs',
    color: 'text-indigo-600'
  }
}
const impactColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}
export function DeleteProjectConfirmation({
  open,
  onOpenChange,
  project,
  onConfirm,
}: DeleteProjectConfirmationProps) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [handleDependencies, setHandleDependencies] = useState<'delete' | 'reassign' | 'archive'>('archive')
  const [reassignmentOptions, setReassignmentOptions] = useState<Record<string, string>>({})
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onConfirm({ 
        projectId: project.id, 
        reason, 
        handleDependencies,
        reassignmentOptions: handleDependencies === 'reassign' ? reassignmentOptions : undefined
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Project deletion failed:', error)
    } finally {
      setLoading(false)
    }
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }
  const groupedDependencies = project.dependencies.reduce((acc, dep) => {
    if (!acc[dep.type]) acc[dep.type] = []
    acc[dep.type].push(dep)
    return acc
  }, {} as Record<string, ProjectDependency[]>)
  const highImpactDependencies = project.dependencies.filter(dep => dep.impact === 'high')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Supprimer le projet "{project.name}"
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Informations du projet</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Code:</span>
                <span className="ml-2 font-medium">{project.code}</span>
              </div>
              <div>
                <span className="text-gray-500">Statut:</span>
                <span className="ml-2 font-medium">{project.status}</span>
              </div>
              <div>
                <span className="text-gray-500">Créé le:</span>
                <span className="ml-2">{formatDate(project.createdDate)}</span>
              </div>
              <div>
                <span className="text-gray-500">Commandes:</span>
                <span className="ml-2 font-medium">{project.totalOrders}</span>
              </div>
              <div>
                <span className="text-gray-500">Valeur totale:</span>
                <span className="ml-2 font-medium">{formatCurrency(project.totalValue)}</span>
              </div>
              <div>
                <span className="text-gray-500">Documents:</span>
                <span className="ml-2 font-medium">{project.documentsCount}</span>
              </div>
            </div>
          </div>
          {/* High Impact Warning */}
          {highImpactDependencies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-2">
                    Attention: Impact élevé détecté
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    Ce projet a {highImpactDependencies.length} dépendance{highImpactDependencies.length > 1 ? 's' : ''} à fort impact. 
                    La suppression pourrait affecter significativement d'autres parties du système.
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {highImpactDependencies.map((dep) => (
                      <li key={dep.id} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        {dep.name} ({dependencyTypeConfig[dep.type].label})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {/* Dependencies */}
          {project.dependencies.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Dépendances ({project.dependencies.length})
              </h4>
              <div className="space-y-4">
                {Object.entries(groupedDependencies).map(([type, deps]) => {
                  const config = dependencyTypeConfig[type as keyof typeof dependencyTypeConfig]
                  const IconComponent = config.icon
                  return (
                    <div key={type} className="bg-white border rounded-lg p-3">
                      <h5 className="flex items-center gap-2 text-sm font-medium mb-2">
                        <IconComponent className={`h-4 w-4 ${config.color}`} />
                        {config.label} ({deps.length})
                      </h5>
                      <div className="space-y-2">
                        {deps.map((dep) => (
                          <div key={dep.id} className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <span className="font-medium">{dep.name}</span>
                              {dep.description && (
                                <span className="text-gray-500 ml-2">- {dep.description}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${impactColors[dep.impact]}`}>
                                {dep.impact === 'low' ? 'Faible' : dep.impact === 'medium' ? 'Moyen' : 'Élevé'}
                              </span>
                              {dep.canBeReassigned && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  Réassignable
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* Dependency Handling Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Gestion des dépendances</h4>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="handleDependencies"
                  value="archive"
                  checked={handleDependencies === 'archive'}
                  onChange={(e) => setHandleDependencies(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium">Archiver les dépendances</div>
                  <div className="text-xs text-gray-500">
                    Les éléments liés seront archivés mais conservés dans le système
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="handleDependencies"
                  value="reassign"
                  checked={handleDependencies === 'reassign'}
                  onChange={(e) => setHandleDependencies(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium">Réassigner à un autre projet</div>
                  <div className="text-xs text-gray-500">
                    Les éléments réassignables seront transférés vers un autre projet
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="handleDependencies"
                  value="delete"
                  checked={handleDependencies === 'delete'}
                  onChange={(e) => setHandleDependencies(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-red-600">Supprimer définitivement</div>
                  <div className="text-xs text-red-500">
                    ⚠️ Toutes les dépendances seront supprimées de façon irréversible
                  </div>
                </div>
              </label>
            </div>
          </div>
          {/* Deletion Reason */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Motif de suppression <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Décrivez la raison de la suppression du projet..."
              required
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !reason.trim()}
              variant="destructive"
            >
              {loading ? 'Suppression en cours...' : 'Confirmer la suppression'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
