'use client'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Package,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../data-display'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../navigation'
import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../primitives'
import { Button } from '../../../primitives/button/Button'
export interface StockMovement {
  id: string
  reference: string
  type: 'entry' | 'exit' | 'transfer' | 'adjustment' | 'return' | 'production'
  date: Date
  articleId: string
  articleReference: string
  articleDesignation: string
  quantity: number
  unit: string
  previousStock: number
  newStock: number
  location?: string
  destinationLocation?: string // Pour les transferts
  reason?: string
  documentType?: 'order' | 'invoice' | 'delivery' | 'production' | 'inventory' | 'return'
  documentReference?: string
  userId: string
  userName: string
  status: 'pending' | 'completed' | 'cancelled'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
  cost?: number
  totalValue?: number
  batchNumber?: string
  expiryDate?: Date
  createdAt: Date
  validatedAt?: Date
  validatedBy?: string
}
interface StockMovementsTableProps {
  data: StockMovement[]
  loading?: boolean
  onView?: (movement: StockMovement) => void
  onEdit?: (movement: StockMovement) => void
  onDelete?: (movement: StockMovement) => void
  onValidate?: (movement: StockMovement) => void
  onCancel?: (movement: StockMovement) => void
  onViewDocument?: (movement: StockMovement) => void
}
export function StockMovementsTable({
  data = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onValidate,
  onCancel,
  onViewDocument,
}: StockMovementsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">
            Chargement des mouvements de stock...
          </p>
        </div>
      </div>
    )
  }
  const getTypeBadge = (type: StockMovement['type']) => {
    const variants = {
      entry: {
        label: 'Entrée',
        className: 'bg-green-100 text-green-800',
        icon: <ArrowDownRight className="h-3 w-3" />,
      },
      exit: {
        label: 'Sortie',
        className: 'bg-red-100 text-red-800',
        icon: <ArrowUpRight className="h-3 w-3" />,
      },
      transfer: {
        label: 'Transfert',
        className: 'bg-blue-100 text-blue-800',
        icon: <Package className="h-3 w-3" />,
      },
      adjustment: {
        label: 'Ajustement',
        className: 'bg-orange-100 text-orange-800',
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      return: {
        label: 'Retour',
        className: 'bg-purple-100 text-purple-800',
        icon: <Package className="h-3 w-3" />,
      },
      production: {
        label: 'Production',
        className: 'bg-indigo-100 text-indigo-800',
        icon: <Package className="h-3 w-3" />,
      },
    }
    const variant = variants[type] || variants.adjustment
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    )
  }
  const getStatusBadge = (status: StockMovement['status']) => {
    const variants = {
      pending: {
        label: 'En attente',
        className: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-3 w-3" />,
      },
      completed: {
        label: 'Validé',
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      cancelled: {
        label: 'Annulé',
        className: 'bg-gray-100 text-gray-600',
        icon: <XCircle className="h-3 w-3" />,
      },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    )
  }
  const getPriorityBadge = (priority?: StockMovement['priority']) => {
    if (!priority) return null
    const variants = {
      low: { label: 'Faible', className: 'bg-gray-100 text-gray-800' },
      normal: { label: 'Normal', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'Élevé', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
    }
    const variant = variants[priority] || variants.normal
    return <Badge className={variant.className}>{variant.label}</Badge>
  }
  const getStockImpact = (movement: StockMovement) => {
    const diff = movement.newStock - movement.previousStock
    const isPositive = diff >= 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = isPositive ? 'text-green-600' : 'text-red-600'
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="font-medium">
          {isPositive ? '+' : ''}
          {diff} {movement.unit}
        </span>
      </div>
    )
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }
  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Article</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Impact stock</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  Aucun mouvement de stock trouvé
                </TableCell>
              </TableRow>
            ) : (
              data.map((movement) => (
                <TableRow
                  key={movement.id}
                  className={movement.status === 'cancelled' ? 'opacity-60' : ''}
                >
                  <TableCell className="font-medium">
                    {movement.reference}
                    {movement.batchNumber && (
                      <div className="text-xs text-muted-foreground">
                        Lot: {movement.batchNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-sm">{formatDate(movement.date)}</div>
                      </TooltipTrigger>
                      {movement.validatedAt && (
                        <TooltipContent>
                          <div className="space-y-1">
                            <div>Validé le: {formatDate(movement.validatedAt)}</div>
                            {movement.validatedBy && <div>Par: {movement.validatedBy}</div>}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell>{getTypeBadge(movement.type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{movement.articleReference}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {movement.articleDesignation}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {movement.quantity} {movement.unit}
                    </div>
                    {movement.totalValue && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(movement.totalValue)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStockImpact(movement)}
                    <div className="text-xs text-muted-foreground">
                      {movement.previousStock} → {movement.newStock}
                    </div>
                  </TableCell>
                  <TableCell>
                    {movement.documentReference ? (
                      <button
                        onClick={() => onViewDocument?.(movement)}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="text-sm">{movement.documentReference}</span>
                      </button>
                    ) : (
                      '-'
                    )}
                    {movement.documentType && (
                      <div className="text-xs text-muted-foreground capitalize">
                        {movement.documentType}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(movement.status)}</TableCell>
                  <TableCell>{getPriorityBadge(movement.priority)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {movement.userName}
                      {movement.location && (
                        <div className="text-xs text-muted-foreground">
                          📍 {movement.location}
                          {movement.destinationLocation && (
                            <span> → {movement.destinationLocation}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView?.(movement)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        {movement.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => onEdit?.(movement)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onValidate?.(movement)}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Valider
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onCancel?.(movement)}
                              className="text-orange-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Annuler
                            </DropdownMenuItem>
                          </>
                        )}
                        {movement.documentReference && (
                          <DropdownMenuItem onClick={() => onViewDocument?.(movement)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Voir document
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete?.(movement)}
                          className="text-red-600"
                          disabled={movement.status === 'completed'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
