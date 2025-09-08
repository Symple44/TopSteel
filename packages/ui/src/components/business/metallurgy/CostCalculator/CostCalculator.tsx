'use client'
import { Calculator, DollarSign, Factory, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Label } from '../../../forms/label/Label'
import { Card } from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'

interface MaterialCost {
  material: string
  quantity: number
  unit: string
  unitPrice: number
  totalCost: number
  waste?: number // percentage
}
interface ProcessingCost {
  process: string
  description: string
  laborHours: number
  hourlyRate: number
  machineHours?: number
  machineRate?: number
  setupCost?: number
  totalCost: number
}
interface CostBreakdown {
  materials: MaterialCost[]
  processing: ProcessingCost[]
  overhead: {
    percentage: number
    amount: number
  }
  shipping?: {
    cost: number
    method: string
  }
  markup: {
    percentage: number
    amount: number
  }
  subtotal: number
  total: number
  currency: string
}
interface CostCalculatorProps {
  className?: string
  initialData?: Partial<CostBreakdown>
  onCalculate?: (breakdown: CostBreakdown) => void
  readOnly?: boolean
  currency?: string
}
export function CostCalculator({
  className,
  initialData,
  onCalculate,
  readOnly = false,
  currency = 'EUR',
}: CostCalculatorProps) {
  const [materials, setMaterials] = useState<MaterialCost[]>(initialData?.materials || [])
  const [processing, setProcessing] = useState<ProcessingCost[]>(initialData?.processing || [])
  const [overheadPercentage, setOverheadPercentage] = useState(
    initialData?.overhead?.percentage || 15
  )
  const [markupPercentage, setMarkupPercentage] = useState(initialData?.markup?.percentage || 20)
  const [shippingCost, setShippingCost] = useState(initialData?.shipping?.cost || 0)
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null)
  const addMaterial = () => {
    setMaterials([
      ...materials,
      {
        material: '',
        quantity: 0,
        unit: 'kg',
        unitPrice: 0,
        totalCost: 0,
        waste: 5,
      },
    ])
  }
  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }
  const updateMaterial = (index: number, field: keyof MaterialCost, value: any) => {
    const updated = [...materials]
    updated[index] = { ...updated[index], [field]: value }
    // Auto-calculate total cost
    if (field === 'quantity' || field === 'unitPrice' || field === 'waste') {
      const material = updated[index]
      const wasteMultiplier = 1 + (material.waste || 0) / 100
      updated[index].totalCost = material.quantity * material.unitPrice * wasteMultiplier
    }
    setMaterials(updated)
  }
  const addProcess = () => {
    setProcessing([
      ...processing,
      {
        process: '',
        description: '',
        laborHours: 0,
        hourlyRate: 25,
        machineHours: 0,
        machineRate: 50,
        setupCost: 0,
        totalCost: 0,
      },
    ])
  }
  const removeProcess = (index: number) => {
    setProcessing(processing.filter((_, i) => i !== index))
  }
  const updateProcess = (index: number, field: keyof ProcessingCost, value: any) => {
    const updated = [...processing]
    updated[index] = { ...updated[index], [field]: value }
    // Auto-calculate total cost
    if (['laborHours', 'hourlyRate', 'machineHours', 'machineRate', 'setupCost'].includes(field)) {
      const process = updated[index]
      const laborCost = process.laborHours * process.hourlyRate
      const machineCost = (process.machineHours || 0) * (process.machineRate || 0)
      updated[index].totalCost = laborCost + machineCost + (process.setupCost || 0)
    }
    setProcessing(updated)
  }
  const calculateBreakdown = useCallback(() => {
    const materialTotal = materials.reduce((sum, m) => sum + m.totalCost, 0)
    const processingTotal = processing.reduce((sum, p) => sum + p.totalCost, 0)
    const subtotal = materialTotal + processingTotal + shippingCost
    const overheadAmount = subtotal * (overheadPercentage / 100)
    const subtotalWithOverhead = subtotal + overheadAmount
    const markupAmount = subtotalWithOverhead * (markupPercentage / 100)
    const total = subtotalWithOverhead + markupAmount
    const newBreakdown: CostBreakdown = {
      materials,
      processing,
      overhead: {
        percentage: overheadPercentage,
        amount: overheadAmount,
      },
      shipping: {
        cost: shippingCost,
        method: 'Standard',
      },
      markup: {
        percentage: markupPercentage,
        amount: markupAmount,
      },
      subtotal,
      total,
      currency,
    }
    setBreakdown(newBreakdown)
    onCalculate?.(newBreakdown)
  }, [
    materials,
    processing,
    shippingCost,
    overheadPercentage,
    markupPercentage,
    currency,
    onCalculate,
  ])
  useEffect(() => {
    calculateBreakdown()
  }, [calculateBreakdown])
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Cost Calculator</h3>
          </div>
          {breakdown && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(breakdown.total)}
              </div>
              <div className="text-xs text-muted-foreground">Total Cost</div>
            </div>
          )}
        </div>
        {/* Materials Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Factory className="w-4 h-4" />
              Materials
            </h4>
            {!readOnly && (
              <Button type="button" onClick={addMaterial} size="sm" variant="outline">
                Add Material
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {materials.map((material, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                <div className="col-span-3">
                  <Label className="text-xs">Material</Label>
                  <Input
                    value={material.material}
                    onChange={(e) => updateMaterial(index, 'material', e.target.value)}
                    placeholder="Steel Grade"
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={material.quantity}
                    onChange={(e) =>
                      updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    value={material.unit}
                    onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={material.unitPrice}
                    onChange={(e) =>
                      updateMaterial(index, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Waste %</Label>
                  <Input
                    type="number"
                    value={material.waste}
                    onChange={(e) =>
                      updateMaterial(index, 'waste', parseFloat(e.target.value) || 0)
                    }
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Total</Label>
                  <div className="h-8 px-2 py-1 bg-muted rounded text-xs flex items-center">
                    {formatCurrency(material.totalCost)}
                  </div>
                </div>
                {!readOnly && (
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Processing Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Processing
            </h4>
            {!readOnly && (
              <Button type="button" onClick={addProcess} size="sm" variant="outline">
                Add Process
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {processing.map((process, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                <div className="col-span-3">
                  <Label className="text-xs">Process</Label>
                  <Input
                    value={process.process}
                    onChange={(e) => updateProcess(index, 'process', e.target.value)}
                    placeholder="Cutting, Welding..."
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Labor Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={process.laborHours}
                    onChange={(e) =>
                      updateProcess(index, 'laborHours', parseFloat(e.target.value) || 0)
                    }
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Rate/hr</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={process.hourlyRate}
                    onChange={(e) =>
                      updateProcess(index, 'hourlyRate', parseFloat(e.target.value) || 0)
                    }
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Machine Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={process.machineHours}
                    onChange={(e) =>
                      updateProcess(index, 'machineHours', parseFloat(e.target.value) || 0)
                    }
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Setup</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={process.setupCost}
                    onChange={(e) =>
                      updateProcess(index, 'setupCost', parseFloat(e.target.value) || 0)
                    }
                    disabled={readOnly}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Total</Label>
                  <div className="h-8 px-2 py-1 bg-muted rounded text-xs flex items-center">
                    {formatCurrency(process.totalCost)}
                  </div>
                </div>
                {!readOnly && (
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      onClick={() => removeProcess(index)}
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Settings */}
        {!readOnly && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Overhead %</Label>
              <Input
                type="number"
                step="0.1"
                value={overheadPercentage}
                onChange={(e) => setOverheadPercentage(parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Markup %</Label>
              <Input
                type="number"
                step="0.1"
                value={markupPercentage}
                onChange={(e) => setMarkupPercentage(parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Shipping Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
          </div>
        )}
        {/* Cost Breakdown */}
        {breakdown && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Cost Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Materials:</span>
                <span>
                  {formatCurrency(breakdown.materials.reduce((sum, m) => sum + m.totalCost, 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Processing:</span>
                <span>
                  {formatCurrency(breakdown.processing.reduce((sum, p) => sum + p.totalCost, 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatCurrency(breakdown.shipping?.cost || 0)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>{formatCurrency(breakdown.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overhead ({breakdown.overhead.percentage}%):</span>
                <span>{formatCurrency(breakdown.overhead.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Markup ({breakdown.markup.percentage}%):</span>
                <span>{formatCurrency(breakdown.markup.amount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(breakdown.total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
