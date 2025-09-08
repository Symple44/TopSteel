'use client'
import { DollarSign, Euro, JapaneseYen, PoundSterling } from 'lucide-react'
import { cn } from '../../../../lib/utils'
export type Currency = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD'
interface CurrencyDisplayProps {
  amount: number
  currency?: Currency
  locale?: string
  showSymbol?: boolean
  showIcon?: boolean
  precision?: number
  compact?: boolean
  variant?: 'default' | 'positive' | 'negative' | 'muted'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
export function CurrencyDisplay({
  amount,
  currency = 'EUR',
  locale = 'fr-FR',
  showSymbol = true,
  showIcon = false,
  precision,
  compact = false,
  variant = 'default',
  size = 'md',
  className,
}: CurrencyDisplayProps) {
  const getCurrencyIcon = (currency: Currency) => {
    switch (currency) {
      case 'EUR':
        return Euro
      case 'USD':
      case 'CAD':
      case 'AUD':
        return DollarSign
      case 'GBP':
        return PoundSterling
      case 'JPY':
        return JapaneseYen
      default:
        return DollarSign
    }
  }
  const formatCurrency = (amount: number, currency: Currency) => {
    if (compact && Math.abs(amount) >= 1000) {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      })
      return formatter.format(amount)
    }
    const options: Intl.NumberFormatOptions = {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? currency : undefined,
    }
    if (precision !== undefined) {
      options.minimumFractionDigits = precision
      options.maximumFractionDigits = precision
    }
    const formatter = new Intl.NumberFormat(locale, options)
    return formatter.format(amount)
  }
  const getVariantClasses = () => {
    switch (variant) {
      case 'positive':
        return 'text-green-600 dark:text-green-400'
      case 'negative':
        return 'text-red-600 dark:text-red-400'
      case 'muted':
        return 'text-muted-foreground'
      default:
        return 'text-foreground'
    }
  }
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-lg font-semibold'
      default:
        return 'text-base'
    }
  }
  const Icon = getCurrencyIcon(currency)
  const formattedAmount = formatCurrency(amount, currency)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium tabular-nums',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
      title={`${amount.toLocaleString(locale)} ${currency}`}
    >
      {showIcon && (
        <Icon className={cn(size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />
      )}
      {formattedAmount}
    </span>
  )
}
