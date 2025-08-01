'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@erp/ui'
import {
  Building,
  Calendar,
  CheckCircle,
  Eye,
  History,
  Info,
  Key,
  RefreshCw,
  Shield,
  User,
  Users,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface BulkOperation {
  id: string
  operation: string
  userCount: number
  successCount: number
  failedCount: number
  performedBy: string
  performedAt: string
  reason?: string
  details?: any
}

const OPERATION_LABELS = {
  assign_roles: 'Attribution de rôles',
  remove_roles: 'Suppression de rôles',
  assign_groups: 'Attribution de groupes',
  remove_groups: 'Suppression de groupes',
  activate: 'Activation de comptes',
  deactivate: 'Désactivation de comptes',
  reset_password: 'Réinitialisation de mots de passe',
  update_department: 'Changement de département',
}

const OPERATION_ICONS = {
  assign_roles: <Shield className="h-4 w-4" />,
  remove_roles: <Shield className="h-4 w-4" />,
  assign_groups: <Users className="h-4 w-4" />,
  remove_groups: <Users className="h-4 w-4" />,
  activate: <Eye className="h-4 w-4" />,
  deactivate: <Eye className="h-4 w-4" />,
  reset_password: <Key className="h-4 w-4" />,
  update_department: <Building className="h-4 w-4" />,
}

const OPERATION_COLORS = {
  assign_roles: 'bg-blue-100 text-blue-800',
  remove_roles: 'bg-red-100 text-red-800',
  assign_groups: 'bg-green-100 text-green-800',
  remove_groups: 'bg-orange-100 text-orange-800',
  activate: 'bg-emerald-100 text-emerald-800',
  deactivate: 'bg-gray-100 text-gray-800',
  reset_password: 'bg-purple-100 text-purple-800',
  update_department: 'bg-yellow-100 text-yellow-800',
}

interface BulkOperationsHistoryProps {
  userId?: string
  limit?: number
}

export default function BulkOperationsHistory({ userId, limit = 20 }: BulkOperationsHistoryProps) {
  const [operations, setOperations] = useState<BulkOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [_selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const { callClientApi } = await import('@/utils/backend-api')
      const endpoint = userId
        ? `admin/users/${userId}/bulk-operations-history?limit=${limit}`
        : `admin/users/bulk-operations?limit=${limit}`

      const response = await callClientApi(endpoint)
      const data = await response.json()

      if (data.success) {
        setOperations(data.data)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return "Il y a moins d'une heure"
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  const getSuccessRate = (operation: BulkOperation) => {
    if (operation.userCount === 0) return 0
    return Math.round((operation.successCount / operation.userCount) * 100)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des opérations en masse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des opérations en masse
            {userId && ' (cet utilisateur)'}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {operations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune opération en masse enregistrée</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opération</TableHead>
                <TableHead>Utilisateurs</TableHead>
                <TableHead>Succès</TableHead>
                <TableHead>Effectué par</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((operation) => (
                <TableRow key={operation.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1 rounded ${OPERATION_COLORS[operation.operation as keyof typeof OPERATION_COLORS]?.replace('text-', 'bg-').replace('-800', '-100')}`}
                      >
                        {OPERATION_ICONS[operation.operation as keyof typeof OPERATION_ICONS]}
                      </div>
                      <div>
                        <p className="font-medium">
                          {OPERATION_LABELS[operation.operation as keyof typeof OPERATION_LABELS] ||
                            operation.operation}
                        </p>
                        {operation.reason && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {operation.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {operation.userCount} utilisateur{operation.userCount > 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{operation.successCount}</span>
                      </div>
                      {operation.failedCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">{operation.failedCount}</span>
                        </div>
                      )}
                      <Badge
                        variant={getSuccessRate(operation) === 100 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getSuccessRate(operation)}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{operation.performedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(operation.performedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOperation(operation)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {OPERATION_ICONS[operation.operation as keyof typeof OPERATION_ICONS]}
                            Détails de l'opération
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Type d'opération
                              </p>
                              <Badge
                                className={
                                  OPERATION_COLORS[
                                    operation.operation as keyof typeof OPERATION_COLORS
                                  ]
                                }
                              >
                                {OPERATION_LABELS[
                                  operation.operation as keyof typeof OPERATION_LABELS
                                ] || operation.operation}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Date et heure
                              </p>
                              <p className="font-medium">
                                {new Date(operation.performedAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total</p>
                              <p className="text-2xl font-bold">{operation.userCount}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Réussies</p>
                              <p className="text-2xl font-bold text-green-600">
                                {operation.successCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Échecs</p>
                              <p className="text-2xl font-bold text-red-600">
                                {operation.failedCount}
                              </p>
                            </div>
                          </div>

                          {operation.reason && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                Raison
                              </p>
                              <p className="p-3 bg-muted rounded-lg">{operation.reason}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Effectué par
                            </p>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{operation.performedBy}</span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
