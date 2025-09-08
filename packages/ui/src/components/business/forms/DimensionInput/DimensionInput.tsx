'use client'
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowUpDown,
  Calculator,
  RotateCcw,
  Ruler,
  Weight,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../primitives/tooltip/Tooltip'
export interface DimensionValue {
  length?: number
  width?: number
  height?: number
  diameter?: number
  weight?: number
  thickness?: number
  unit: 'mm' | 'cm' | 'm' | 'inch' | 'ft'
  weightUnit: 'g' | 'kg' | 't' | 'lb' | 'oz'
}
export interface DimensionValidation {
  field: keyof DimensionValue
  isValid: boolean
  error?: string
  warning?: string
}
export interface DimensionCalculation {
  volume?: number
  surfaceArea?: number
  perimeter?: number
  estimatedWeight?: number
  materialUsage?: number
}
export type DimensionPreset = 'rectangular' | 'cylindrical' | 'square' | 'custom'
export type MaterialType = 'steel' | 'aluminum' | 'copper' | 'brass' | 'plastic' | 'other'
interface DimensionInputProps {
  value?: Partial<DimensionValue>
  onChange?: (value: Partial<DimensionValue>) => void
  onCalculate?: (dimensions: Partial<DimensionValue>) => DimensionCalculation
  onValidate?: (dimensions: Partial<DimensionValue>) => DimensionValidation[]
  preset?: DimensionPreset
  materialType?: MaterialType
  materialDensity?: number // kg/m³
  required?: boolean
  disabled?: boolean
  label?: string
  helperText?: string
  error?: string
  showCalculations?: boolean
  showPresets?: boolean
  showWeightEstimation?: boolean
  allowNegative?: boolean
  precision?: number
  minValues?: Partial<DimensionValue>
  maxValues?: Partial<DimensionValue>
  className?: string
}
export function DimensionInput({
  value = { unit: 'mm', weightUnit: 'kg' },
  onChange,
  onCalculate,
  onValidate,
  preset = 'rectangular',
  materialType = 'steel',
  materialDensity,
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  showCalculations = true,
  showPresets = true,
  showWeightEstimation = false,
  allowNegative = false,
  precision = 2,
  minValues,
  maxValues,
  className,
}: DimensionInputProps) {
  const [dimensions, setDimensions] = useState<Partial<DimensionValue>>(value)
  const [validations, setValidations] = useState<DimensionValidation[]>([])
  const [calculations, setCalculations] = useState<DimensionCalculation>({})
  const [currentPreset, setCurrentPreset] = useState<DimensionPreset>(preset)
  const [isCalculating, setIsCalculating] = useState(false)
  useEffect(() => {
    setDimensions(value)
  }, [value])
  useEffect(() => {
    if (onValidate) {
      const newValidations = onValidate(dimensions)
      setValidations(newValidations)
    }
  }, [dimensions, onValidate])
  // Material densities (kg/m³)
  const materialDensities = useMemo(
    () => ({
      steel: 7850,
      aluminum: 2700,
      copper: 8960,
      brass: 8500,
      plastic: 1200,
      other: materialDensity || 1000,
    }),
    [materialDensity]
  )

  const hasRequiredDimensions = useCallback(() => {
    switch (currentPreset) {
      case 'rectangular':
        return dimensions.length && dimensions.width && dimensions.height
      case 'cylindrical':
        return dimensions.diameter && dimensions.height
      case 'square':
        return dimensions.length && dimensions.height
      default:
        return dimensions.length || dimensions.width || dimensions.height || dimensions.diameter
    }
  }, [currentPreset, dimensions])

  const calculateDimensions = useCallback(
    (
      dims: Partial<DimensionValue>,
      presetType: DimensionPreset,
      matType: MaterialType,
      densities: Record<MaterialType, number>
    ): DimensionCalculation => {
      const { length = 0, width = 0, height = 0, diameter = 0, unit = 'mm' } = dims
      const density = densities[matType]
      // Convert to meters for calculations
      const unitMultipliers = { mm: 0.001, cm: 0.01, m: 1, inch: 0.0254, ft: 0.3048 }
      const multiplier = unitMultipliers[unit]
      const l = length * multiplier
      const w = width * multiplier
      const h = height * multiplier
      const d = diameter * multiplier
      let volume = 0
      let surfaceArea = 0
      let perimeter = 0
      switch (presetType) {
        case 'rectangular':
          volume = l * w * h
          surfaceArea = 2 * (l * w + l * h + w * h)
          perimeter = 4 * (l + w + h)
          break
        case 'cylindrical': {
          const radius = d / 2
          volume = Math.PI * radius * radius * h
          surfaceArea = 2 * Math.PI * radius * (radius + h)
          perimeter = 2 * Math.PI * radius + 2 * h
          break
        }
        case 'square':
          volume = l * l * h
          surfaceArea = 2 * l * l + 4 * l * h
          perimeter = 4 * l + 4 * h
          break
        default:
          if (l && w && h) {
            volume = l * w * h
            surfaceArea = 2 * (l * w + l * h + w * h)
          }
      }
      const estimatedWeight = volume * density // kg
      const materialUsage = volume * 1000 // liters
      return {
        volume: parseFloat(volume.toFixed(6)),
        surfaceArea: parseFloat(surfaceArea.toFixed(4)),
        perimeter: parseFloat(perimeter.toFixed(4)),
        estimatedWeight: parseFloat(estimatedWeight.toFixed(2)),
        materialUsage: parseFloat(materialUsage.toFixed(4)),
      }
    },
    []
  )

  const performCalculations = useCallback(async () => {
    if (!hasRequiredDimensions()) return
    setIsCalculating(true)
    try {
      if (onCalculate) {
        const result = onCalculate(dimensions)
        setCalculations(result)
      } else {
        // Default calculations
        const calcs = calculateDimensions(
          dimensions,
          currentPreset,
          materialType,
          materialDensities
        )
        setCalculations(calcs)
      }
    } catch (_error) {
    } finally {
      setIsCalculating(false)
    }
  }, [
    dimensions,
    currentPreset,
    materialType,
    onCalculate,
    calculateDimensions,
    hasRequiredDimensions,
    materialDensities,
  ])

  useEffect(() => {
    if (showCalculations && hasRequiredDimensions()) {
      performCalculations()
    }
  }, [showCalculations, hasRequiredDimensions, performCalculations])

  const handleDimensionChange = (field: keyof DimensionValue, newValue: string) => {
    const numericValue = parseFloat(newValue) || 0
    if (!allowNegative && numericValue < 0) return
    // Apply min/max validation
    if (minValues?.[field] && numericValue < Number(minValues[field]!)) return
    if (maxValues?.[field] && numericValue > Number(maxValues[field]!)) return
    const updatedDimensions = {
      ...dimensions,
      [field]: numericValue,
    }
    setDimensions(updatedDimensions)
    onChange?.(updatedDimensions)
  }
  const handleUnitChange = (field: 'unit' | 'weightUnit', newUnit: string) => {
    const updatedDimensions = {
      ...dimensions,
      [field]: newUnit,
    }
    setDimensions(updatedDimensions)
    onChange?.(updatedDimensions)
  }
  const handlePresetChange = (newPreset: DimensionPreset) => {
    setCurrentPreset(newPreset)
    // Reset dimensions that don't apply to the new preset
    const resetDimensions = { ...dimensions }
    if (newPreset === 'cylindrical') {
      delete resetDimensions.length
      delete resetDimensions.width
    } else if (newPreset === 'square') {
      delete resetDimensions.width
      delete resetDimensions.diameter
    } else if (newPreset === 'rectangular') {
      delete resetDimensions.diameter
    }
    setDimensions(resetDimensions)
    onChange?.(resetDimensions)
  }
  const handleReset = () => {
    const resetValue = { unit: dimensions.unit || 'mm', weightUnit: dimensions.weightUnit || 'kg' }
    setDimensions(resetValue)
    onChange?.(resetValue)
    setCalculations({})
  }
  const handleSwapDimensions = (field1: keyof DimensionValue, field2: keyof DimensionValue) => {
    const temp = dimensions[field1]
    const updatedDimensions = {
      ...dimensions,
      [field1]: dimensions[field2],
      [field2]: temp,
    }
    setDimensions(updatedDimensions)
    onChange?.(updatedDimensions)
  }
  const formatNumber = (value?: number) => {
    return value?.toFixed(precision) || '0'
  }
  const getFieldError = (field: keyof DimensionValue) => {
    return validations.find((v) => v.field === field && !v.isValid)?.error
  }
  const getFieldWarning = (field: keyof DimensionValue) => {
    return validations.find((v) => v.field === field)?.warning
  }
  const renderDimensionField = (
    field: keyof DimensionValue,
    icon: React.ReactNode,
    labelText: string,
    unitType: 'unit' | 'weightUnit' = 'unit'
  ) => {
    const fieldError = getFieldError(field)
    const fieldWarning = getFieldWarning(field)
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <Label htmlFor={`dimension-${field}`} className="text-sm">
            {labelText}
          </Label>
        </div>
        <div className="flex gap-2">
          <Input
            id={`dimension-${field}`}
            type="number"
            value={dimensions[field] || ''}
            onChange={(e) => handleDimensionChange(field, e.target.value)}
            placeholder="0"
            disabled={disabled}
            step={1 / 10 ** precision}
            min={allowNegative ? undefined : 0}
            className={cn(
              'flex-1',
              fieldError && 'border-red-500',
              fieldWarning && 'border-yellow-500'
            )}
          />
          <Select
            value={dimensions[unitType]}
            onValueChange={(value) => handleUnitChange(unitType, value)}
            disabled={disabled}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitType === 'unit' ? (
                <>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="inch">in</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="t">t</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                  <SelectItem value="oz">oz</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        {fieldError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {fieldError}
          </p>
        )}
        {fieldWarning && !fieldError && (
          <p className="text-xs text-yellow-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {fieldWarning}
          </p>
        )}
      </div>
    )
  }
  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex items-center gap-2">
            {showPresets && (
              <Select
                value={currentPreset}
                onValueChange={(value) => handlePresetChange(value as DimensionPreset)}
                disabled={disabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangular">Rectangle</SelectItem>
                  <SelectItem value="cylindrical">Cylindrique</SelectItem>
                  <SelectItem value="square">Carré</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={disabled}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Réinitialiser</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
      <div className="grid gap-4">
        {/* Dimension fields based on preset */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(currentPreset === 'rectangular' ||
            currentPreset === 'square' ||
            currentPreset === 'custom') && (
            <div>
              {renderDimensionField('length', <ArrowLeftRight className="h-4 w-4" />, 'Longueur')}
            </div>
          )}
          {(currentPreset === 'rectangular' || currentPreset === 'custom') && (
            <div>
              {renderDimensionField('width', <ArrowUpDown className="h-4 w-4" />, 'Largeur')}
              {currentPreset === 'rectangular' && dimensions.length && dimensions.width && (
                <div className="flex justify-center mt-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleSwapDimensions('length', 'width')}
                      >
                        ↔
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Échanger L↔l</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          )}
          {currentPreset === 'cylindrical' && (
            <div>{renderDimensionField('diameter', <Ruler className="h-4 w-4" />, 'Diamètre')}</div>
          )}
          {(currentPreset === 'rectangular' ||
            currentPreset === 'cylindrical' ||
            currentPreset === 'square' ||
            currentPreset === 'custom') && (
            <div>
              {renderDimensionField('height', <ArrowUpDown className="h-4 w-4" />, 'Hauteur')}
            </div>
          )}
          {currentPreset === 'custom' && (
            <>
              <div>
                {renderDimensionField('thickness', <Ruler className="h-4 w-4" />, 'Épaisseur')}
              </div>
              <div>
                {renderDimensionField(
                  'weight',
                  <Weight className="h-4 w-4" />,
                  'Poids',
                  'weightUnit'
                )}
              </div>
            </>
          )}
        </div>
        {/* Calculations */}
        {showCalculations && hasRequiredDimensions() && (
          <div className="p-4 bg-muted rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4" />
              <h4 className="text-sm font-medium">Calculs automatiques</h4>
              {isCalculating && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {calculations.volume && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Volume:</span>
                  <div className="font-mono font-medium">{calculations.volume.toFixed(6)} m³</div>
                </div>
              )}
              {calculations.surfaceArea && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Surface:</span>
                  <div className="font-mono font-medium">
                    {calculations.surfaceArea.toFixed(4)} m²
                  </div>
                </div>
              )}
              {calculations.perimeter && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Périmètre:</span>
                  <div className="font-mono font-medium">{calculations.perimeter.toFixed(4)} m</div>
                </div>
              )}
              {showWeightEstimation && calculations.estimatedWeight && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Poids estimé:</span>
                  <div className="font-mono font-medium">
                    {calculations.estimatedWeight.toFixed(2)} kg
                  </div>
                  <div className="text-xs text-muted-foreground">({materialType})</div>
                </div>
              )}
              {calculations.materialUsage && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Usage matériau:</span>
                  <div className="font-mono font-medium">
                    {calculations.materialUsage.toFixed(4)} L
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Current dimensions summary */}
        {(dimensions.length || dimensions.width || dimensions.height || dimensions.diameter) && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-mono">
              Preset: {currentPreset}
            </Badge>
            {dimensions.length && (
              <Badge variant="outline" className="font-mono">
                L: {formatNumber(dimensions.length)}
                {dimensions.unit}
              </Badge>
            )}
            {dimensions.width && (
              <Badge variant="outline" className="font-mono">
                l: {formatNumber(dimensions.width)}
                {dimensions.unit}
              </Badge>
            )}
            {dimensions.height && (
              <Badge variant="outline" className="font-mono">
                H: {formatNumber(dimensions.height)}
                {dimensions.unit}
              </Badge>
            )}
            {dimensions.diameter && (
              <Badge variant="outline" className="font-mono">
                Ø: {formatNumber(dimensions.diameter)}
                {dimensions.unit}
              </Badge>
            )}
            {dimensions.weight && (
              <Badge variant="outline" className="font-mono">
                Poids: {formatNumber(dimensions.weight)}
                {dimensions.weightUnit}
              </Badge>
            )}
          </div>
        )}
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
