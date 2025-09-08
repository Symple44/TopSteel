'use client'
import { Download, Eye, EyeOff, FileText, Grid, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import type React from 'react'
import { useRef, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'

interface CutPiece {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  color?: string
  rotated?: boolean
  priority?: 'high' | 'medium' | 'low'
}
interface CuttingPlan {
  id: string
  name: string
  stockMaterial: {
    width: number
    height: number
    thickness: number
    material: string
    grade?: string
  }
  pieces: CutPiece[]
  efficiency: number
  wastePercentage: number
  sawKerf: number
  scale?: number
  notes?: string
}
interface CuttingPlanViewerProps {
  className?: string
  plan: CuttingPlan
  editable?: boolean
  showGrid?: boolean
  showLabels?: boolean
  onPieceClick?: (piece: CutPiece) => void
  onPieceMove?: (pieceId: string, x: number, y: number) => void
}
export function CuttingPlanViewer({
  className,
  plan,
  editable = false,
  showGrid = true,
  showLabels = true,
  onPieceClick,
  onPieceMove,
}: CuttingPlanViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewSettings, setViewSettings] = useState({
    showGrid,
    showLabels,
    showDimensions: true,
    showWaste: true,
  })
  const maxDimension = Math.max(plan.stockMaterial.width, plan.stockMaterial.height)
  const viewBoxSize = 400
  const scale = (viewBoxSize / maxDimension) * zoom
  const scaledWidth = plan.stockMaterial.width * scale
  const scaledHeight = plan.stockMaterial.height * scale
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 5))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.2))
  const handleZoomReset = () => setZoom(1)
  const getPieceColor = (piece: CutPiece) => {
    if (piece.color) return piece.color
    switch (piece.priority) {
      case 'high':
        return '#ef4444'
      case 'medium':
        return '#f59e0b'
      case 'low':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }
  const getContrastColor = (backgroundColor: string) => {
    // Simple contrast calculation
    const r = parseInt(backgroundColor.slice(1, 3), 16)
    const g = parseInt(backgroundColor.slice(3, 5), 16)
    const b = parseInt(backgroundColor.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#000000' : '#ffffff'
  }
  const handlePieceMouseDown = (piece: CutPiece, event: React.MouseEvent) => {
    if (!editable) return
    setSelectedPiece(piece.id)
    setIsDragging(true)
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) {
      const x = (event.clientX - rect.left) / scale
      const y = (event.clientY - rect.top) / scale
      setDragOffset({
        x: x - piece.x,
        y: y - piece.y,
      })
    }
  }
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !selectedPiece || !editable) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) {
      const x = (event.clientX - rect.left) / scale - dragOffset.x
      const y = (event.clientY - rect.top) / scale - dragOffset.y
      onPieceMove?.(selectedPiece, x, y)
    }
  }
  const handleMouseUp = () => {
    setIsDragging(false)
    setSelectedPiece(null)
  }
  const handlePieceClick = (piece: CutPiece) => {
    onPieceClick?.(piece)
  }
  const generateGrid = () => {
    if (!viewSettings.showGrid) return null
    const gridSize = 100 // 100mm grid
    const lines = []
    // Vertical lines
    for (let x = 0; x <= plan.stockMaterial.width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x * scale}
          y1={0}
          x2={x * scale}
          y2={scaledHeight}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
      )
    }
    // Horizontal lines
    for (let y = 0; y <= plan.stockMaterial.height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y * scale}
          x2={scaledWidth}
          y2={y * scale}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
      )
    }
    return lines
  }
  const _calculateWasteAreas = () => {
    if (!viewSettings.showWaste) return []
    // Simple waste calculation - areas not covered by pieces
    const totalArea = plan.stockMaterial.width * plan.stockMaterial.height
    const usedArea = plan.pieces.reduce((sum, piece) => sum + piece.width * piece.height, 0)
    const wasteArea = totalArea - usedArea
    return [
      {
        area: wasteArea,
        percentage: (wasteArea / totalArea) * 100,
      },
    ]
  }
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {plan.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {plan.stockMaterial.material} - {plan.stockMaterial.width}×{plan.stockMaterial.height}
              ×{plan.stockMaterial.thickness}mm
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {plan.efficiency.toFixed(1)}% efficiency
            </Badge>
            <Badge variant="outline" className="text-xs">
              {plan.pieces.length} pieces
            </Badge>
          </div>
        </div>
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleZoomOut} size="sm" variant="outline">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs px-2">{(zoom * 100).toFixed(0)}%</span>
            <Button type="button" onClick={handleZoomIn} size="sm" variant="outline">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button type="button" onClick={handleZoomReset} size="sm" variant="outline">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setViewSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
              size="sm"
              variant={viewSettings.showGrid ? 'default' : 'outline'}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              onClick={() => setViewSettings((prev) => ({ ...prev, showLabels: !prev.showLabels }))}
              size="sm"
              variant={viewSettings.showLabels ? 'default' : 'outline'}
            >
              {viewSettings.showLabels ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button type="button" size="sm" variant="outline">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Cutting Plan Viewer */}
        <div className="border rounded-lg p-4 bg-white" style={{ minHeight: '400px' }}>
          <svg
            ref={svgRef}
            width="100%"
            height="400"
            viewBox={`0 0 ${scaledWidth} ${scaledHeight}`}
            className="border border-gray-300"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid */}
            {generateGrid()}
            {/* Stock material outline */}
            <rect
              x={0}
              y={0}
              width={scaledWidth}
              height={scaledHeight}
              fill="#f9fafb"
              stroke="#374151"
              strokeWidth={2}
            />
            {/* Cut pieces */}
            {plan.pieces.map((piece) => {
              const pieceColor = getPieceColor(piece)
              const textColor = getContrastColor(pieceColor)
              const isSelected = selectedPiece === piece.id
              return (
                <g key={piece.id}>
                  {/* Piece rectangle */}
                  <rect
                    x={piece.x * scale}
                    y={piece.y * scale}
                    width={piece.width * scale}
                    height={piece.height * scale}
                    fill={pieceColor}
                    fillOpacity={0.7}
                    stroke={isSelected ? '#3b82f6' : '#374151'}
                    strokeWidth={isSelected ? 2 : 1}
                    className={cn(
                      'transition-all duration-200',
                      editable && 'cursor-move hover:fill-opacity-80'
                    )}
                    // biome-ignore lint/a11y/useSemanticElements: SVG rect element must use role="button" for interactive behavior
                    role="button"
                    tabIndex={editable ? 0 : -1}
                    aria-label={`Piece ${piece.label}: ${piece.width}x${piece.height}mm`}
                    onMouseDown={(e) => handlePieceMouseDown(piece, e)}
                    onClick={() => handlePieceClick(piece)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handlePieceClick(piece)
                      }
                    }}
                  />
                  {/* Piece label */}
                  {viewSettings.showLabels && (
                    <text
                      x={(piece.x + piece.width / 2) * scale}
                      y={(piece.y + piece.height / 2) * scale}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.max(10, 12 * zoom)}
                      fill={textColor}
                      className="pointer-events-none font-medium"
                    >
                      {piece.label}
                    </text>
                  )}
                  {/* Dimensions */}
                  {viewSettings.showDimensions && zoom > 0.5 && (
                    <g>
                      <text
                        x={(piece.x + piece.width / 2) * scale}
                        y={(piece.y + piece.height + 15) * scale}
                        textAnchor="middle"
                        fontSize={Math.max(8, 10 * zoom)}
                        fill="#6b7280"
                        className="pointer-events-none"
                      >
                        {piece.width}×{piece.height}
                      </text>
                    </g>
                  )}
                  {/* Rotation indicator */}
                  {piece.rotated && (
                    <circle
                      cx={(piece.x + piece.width - 10) * scale}
                      cy={(piece.y + 10) * scale}
                      r={3 * zoom}
                      fill="#3b82f6"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              )
            })}
            {/* Stock dimensions */}
            <g>
              <text
                x={scaledWidth / 2}
                y={-10}
                textAnchor="middle"
                fontSize={12}
                fill="#374151"
                className="font-medium"
              >
                {plan.stockMaterial.width}mm
              </text>
              <text
                x={-20}
                y={scaledHeight / 2}
                textAnchor="middle"
                fontSize={12}
                fill="#374151"
                className="font-medium"
                transform={`rotate(-90, -20, ${scaledHeight / 2})`}
              >
                {plan.stockMaterial.height}mm
              </text>
            </g>
          </svg>
        </div>
        {/* Plan Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Material Information</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Material: {plan.stockMaterial.material}</div>
              {plan.stockMaterial.grade && <div>Grade: {plan.stockMaterial.grade}</div>}
              <div>Thickness: {plan.stockMaterial.thickness}mm</div>
              <div>Saw Kerf: {plan.sawKerf}mm</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Cutting Statistics</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Pieces: {plan.pieces.length}</div>
              <div>Efficiency: {plan.efficiency.toFixed(1)}%</div>
              <div>Waste: {plan.wastePercentage.toFixed(1)}%</div>
              <div>
                Total Area:{' '}
                {((plan.stockMaterial.width * plan.stockMaterial.height) / 1000000).toFixed(2)}m²
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Piece Priorities</h4>
            <div className="space-y-1">
              {['high', 'medium', 'low'].map((priority) => {
                const count = plan.pieces.filter((p) => p.priority === priority).length
                if (count === 0) return null
                return (
                  <div key={priority} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getPieceColor({ priority } as CutPiece) }}
                    />
                    <span className="capitalize">
                      {priority}: {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {plan.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-1">Notes</h4>
            <p className="text-xs text-muted-foreground">{plan.notes}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
