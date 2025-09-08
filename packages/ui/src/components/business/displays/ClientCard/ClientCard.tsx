'use client'
import { Building2, Calendar, CreditCard, Mail, MapPin, Phone, Truck, User } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button/Button'
export interface Client {
  id: string
  name: string
  company?: string
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  type: 'individual' | 'company'
  createdAt: Date
  lastOrderDate?: Date
  totalOrders: number
  totalValue: number
  creditLimit?: number
  paymentTerms?: string
  industry?: string
  contacts?: Array<{
    name: string
    role: string
    email: string
    phone?: string
  }>
  deliveryPreferences?: {
    method: 'pickup' | 'delivery' | 'shipping'
    address?: string
    instructions?: string
  }
}
interface ClientCardProps {
  client: Client
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  className?: string
  loading?: boolean
}
export function ClientCard({
  client,
  showActions = false,
  onEdit,
  onDelete,
  onViewDetails,
  className,
  loading = false,
}: ClientCardProps) {
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
          </div>
        </CardContent>
      </Card>
    )
  }
  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {client.type === 'company' ? (
                <Building2 className="h-4 w-4 text-blue-600" />
              ) : (
                <User className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{client.name}</CardTitle>
              {client.company && client.type === 'individual' && (
                <p className="text-sm text-muted-foreground">{client.company}</p>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(client.status)}>
            {client.status === 'active' && 'Actif'}
            {client.status === 'inactive' && 'Inactif'}
            {client.status === 'pending' && 'En attente'}
            {client.status === 'suspended' && 'Suspendu'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div>{client.address.street}</div>
                <div>
                  {client.address.postalCode} {client.address.city}
                </div>
                <div>{client.address.country}</div>
              </div>
            </div>
          )}
        </div>
        {/* Business Information */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Commandes</p>
            <p className="font-semibold">{client.totalOrders}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valeur totale</p>
            <p className="font-semibold">{formatCurrency(client.totalValue)}</p>
          </div>
        </div>
        {/* Additional Information */}
        <div className="flex flex-wrap gap-2">
          {client.industry && (
            <Badge variant="outline" className="text-xs">
              {client.industry}
            </Badge>
          )}
          {client.deliveryPreferences?.method && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {client.deliveryPreferences.method === 'pickup' && 'Retrait'}
              {client.deliveryPreferences.method === 'delivery' && 'Livraison'}
              {client.deliveryPreferences.method === 'shipping' && 'Expédition'}
            </Badge>
          )}
          {client.creditLimit && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Crédit: {formatCurrency(client.creditLimit)}
            </Badge>
          )}
        </div>
        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Créé le {formatDate(client.createdAt)}
          </div>
          {client.lastOrderDate && <div>Dernière commande: {formatDate(client.lastOrderDate)}</div>}
        </div>
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t">
            {onViewDetails && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="flex-1"
              >
                Voir détails
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
