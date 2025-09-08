'use client'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Send,
  Trash2,
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
import { Badge } from '../../../primitives'
import { Button } from '../../../primitives/button/Button'
export interface Invoice {
  id: string
  number: string
  clientId: string
  clientName: string
  date: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  tax: number
  taxRate: number
  discount?: number
  total: number
  currency: string
  paymentMethod?: string
  paidAt?: Date
  notes?: string
  attachments?: string[]
  createdAt: Date
  updatedAt: Date
}
interface InvoicesTableProps {
  data: Invoice[]
  loading?: boolean
  onView?: (invoice: Invoice) => void
  onEdit?: (invoice: Invoice) => void
  onDelete?: (invoice: Invoice) => void
  onDownload?: (invoice: Invoice) => void
  onSend?: (invoice: Invoice) => void
  onMarkAsPaid?: (invoice: Invoice) => void
}
export function InvoicesTable({
  data = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onSend,
  onMarkAsPaid,
}: InvoicesTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des factures...</p>
        </div>
      </div>
    )
  }
  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      draft: {
        label: 'Brouillon',
        className: 'bg-gray-100 text-gray-800',
        icon: <Edit className="h-3 w-3" />,
      },
      sent: {
        label: 'Envoyée',
        className: 'bg-blue-100 text-blue-800',
        icon: <Send className="h-3 w-3" />,
      },
      paid: {
        label: 'Payée',
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      overdue: {
        label: 'En retard',
        className: 'bg-red-100 text-red-800',
        icon: <AlertCircle className="h-3 w-3" />,
      },
      cancelled: {
        label: 'Annulée',
        className: 'bg-gray-100 text-gray-600',
        icon: <XCircle className="h-3 w-3" />,
      },
    }
    const variant = variants[status] || variants.draft
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    )
  }
  const getPaymentBadge = (status: Invoice['paymentStatus']) => {
    const variants = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      partial: { label: 'Partiel', className: 'bg-orange-100 text-orange-800' },
      paid: { label: 'Payé', className: 'bg-green-100 text-green-800' },
      refunded: { label: 'Remboursé', className: 'bg-purple-100 text-purple-800' },
    }
    const variant = variants[status] || variants.pending
    return <Badge className={variant.className}>{variant.label}</Badge>
  }
  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount)
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
  }
  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Paiement</TableHead>
            <TableHead className="text-right">Montant HT</TableHead>
            <TableHead className="text-right">TVA</TableHead>
            <TableHead className="text-right">Total TTC</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                Aucune facture trouvée
              </TableCell>
            </TableRow>
          ) : (
            data.map((invoice) => {
              const daysUntilDue = getDaysUntilDue(invoice.dueDate)
              const isOverdue = invoice.status !== 'paid' && daysUntilDue < 0
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.clientName}</div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>
                    <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      {formatDate(invoice.dueDate)}
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <div className="text-xs text-muted-foreground">
                          {daysUntilDue > 0 ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {daysUntilDue} jour{daysUntilDue > 1 ? 's' : ''}
                            </span>
                          ) : daysUntilDue === 0 ? (
                            <span className="text-orange-600">Aujourd'hui</span>
                          ) : (
                            <span className="text-red-600">
                              {Math.abs(daysUntilDue)} jour{Math.abs(daysUntilDue) > 1 ? 's' : ''}{' '}
                              de retard
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>{getPaymentBadge(invoice.paymentStatus)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.tax, invoice.currency)}
                    <div className="text-xs text-muted-foreground">{invoice.taxRate}%</div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.total, invoice.currency)}
                    {invoice.discount && invoice.discount > 0 && (
                      <div className="text-xs text-green-600">
                        -{formatCurrency(invoice.discount, invoice.currency)}
                      </div>
                    )}
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
                        <DropdownMenuItem onClick={() => onView?.(invoice)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload?.(invoice)}>
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger PDF
                        </DropdownMenuItem>
                        {invoice.status === 'draft' && (
                          <>
                            <DropdownMenuItem onClick={() => onEdit?.(invoice)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSend?.(invoice)}>
                              <Send className="mr-2 h-4 w-4" />
                              Envoyer
                            </DropdownMenuItem>
                          </>
                        )}
                        {invoice.status === 'sent' && invoice.paymentStatus !== 'paid' && (
                          <DropdownMenuItem onClick={() => onMarkAsPaid?.(invoice)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marquer comme payée
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete?.(invoice)}
                          className="text-red-600"
                          disabled={invoice.status === 'paid'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
