'use client'
import React, { useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Card } from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
import { Progress } from '../../../primitives/progress'
import { Scissors, Maximize, TrendingUp, RotateCw, Trash2 } from 'lucide-react'
interface StockMaterial {
  id: string
  length: number
  width: number
  thickness: number
  quantity: number
  material: string
  cost: number
}
interface CutPiece {
  id: string
  length: number
  width: number
  thickness: number
  quantity: number
  priority: 'high' | 'medium' | 'low'
  label?: string
}
interface CuttingPattern {
  id: string
  stockId: string
  pieces: Array<{
    pieceId: string
    x: number
    y: number
    rotated: boolean
    quantity: number
  }>
  efficiency: number
  wasteArea: number
  totalArea: number
}
interface OptimizationResult {
  patterns: CuttingPattern[]
  totalEfficiency: number
  totalWaste: number
  materialUsed: number
  costSavings: number
}
interface CuttingOptimizerProps {
  className?: string
  stockMaterials?: StockMaterial[]
  pieces?: CutPiece[]
  onOptimize?: (result: OptimizationResult) => void
  autoOptimize?: boolean
}
export function CuttingOptimizer({ 
  className, 
  stockMaterials = [],
  pieces = [],
  onOptimize,
  autoOptimize = false
}: CuttingOptimizerProps) {
  const [stock, setStock] = useState<StockMaterial[]>(stockMaterials)
  const [cutPieces, setCutPieces] = useState<CutPiece[]>(pieces)
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [sawKerf, setSawKerf] = useState(3) // mm kerf width
  const [allowRotation, setAllowRotation] = useState(true)
  const addStockMaterial = () => {
    const newStock: StockMaterial = {
      id: `stock-${Date.now()}`,
      length: 6000,
      width: 2000,
      thickness: 10,
      quantity: 1,
      material: 'Steel Sheet',
      cost: 500
    }
    setStock([...stock, newStock])
  }
  const updateStock = (id: string, field: keyof StockMaterial, value: any) => {
    setStock(stock.map(s => s.id === id ? { ...s, [field]: value } : s))
  }
  const removeStock = (id: string) => {
    setStock(stock.filter(s => s.id !== id))
  }
  const addPiece = () => {
    const newPiece: CutPiece = {
      id: `piece-${Date.now()}`,
      length: 1000,
      width: 500,
      thickness: 10,
      quantity: 1,
      priority: 'medium',
      label: `Piece ${cutPieces.length + 1}`
    }
    setCutPieces([...cutPieces, newPiece])
  }
  const updatePiece = (id: string, field: keyof CutPiece, value: any) => {
    setCutPieces(cutPieces.map(p => p.id === id ? { ...p, [field]: value } : p))
  }
  const removePiece = (id: string) => {
    setCutPieces(cutPieces.filter(p => p.id !== id))
  }
  const runOptimization = async () => {
    setOptimizing(true)
    try {
      // Simulate optimization algorithm
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Mock optimization result
      const mockResult: OptimizationResult = {
        patterns: stock.slice(0, Math.min(stock.length, 3)).map((s, index) => ({
          id: `pattern-${index}`,
          stockId: s.id,
          pieces: cutPieces.slice(0, 3).map((p, i) => ({
            pieceId: p.id,
            x: (i % 2) * (s.width / 2),
            y: Math.floor(i / 2) * (s.length / 3),
            rotated: allowRotation && Math.random() > 0.5,
            quantity: Math.min(p.quantity, 2)
          })),
          efficiency: 75 + Math.random() * 20,
          wasteArea: s.length * s.width * (0.15 + Math.random() * 0.1),
          totalArea: s.length * s.width
        })),
        totalEfficiency: 82.5,
        totalWaste: 12.3,
        materialUsed: 87.7,
        costSavings: 234.50
      }
      setResult(mockResult)
      onOptimize?.(mockResult)
    } finally {
      setOptimizing(false)
    }
  }
  const getPriorityColor = (priority: CutPiece['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Cutting Optimizer</h3>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <div className="text-right mr-4">
                <div className="text-lg font-bold text-green-600">
                  {result.totalEfficiency.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Efficiency</div>
              </div>
            )}
            <Button 
              onClick={runOptimization} 
              disabled={optimizing || stock.length === 0 || cutPieces.length === 0}
              className="gap-2"
            >
              {optimizing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Maximize className="w-4 h-4" />
                  Optimize
                </>
              )}
            </Button>
          </div>
        </div>
        {/* Settings */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <Label className="text-xs">Saw Kerf (mm)</Label>
            <Input
              type="number"
              value={sawKerf}
              onChange={(e) => setSawKerf(parseFloat(e.target.value) || 0)}
              className="h-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowRotation"
              checked={allowRotation}
              onChange={(e) => setAllowRotation(e.target.checked)}
            />
            <Label htmlFor="allowRotation" className="text-xs">Allow piece rotation</Label>
          </div>
        </div>
        {/* Stock Materials */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Stock Materials</h4>
            <Button onClick={addStockMaterial} size="sm" variant="outline">
              Add Stock
            </Button>
          </div>
          <div className="space-y-2">
            {stock.map((material) => (
              <div key={material.id} className="grid grid-cols-8 gap-2 p-3 border rounded-lg">
                <div>
                  <Label className="text-xs">Material</Label>
                  <Input
                    value={material.material}
                    onChange={(e) => updateStock(material.id, 'material', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Length (mm)</Label>
                  <Input
                    type="number"
                    value={material.length}
                    onChange={(e) => updateStock(material.id, 'length', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Width (mm)</Label>
                  <Input
                    type="number"
                    value={material.width}
                    onChange={(e) => updateStock(material.id, 'width', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Thickness</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={material.thickness}
                    onChange={(e) => updateStock(material.id, 'thickness', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={material.quantity}
                    onChange={(e) => updateStock(material.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={material.cost}
                    onChange={(e) => updateStock(material.id, 'cost', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex items-center">
                  <div className="text-xs text-center">
                    <div className="font-medium">{(material.length * material.width / 1000000).toFixed(2)}</div>
                    <div className="text-muted-foreground">m²</div>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => removeStock(material.id)}
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Cut Pieces */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Pieces to Cut</h4>
            <Button onClick={addPiece} size="sm" variant="outline">
              Add Piece
            </Button>
          </div>
          <div className="space-y-2">
            {cutPieces.map((piece) => (
              <div key={piece.id} className="grid grid-cols-8 gap-2 p-3 border rounded-lg">
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={piece.label || ''}
                    onChange={(e) => updatePiece(piece.id, 'label', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Length (mm)</Label>
                  <Input
                    type="number"
                    value={piece.length}
                    onChange={(e) => updatePiece(piece.id, 'length', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Width (mm)</Label>
                  <Input
                    type="number"
                    value={piece.width}
                    onChange={(e) => updatePiece(piece.id, 'width', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Thickness</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={piece.thickness}
                    onChange={(e) => updatePiece(piece.id, 'thickness', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={piece.quantity}
                    onChange={(e) => updatePiece(piece.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Priority</Label>
                  <select
                    value={piece.priority}
                    onChange={(e) => updatePiece(piece.id, 'priority', e.target.value as CutPiece['priority'])}
                    className="h-8 px-2 border rounded text-xs"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex items-center justify-center">
                  <div className={cn("w-4 h-4 rounded-full", getPriorityColor(piece.priority))} />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => removePiece(piece.id)}
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Optimization Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Optimization Results
            </h4>
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {result.totalEfficiency.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Material Efficiency</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">
                  {result.totalWaste.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Waste</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {result.patterns.length}
                </div>
                <div className="text-xs text-muted-foreground">Cutting Patterns</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  €{result.costSavings.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Cost Savings</div>
              </div>
            </div>
            {/* Cutting Patterns */}
            <div className="space-y-3">
              <h5 className="font-medium">Cutting Patterns</h5>
              {result.patterns.map((pattern, index) => {
                const stockMaterial = stock.find(s => s.id === pattern.stockId)
                return (
                  <div key={pattern.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h6 className="font-medium">Pattern {index + 1}</h6>
                        <p className="text-xs text-muted-foreground">
                          {stockMaterial?.material} - {stockMaterial?.length}x{stockMaterial?.width}mm
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {pattern.efficiency.toFixed(1)}% efficient
                        </Badge>
                      </div>
                    </div>
                    <Progress value={pattern.efficiency} className="h-2 mb-2" />
                    <div className="text-xs text-muted-foreground">
                      {pattern.pieces.length} pieces • 
                      Waste: {((pattern.wasteArea / pattern.totalArea) * 100).toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
