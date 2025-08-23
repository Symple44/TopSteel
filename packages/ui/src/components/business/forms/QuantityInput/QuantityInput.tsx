'use client'
import { useState, useEffect, useRef } from 'react'
import { Minus, Plus, AlertCircle, Calculator, Package, Weight, Ruler } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { safeMathEval } from '../../../../utils/safe-math-eval'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Badge } from '../../../data-display/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
export interface QuantityInputProps {
  value?: number
  onChange?: (value: number | undefined) => void
  onBlur?: () => void
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
  unit?: string
  availableUnits?: Array<{
    value: string
    label: string
    icon?: React.ReactNode
    conversionFactor?: number // factor to convert to base unit
  }>
  onUnitChange?: (unit: string) => void
  showStepButtons?: boolean
  showCalculator?: boolean
  showInventoryInfo?: boolean
  availableStock?: number
  reservedStock?: number
  minStockWarning?: number
  maxStockWarning?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'ghost'
}
const DEFAULT_UNITS = [
  { value: 'pieces', label: 'Pièces', icon: <Package className="h-3 w-3" />, conversionFactor: 1 },
  { value: 'kg', label: 'Kilogrammes', icon: <Weight className="h-3 w-3" />, conversionFactor: 1 },
  { value: 'tons', label: 'Tonnes', icon: <Weight className="h-3 w-3" />, conversionFactor: 1000 },
  { value: 'm', label: 'Mètres', icon: <Ruler className="h-3 w-3" />, conversionFactor: 1 },
  { value: 'mm', label: 'Millimètres', icon: <Ruler className="h-3 w-3" />, conversionFactor: 0.001 },
  { value: 'm2', label: 'Mètres carrés', icon: <Ruler className="h-3 w-3" />, conversionFactor: 1 },
  { value: 'm3', label: 'Mètres cubes', icon: <Ruler className="h-3 w-3" />, conversionFactor: 1 },
]
export function QuantityInput({
  value,
  onChange,
  onBlur,
  min = 0,
  max,
  step = 1,
  precision = 2,
  required = false,
  disabled = false,
  readOnly = false,
  placeholder = '0',
  label,
  helperText,
  error,
  unit = 'pieces',
  availableUnits = DEFAULT_UNITS,
  onUnitChange,
  showStepButtons = true,
  showCalculator = false,
  showInventoryInfo = false,
  availableStock,
  reservedStock,
  minStockWarning,
  maxStockWarning,
  className,
  size = 'md',
  variant = 'default',
}: QuantityInputProps) {
  const [inputValue, setInputValue] = useState<string>(
    value !== undefined ? value.toFixed(precision) : ''
  )
  const [currentUnit, setCurrentUnit] = useState(unit)
  const [isFocused, setIsFocused] = useState(false)
  const [calcExpression, setCalcExpression] = useState('')
  const [showCalc, setShowCalc] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!isFocused && value !== undefined) {
      setInputValue(value.toFixed(precision))
    }
  }, [value, precision, isFocused])
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
      if (!isNaN(numValue)) {
        // Apply min/max constraints
        let constrainedValue = numValue
        if (min !== undefined && numValue < min) constrainedValue = min
        if (max !== undefined && numValue > max) constrainedValue = max
        onChange?.(constrainedValue)
      }
    }
  }
  const handleStepChange = (direction: 'up' | 'down') => {
    const currentValue = value || 0
    const newValue = direction === 'up' ? currentValue + step : currentValue - step
    let constrainedValue = newValue
    if (min !== undefined && newValue < min) constrainedValue = min
    if (max !== undefined && newValue > max) constrainedValue = max
    onChange?.(constrainedValue)
    setInputValue(constrainedValue.toFixed(precision))
  }
  const handleFocus = () => {
    setIsFocused(true)
    inputRef.current?.select()
  }
  const handleBlur = () => {
    setIsFocused(false)
    // Format the value on blur
    if (inputValue !== '') {
      const numValue = parseFloat(inputValue)
      if (!isNaN(numValue)) {
        setInputValue(numValue.toFixed(precision))
      }
    }
    onBlur?.()
  }
  const handleUnitChange = (newUnit: string) => {
    setCurrentUnit(newUnit)
    onUnitChange?.(newUnit)
  }
  const handleCalculate = () => {
    try {
      // Safe mathematical expression evaluation
      const result = safeMathEval(calcExpression)
      if (!isNaN(result) && isFinite(result)) {
        const constrainedValue = Math.max(min || 0, Math.min(max || Infinity, result))
        onChange?.(constrainedValue)
        setInputValue(constrainedValue.toFixed(precision))
        setCalcExpression('')
        setShowCalc(false)
      }
    } catch (e) {
      // Invalid expression - silently ignore
    }
  }
  const getSelectedUnit = () => {
    return availableUnits.find(u => u.value === currentUnit) || availableUnits[0]
  }
  const getStockStatus = () => {
    if (!availableStock) return null
    const usedStock = (reservedStock || 0) + (value || 0)
    const remainingStock = availableStock - usedStock
    if (remainingStock < 0) return 'exceeded'
    if (minStockWarning && remainingStock <= minStockWarning) return 'low'
    if (maxStockWarning && usedStock >= maxStockWarning) return 'high'
    return 'normal'
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
  const selectedUnit = getSelectedUnit()
  const stockStatus = getStockStatus()
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="quantity-input">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              id="quantity-input"
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
                showStepButtons && 'pr-16',
                error && 'border-red-500 focus-visible:ring-red-500',
                sizeClasses[size],
                variantClasses[variant]
              )}
            />
            {showStepButtons && (
              <div className="absolute right-1 flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={disabled || readOnly || (min !== undefined && (value || 0) <= min)}
                  onClick={() => handleStepChange('down')}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={disabled || readOnly || (max !== undefined && (value || 0) >= max)}
                  onClick={() => handleStepChange('up')}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Unit Selector */}
        {availableUnits.length > 1 && (
          <Select value={currentUnit} onValueChange={handleUnitChange} disabled={disabled}>
            <SelectTrigger className={cn('w-32', sizeClasses[size])}>
              <div className="flex items-center gap-2">
                {selectedUnit.icon}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableUnits.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  <div className="flex items-center gap-2">
                    {unit.icon}
                    <span>{unit.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {showCalculator && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn('h-7 w-7 p-0', sizeClasses[size])}
            disabled={disabled || readOnly}
            onClick={() => setShowCalc(!showCalc)}
          >
            <Calculator className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Calculator */}
      {showCalc && (
        <div className="mt-2 p-3 border rounded-md bg-muted/50">
          <div className="space-y-2">
            <Label className="text-xs">Expression de calcul</Label>
            <input
              type="text"
              value={calcExpression}
              onChange={(e) => setCalcExpression(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
              placeholder="Ex: 100 + 50 * 2"
              className="w-full rounded-md border px-3 py-1 text-sm"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCalculate}
              className="w-full"
            >
              Calculer
            </Button>
          </div>
        </div>
      )}
      {/* Stock Information */}
      {showInventoryInfo && availableStock !== undefined && (
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Stock disponible</span>
            <span className="font-medium">{availableStock} {selectedUnit.label.toLowerCase()}</span>
          </div>
          {reservedStock !== undefined && reservedStock > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stock réservé</span>
              <span className="font-medium">{reservedStock} {selectedUnit.label.toLowerCase()}</span>
            </div>
          )}
          {value !== undefined && value > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reste après commande</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'font-medium',
                  stockStatus === 'exceeded' ? 'text-red-600' : 
                  stockStatus === 'low' ? 'text-yellow-600' : 
                  'text-green-600'
                )}>
                  {availableStock - (reservedStock || 0) - value} {selectedUnit.label.toLowerCase()}
                </span>
                {stockStatus !== 'normal' && (
                  <Badge variant={
                    stockStatus === 'exceeded' ? 'destructive' : 
                    stockStatus === 'low' ? 'secondary' : 
                    'default'
                  } className="text-xs">
                    {stockStatus === 'exceeded' ? 'Stock insuffisant' :
                     stockStatus === 'low' ? 'Stock faible' :
                     'Stock élevé'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      )}
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
