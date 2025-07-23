'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Calculator } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CalculatedField {
  id?: string
  name: string
  label: string
  description?: string
  expression: string
  dataType: string
  isVisible: boolean
  displayOrder: number
  format?: any
  dependencies?: string[]
}

interface CalculatedFieldsEditorProps {
  fields: CalculatedField[]
  columns: any[]
  onFieldsChange: (fields: CalculatedField[]) => void
}

export function CalculatedFieldsEditor({
  fields,
  columns,
  onFieldsChange,
}: CalculatedFieldsEditorProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingField, setEditingField] = useState<CalculatedField | null>(null)
  const [formData, setFormData] = useState<Partial<CalculatedField>>({
    name: '',
    label: '',
    description: '',
    expression: '',
    dataType: 'number',
    isVisible: true,
  })

  const handleEdit = (field: CalculatedField) => {
    setEditingField(field)
    setFormData(field)
    setShowDialog(true)
  }

  const handleDelete = (index: number) => {
    onFieldsChange(fields.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!formData.name || !formData.label || !formData.expression) return

    const newField: CalculatedField = {
      ...formData as CalculatedField,
      displayOrder: editingField ? editingField.displayOrder : fields.length,
    }

    if (editingField) {
      const index = fields.findIndex(f => f === editingField)
      const newFields = [...fields]
      newFields[index] = newField
      onFieldsChange(newFields)
    } else {
      onFieldsChange([...fields, newField])
    }

    setShowDialog(false)
    setEditingField(null)
    setFormData({
      name: '',
      label: '',
      description: '',
      expression: '',
      dataType: 'number',
      isVisible: true,
    })
  }

  const handleInsertColumn = (columnAlias: string) => {
    setFormData({
      ...formData,
      expression: (formData.expression || '') + `[${columnAlias}]`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Calculated Fields</h3>
          <p className="text-sm text-muted-foreground">
            Create custom fields using expressions and formulas
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingField(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Calculated Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Edit' : 'Add'} Calculated Field
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="total_price"
                  />
                </div>
                <div>
                  <Label>Display Label</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Total Price"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <Label>Data Type</Label>
                <Select
                  value={formData.dataType}
                  onValueChange={(value) => setFormData({ ...formData, dataType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Expression</Label>
                <Textarea
                  value={formData.expression}
                  onChange={(e) => setFormData({ ...formData, expression: e.target.value })}
                  placeholder="[quantity] * [unit_price]"
                  rows={4}
                  className="font-mono"
                />
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Available columns (click to insert):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {columns.map((col) => (
                      <Badge
                        key={col.alias}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleInsertColumn(col.alias)}
                      >
                        {col.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingField ? 'Update' : 'Create'} Field
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {fields.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No calculated fields yet. Create one to add custom calculations.
              </p>
            </CardContent>
          </Card>
        ) : (
          fields.map((field, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{field.label}</h4>
                      <Badge variant="secondary">{field.name}</Badge>
                      <Badge variant="outline">{field.dataType}</Badge>
                    </div>
                    {field.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {field.description}
                      </p>
                    )}
                    <div className="bg-muted p-2 rounded text-sm font-mono">
                      {field.expression}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(field)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}