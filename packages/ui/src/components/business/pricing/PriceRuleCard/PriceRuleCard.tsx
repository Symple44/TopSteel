'use client'
import {
  Activity,
  Box,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  DollarSign,
  Edit,
  Hash,
  MoreHorizontal,
  Package,
  Percent,
  Power,
  Ruler,
  Trash2,
  Users,
  Weight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'
import {
  DropdownItem,
  DropdownPortal,
  DropdownSeparator,
} from '../../../primitives/dropdown-portal'
import { SimpleTooltip } from '../../../primitives/tooltip'
export enum AdjustmentType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FIXED_PRICE = 'FIXED_PRICE',
  PRICE_PER_WEIGHT = 'PRICE_PER_WEIGHT',
  PRICE_PER_LENGTH = 'PRICE_PER_LENGTH',
  PRICE_PER_SURFACE = 'PRICE_PER_SURFACE',
  PRICE_PER_VOLUME = 'PRICE_PER_VOLUME',
  FORMULA = 'FORMULA',
}
export enum PriceRuleChannel {
  ALL = 'ALL',
  ERP = 'ERP',
  MARKETPLACE = 'MARKETPLACE',
  B2B = 'B2B',
  API = 'API',
}
export interface PricingCondition {
  type:
    | 'customer_group'
    | 'customer_email'
    | 'customer_code'
    | 'quantity'
    | 'date_range'
    | 'article_reference'
    | 'article_family'
    | 'order_total'
    | 'custom'
  operator:
    | 'equals'
    | 'not_equals'
    | 'in'
    | 'not_in'
    | 'between'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'starts_with'
    | 'ends_with'
    | 'after'
    | 'before'
  value: string | number | string[] | { from: string | number; to: string | number }
  field?: string
}
export interface PriceRule {
  id: string
  ruleName: string
  description?: string
  channel: PriceRuleChannel
  articleId?: string
  articleFamily?: string
  adjustmentType: AdjustmentType
  adjustmentValue: number
  adjustmentUnit?: string
  formula?: string
  conditions: PricingCondition[]
  priority: number
  combinable: boolean
  isActive: boolean
  validFrom?: Date | string
  validUntil?: Date | string
  usageLimit?: number
  usageLimitPerCustomer?: number
  usageCount: number
  customerGroup?: string
  customerGroups?: string[]
  minQuantity?: number
  maxQuantity?: number
  metadata?: {
    createdBy?: string
    lastModifiedBy?: string
    lastModifiedAt?: string
    notes?: string
    [key: string]: string | undefined
  }
}
export interface PriceRuleCardProps {
  rule: PriceRule
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
  onEdit?: (rule: PriceRule) => void
  onDelete?: (rule: PriceRule) => void
  onToggle?: (rule: PriceRule) => void
  onDuplicate?: (rule: PriceRule) => void
  onPreview?: (rule: PriceRule) => void
  showActions?: boolean
  expandable?: boolean
  selected?: boolean
  onSelect?: (rule: PriceRule) => void
}
const getAdjustmentIcon = (type: AdjustmentType) => {
  switch (type) {
    case AdjustmentType.PERCENTAGE:
      return <Percent className="w-4 h-4" />
    case AdjustmentType.FIXED_AMOUNT:
    case AdjustmentType.FIXED_PRICE:
      return <DollarSign className="w-4 h-4" />
    case AdjustmentType.PRICE_PER_WEIGHT:
      return <Weight className="w-4 h-4" />
    case AdjustmentType.PRICE_PER_LENGTH:
      return <Ruler className="w-4 h-4" />
    case AdjustmentType.PRICE_PER_SURFACE:
      return <Box className="w-4 h-4" />
    case AdjustmentType.PRICE_PER_VOLUME:
      return <Package className="w-4 h-4" />
    case AdjustmentType.FORMULA:
      return <Calculator className="w-4 h-4" />
    default:
      return <Activity className="w-4 h-4" />
  }
}
const getAdjustmentLabel = (type: AdjustmentType) => {
  switch (type) {
    case AdjustmentType.PERCENTAGE:
      return 'Pourcentage'
    case AdjustmentType.FIXED_AMOUNT:
      return 'Montant fixe'
    case AdjustmentType.FIXED_PRICE:
      return 'Prix fixe'
    case AdjustmentType.PRICE_PER_WEIGHT:
      return 'Prix au poids'
    case AdjustmentType.PRICE_PER_LENGTH:
      return 'Prix à la longueur'
    case AdjustmentType.PRICE_PER_SURFACE:
      return 'Prix à la surface'
    case AdjustmentType.PRICE_PER_VOLUME:
      return 'Prix au volume'
    case AdjustmentType.FORMULA:
      return 'Formule'
    default:
      return type
  }
}
const formatAdjustmentValue = (rule: PriceRule) => {
  const { adjustmentType, adjustmentValue, adjustmentUnit, formula } = rule
  if (adjustmentType === AdjustmentType.FORMULA) {
    return formula || 'Non définie'
  }
  if (adjustmentType === AdjustmentType.PERCENTAGE) {
    const sign = adjustmentValue >= 0 ? '+' : ''
    return `${sign}${adjustmentValue}%`
  }
  if (adjustmentUnit) {
    return `${adjustmentValue}€/${adjustmentUnit}`
  }
  const sign = adjustmentValue >= 0 && adjustmentType === AdjustmentType.FIXED_AMOUNT ? '+' : ''
  return `${sign}${adjustmentValue}€`
}
const getChannelColor = (channel: PriceRuleChannel) => {
  switch (channel) {
    case PriceRuleChannel.ALL:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    case PriceRuleChannel.ERP:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    case PriceRuleChannel.MARKETPLACE:
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    case PriceRuleChannel.B2B:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    case PriceRuleChannel.API:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}
export function PriceRuleCard({
  rule,
  className,
  variant = 'default',
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onPreview,
  showActions = true,
  expandable = true,
  selected = false,
  onSelect,
}: PriceRuleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const isExpired = rule.validUntil && new Date(rule.validUntil) < new Date()
  const isUpcoming = rule.validFrom && new Date(rule.validFrom) > new Date()
  const isLimited = rule.usageLimit && rule.usageCount >= rule.usageLimit
  const statusColor = rule.isActive
    ? isExpired
      ? 'text-red-500'
      : isUpcoming
        ? 'text-orange-500'
        : isLimited
          ? 'text-yellow-500'
          : 'text-green-500'
    : 'text-gray-500'
  const statusText = rule.isActive
    ? isExpired
      ? 'Expirée'
      : isUpcoming
        ? 'À venir'
        : isLimited
          ? 'Limite atteinte'
          : 'Active'
    : 'Inactive'
  const renderCompactView = () => (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3 flex-1">
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(rule)}
            className="w-4 h-4 rounded border-gray-300"
            aria-label={`Sélectionner la règle ${rule.ruleName}`}
          />
        )}
        <div className="flex items-center gap-2">
          {getAdjustmentIcon(rule.adjustmentType)}
          <span className="font-medium">{rule.ruleName}</span>
        </div>
        <Badge variant="outline" className={cn('ml-2', getChannelColor(rule.channel))}>
          {rule.channel}
        </Badge>
        <span
          className={cn(
            'font-semibold ml-2',
            rule.adjustmentValue < 0 ? 'text-green-600' : 'text-gray-900'
          )}
        >
          {formatAdjustmentValue(rule)}
        </span>
        {rule.priority > 0 && (
          <Badge variant="outline" className="ml-2">
            <Hash className="w-3 h-3 mr-1" />
            {rule.priority}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <SimpleTooltip content={statusText}>
          <div className={cn('w-2 h-2 rounded-full', statusColor.replace('text-', 'bg-'))} />
        </SimpleTooltip>
        {showActions && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onToggle?.(rule)}>
            <Power className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'hover:shadow-md transition-shadow',
          className,
          selected && 'ring-2 ring-primary'
        )}
      >
        {renderCompactView()}
      </Card>
    )
  }
  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow',
        className,
        selected && 'ring-2 ring-primary'
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onSelect(rule)}
                  className="w-4 h-4 rounded border-gray-300"
                  aria-label={`Sélectionner la règle ${rule.ruleName}`}
                />
              )}
              <CardTitle className="flex items-center gap-2">
                {getAdjustmentIcon(rule.adjustmentType)}
                {rule.ruleName}
              </CardTitle>
              <SimpleTooltip content={statusText}>
                <div
                  className={cn('w-2 h-2 rounded-full ml-2', statusColor.replace('text-', 'bg-'))}
                />
              </SimpleTooltip>
            </div>
            {rule.description && variant === 'detailed' && (
              <CardDescription className="mt-2">{rule.description}</CardDescription>
            )}
          </div>
          {showActions && (
            <DropdownPortal
              open={dropdownOpen}
              onOpenChange={setDropdownOpen}
              trigger={
                <Button type="button" variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              }
            >
              <DropdownItem onClick={() => onEdit?.(rule)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </DropdownItem>
              <DropdownItem onClick={() => onDuplicate?.(rule)}>
                <Copy className="w-4 h-4 mr-2" />
                Dupliquer
              </DropdownItem>
              <DropdownItem onClick={() => onPreview?.(rule)}>
                <Activity className="w-4 h-4 mr-2" />
                Prévisualiser
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={() => onToggle?.(rule)}>
                <Power className="w-4 h-4 mr-2" />
                {rule.isActive ? 'Désactiver' : 'Activer'}
              </DropdownItem>
              <DropdownItem onClick={() => onDelete?.(rule)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownItem>
            </DropdownPortal>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className={getChannelColor(rule.channel)}>
            {rule.channel}
          </Badge>
          <Badge variant="outline">{getAdjustmentLabel(rule.adjustmentType)}</Badge>
          <Badge variant={rule.adjustmentValue < 0 ? 'secondary' : 'outline'}>
            {formatAdjustmentValue(rule)}
          </Badge>
          {rule.priority > 0 && <Badge variant="outline">Priorité: {rule.priority}</Badge>}
          {!rule.combinable && <Badge variant="destructive">Non combinable</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rule.conditions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conditions ({rule.conditions.length})</span>
                {expandable && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              {(expanded || variant === 'detailed') && (
                <div className="space-y-1">
                  {rule.conditions.map((condition, index) => (
                    <div key={index} className="text-sm text-muted-foreground pl-4">
                      • {condition.type} {condition.operator}{' '}
                      {typeof condition.value === 'object'
                        ? JSON.stringify(condition.value)
                        : String(condition.value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {(rule.articleFamily || rule.articleId) && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span>
                {rule.articleFamily
                  ? `Famille: ${rule.articleFamily}`
                  : rule.articleId
                    ? `Article spécifique`
                    : ''}
              </span>
            </div>
          )}
          {rule.customerGroups && rule.customerGroups.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Groupes: {rule.customerGroups.join(', ')}</span>
            </div>
          )}
          {(rule.validFrom || rule.validUntil) && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {rule.validFrom && `Du ${new Date(rule.validFrom).toLocaleDateString()}`}
                {rule.validFrom && rule.validUntil && ' '}
                {rule.validUntil && `au ${new Date(rule.validUntil).toLocaleDateString()}`}
              </span>
            </div>
          )}
          {(rule.usageLimit || rule.usageLimitPerCustomer) && (
            <div className="flex items-center gap-4 text-sm">
              {rule.usageLimit && (
                <span>
                  Utilisations: {rule.usageCount}/{rule.usageLimit}
                </span>
              )}
              {rule.usageLimitPerCustomer && <span>Max/client: {rule.usageLimitPerCustomer}</span>}
            </div>
          )}
        </div>
      </CardContent>
      {variant === 'detailed' && rule.metadata && (
        <CardFooter className="text-xs text-muted-foreground">
          {rule.metadata.createdBy && <span>Créé par {rule.metadata.createdBy}</span>}
          {rule.metadata.lastModifiedBy && (
            <span className="ml-4">Modifié par {rule.metadata.lastModifiedBy}</span>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
