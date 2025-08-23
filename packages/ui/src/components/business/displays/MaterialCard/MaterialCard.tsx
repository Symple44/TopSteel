'use client'
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button/Button'
import { Badge } from '../../../data-display/badge'
import { StockLevelIndicator } from '../StockLevelIndicator'
import { PriceDisplay } from '../PriceDisplay'
import { 
  Package, 
  Ruler, 
  Weight, 
  Shield, 
  Zap, 
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Image,
  FileText
} from 'lucide-react'
import { cn } from '../../../../lib/utils'
export interface Material {
  id: string
  name: string
  reference: string
  category: 'steel' | 'aluminum' | 'stainless' | 'copper' | 'brass' | 'iron' | 'alloy'
  grade?: string
  specifications: {
    thickness?: number
    width?: number
    length?: number
    diameter?: number
    weight?: number
    density?: number
  }
  properties: {
    tensileStrength?: number
    yieldStrength?: number
    hardness?: string
    corrosionResistance?: 'low' | 'medium' | 'high' | 'excellent'
    weldability?: 'poor' | 'fair' | 'good' | 'excellent'
    machinability?: 'poor' | 'fair' | 'good' | 'excellent'
  }
  stock: {
    current: number
    minimum: number
    maximum: number
    unit: 'kg' | 'tons' | 'pieces' | 'm' | 'm²' | 'm³'
    location?: string
  }
  pricing: {
    unitPrice: number
    currency: 'EUR' | 'USD' | 'GBP'
    pricePerKg?: number
    lastUpdated: Date
  }
  supplier?: {
    name: string
    reference: string
    leadTime: number
  }
  certifications?: string[]
  image?: string
  description?: string
  status: 'active' | 'discontinued' | 'pending'
}
interface MaterialCardProps {
  material: Material
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onViewDetails?: () => void
  className?: string
  loading?: boolean
}
export function MaterialCard({
  material,
  showActions = false,
  onEdit,
  onDelete,
  onViewDetails,
  className,
  loading = false,
}: MaterialCardProps) {
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
  const getCategoryIcon = (category: Material['category']) => {
    switch (category) {
      case 'steel':
        return Shield
      case 'aluminum':
        return Zap
      case 'stainless':
        return Shield
      case 'copper':
        return Thermometer
      default:
        return Package
    }
  }
  const getCategoryColor = (category: Material['category']) => {
    switch (category) {
      case 'steel':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'aluminum':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'stainless':
        return 'bg-silver-100 text-silver-800 border-silver-200'
      case 'copper':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'brass':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  const getStatusColor = (status: Material['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'discontinued':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  const formatSpecifications = () => {
    const specs = material.specifications
    const parts = []
    if (specs.thickness) parts.push(`${specs.thickness}mm`)
    if (specs.width) parts.push(`${specs.width}mm`)
    if (specs.length) parts.push(`${specs.length}mm`)
    if (specs.diameter) parts.push(`Ø${specs.diameter}mm`)
    return parts.join(' × ')
  }
  const Icon = getCategoryIcon(material.category)
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{material.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{material.reference}</p>
              {material.grade && (
                <p className="text-xs text-muted-foreground">Grade: {material.grade}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className={getCategoryColor(material.category)}>
              {material.category.toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(material.status)}>
              {material.status === 'active' && 'Actif'}
              {material.status === 'discontinued' && 'Arrêté'}
              {material.status === 'pending' && 'En attente'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Specifications */}
        {formatSpecifications() && (
          <div className="flex items-center gap-2 text-sm">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span>{formatSpecifications()}</span>
            {material.specifications.weight && (
              <>
                <Weight className="h-4 w-4 text-muted-foreground ml-2" />
                <span>{material.specifications.weight}kg</span>
              </>
            )}
          </div>
        )}
        {/* Stock Level */}
        <div>
          <StockLevelIndicator
            current={material.stock.current}
            minimum={material.stock.minimum}
            maximum={material.stock.maximum}
            unit={material.stock.unit}
            showLabel={true}
            variant="compact"
          />
        </div>
        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Prix unitaire</span>
          <PriceDisplay
            price={material.pricing.unitPrice}
            currency={material.pricing.currency}
            unit={material.stock.unit}
            size="sm"
            variant="compact"
          />
        </div>
        {/* Properties */}
        {(material.properties.tensileStrength || material.properties.hardness) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {material.properties.tensileStrength && (
              <div>
                <span className="text-muted-foreground">Résistance:</span>
                <br />
                <span className="font-medium">{material.properties.tensileStrength} MPa</span>
              </div>
            )}
            {material.properties.hardness && (
              <div>
                <span className="text-muted-foreground">Dureté:</span>
                <br />
                <span className="font-medium">{material.properties.hardness}</span>
              </div>
            )}
          </div>
        )}
        {/* Quality Indicators */}
        <div className="flex flex-wrap gap-1">
          {material.properties.corrosionResistance && (
            <Badge variant="outline" className="text-xs">
              Corrosion: {material.properties.corrosionResistance}
            </Badge>
          )}
          {material.properties.weldability && (
            <Badge variant="outline" className="text-xs">
              Soudabilité: {material.properties.weldability}
            </Badge>
          )}
          {material.certifications && material.certifications.length > 0 && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {material.certifications.length} cert.
            </Badge>
          )}
        </div>
        {/* Supplier Info */}
        {material.supplier && (
          <div className="text-xs text-muted-foreground">
            Fournisseur: {material.supplier.name} • Délai: {material.supplier.leadTime}j
          </div>
        )}
        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {material.image && <Image className="h-3 w-3" />}
            {material.description && <FileText className="h-3 w-3" />}
            {material.stock.location && (
              <span>📍 {material.stock.location}</span>
            )}
          </div>
          <div>
            Prix maj: {new Intl.DateTimeFormat('fr-FR').format(material.pricing.lastUpdated)}
          </div>
        </div>
        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t">
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
                Voir détails
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Supprimer
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
