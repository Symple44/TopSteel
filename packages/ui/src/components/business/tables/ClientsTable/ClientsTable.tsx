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
import { MoreHorizontal, Edit, Trash2, Eye, Phone, Mail } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../navigation'
export interface Client {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  vatNumber?: string
  status: 'active' | 'inactive' | 'suspended'
  type: 'company' | 'individual'
  creditLimit?: number
  outstandingBalance?: number
  lastOrderDate?: Date
  totalOrders?: number
  totalRevenue?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}
interface ClientsTableProps {
  data: Client[]
  loading?: boolean
  onView?: (client: Client) => void
  onEdit?: (client: Client) => void
  onDelete?: (client: Client) => void
  onContact?: (client: Client, type: 'email' | 'phone') => void
}
export function ClientsTable({ 
  data = [], 
  loading = false, 
  onView,
  onEdit, 
  onDelete,
  onContact 
}: ClientsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des clients...</p>
        </div>
      </div>
    )
  }
  const getStatusBadge = (status: Client['status']) => {
    const variants = {
      active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Suspendu', className: 'bg-red-100 text-red-800' },
    }
    const variant = variants[status] || variants.inactive
    return <Badge className={variant.className}>{variant.label}</Badge>
  }
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }
  const formatDate = (date?: Date) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Crédit</TableHead>
            <TableHead className="text-right">Solde</TableHead>
            <TableHead>Dernière commande</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                Aucun client trouvé
              </TableCell>
            </TableRow>
          ) : (
            data.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.code}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    {client.city && (
                      <div className="text-sm text-muted-foreground">
                        {client.city} {client.postalCode && `(${client.postalCode})`}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {client.email && (
                      <button
                        onClick={() => onContact?.(client, 'email')}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{client.email}</span>
                      </button>
                    )}
                    {client.phone && (
                      <button
                        onClick={() => onContact?.(client, 'phone')}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {client.type === 'company' ? 'Entreprise' : 'Particulier'}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(client.status)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(client.creditLimit)}
                </TableCell>
                <TableCell className="text-right">
                  <span className={client.outstandingBalance && client.outstandingBalance > 0 ? 'text-red-600 font-medium' : ''}>
                    {formatCurrency(client.outstandingBalance)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{formatDate(client.lastOrderDate)}</div>
                    {client.totalOrders && (
                      <div className="text-muted-foreground">
                        {client.totalOrders} commande{client.totalOrders > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
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
                      <DropdownMenuItem onClick={() => onView?.(client)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(client)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(client)}
                        className="text-red-600"
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
  )
}
