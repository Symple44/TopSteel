'use client'
import React, { useState, useEffect } from 'react'
import { cn } from '../../../../lib/utils'
import { Card } from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import { Label } from '../../../forms/label/Label'
import { Select } from '../../../primitives/select/select'
import { Calculator, Scale, Package } from 'lucide-react'
interface MaterialDensity {
  name: string
  density: number // kg/m³
  category: string
}
interface DimensionSet {
  length: number
  width: number
  thickness: number
  quantity: number
}
interface WeightResult {
  volume: number // m³
  weight: number // kg
  totalWeight: number // kg including quantity
  cost?: number
}
interface WeightCalculatorProps {
  className?: string
  materials?: MaterialDensity[]
  defaultMaterial?: string
  pricePerKg?: number
  onCalculate?: (result: WeightResult) => void
}
const defaultMaterials: MaterialDensity[] = [
  { name: 'Steel (Carbon)', density: 7850, category: 'Steel' },
  { name: 'Steel (Stainless 316)', density: 8000, category: 'Steel' },
  { name: 'Steel (Stainless 304)', density: 7930, category: 'Steel' },
  { name: 'Aluminum 6061', density: 2700, category: 'Aluminum' },
  { name: 'Aluminum 7075', density: 2810, category: 'Aluminum' },
  { name: 'Copper', density: 8960, category: 'Copper' },
  { name: 'Brass', density: 8500, category: 'Copper Alloys' },
  { name: 'Bronze', density: 8800, category: 'Copper Alloys' },
  { name: 'Titanium', density: 4500, category: 'Titanium' },
  { name: 'Cast Iron', density: 7200, category: 'Iron' }
]
export function WeightCalculator({ 
  className, 
  materials = defaultMaterials,
  defaultMaterial,
  pricePerKg,
  onCalculate
}: WeightCalculatorProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDensity>(
    materials.find(m => m.name === defaultMaterial) || materials[0]
  )
  const [dimensions, setDimensions] = useState<DimensionSet>({
    length: 1000, // mm
    width: 1000,
    thickness: 10,
    quantity: 1
  })
  const [shape, setShape] = useState<'rectangle' | 'round' | 'tube'>('rectangle')
  const [tubeInnerDiameter, setTubeInnerDiameter] = useState(0)
  const [result, setResult] = useState<WeightResult | null>(null)
  const [unit, setUnit] = useState<'mm' | 'cm' | 'm'>('mm')
  const unitMultipliers = {
    mm: 0.001,
    cm: 0.01,
    m: 1
  }
  const calculateWeight = () => {
    const multiplier = unitMultipliers[unit]
    const length = dimensions.length * multiplier
    const width = dimensions.width * multiplier
    const thickness = dimensions.thickness * multiplier
    let volume = 0
    switch (shape) {
      case 'rectangle':
        volume = length * width * thickness
        break
      case 'round':
        // Treating length as diameter for round shapes
        const radius = length / 2
        volume = Math.PI * radius * radius * thickness
        break
      case 'tube':
        const outerRadius = length / 2
        const innerRadius = (tubeInnerDiameter * multiplier) / 2
        volume = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius) * thickness
        break
    }
    const weight = volume * selectedMaterial.density
    const totalWeight = weight * dimensions.quantity
    const cost = pricePerKg ? totalWeight * pricePerKg : undefined
    const newResult: WeightResult = {
      volume,
      weight,
      totalWeight,
      cost
    }
    setResult(newResult)
    onCalculate?.(newResult)
  }
  useEffect(() => {
    calculateWeight()
  }, [selectedMaterial, dimensions, shape, tubeInnerDiameter, unit])
  const formatWeight = (weight: number) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(2)} t`
    }
    return `${weight.toFixed(2)} kg`
  }
  const formatVolume = (volume: number) => {
    if (volume < 0.001) {
      return `${(volume * 1000000).toFixed(2)} cm³`
    }
    return `${volume.toFixed(6)} m³`
  }
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Weight Calculator</h3>
          </div>
          {result && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {formatWeight(result.totalWeight)}
              </div>
              <div className="text-xs text-muted-foreground">Total Weight</div>
            </div>
          )}
        </div>
        {/* Material Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Material</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Material Type</Label>
              <select
                value={selectedMaterial.name}
                onChange={(e) => {
                  const material = materials.find(m => m.name === e.target.value)
                  if (material) setSelectedMaterial(material)
                }}
                className="w-full h-9 px-3 border rounded text-sm"
              >
                {materials.map((material) => (
                  <option key={material.name} value={material.name}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Density</Label>
              <div className="h-9 px-3 border rounded bg-muted flex items-center text-sm">
                {selectedMaterial.density.toLocaleString()} kg/m³
              </div>
            </div>
          </div>
        </div>
        {/* Shape Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Shape</Label>
          <div className="flex gap-2">
            <Button
              onClick={() => setShape('rectangle')}
              size="sm"
              variant={shape === 'rectangle' ? 'default' : 'outline'}
            >
              Rectangle
            </Button>
            <Button
              onClick={() => setShape('round')}
              size="sm"
              variant={shape === 'round' ? 'default' : 'outline'}
            >
              Round
            </Button>
            <Button
              onClick={() => setShape('tube')}
              size="sm"
              variant={shape === 'tube' ? 'default' : 'outline'}
            >
              Tube
            </Button>
          </div>
        </div>
        {/* Dimensions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Dimensions</Label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'mm' | 'cm' | 'm')}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="m">m</option>
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">
                {shape === 'round' ? 'Diameter' : 'Length'} ({unit})
              </Label>
              <Input
                type="number"
                value={dimensions.length}
                onChange={(e) => setDimensions(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
            </div>
            {shape === 'rectangle' && (
              <div>
                <Label className="text-xs">Width ({unit})</Label>
                <Input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                  className="h-9"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">
                {shape === 'rectangle' ? 'Thickness' : 'Height'} ({unit})
              </Label>
              <Input
                type="number"
                value={dimensions.thickness}
                onChange={(e) => setDimensions(prev => ({ ...prev, thickness: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
            </div>
            {shape === 'tube' && (
              <div>
                <Label className="text-xs">Inner Diameter ({unit})</Label>
                <Input
                  type="number"
                  value={tubeInnerDiameter}
                  onChange={(e) => setTubeInnerDiameter(parseFloat(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                value={dimensions.quantity}
                onChange={(e) => setDimensions(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="h-9"
              />
            </div>
          </div>
        </div>
        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Calculation Results
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {formatVolume(result.volume)}
                </div>
                <div className="text-xs text-muted-foreground">Volume</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {formatWeight(result.weight)}
                </div>
                <div className="text-xs text-muted-foreground">Unit Weight</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {formatWeight(result.totalWeight)}
                </div>
                <div className="text-xs text-muted-foreground">Total Weight</div>
              </div>
              {result.cost && (
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    €{result.cost.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Estimated Cost</div>
                </div>
              )}
            </div>
            {/* Calculation Details */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Material: {selectedMaterial.name} ({selectedMaterial.density} kg/m³)</div>
              <div>Shape: {shape.charAt(0).toUpperCase() + shape.slice(1)}</div>
              <div>Quantity: {dimensions.quantity} piece{dimensions.quantity !== 1 ? 's' : ''}</div>
              {pricePerKg && (
                <div>Material cost: €{pricePerKg}/kg</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
