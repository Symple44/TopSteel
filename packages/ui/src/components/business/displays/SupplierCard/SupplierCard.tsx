'use client'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  FileText,
  Globe,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button/Button'
export interface Supplier {
  id: string
  name: string
  company: string
  type: 'raw_materials' | 'equipment' | 'services' | 'logistics'
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'preferred'
  rating: {
    overall: number
    quality: number
    delivery: number
    price: number
    service: number
    reviewCount: number
  }
  contact: {
    email: string
    phone?: string
    website?: string
    primaryContact: {
      name: string
      role: string
      email: string
      phone?: string
    }
  }
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  business: {
    totalOrders: number
    totalValue: number
    averageOrderValue: number
    lastOrderDate?: Date
    preferredPaymentTerms: string
    creditLimit?: number
    currency: string
  }
  performance: {
    onTimeDelivery: number // percentage
    qualityScore: number // percentage
    priceCompetitiveness: number // percentage
    responseTime: number // hours
  }
  certifications: Array<{
    id: string
    name: string
    issuer: string
    expiryDate?: Date
    status: 'valid' | 'expired' | 'pending'
  }>
  products: Array<{
    id: string
    name: string
    category: string
    steelGrade?: string
    specifications?: string
    priceRange?: {
      min: number
      max: number
      unit: string
    }
  }>
  contracts: {
    active: number
    total: number
    value: number
  }
  risks: Array<{
    id: string
    type: 'financial' | 'operational' | 'compliance' | 'quality'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    mitigationStatus: 'open' | 'in_progress' | 'resolved'
  }>
  createdAt: Date
  updatedAt: Date
}
interface SupplierCardProps {
  supplier: Supplier
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  onViewContracts?: () => void
  onCreateOrder?: () => void
  className?: string
  loading?: boolean
  compact?: boolean
}
export function SupplierCard({
  supplier,
  showActions = false,
  onEdit,
  onDelete,
  onViewDetails,
  onViewContracts,
  onCreateOrder,
  className,
  loading = false,
  compact = false,
}: SupplierCardProps) {
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
  const getStatusConfig = (status: Supplier['status']) => {
    switch (status) {
      case 'active':
        return {
          label: 'Actif',
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 border-green-200',
        }
      case 'inactive':
        return {
          label: 'Inactif',
          icon: Clock,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
      case 'pending':
        return {
          label: 'En attente',
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
      case 'suspended':
        return {
          label: 'Suspendu',
          icon: AlertTriangle,
          className: 'bg-red-100 text-red-800 border-red-200',
        }
      case 'preferred':
        return {
          label: 'Préféré',
          icon: Star,
          className: 'bg-purple-100 text-purple-800 border-purple-200',
        }
      default:
        return {
          label: 'Inconnu',
          icon: AlertTriangle,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        }
    }
  }
  const getTypeLabel = (type: Supplier['type']) => {
    switch (type) {
      case 'raw_materials':
        return 'Matières premières'
      case 'equipment':
        return 'Équipement'
      case 'services':
        return 'Services'
      case 'logistics':
        return 'Logistique'
      default:
        return 'Autre'
    }
  }
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.0) return 'text-yellow-600'
    return 'text-red-600'
  }
  const getPerformanceColor = (value: number) => {
    if (value >= 90) return 'text-green-600'
    if (value >= 80) return 'text-blue-600'
    if (value >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }
  const getCriticalRisks = () => {
    return supplier.risks.filter(
      (risk) => risk.severity === 'critical' && risk.mitigationStatus !== 'resolved'
    )
  }
  const getValidCertifications = () => {
    return supplier.certifications.filter((cert) => cert.status === 'valid')
  }
  const statusConfig = getStatusConfig(supplier.status)
  const StatusIcon = statusConfig.icon
  const criticalRisks = getCriticalRisks()
  const validCertifications = getValidCertifications()
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{supplier.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {supplier.company} • {getTypeLabel(supplier.type)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={statusConfig.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
            {criticalRisks.length > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {criticalRisks.length} risque{criticalRisks.length > 1 ? 's' : ''} critique
                {criticalRisks.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-4 w-4',
                    star <= supplier.rating.overall
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className={cn('font-medium text-sm', getRatingColor(supplier.rating.overall))}>
              {supplier.rating.overall.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({supplier.rating.reviewCount} avis)
            </span>
          </div>
          {validCertifications.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {validCertifications.length} certification{validCertifications.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{supplier.contact.email}</span>
          </div>
          {supplier.contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{supplier.contact.phone}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <div>{supplier.address.street}</div>
              <div>
                {supplier.address.postalCode} {supplier.address.city}
              </div>
              <div>{supplier.address.country}</div>
            </div>
          </div>
          {supplier.contact.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={supplier.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Site web
              </a>
            </div>
          )}
        </div>
        {!compact && (
          <>
            {/* Business Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Commandes</p>
                <p className="font-semibold">{supplier.business.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valeur totale</p>
                <p className="font-semibold">
                  {formatCurrency(supplier.business.totalValue, supplier.business.currency)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Panier moyen</p>
                <p className="font-semibold">
                  {formatCurrency(supplier.business.averageOrderValue, supplier.business.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contrats actifs</p>
                <p className="font-semibold">{supplier.contracts.active}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(supplier.contracts.value, supplier.business.currency)}
                </p>
              </div>
            </div>
            {/* Performance Metrics */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium">Performance</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Livraison à temps</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      getPerformanceColor(supplier.performance.onTimeDelivery)
                    )}
                  >
                    {supplier.performance.onTimeDelivery.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Score qualité</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      getPerformanceColor(supplier.performance.qualityScore)
                    )}
                  >
                    {supplier.performance.qualityScore.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Compétitivité prix</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      getPerformanceColor(supplier.performance.priceCompetitiveness)
                    )}
                  >
                    {supplier.performance.priceCompetitiveness.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Temps de réponse</span>
                  <span className="text-xs font-medium">{supplier.performance.responseTime}h</span>
                </div>
              </div>
            </div>
            {/* Top Products */}
            {supplier.products.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground font-medium">Produits principaux</p>
                <div className="space-y-1">
                  {supplier.products.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex justify-between items-center text-sm">
                      <div className="min-w-0 flex-1">
                        <span className="truncate block">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.category}
                          {product.steelGrade && ` • Grade: ${product.steelGrade}`}
                        </span>
                      </div>
                      {product.priceRange && (
                        <div className="text-right text-xs">
                          <span className="font-medium">
                            {formatCurrency(product.priceRange.min, supplier.business.currency)} -{' '}
                            {formatCurrency(product.priceRange.max, supplier.business.currency)}
                          </span>
                          <div className="text-muted-foreground">/{product.priceRange.unit}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {supplier.products.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{supplier.products.length - 3} autre
                      {supplier.products.length - 3 > 1 ? 's' : ''} produit
                      {supplier.products.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* Primary Contact */}
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-xs text-muted-foreground mb-2">Contact principal</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {supplier.contact.primaryContact.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {supplier.contact.primaryContact.role}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {supplier.contact.primaryContact.email}
                  {supplier.contact.primaryContact.phone && (
                    <span className="ml-2">• {supplier.contact.primaryContact.phone}</span>
                  )}
                </div>
              </div>
            </div>
            {/* Critical Risks */}
            {criticalRisks.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Risques critiques
                </p>
                <div className="space-y-1">
                  {criticalRisks.slice(0, 2).map((risk) => (
                    <div
                      key={risk.id}
                      className="text-xs bg-red-50 p-2 rounded border border-red-200"
                    >
                      <p className="font-medium text-red-800">{risk.description}</p>
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs mt-1">
                        {risk.type}
                      </Badge>
                    </div>
                  ))}
                  {criticalRisks.length > 2 && (
                    <p className="text-xs text-red-600">
                      +{criticalRisks.length - 2} autre{criticalRisks.length - 2 > 1 ? 's' : ''}{' '}
                      risque{criticalRisks.length - 2 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* Last Order & Payment Terms */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {supplier.business.lastOrderDate ? (
                  <span>Dernière commande: {formatDate(supplier.business.lastOrderDate)}</span>
                ) : (
                  <span>Aucune commande</span>
                )}
              </div>
              <div>Conditions: {supplier.business.preferredPaymentTerms}</div>
            </div>
          </>
        )}
        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {onCreateOrder && supplier.status === 'active' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCreateOrder}
                className="flex items-center gap-1"
              >
                <Package className="h-3 w-3" />
                Commander
              </Button>
            )}
            {onViewDetails && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Détails
              </Button>
            )}
            {onViewContracts && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onViewContracts}
                className="flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                Contrats
              </Button>
            )}
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" />
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
