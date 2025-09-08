'use client'
import { CheckSquare, FileText, Square, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Card } from '../../../layout/card'
import { Button } from '../../../primitives/button/Button'
import { Progress } from '../../../primitives/progress'
import { Textarea } from '../../../primitives/textarea/Textarea'

interface ChecklistItem {
  id: string
  title: string
  description: string
  category: 'visual' | 'dimensional' | 'mechanical' | 'surface' | 'documentation' | 'safety'
  mandatory: boolean
  status: 'pending' | 'passed' | 'failed' | 'na'
  inspector?: string
  notes?: string
}
interface QualityControlChecklistProps {
  className?: string
  title?: string
  productName: string
  orderNumber: string
  items: ChecklistItem[]
  inspector?: string
  editable?: boolean
  onItemCheck?: (itemId: string, status: ChecklistItem['status'], notes?: string) => void
}
export function QualityControlChecklist({
  className,
  title = 'Quality Control Checklist',
  productName,
  orderNumber,
  items,
  inspector,
  editable = false,
  onItemCheck,
}: QualityControlChecklistProps) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed':
        return <CheckSquare className="w-5 h-5 text-green-600" />
      case 'failed':
        return <X className="w-5 h-5 text-red-600" />
      case 'na':
        return <Square className="w-5 h-5 text-gray-400" />
      default:
        return <Square className="w-5 h-5 text-gray-300" />
    }
  }
  const getStatusBadge = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed':
        return (
          <Badge variant="default" className="text-xs">
            Passed
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="text-xs">
            Failed
          </Badge>
        )
      case 'na':
        return (
          <Badge variant="secondary" className="text-xs">
            N/A
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Pending
          </Badge>
        )
    }
  }
  const handleStatusChange = (item: ChecklistItem, newStatus: ChecklistItem['status']) => {
    const itemNotes = notes[item.id] || ''
    onItemCheck?.(item.id, newStatus, itemNotes)
  }
  const getProgress = () => {
    const completed = items.filter((item) => item.status !== 'pending').length
    return (completed / items.length) * 100
  }
  const getResults = () => {
    const passed = items.filter((item) => item.status === 'passed').length
    const failed = items.filter((item) => item.status === 'failed').length
    const na = items.filter((item) => item.status === 'na').length
    const pending = items.filter((item) => item.status === 'pending').length
    return { passed, failed, na, pending }
  }
  const results = getResults()
  const progress = getProgress()
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {productName} • Order: {orderNumber}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{progress.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">
              {results.passed + results.failed + results.na}/{items.length} checked
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{results.passed}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{results.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-600">{results.na}</div>
            <div className="text-xs text-muted-foreground">N/A</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{results.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'border rounded-lg p-4 transition-colors',
                item.status === 'failed' && 'border-red-200 bg-red-50',
                item.status === 'passed' && 'border-green-200 bg-green-50',
                item.mandatory && 'border-l-4 border-l-blue-500'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm">{item.title}</h5>
                      {item.mandatory && (
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                          Required
                        </Badge>
                      )}
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                    {editable && (
                      <Textarea
                        placeholder="Add inspection notes..."
                        value={notes[item.id] || item.notes || ''}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="mt-2 h-16 text-xs"
                      />
                    )}
                  </div>
                </div>
                {editable && (
                  <div className="flex gap-1 ml-3">
                    <Button
                      type="button"
                      onClick={() => handleStatusChange(item, 'passed')}
                      size="sm"
                      variant={item.status === 'passed' ? 'default' : 'outline'}
                      className="h-8 px-2"
                    >
                      Pass
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleStatusChange(item, 'failed')}
                      size="sm"
                      variant={item.status === 'failed' ? 'destructive' : 'outline'}
                      className="h-8 px-2"
                    >
                      Fail
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleStatusChange(item, 'na')}
                      size="sm"
                      variant={item.status === 'na' ? 'secondary' : 'outline'}
                      className="h-8 px-2"
                    >
                      N/A
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
