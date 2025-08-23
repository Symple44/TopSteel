'use client'
import { Package, AlertTriangle, TrendingDown, ShoppingCart, Truck, Clock } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type StockLevel = 'out_of_stock' | 'critical' | 'low' | 'warning'
export type MaterialCategory = 'steel_sheets' | 'steel_bars' | 'steel_pipes' | 'fasteners' | 'consumables' | 'raw_materials'
export interface StockItem {
  id: string
  name: string
  sku: string
  category: MaterialCategory
  currentQuantity: number
  unit: string
  minimumThreshold: number
  reorderPoint: number
  averageDailyUsage: number
  daysOfStockLeft: number
  supplier: string
  lastReorderDate?: string
  pendingOrders: number
  expectedDeliveryDate?: string
  unitCost: number
  totalValue: number
}
export interface StockAlertProps {
  className?: string
  level: StockLevel
  items: StockItem[]
  onReorder?: (itemId: string) => void
  onViewDetails?: (itemId: string) => void
  onAdjustThreshold?: (itemId: string) => void
  onContactSupplier?: (supplierId: string) => void
  showActions?: boolean
}
const levelConfig = {
  out_of_stock: {
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-700',
    title: 'Rupture de stock'
  },
  critical: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    title: 'Stock critique'
  },
  low: {
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-600',
    title: 'Stock faible'
  },
  warning: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    title: 'Alerte stock'
  }
}
const categoryConfig = {
  steel_sheets: {
    icon: Package,
    label: 'Tôles acier',
    color: 'text-blue-600'
  },
  steel_bars: {
    icon: Package,
    label: 'Barres acier',
    color: 'text-green-600'
  },
  steel_pipes: {
    icon: Package,
    label: 'Tubes acier',
    color: 'text-purple-600'
  },
  fasteners: {
    icon: Package,
    label: 'Fixations',
    color: 'text-orange-600'
  },
  consumables: {
    icon: Package,
    label: 'Consommables',
    color: 'text-pink-600'
  },
  raw_materials: {
    icon: Package,
    label: 'Matières premières',
    color: 'text-indigo-600'
  }
}
export function StockAlert({
  className,
  level,
  items,
  onReorder,
  onViewDetails,
  onAdjustThreshold,
  onContactSupplier,
  showActions = true
}: StockAlertProps) {
  const config = levelConfig[level]
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0)
  const outOfStockCount = items.filter(item => item.currentQuantity === 0).length
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }
  const getStockLevelIndicator = (item: StockItem) => {
    if (item.currentQuantity === 0) {
      return { color: 'bg-red-500', label: 'Rupture' }
    }
    if (item.currentQuantity <= item.minimumThreshold) {
      return { color: 'bg-red-400', label: 'Critique' }
    }
    if (item.currentQuantity <= item.reorderPoint) {
      return { color: 'bg-orange-400', label: 'Faible' }
    }
    return { color: 'bg-yellow-400', label: 'Attention' }
  }
  const getDaysLeftColor = (days: number) => {
    if (days <= 0) return 'text-red-600 font-bold'
    if (days <= 3) return 'text-red-600 font-medium'
    if (days <= 7) return 'text-orange-600 font-medium'
    if (days <= 14) return 'text-yellow-600'
    return 'text-gray-600'
  }
  const getUrgencyIcon = (item: StockItem) => {
    if (item.currentQuantity === 0) return <AlertTriangle className="h-4 w-4 text-red-600" />
    if (item.daysOfStockLeft <= 3) return <Clock className="h-4 w-4 text-red-600" />
    if (item.daysOfStockLeft <= 7) return <TrendingDown className="h-4 w-4 text-orange-600" />
    return null
  }
  return (
    <div className={cn(
      'rounded-lg border p-4',
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <Package className={cn('h-5 w-5 mt-0.5', config.iconColor)} />
        <div className="flex-1 space-y-4">
          <div>
            <h3 className={cn('font-medium', config.textColor)}>
              {config.title}
            </h3>
            <p className={cn('text-sm mt-1', config.textColor)}>
              {items.length} article{items.length > 1 ? 's' : ''} nécessite{items.length === 1 ? '' : 'nt'} une attention • 
              Valeur totale: {formatCurrency(totalValue)}
              {outOfStockCount > 0 && (
                <span className="ml-2 font-medium">• {outOfStockCount} en rupture</span>
              )}
            </p>
          </div>
          <div className="space-y-3">
            {items.map((item) => {
              const CategoryIcon = categoryConfig[item.category].icon
              const stockIndicator = getStockLevelIndicator(item)
              const urgencyIcon = getUrgencyIcon(item)
              return (
                <div key={item.id} className="bg-white/50 rounded-lg p-4 border border-white/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <CategoryIcon className={cn('h-5 w-5 mt-0.5', categoryConfig[item.category].color)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                          <span className="text-xs font-mono text-gray-500">({item.sku})</span>
                          <span className={cn('w-3 h-3 rounded-full', stockIndicator.color)} title={stockIndicator.label} />
                          {urgencyIcon}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Stock actuel:</span>
                            <span className={cn('ml-2 font-medium', 
                              item.currentQuantity === 0 ? 'text-red-600' : 
                              item.currentQuantity <= item.minimumThreshold ? 'text-orange-600' : 'text-gray-900'
                            )}>
                              {item.currentQuantity} {item.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Seuil minimum:</span>
                            <span className="ml-2">{item.minimumThreshold} {item.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Point de commande:</span>
                            <span className="ml-2">{item.reorderPoint} {item.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Jours restants:</span>
                            <span className={cn('ml-2', getDaysLeftColor(item.daysOfStockLeft))}>
                              {item.daysOfStockLeft <= 0 ? 'Épuisé' : `${Math.round(item.daysOfStockLeft)} jours`}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Utilisation/jour:</span>
                            <span className="ml-2">{item.averageDailyUsage} {item.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Valeur stock:</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.totalValue)}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded p-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-500">Fournisseur:</span>
                              <span className="ml-2 font-medium">{item.supplier}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Catégorie:</span>
                              <span className={cn('ml-2', categoryConfig[item.category].color)}>
                                {categoryConfig[item.category].label}
                              </span>
                            </div>
                            {item.pendingOrders > 0 && (
                              <div>
                                <span className="text-gray-500">Commandes en cours:</span>
                                <span className="ml-2 font-medium text-blue-600">
                                  {item.pendingOrders} {item.unit}
                                </span>
                              </div>
                            )}
                            {item.expectedDeliveryDate && (
                              <div>
                                <span className="text-gray-500">Livraison prévue:</span>
                                <span className="ml-2 text-blue-600">
                                  {formatDate(item.expectedDeliveryDate)}
                                </span>
                              </div>
                            )}
                            {item.lastReorderDate && (
                              <div>
                                <span className="text-gray-500">Dernière commande:</span>
                                <span className="ml-2">{formatDate(item.lastReorderDate)}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Coût unitaire:</span>
                              <span className="ml-2">{formatCurrency(item.unitCost)}</span>
                            </div>
                          </div>
                        </div>
                        {/* Reorder Recommendation */}
                        {item.currentQuantity <= item.reorderPoint && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <ShoppingCart className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Recommandation de commande</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              Quantité recommandée: {Math.ceil((item.reorderPoint + item.averageDailyUsage * 30) - item.currentQuantity)} {item.unit}
                              <br />
                              Coût estimé: {formatCurrency(Math.ceil((item.reorderPoint + item.averageDailyUsage * 30) - item.currentQuantity) * item.unitCost)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {showActions && (
                      <div className="flex flex-col gap-1">
                        {onReorder && (
                          <button
                            onClick={() => onReorder(item.id)}
                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Commander
                          </button>
                        )}
                        {onContactSupplier && (
                          <button
                            onClick={() => onContactSupplier(item.supplier)}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Contact fournisseur
                          </button>
                        )}
                        {onAdjustThreshold && (
                          <button
                            onClick={() => onAdjustThreshold(item.id)}
                            className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                          >
                            Ajuster seuil
                          </button>
                        )}
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(item.id)}
                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Détails
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {/* Summary Actions */}
          {showActions && items.length > 1 && (
            <div className="bg-white/70 rounded-lg p-3 border border-white/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">
                  Actions rapides:
                </span>
                <div className="flex gap-2">
                  <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Commander tout
                  </button>
                  <button className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                    Exporter la liste
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
