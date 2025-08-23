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
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calculator
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../primitives'
export interface Material {
  id: string
  reference: string
  designation: string
  description?: string
  category: string
  type: 'raw' | 'component' | 'finished' | 'consumable'
  unit: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
    diameter?: number
    thickness?: number
    weight?: number
  }
  specifications?: {
    grade?: string
    standard?: string
    tolerance?: string
    finish?: string
  }
  stock: {
    physicalStock: number
    availableStock: number
    reservedStock: number
    minimumStock: number
    maximumStock?: number
    reorderPoint?: number
    location?: string
  }
  pricing: {
    purchasePrice: number
    salePrice: number
    averageCost?: number
    lastPurchasePrice?: number
    currency: string
  }
  supplier?: {
    id: string
    name: string
    reference?: string
  }
  status: 'active' | 'inactive' | 'discontinued' | 'outOfStock'
  leadTime?: number // in days
  lastMovementDate?: Date
  createdAt: Date
  updatedAt: Date
}
interface MaterialsTableProps {
  data: Material[]
  loading?: boolean
  onView?: (material: Material) => void
  onEdit?: (material: Material) => void
  onDelete?: (material: Material) => void
  onAdjustStock?: (material: Material) => void
  onViewHistory?: (material: Material) => void
  onCalculateNeeds?: (material: Material) => void
}
export function MaterialsTable({
  data = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onAdjustStock,
  onViewHistory,
  onCalculateNeeds,
}: MaterialsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des matériaux...</p>
        </div>
      </div>
    )
  }
  const getStatusBadge = (status: Material['status']) => {
    const variants = {
      active: { 
        label: 'Actif', 
        className: 'bg-green-100 text-green-800' 
      },
      inactive: { 
        label: 'Inactif', 
        className: 'bg-gray-100 text-gray-800' 
      },
      discontinued: { 
        label: 'Abandonné', 
        className: 'bg-orange-100 text-orange-800' 
      },
      outOfStock: { 
        label: 'Rupture', 
        className: 'bg-red-100 text-red-800' 
      },
    }
    const variant = variants[status] || variants.inactive
    return <Badge className={variant.className}>{variant.label}</Badge>
  }
  const getTypeBadge = (type: Material['type']) => {
    const variants = {
      raw: { label: 'Matière première', icon: <Package className="h-3 w-3" /> },
      component: { label: 'Composant', icon: <Package className="h-3 w-3" /> },
      finished: { label: 'Produit fini', icon: <Package className="h-3 w-3" /> },
      consumable: { label: 'Consommable', icon: <Package className="h-3 w-3" /> },
    }
    const variant = variants[type] || variants.raw
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {variant.icon}
        {variant.label}
      </Badge>
    )
  }
  const getStockStatus = (material: Material) => {
    const { physicalStock, minimumStock, maximumStock, reorderPoint } = material.stock
    if (physicalStock <= 0) {
      return { 
        level: 'critical', 
        color: 'text-red-600', 
        bgColor: 'bg-red-50',
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
        text: 'Rupture de stock' 
      }
    }
    if (physicalStock <= minimumStock) {
      return { 
        level: 'low', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50',
        icon: <TrendingDown className="h-4 w-4 text-orange-600" />,
        text: 'Stock faible' 
      }
    }
    if (reorderPoint && physicalStock <= reorderPoint) {
      return { 
        level: 'reorder', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-50',
        icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
        text: 'À commander' 
      }
    }
    if (maximumStock && physicalStock >= maximumStock) {
      return { 
        level: 'excess', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50',
        icon: <TrendingUp className="h-4 w-4 text-blue-600" />,
        text: 'Surstock' 
      }
    }
    return { 
      level: 'normal', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      icon: null,
      text: 'Normal' 
    }
  }
  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount)
  }
  const formatDimensions = (dimensions?: Material['dimensions']) => {
    if (!dimensions) return '-'
    const parts = []
    if (dimensions.length) parts.push(`L: ${dimensions.length}mm`)
    if (dimensions.width) parts.push(`l: ${dimensions.width}mm`)
    if (dimensions.height) parts.push(`H: ${dimensions.height}mm`)
    if (dimensions.diameter) parts.push(`Ø: ${dimensions.diameter}mm`)
    if (dimensions.thickness) parts.push(`Ép: ${dimensions.thickness}mm`)
    if (dimensions.weight) parts.push(`${dimensions.weight}kg`)
    return parts.join(' × ')
  }
  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead>Type/Catégorie</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>État stock</TableHead>
              <TableHead className="text-right">Prix achat</TableHead>
              <TableHead className="text-right">Prix vente</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  Aucun matériau trouvé
                </TableCell>
              </TableRow>
            ) : (
              data.map((material) => {
                const stockStatus = getStockStatus(material)
                return (
                  <TableRow key={material.id} className={stockStatus.level === 'critical' ? 'bg-red-50/50' : ''}>
                    <TableCell className="font-medium">
                      {material.reference}
                      {material.specifications?.grade && (
                        <div className="text-xs text-muted-foreground">
                          Grade: {material.specifications.grade}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{material.designation}</div>
                        {material.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {material.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getTypeBadge(material.type)}
                        <div className="text-xs text-muted-foreground">{material.category}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="text-sm">
                            {formatDimensions(material.dimensions)}
                          </div>
                        </TooltipTrigger>
                        {material.specifications && (
                          <TooltipContent>
                            <div className="space-y-1">
                              {material.specifications.standard && (
                                <div>Norme: {material.specifications.standard}</div>
                              )}
                              {material.specifications.tolerance && (
                                <div>Tolérance: {material.specifications.tolerance}</div>
                              )}
                              {material.specifications.finish && (
                                <div>Finition: {material.specifications.finish}</div>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {material.stock.physicalStock} {material.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Disponible: {material.stock.availableStock}
                          {material.stock.reservedStock > 0 && (
                            <span className="text-orange-600">
                              {' '}(Réservé: {material.stock.reservedStock})
                            </span>
                          )}
                        </div>
                        {material.stock.location && (
                          <div className="text-xs text-muted-foreground">
                            📍 {material.stock.location}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 px-2 py-1 rounded ${stockStatus.bgColor}`}>
                        {stockStatus.icon}
                        <span className={`text-sm font-medium ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Min: {material.stock.minimumStock} | Max: {material.stock.maximumStock || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(material.pricing.purchasePrice, material.pricing.currency)}
                      {material.pricing.lastPurchasePrice && 
                       material.pricing.lastPurchasePrice !== material.pricing.purchasePrice && (
                        <div className="text-xs text-muted-foreground">
                          Dernier: {formatCurrency(material.pricing.lastPurchasePrice, material.pricing.currency)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {formatCurrency(material.pricing.salePrice, material.pricing.currency)}
                      </div>
                      {material.pricing.averageCost && (
                        <div className="text-xs text-muted-foreground">
                          PMP: {formatCurrency(material.pricing.averageCost, material.pricing.currency)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(material.status)}</TableCell>
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
                          <DropdownMenuItem onClick={() => onView?.(material)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(material)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onAdjustStock?.(material)}>
                            <Package className="mr-2 h-4 w-4" />
                            Ajuster le stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewHistory?.(material)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Historique mouvements
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCalculateNeeds?.(material)}>
                            <Calculator className="mr-2 h-4 w-4" />
                            Calculer les besoins
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDelete?.(material)}
                            className="text-red-600"
                            disabled={material.stock.physicalStock > 0}
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
    </TooltipProvider>
  )
}