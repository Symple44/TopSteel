'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
} from '@erp/ui'
import type { ColumnConfig } from '@erp/ui/components/data-display/datatable/types'
import { Edit, Eye, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

// Type de données pour le test
interface TestData extends Record<string, unknown> {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  salary: number
  department: string
}

// Données de test
const generateTestData = (count: number): TestData[] => {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']
  const roles = ['Manager', 'Developer', 'Designer', 'Analyst', 'Consultant']
  const statuses: ('active' | 'inactive' | 'pending')[] = ['active', 'inactive', 'pending']

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[Math.floor(Math.random() * roles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    salary: Math.floor(Math.random() * 100000) + 30000,
    department: departments[Math.floor(Math.random() * departments.length)],
  }))
}

export default function TestDataTablePage() {
  const [data, setData] = useState<TestData[]>(generateTestData(100))
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())

  // Configuration des colonnes
  const columns: ColumnConfig<TestData>[] = [
    {
      id: 'name',
      key: 'name',
      title: 'Name',
      type: 'text',
      sortable: true,
      searchable: true,
      width: 200,
    },
    {
      id: 'email',
      key: 'email',
      title: 'Email',
      type: 'text',
      sortable: true,
      searchable: true,
      width: 250,
    },
    {
      id: 'role',
      key: 'role',
      title: 'Role',
      type: 'text',
      sortable: true,
      searchable: true,
      width: 150,
    },
    {
      id: 'department',
      key: 'department',
      title: 'Department',
      type: 'select',
      sortable: true,
      searchable: true,
      width: 150,
      options: [
        { value: 'Engineering', label: 'Engineering' },
        { value: 'Sales', label: 'Sales' },
        { value: 'Marketing', label: 'Marketing' },
        { value: 'HR', label: 'HR' },
        { value: 'Finance', label: 'Finance' },
      ],
    },
    {
      id: 'salary',
      key: 'salary',
      title: 'Salary',
      type: 'number',
      sortable: true,
      width: 120,
      format: {
        currency: 'USD',
        decimals: 0,
      },
      render: (_value: unknown, row: TestData, _column: ColumnConfig<TestData>) => (
        <span className="font-medium">${row.salary.toLocaleString()}</span>
      ),
    },
    {
      id: 'status',
      key: 'status',
      title: 'Status',
      type: 'select',
      sortable: true,
      searchable: true,
      width: 120,
      options: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'red' },
        { value: 'pending', label: 'Pending', color: 'yellow' },
      ],
      render: (_value: unknown, row: TestData, _column: ColumnConfig<TestData>) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800'
              : row.status === 'inactive'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: 'createdAt',
      key: 'createdAt',
      title: 'Created',
      type: 'date',
      sortable: true,
      width: 150,
      render: (_value: unknown, row: TestData, _column: ColumnConfig<TestData>) =>
        new Date(row.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      key: 'actions',
      title: 'Actions',
      type: 'custom',
      width: 150,
      locked: true,
      render: (_value: unknown, row: TestData, _column: ColumnConfig<TestData>) => (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => {}}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => {}}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setData((prev) => prev.filter((item) => item.id !== row.id))
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const handleAddNew = () => {
    const newItem: TestData = {
      id: `user-${data.length + 1}`,
      name: `New User ${data.length + 1}`,
      email: `newuser${data.length + 1}@example.com`,
      role: 'Developer',
      status: 'pending',
      createdAt: new Date().toISOString(),
      salary: 50000,
      department: 'Engineering',
    }
    setData([newItem, ...data])
  }

  const handleCellEdit = (row: TestData, column: ColumnConfig<TestData>, value: unknown) => {
    setData((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, [column.key]: value } : item))
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>DataTable Test Page</CardTitle>
          <CardDescription>Testing all DataTable features with {data.length} rows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{data.length}</div>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {data.filter((d) => d.status === 'active').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    ${(data.reduce((sum, d) => sum + d.salary, 0) / data.length).toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Average Salary</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{selectedRows.size}</div>
                  <p className="text-xs text-muted-foreground">Selected</p>
                </CardContent>
              </Card>
            </div>

            {/* DataTable */}
            <DataTable
              data={data}
              columns={columns}
              keyField="id"
              // Features
              sortable={true}
              filterable={true}
              searchable={true}
              selectable={true}
              editable={true}
              exportable={true}
              pagination={{
                page: 1,
                pageSize: 10,
                total: data.length,
                pageSizeOptions: [5, 10, 20, 50, 100],
              }}
              // Appearance
              title="Test Data"
              striped={true}
              bordered={true}
              hoverable={true}
              height="600px"
              // Actions
              actions={[
                {
                  label: 'Add New',
                  icon: <Plus className="h-4 w-4" />,
                  onClick: handleAddNew,
                },
              ]}
              // Callbacks
              onCellEdit={handleCellEdit}
              onSelectionChange={(selection) => {
                setSelectedRows(selection.selectedRows)
              }}
              onRowClick={(_row) => {}}
              onRowDoubleClick={(_row) => {}}
              onAddNew={handleAddNew}
              // Settings persistence
              tableId="test-datatable"
            />

            {/* Selected rows info */}
            {selectedRows.size > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium">Selected {selectedRows.size} row(s):</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {Array.from(selectedRows).join(', ')}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setData((prev) => prev.filter((item) => !selectedRows.has(String(item.id))))
                        setSelectedRows(new Set())
                      }}
                    >
                      Delete Selected
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRows(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
