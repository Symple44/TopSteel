'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../data-display'
import { Button } from '../../../primitives/button/Button'
import { Badge } from '../../../primitives'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Send,
  Copy,
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../navigation'
export interface Quote {
  id: string
  number: string
  clientId: string
  clientName: string
  reference?: string
  date: Date
  validUntil: Date
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    discount?: number
    total: number
  }>
  subtotal: number
  tax: number
  taxRate: number
  discount?: number
  total: number
  currency: string
  deliveryTime?: string
  paymentTerms?: string
  notes?: string
  termsAndConditions?: string
  convertedToInvoiceId?: string
  createdAt: Date
  updatedAt: Date
}
interface QuotesTableProps {
  data: Quote[]
  loading?: boolean
  onView?: (quote: Quote) => void
  onEdit?: (quote: Quote) => void
  onDelete?: (quote: Quote) => void
  onDownload?: (quote: Quote) => void
  onSend?: (quote: Quote) => void
  onDuplicate?: (quote: Quote) => void
  onConvertToInvoice?: (quote: Quote) => void
}
export function QuotesTable({ 
  data = [], 
  loading = false, 
  onView,
  onEdit, 
  onDelete,
  onDownload,
  onSend,
  onDuplicate,
  onConvertToInvoice
}: QuotesTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des devis...</p>
        </div>
      </div>
    )
  }
  const getStatusBadge = (status: Quote['status']) => {
    const variants = {
      draft: { 
        label: 'Brouillon', 
        className: 'bg-gray-100 text-gray-800',
        icon: <Edit className="h-3 w-3" />
      },
      sent: { 
        label: 'Envoyé', 
        className: 'bg-blue-100 text-blue-800',
        icon: <Send className="h-3 w-3" />
      },
      accepted: { 
        label: 'Accepté', 
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      rejected: { 
        label: 'Refusé', 
        className: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-3 w-3" />
      },
      expired: { 
        label: 'Expiré', 
        className: 'bg-orange-100 text-orange-800',
        icon: <Clock className="h-3 w-3" />
      },
      converted: { 
        label: 'Converti', 
        className: 'bg-purple-100 text-purple-800',
        icon: <FileText className="h-3 w-3" />
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
  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount)
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
  }
  const getDaysUntilExpiry = (validUntil: Date) => {
    const today = new Date()
    const expiry = new Date(validUntil)
    const diffTime = expiry.getTime() - today.getTime()
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
            <TableHead>Validité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Montant HT</TableHead>
            <TableHead className="text-right">TVA</TableHead>
            <TableHead className="text-right">Total TTC</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                Aucun devis trouvé
              </TableCell>
            </TableRow>
          ) : (
            data.map((quote) => {
              const daysUntilExpiry = getDaysUntilExpiry(quote.validUntil)
              const isExpiring = quote.status === 'sent' && daysUntilExpiry <= 7 && daysUntilExpiry > 0
              const isExpired = quote.status === 'sent' && daysUntilExpiry <= 0
              return (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">
                    {quote.number}
                    {quote.reference && (
                      <div className="text-xs text-muted-foreground">
                        Réf: {quote.reference}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{quote.clientName}</div>
                  </TableCell>
                  <TableCell>{formatDate(quote.date)}</TableCell>
                  <TableCell>
                    <div className={isExpired ? 'text-red-600' : isExpiring ? 'text-orange-600' : ''}>
                      {formatDate(quote.validUntil)}
                      {quote.status === 'sent' && (
                        <div className="text-xs">
                          {daysUntilExpiry > 0 ? (
                            <span className={isExpiring ? 'font-medium' : 'text-muted-foreground'}>
                              {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="font-medium">Expiré</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(isExpired ? 'expired' : quote.status)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(quote.subtotal, quote.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(quote.tax, quote.currency)}
                    <div className="text-xs text-muted-foreground">
                      {quote.taxRate}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(quote.total, quote.currency)}
                    {quote.discount && quote.discount > 0 && (
                      <div className="text-xs text-green-600">
                        -{formatCurrency(quote.discount, quote.currency)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView?.(quote)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload?.(quote)}>
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger PDF
                        </DropdownMenuItem>
                        {quote.status === 'draft' && (
                          <>
                            <DropdownMenuItem onClick={() => onEdit?.(quote)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSend?.(quote)}>
                              <Send className="mr-2 h-4 w-4" />
                              Envoyer
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => onDuplicate?.(quote)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Dupliquer
                        </DropdownMenuItem>
                        {quote.status === 'accepted' && !quote.convertedToInvoiceId && (
                          <DropdownMenuItem 
                            onClick={() => onConvertToInvoice?.(quote)}
                            className="text-green-600"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Convertir en facture
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(quote)}
                          className="text-red-600"
                          disabled={quote.status === 'converted'}
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