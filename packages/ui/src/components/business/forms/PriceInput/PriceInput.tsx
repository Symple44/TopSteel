'use client'
import {
  AlertCircle,
  Calculator,
  DollarSign,
  Euro,
  PoundSterling,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useUniqueId } from '../../../../hooks/useFormFieldIds'
import { cn } from '../../../../lib/utils'
import { safeMathEval } from '../../../../utils/safe-math-eval'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Popover, PopoverContent, PopoverTrigger } from '../../../primitives'
import { Button } from '../../../primitives/button/Button'
export interface PriceInputProps {
  value?: number
  onChange?: (value: number | undefined) => void
  onBlur?: () => void
  currency?: 'EUR' | 'USD' | 'GBP'
  min?: number
  max?: number
  step?: number
  precision?: number // decimal places
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  label?: string
  helperText?: string
  error?: string
  showCurrency?: boolean
  showCalculator?: boolean
  taxRate?: number // for showing price with tax
  showTaxIncluded?: boolean
  comparePrice?: number // for showing price comparison
  discountPercentage?: number
  marginPercentage?: number
  costPrice?: number // for margin calculation
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'ghost'
}
export function PriceInput({
  value,
  onChange,
  onBlur,
  currency = 'EUR',
  min = 0,
  max,
  step = 0.01,
  precision = 2,
  required = false,
  disabled = false,
  readOnly = false,
  placeholder = '0.00',
  label,
  helperText,
  error,
  showCurrency = true,
  showCalculator = false,
  taxRate = 20,
  showTaxIncluded = false,
  comparePrice,
  discountPercentage,
  marginPercentage,
  costPrice,
  className,
  size = 'md',
  variant = 'default',
}: PriceInputProps) {
  // Generate unique ID for the input
  const inputId = useUniqueId('price-input')

  const [inputValue, setInputValue] = useState<string>(
    value !== undefined ? value.toFixed(precision) : ''
  )
  const [isFocused, setIsFocused] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [calcExpression, setCalcExpression] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!isFocused && value !== undefined) {
      setInputValue(value.toFixed(precision))
    }
  }, [value, precision, isFocused])
  const getCurrencySymbol = () => {
    const symbols = {
      EUR: { symbol: '€', icon: <Euro className="h-4 w-4" /> },
      USD: { symbol: '$', icon: <DollarSign className="h-4 w-4" /> },
      GBP: { symbol: '£', icon: <PoundSterling className="h-4 w-4" /> },
    }
    return symbols[currency]
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Allow empty input
    if (newValue === '') {
      setInputValue('')
      onChange?.(undefined)
      return
    }
    // Validate numeric input
    const regex = new RegExp(`^\\d*\\.?\\d{0,${precision}}$`)
    if (regex.test(newValue)) {
      setInputValue(newValue)
      const numValue = parseFloat(newValue)
      if (!Number.isNaN(numValue)) {
        // Apply min/max constraints
        let constrainedValue = numValue
        if (min !== undefined && numValue < min) constrainedValue = min
        if (max !== undefined && numValue > max) constrainedValue = max
        onChange?.(constrainedValue)
      }
    }
  }
  const handleFocus = () => {
    setIsFocused(true)
    // Select all text on focus for easy replacement
    inputRef.current?.select()
  }
  const handleBlur = () => {
    setIsFocused(false)
    // Format the value on blur
    if (inputValue !== '') {
      const numValue = parseFloat(inputValue)
      if (!Number.isNaN(numValue)) {
        setInputValue(numValue.toFixed(precision))
      }
    }
    onBlur?.()
  }
  const handleCalculate = () => {
    try {
      // Safe mathematical expression evaluation
      const result = safeMathEval(calcExpression)
      if (!Number.isNaN(result)) {
        const constrainedValue = Math.max(min || 0, Math.min(max || Infinity, result))
        onChange?.(constrainedValue)
        setInputValue(constrainedValue.toFixed(precision))
        setCalcExpression('')
        setShowCalc(false)
      }
    } catch (_e) {
      // Invalid expression - silently ignore
    }
  }
  const getPriceWithTax = () => {
    if (value === undefined) return null
    return value * (1 + taxRate / 100)
  }
  const getDiscount = () => {
    if (value === undefined || !comparePrice) return null
    return comparePrice - value
  }
  const getDiscountPercentage = () => {
    if (value === undefined || !comparePrice) return null
    return ((comparePrice - value) / comparePrice) * 100
  }
  const getMargin = () => {
    if (value === undefined || !costPrice) return null
    return value - costPrice
  }
  const getMarginPercentage = () => {
    if (value === undefined || !costPrice) return null
    return ((value - costPrice) / value) * 100
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(amount)
  }
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg',
  }
  const variantClasses = {
    default: 'border bg-background',
    filled: 'bg-muted border-0',
    ghost: 'border-0 bg-transparent',
  }
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <div className="relative flex items-center">
          {showCurrency && (
            <div className="absolute left-3 text-muted-foreground">{getCurrencySymbol().icon}</div>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-md px-3 py-2 text-sm ring-offset-background transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              showCurrency && 'pl-10',
              showCalculator && 'pr-10',
              error && 'border-red-500 focus-visible:ring-red-500',
              sizeClasses[size],
              variantClasses[variant]
            )}
          />
          {showCalculator && (
            <Popover open={showCalc} onOpenChange={setShowCalc}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 h-7 w-7 p-0"
                  disabled={disabled || readOnly}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-2">
                  <Label>Expression de calcul</Label>
                  <input
                    type="text"
                    value={calcExpression}
                    onChange={(e) => setCalcExpression(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                    placeholder="Ex: 100 * 1.2"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                  <Button type="button" size="sm" onClick={handleCalculate} className="w-full">
                    Calculer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {/* Price calculations display */}
        <div className="mt-2 space-y-1">
          {showTaxIncluded && value !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">TTC ({taxRate}%)</span>
              <span className="font-medium">{formatCurrency(getPriceWithTax()!)}</span>
            </div>
          )}
          {comparePrice && value !== undefined && comparePrice !== value && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prix barré</span>
              <div className="flex items-center gap-2">
                <span className="line-through text-muted-foreground">
                  {formatCurrency(comparePrice)}
                </span>
                <Badge variant={getDiscount()! > 0 ? 'destructive' : 'default'} className="text-xs">
                  {getDiscount()! > 0 ? '-' : '+'}
                  {Math.abs(getDiscountPercentage()!).toFixed(0)}%
                </Badge>
              </div>
            </div>
          )}
          {discountPercentage !== undefined && value !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remise ({discountPercentage}%)</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(value * (discountPercentage / 100))}
              </span>
            </div>
          )}
          {costPrice !== undefined && value !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Marge</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-medium',
                    getMargin()! >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {formatCurrency(getMargin()!)}
                </span>
                <Badge variant={getMargin()! >= 0 ? 'default' : 'destructive'} className="text-xs">
                  {getMarginPercentage()?.toFixed(1)}%
                </Badge>
                {getMargin()! >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
