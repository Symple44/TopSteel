'use client'
import { useState, useEffect, useMemo } from 'react'
import { Percent, AlertCircle, Calculator, Info, Euro, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Badge } from '../../../data-display/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
import { RadioGroup, RadioGroupItem } from '../../../primitives/radio-group'
export interface VatRate {
  value: number
  label: string
  description?: string
  code?: string // For accounting or administrative codes
  isDefault?: boolean
}
export interface VatInputProps {
  value?: number
  onChange?: (value: number | undefined) => void
  onBlur?: () => void
  baseAmount?: number // Amount before VAT
  vatRate?: number // VAT percentage
  onVatRateChange?: (rate: number) => void
  availableRates?: VatRate[]
  showCalculation?: boolean
  showBreakdown?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  label?: string
  helperText?: string
  error?: string
  currency?: 'EUR' | 'USD' | 'GBP'
  precision?: number
  displayMode?: 'inclusive' | 'exclusive' // Whether VAT is included or excluded from base amount
  allowCustomRate?: boolean
  minRate?: number
  maxRate?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'ghost'
}
const DEFAULT_VAT_RATES: VatRate[] = [
  { value: 20, label: '20% (Taux normal)', code: 'STD', isDefault: true, description: 'Taux normal en France' },
  { value: 10, label: '10% (Taux intermédiaire)', code: 'INT', description: 'Restauration, transport, hébergement' },
  { value: 5.5, label: '5,5% (Taux réduit)', code: 'RED', description: 'Produits de première nécessité' },
  { value: 2.1, label: '2,1% (Taux super-réduit)', code: 'SUP', description: 'Médicaments, presse' },
  { value: 0, label: '0% (Exonéré)', code: 'EXO', description: 'Exportations, services intracommunautaires' },
]
export function VatInput({
  value,
  onChange,
  onBlur,
  baseAmount = 0,
  vatRate = 20,
  onVatRateChange,
  availableRates = DEFAULT_VAT_RATES,
  showCalculation = true,
  showBreakdown = true,
  required = false,
  disabled = false,
  readOnly = false,
  placeholder = '0.00',
  label,
  helperText,
  error,
  currency = 'EUR',
  precision = 2,
  displayMode = 'exclusive',
  allowCustomRate = false,
  minRate = 0,
  maxRate = 100,
  className,
  size = 'md',
  variant = 'default',
}: VatInputProps) {
  const [inputValue, setInputValue] = useState<string>(
    value !== undefined ? value.toFixed(precision) : ''
  )
  const [customRate, setCustomRate] = useState<string>(vatRate.toString())
  const [selectedRateValue, setSelectedRateValue] = useState(vatRate)
  const [isCustomRateMode, setIsCustomRateMode] = useState(
    allowCustomRate && !availableRates.some(rate => rate.value === vatRate)
  )
  // Calculate VAT amounts
  const calculations = useMemo(() => {
    const rate = selectedRateValue
    const base = baseAmount || 0
    if (displayMode === 'inclusive') {
      // VAT is included in the base amount
      const vatAmount = (base * rate) / (100 + rate)
      const netAmount = base - vatAmount
      return {
        vatAmount,
        netAmount,
        grossAmount: base,
        rate
      }
    } else {
      // VAT is added to the base amount
      const vatAmount = (base * rate) / 100
      const grossAmount = base + vatAmount
      return {
        vatAmount,
        netAmount: base,
        grossAmount,
        rate
      }
    }
  }, [baseAmount, selectedRateValue, displayMode])
  useEffect(() => {
    if (showCalculation && onChange && calculations.vatAmount !== value) {
      onChange(calculations.vatAmount)
    }
  }, [calculations.vatAmount, onChange, showCalculation, value])
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value.toFixed(precision))
    }
  }, [value, precision])
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue === '') {
      setInputValue('')
      onChange?.(undefined)
      return
    }
    const regex = new RegExp(`^\\d*\\.?\\d{0,${precision}}$`)
    if (regex.test(newValue)) {
      setInputValue(newValue)
      const numValue = parseFloat(newValue)
      if (!isNaN(numValue)) {
        onChange?.(numValue)
      }
    }
  }
  const handleRateChange = (newRate: string) => {
    const rate = parseFloat(newRate)
    if (!isNaN(rate)) {
      setSelectedRateValue(rate)
      onVatRateChange?.(rate)
      // Check if it's a predefined rate
      const predefinedRate = availableRates.find(r => r.value === rate)
      if (predefinedRate) {
        setIsCustomRateMode(false)
      }
    }
  }
  const handleCustomRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = e.target.value
    setCustomRate(newRate)
    const rate = parseFloat(newRate)
    if (!isNaN(rate) && rate >= minRate && rate <= maxRate) {
      setSelectedRateValue(rate)
      onVatRateChange?.(rate)
    }
  }
  const toggleCustomRate = () => {
    setIsCustomRateMode(!isCustomRateMode)
    if (isCustomRateMode) {
      // Switch back to predefined rates
      const defaultRate = availableRates.find(r => r.isDefault) || availableRates[0]
      if (defaultRate) {
        handleRateChange(defaultRate.value.toString())
      }
    }
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
  const selectedRate = availableRates.find(r => r.value === selectedRateValue)
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="space-y-3">
        {/* VAT Rate Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Taux de TVA</Label>
          {!isCustomRateMode ? (
            <Select 
              value={selectedRateValue.toString()} 
              onValueChange={handleRateChange}
              disabled={disabled}
            >
              <SelectTrigger className={cn(sizeClasses[size])}>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableRates.map((rate) => (
                  <SelectItem key={rate.value} value={rate.value.toString()}>
                    <div className="flex flex-col">
                      <span>{rate.label}</span>
                      {rate.description && (
                        <span className="text-xs text-muted-foreground">{rate.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customRate}
                  onChange={handleCustomRateChange}
                  disabled={disabled}
                  readOnly={readOnly}
                  placeholder="20.0"
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-sm ring-offset-background transition-colors pr-8',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    sizeClasses[size],
                    variantClasses[variant]
                  )}
                />
                <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
          {allowCustomRate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleCustomRate}
              disabled={disabled}
              className="text-xs"
            >
              {isCustomRateMode ? 'Utiliser taux prédéfinis' : 'Taux personnalisé'}
            </Button>
          )}
        </div>
        {/* VAT Amount Input (if not using automatic calculation) */}
        {!showCalculation && (
          <div className="space-y-2">
            <Label htmlFor="vat-amount-input" className="text-sm font-medium">
              Montant TVA
            </Label>
            <div className="relative">
              <input
                id="vat-amount-input"
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={onBlur}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={placeholder}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-sm ring-offset-background transition-colors pl-8',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  error && 'border-red-500 focus-visible:ring-red-500',
                  sizeClasses[size],
                  variantClasses[variant]
                )}
              />
              <Euro className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
        {/* Calculation Breakdown */}
        {showBreakdown && baseAmount > 0 && (
          <div className="p-3 bg-muted/50 rounded-md space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4" />
              <span className="text-sm font-medium">Calcul TVA</span>
              {selectedRate && (
                <Badge variant="secondary" className="text-xs">
                  {selectedRate.code}
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {displayMode === 'inclusive' ? 'Montant TTC' : 'Montant HT'}
                </span>
                <span className="font-medium">
                  {formatCurrency(displayMode === 'inclusive' ? calculations.grossAmount : calculations.netAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  TVA ({selectedRateValue}%)
                </span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(calculations.vatAmount)}
                </span>
              </div>
              <div className="border-t pt-1 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {displayMode === 'inclusive' ? 'Montant HT' : 'Montant TTC'}
                  </span>
                  <span className="font-bold">
                    {formatCurrency(displayMode === 'inclusive' ? calculations.netAmount : calculations.grossAmount)}
                  </span>
                </div>
              </div>
            </div>
            {/* VAT Rate Info */}
            {selectedRate?.description && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded-md">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium">{selectedRate.label}</p>
                  <p>{selectedRate.description}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
