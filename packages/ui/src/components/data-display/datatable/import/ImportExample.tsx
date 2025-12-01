'use client'

/**
 * ImportExample Component
 * Demonstrates how to use the DataTable Import System
 */

import * as React from 'react'
import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '../../../primitives/button/Button'
import { ImportDialog } from './ImportDialog'
import { DataTable } from '../DataTable'
import type { ImportResult, ValidationSchema } from './types'
import type { ColumnConfig } from '../types'

// Example data type
interface User extends Record<string, unknown> {
  id: string
  name: string
  email: string
  age: number
  department: string
  status: 'active' | 'inactive' | 'pending'
  joinDate: string
}

export function ImportExample() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      department: 'Engineering',
      status: 'active',
      joinDate: '2023-01-15',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 28,
      department: 'Marketing',
      status: 'active',
      joinDate: '2023-03-20',
    },
  ])

  const [importOpen, setImportOpen] = useState(false)
  const [importStats, setImportStats] = useState<ImportResult['stats'] | null>(null)

  // Define table columns
  const columns: ColumnConfig<User>[] = [
    {
      id: 'name',
      key: 'name',
      title: 'Name',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      id: 'email',
      key: 'email',
      title: 'Email',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      id: 'age',
      key: 'age',
      title: 'Age',
      type: 'number',
      sortable: true,
      filterable: true,
    },
    {
      id: 'department',
      key: 'department',
      title: 'Department',
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      key: 'status',
      title: 'Status',
      type: 'select',
      sortable: true,
      filterable: true,
      options: [
        { value: 'active', label: 'Active', color: '#10b981' },
        { value: 'inactive', label: 'Inactive', color: '#6b7280' },
        { value: 'pending', label: 'Pending', color: '#f59e0b' },
      ],
    },
    {
      id: 'joinDate',
      key: 'joinDate',
      title: 'Join Date',
      type: 'date',
      sortable: true,
      filterable: true,
    },
  ]

  // Define validation schema
  const validationSchema: ValidationSchema = {
    name: {
      required: true,
      type: 'string',
      min: 2,
      max: 100,
      message: 'Name must be between 2 and 100 characters',
    },
    email: {
      required: true,
      type: 'email',
      message: 'Valid email address is required',
    },
    age: {
      type: 'number',
      min: 18,
      max: 100,
      message: 'Age must be between 18 and 100',
    },
    department: {
      type: 'string',
      required: false,
    },
    status: {
      enum: ['active', 'inactive', 'pending'],
      message: 'Status must be active, inactive, or pending',
    },
    joinDate: {
      type: 'date',
      required: false,
    },
  }

  // Handle import
  const handleImport = async (result: ImportResult<User>) => {
    console.log('Import result:', result)

    if (result.success) {
      // Generate IDs for new users
      const newUsers = result.data.map((user, index) => ({
        ...user,
        id: `imported-${Date.now()}-${index}`,
      }))

      // Add to existing users
      setUsers(prev => [...prev, ...newUsers])

      // Store stats
      setImportStats(result.stats)

      // Show success message
      alert(`Successfully imported ${result.stats.successfulRows} users!`)
    } else {
      // Show error message
      alert(`Import failed with ${result.errors.length} errors. Check console for details.`)
      console.error('Import errors:', result.errors)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Import users from CSV or Excel files
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)} leftIcon={<Upload className="h-4 w-4" />}>
          Import Users
        </Button>
      </div>

      {/* Import Stats */}
      {importStats && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-medium mb-2">Last Import</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Rows</p>
              <p className="text-lg font-semibold">{importStats.totalRows}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Successful</p>
              <p className="text-lg font-semibold text-success">{importStats.successfulRows}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="text-lg font-semibold text-destructive">{importStats.failedRows}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{importStats.duration.toFixed(0)}ms</p>
            </div>
          </div>
        </div>
      )}

      {/* DataTable */}
      <DataTable<User>
        data={users}
        columns={columns}
        keyField="id"
        sortable
        filterable
        searchable
        pagination={{
          page: 1,
          pageSize: 10,
          total: users.length,
        }}
        title="Users"
        emptyMessage="No users found. Import some data to get started!"
      />

      {/* Import Dialog */}
      <ImportDialog<User>
        open={importOpen}
        onOpenChange={setImportOpen}
        columns={columns}
        validationSchema={validationSchema}
        onImport={handleImport}
        title="Import Users"
        description="Upload a CSV or Excel file containing user data"
        allowedFormats={['csv', 'xlsx', 'xls']}
        maxFileSize={10 * 1024 * 1024} // 10MB
      />

      {/* Instructions */}
      <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
        <h3 className="font-medium">Import Instructions</h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Required Columns:</strong> name, email
          </p>
          <p>
            <strong>Optional Columns:</strong> age, department, status, joinDate
          </p>
          <p>
            <strong>Sample CSV Format:</strong>
          </p>
          <pre className="bg-background p-3 rounded-lg overflow-x-auto">
            {`name,email,age,department,status,joinDate
John Doe,john@example.com,30,Engineering,active,2023-01-15
Jane Smith,jane@example.com,28,Marketing,active,2023-03-20
Bob Johnson,bob@example.com,35,Sales,pending,2023-06-10`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default ImportExample
