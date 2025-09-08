'use client'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  User,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button/Button'
export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  clientType: 'individual' | 'company'
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  issueDate: Date
  dueDate: Date
  paidDate?: Date
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  items: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    total: number
    steelGrade?: string
    dimensions?: string
  }>
  paymentTerms: string
  notes?: string
  projectId?: string
  projectName?: string
  createdAt: Date
  updatedAt: Date
}
interface InvoiceCardProps {
  invoice: Invoice
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
  onDownload?: () => void
  onMarkAsPaid?: () => void
  className?: string
  loading?: boolean
}
export function InvoiceCard({
  invoice,
  showActions = false,
  onEdit,
  onDelete,
  onView,
  onDownload,
  onMarkAsPaid,
  className,
  loading = false,
}: InvoiceCardProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-8 bg-muted rounded" />
              <div className="h-8 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  const getStatusConfig = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Brouillon',
          icon: FileText,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
      case 'sent':
        return {
          label: 'Envoyée',
          icon: ArrowRight,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        }
      case 'pending':
        return {
          label: 'En attente',
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
      case 'paid':
        return {
          label: 'Payée',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200',
        }
      case 'overdue':
        return {
          label: 'En retard',
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-800 border-red-200',
        }
      case 'cancelled':
        return {
          label: 'Annulée',
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-900 border-red-300',
        }
      default:
        return {
          label: 'Inconnu',
          icon: AlertTriangle,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
    }
  }
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }
  const getDaysOverdue = () => {
    if (invoice.status !== 'overdue') return 0
    const today = new Date()
    const diffTime = today.getTime() - invoice.dueDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  const getDaysUntilDue = () => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return null
    const today = new Date()
    const diffTime = invoice.dueDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  const statusConfig = getStatusConfig(invoice.status)
  const StatusIcon = statusConfig.icon
  const daysOverdue = getDaysOverdue()
  const daysUntilDue = getDaysUntilDue()
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Facture #{invoice.invoiceNumber}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {invoice.projectName
                  ? `Projet: ${invoice.projectName}`
                  : `Client: ${invoice.clientName}`}
              </p>
            </div>
          </div>
          <Badge className={statusConfig.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client Information */}
        <div className="flex items-center gap-2 text-sm">
          {invoice.clientType === 'company' ? (
            <Building2 className="h-4 w-4 text-muted-foreground" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{invoice.clientName}</span>
        </div>
        {/* Financial Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Sous-total</p>
            <p className="font-semibold">{formatCurrency(invoice.subtotal, invoice.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total TTC</p>
            <p className="font-bold text-lg">
              {formatCurrency(invoice.totalAmount, invoice.currency)}
            </p>
          </div>
        </div>
        {/* Tax Information */}
        {invoice.taxAmount > 0 && (
          <div className="text-sm text-muted-foreground">
            TVA: {formatCurrency(invoice.taxAmount, invoice.currency)}
          </div>
        )}
        {/* Dates and Status Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Émise le {formatDate(invoice.issueDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Échéance: {formatDate(invoice.dueDate)}</span>
            {daysOverdue > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                En retard de {daysOverdue} jour{daysOverdue > 1 ? 's' : ''}
              </Badge>
            )}
            {daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 7 && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                {daysUntilDue} jour{daysUntilDue > 1 ? 's' : ''} restant
                {daysUntilDue > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {invoice.paidDate && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Payée le {formatDate(invoice.paidDate)}</span>
            </div>
          )}
        </div>
        {/* Items Summary */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            {invoice.items.length} article{invoice.items.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-1">
            {invoice.items.slice(0, 2).map((item) => (
              <div key={item.id} className="text-sm flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{item.description}</span>
                  {item.steelGrade && (
                    <span className="text-xs text-muted-foreground">
                      Grade: {item.steelGrade}
                      {item.dimensions && ` • ${item.dimensions}`}
                    </span>
                  )}
                </div>
                <div className="text-right ml-2">
                  <span className="font-medium">
                    {formatCurrency(item.total, invoice.currency)}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}
                  </div>
                </div>
              </div>
            ))}
            {invoice.items.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{invoice.items.length - 2} autre{invoice.items.length - 2 > 1 ? 's' : ''} article
                {invoice.items.length - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {/* Payment Terms */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Conditions de paiement</p>
          <p className="text-sm">{invoice.paymentTerms}</p>
        </div>
        {/* Notes */}
        {invoice.notes && (
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{invoice.notes}</p>
          </div>
        )}
        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {onView && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onView}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Voir
              </Button>
            )}
            {onDownload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Télécharger
              </Button>
            )}
            {onMarkAsPaid && invoice.status === 'pending' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onMarkAsPaid}
                className="flex items-center gap-1 text-green-600"
              >
                <CheckCircle className="h-3 w-3" />
                Marquer payée
              </Button>
            )}
            {onEdit && (
              <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                Supprimer
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
