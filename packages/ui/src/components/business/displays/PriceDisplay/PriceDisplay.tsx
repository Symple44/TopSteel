'use client'
import { Badge } from '../../../data-display/badge'
import { TrendingUp, TrendingDown, Minus, Tag, Percent } from 'lucide-react'
import { CurrencyDisplay } from '../CurrencyDisplay'
import { cn } from '../../../../lib/utils'
interface PriceDisplayProps {
  price: number
  originalPrice?: number
  currency?: 'EUR' | 'USD' | 'GBP'
  unit?: string
  discount?: {
    amount: number
    percentage: number
    type: 'percentage' | 'fixed'
  }
  priceChange?: {
    amount: number
    percentage: number
    period: string
  }
  showTrend?: boolean
  showDiscount?: boolean
  variant?: 'default' | 'large' | 'compact' | 'detailed'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function PriceDisplay({
  price,
  originalPrice,
  currency = 'EUR',
  unit,
  discount,
  priceChange,
  showTrend = true,
  showDiscount = true,
  variant = 'default',
  size = 'md',
  className,
}: PriceDisplayProps) {
  const hasDiscount = discount && discount.amount > 0
  const displayPrice = hasDiscount ? price - discount.amount : price
  const effectiveOriginalPrice = originalPrice || price
  const getTrendIcon = () => {
    if (!priceChange) return null
    if (priceChange.amount > 0) return TrendingUp
    if (priceChange.amount < 0) return TrendingDown
    return Minus
  }
  const getTrendColor = () => {
    if (!priceChange) return 'text-muted-foreground'
    if (priceChange.amount > 0) return 'text-red-600'
    if (priceChange.amount < 0) return 'text-green-600'
    return 'text-muted-foreground'
  }
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          price: 'text-lg',
          original: 'text-sm',
          discount: 'text-xs',
          unit: 'text-xs',
          trend: 'text-xs',
        }
      case 'lg':
        return {
          price: 'text-3xl',
          original: 'text-lg',
          discount: 'text-sm',
          unit: 'text-sm',
          trend: 'text-sm',
        }
      default:
        return {
          price: 'text-2xl',
          original: 'text-base',
          discount: 'text-sm',
          unit: 'text-sm',
          trend: 'text-sm',
        }
    }
  }
  const sizeConfig = getSizeClasses()
  const TrendIcon = getTrendIcon()
  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <CurrencyDisplay 
          amount={displayPrice} 
          currency={currency} 
          size={size}
        />
        {unit && (
          <span className={cn('text-muted-foreground', sizeConfig.unit)}>/{unit}</span>
        )}
        {hasDiscount && showDiscount && (
          <Badge variant="destructive" className="text-xs">
            -{discount.percentage}%
          </Badge>
        )}
      </div>
    )
  }
  if (variant === 'large') {
    return (
      <div className={cn('text-center space-y-2', className)}>
        <div className="space-y-1">
          <div className={cn('font-bold', sizeConfig.price)}>
            <CurrencyDisplay 
              amount={displayPrice} 
              currency={currency} 
              size={size}
            />
            {unit && (
              <span className={cn('text-muted-foreground ml-1', sizeConfig.unit)}>/{unit}</span>
            )}
          </div>
          {hasDiscount && showDiscount && (
            <div className="flex items-center justify-center gap-2">
              <span className={cn('line-through text-muted-foreground', sizeConfig.original)}>
                <CurrencyDisplay 
                  amount={effectiveOriginalPrice} 
                  currency={currency} 
                  variant="muted"
                />
              </span>
              <Badge variant="destructive" className="text-xs">
                <Percent className="h-3 w-3 mr-1" />
                -{discount.percentage}%
              </Badge>
            </div>
          )}
        </div>
        {showTrend && priceChange && TrendIcon && (
          <div className={cn('flex items-center justify-center gap-1', getTrendColor(), sizeConfig.trend)}>
            <TrendIcon className="h-4 w-4" />
            <span>
              {priceChange.amount > 0 ? '+' : ''}
              <CurrencyDisplay 
                amount={Math.abs(priceChange.amount)} 
                currency={currency} 
                size="sm"
              />
              ({priceChange.percentage > 0 ? '+' : ''}{priceChange.percentage.toFixed(1)}%)
            </span>
            <span className="text-muted-foreground">vs {priceChange.period}</span>
          </div>
        )}
      </div>
    )
  }
  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-3 p-4 border rounded-lg', className)}>
        <div className="flex items-center justify-between">
          <div>
            <div className={cn('font-semibold', sizeConfig.price)}>
              <CurrencyDisplay 
                amount={displayPrice} 
                currency={currency} 
                size={size}
              />
              {unit && (
                <span className={cn('text-muted-foreground ml-1', sizeConfig.unit)}>/{unit}</span>
              )}
            </div>
            {hasDiscount && showDiscount && (
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('line-through text-muted-foreground', sizeConfig.original)}>
                  <CurrencyDisplay 
                    amount={effectiveOriginalPrice} 
                    currency={currency} 
                    variant="muted"
                  />
                </span>
                <Badge variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  Économie: <CurrencyDisplay amount={discount.amount} currency={currency} size="sm" />
                </Badge>
              </div>
            )}
          </div>
          {hasDiscount && showDiscount && (
            <Badge variant="destructive">
              -{discount.percentage}%
            </Badge>
          )}
        </div>
        {showTrend && priceChange && TrendIcon && (
          <div className={cn('flex items-center gap-2 text-sm', getTrendColor())}>
            <TrendIcon className="h-4 w-4" />
            <span>
              {priceChange.amount > 0 ? 'Augmentation' : 'Diminution'} de{' '}
              <CurrencyDisplay 
                amount={Math.abs(priceChange.amount)} 
                currency={currency} 
                size="sm"
              />
              {' '}({Math.abs(priceChange.percentage).toFixed(1)}%) vs {priceChange.period}
            </span>
          </div>
        )}
      </div>
    )
  }
  // Default variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-baseline gap-1">
        <span className={cn('font-semibold', sizeConfig.price)}>
          <CurrencyDisplay 
            amount={displayPrice} 
            currency={currency} 
            size={size}
          />
        </span>
        {unit && (
          <span className={cn('text-muted-foreground', sizeConfig.unit)}>/{unit}</span>
        )}
      </div>
      {hasDiscount && showDiscount && (
        <div className="flex items-center gap-1">
          <span className={cn('line-through text-muted-foreground', sizeConfig.original)}>
            <CurrencyDisplay 
              amount={effectiveOriginalPrice} 
              currency={currency} 
              variant="muted"
              size="sm"
            />
          </span>
          <Badge variant="destructive" className="text-xs">
            -{discount.percentage}%
          </Badge>
        </div>
      )}
      {showTrend && priceChange && TrendIcon && (
        <div className={cn('flex items-center gap-1', getTrendColor(), sizeConfig.trend)}>
          <TrendIcon className="h-3 w-3" />
          <span>{priceChange.percentage > 0 ? '+' : ''}{priceChange.percentage.toFixed(1)}%</span>
        </div>
      )}
    </div>
  )
}
