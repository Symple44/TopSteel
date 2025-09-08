'use client'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { Progress } from '../../../primitives/progress'

interface ChemicalElement {
  symbol: string
  name: string
  percentage: number
  minPercentage?: number
  maxPercentage?: number
  unit?: string
  critical?: boolean
}
interface AlloyCompositionProps {
  className?: string
  alloyName?: string
  standard?: string
  elements: ChemicalElement[]
  totalPercentage?: number
  showChart?: boolean
  showLimits?: boolean
  onElementClick?: (element: ChemicalElement) => void
}
export function AlloyComposition({
  className,
  alloyName = 'Steel Alloy',
  standard,
  elements,
  totalPercentage,
  showChart = true,
  showLimits = false,
  onElementClick,
}: AlloyCompositionProps) {
  const total = totalPercentage || elements.reduce((sum, el) => sum + el.percentage, 0)
  const isValidComposition = Math.abs(total - 100) < 0.1
  const sortedElements = [...elements].sort((a, b) => b.percentage - a.percentage)
  const getElementColor = (element: ChemicalElement) => {
    if (element.critical) return 'bg-red-500'
    if (element.percentage > 10) return 'bg-blue-500'
    if (element.percentage > 1) return 'bg-green-500'
    return 'bg-gray-400'
  }
  const isOutOfSpec = (element: ChemicalElement) => {
    if (!element.minPercentage && !element.maxPercentage) return false
    const min = element.minPercentage || 0
    const max = element.maxPercentage || 100
    return element.percentage < min || element.percentage > max
  }
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{alloyName}</h3>
            {standard && <p className="text-sm text-muted-foreground">Standard: {standard}</p>}
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-sm font-medium',
                isValidComposition ? 'text-green-600' : 'text-red-600'
              )}
            >
              Total: {total.toFixed(2)}%
            </div>
            {!isValidComposition && <p className="text-xs text-red-500">Composition error</p>}
          </div>
        </div>
        {/* Elements List */}
        <div className="space-y-3">
          {sortedElements.map((element, _index) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: div has proper role and keyboard handlers when interactive
            <div
              key={element.symbol}
              className={cn(
                'p-3 rounded-lg border transition-colors',
                onElementClick && 'cursor-pointer hover:bg-muted/50',
                isOutOfSpec(element) && 'border-red-200 bg-red-50'
              )}
              role={onElementClick ? 'button' : undefined}
              tabIndex={onElementClick ? 0 : undefined}
              onClick={() => onElementClick?.(element)}
              onKeyDown={(e) => {
                if (onElementClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onElementClick(element)
                }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold',
                      getElementColor(element)
                    )}
                  >
                    {element.symbol}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{element.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {element.symbol}
                      {element.unit && ` (${element.unit})`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'font-semibold',
                      isOutOfSpec(element) ? 'text-red-600' : 'text-foreground'
                    )}
                  >
                    {element.percentage.toFixed(3)}%
                  </div>
                  {showLimits && (element.minPercentage || element.maxPercentage) && (
                    <div className="text-xs text-muted-foreground">
                      {element.minPercentage?.toFixed(2) || '0'} -{' '}
                      {element.maxPercentage?.toFixed(2) || '∞'}%
                    </div>
                  )}
                </div>
              </div>
              {showChart && (
                <div className="space-y-1">
                  <Progress
                    value={
                      (element.percentage / Math.max(...elements.map((e) => e.percentage))) * 100
                    }
                    className="h-2"
                  />
                  {showLimits && element.maxPercentage && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {element.minPercentage?.toFixed(2) || '0'}%</span>
                      <span>Max: {element.maxPercentage.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              )}
              {element.critical && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  Critical Element
                </Badge>
              )}
              {isOutOfSpec(element) && (
                <Badge variant="outline" className="mt-2 text-xs border-red-200 text-red-600">
                  Out of Specification
                </Badge>
              )}
            </div>
          ))}
        </div>
        {/* Summary */}
        {elements.length > 5 && (
          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span>Major Elements ({elements.filter((e) => e.percentage > 1).length})</span>
              <span>Trace Elements ({elements.filter((e) => e.percentage <= 1).length})</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
