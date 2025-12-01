/**
 * DataTable Preset System Examples
 * Demonstrates various ways to use the preset system
 */

import type { ColumnConfig } from '../types'
import { DataTable } from '../DataTable'
import { applyPreset, getRecommendedPreset, createCustomPreset } from './index'

// Sample data type
interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: Date
}

// Sample columns
const userColumns: ColumnConfig<User>[] = [
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
    id: 'role',
    key: 'role',
    title: 'Role',
    type: 'select',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'user', label: 'User' },
      { value: 'guest', label: 'Guest' },
    ],
  },
  {
    id: 'status',
    key: 'status',
    title: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    id: 'createdAt',
    key: 'createdAt',
    title: 'Created',
    type: 'date',
    sortable: true,
  },
]

// Sample data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: new Date('2024-03-10'),
  },
]

/**
 * Example 1: Basic Minimal Preset
 * Simple read-only table with no extra features
 */
export function MinimalExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Minimal Preset Example</h2>
      <p className="text-muted-foreground">
        Simple read-only table with no pagination, filters, or search
      </p>
      <DataTable preset="minimal" columns={userColumns} data={sampleUsers} />
    </div>
  )
}

/**
 * Example 2: Standard Preset
 * Typical CRUD table with basic features
 */
export function StandardExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Standard Preset Example</h2>
      <p className="text-muted-foreground">
        Typical admin table with pagination, search, and sorting
      </p>
      <DataTable
        preset="standard"
        title="User Management"
        columns={userColumns}
        data={sampleUsers}
      />
    </div>
  )
}

/**
 * Example 3: Advanced Preset
 * Full-featured table with filters and export
 */
export function AdvancedExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Advanced Preset Example</h2>
      <p className="text-muted-foreground">
        Advanced table with filters, selection, and export capabilities
      </p>
      <DataTable
        preset="advanced"
        title="User Analytics"
        columns={userColumns}
        data={sampleUsers}
        actions={[
          {
            label: 'View',
            onClick: (user) => console.log('View user:', user),
          },
          {
            label: 'Delete',
            onClick: (user) => console.log('Delete user:', user),
            variant: 'destructive',
          },
        ]}
      />
    </div>
  )
}

/**
 * Example 4: Full Preset
 * All features including editing
 */
export function FullExample() {
  const handleCellEdit = (row: User, column: ColumnConfig<User>, value: unknown) => {
    console.log('Cell edited:', { row, column, value })
  }

  const handleAddNew = () => {
    console.log('Add new user')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Full Preset Example</h2>
      <p className="text-muted-foreground">
        Complete spreadsheet-like interface with all features enabled
      </p>
      <DataTable
        preset="full"
        title="User Database"
        columns={userColumns}
        data={sampleUsers}
        onCellEdit={handleCellEdit}
        onAddNew={handleAddNew}
      />
    </div>
  )
}

/**
 * Example 5: Preset with Overrides
 * Using a preset as base and overriding specific features
 */
export function PresetWithOverridesExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Preset with Overrides Example</h2>
      <p className="text-muted-foreground">
        Standard preset with export enabled and compact layout
      </p>
      <DataTable
        preset="standard"
        // Override specific features
        exportable={true}
        compact={true}
        striped={false}
        title="Compact User List"
        columns={userColumns}
        data={sampleUsers}
      />
    </div>
  )
}

/**
 * Example 6: Programmatic Preset Selection
 * Choose preset based on use case
 */
export function ProgrammaticPresetExample() {
  // Get recommended preset for use case
  const preset = getRecommendedPreset('crud')

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Programmatic Preset Example</h2>
      <p className="text-muted-foreground">
        Preset automatically selected based on use case: {preset}
      </p>
      <DataTable preset={preset} title="Users" columns={userColumns} data={sampleUsers} />
    </div>
  )
}

/**
 * Example 7: Custom Preset Configuration
 * Create a custom preset by merging configurations
 */
export function CustomPresetExample() {
  // Create custom preset: minimal base with search and export
  const customConfig = createCustomPreset('minimal', {
    searchable: true,
    exportable: true,
    showSearch: true,
    showExport: true,
    hoverable: true,
  })

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Custom Preset Example</h2>
      <p className="text-muted-foreground">
        Custom preset: minimal with search and export added
      </p>
      <DataTable {...customConfig} title="Custom Table" columns={userColumns} data={sampleUsers} />
    </div>
  )
}

/**
 * Example 8: Apply Preset Directly
 * Spread preset config into DataTable
 */
export function ApplyPresetExample() {
  const config = applyPreset('advanced', {
    compact: true,
    striped: false,
  })

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Apply Preset Example</h2>
      <p className="text-muted-foreground">Advanced preset with custom overrides applied</p>
      <DataTable {...config} title="Advanced Table" columns={userColumns} data={sampleUsers} />
    </div>
  )
}

/**
 * Example 9: Side-by-Side Comparison
 * Compare different presets
 */
export function PresetComparisonExample() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Preset Comparison</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Minimal</h3>
          <DataTable preset="minimal" columns={userColumns} data={sampleUsers} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Standard</h3>
          <DataTable preset="standard" columns={userColumns} data={sampleUsers} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Advanced</h3>
          <DataTable preset="advanced" columns={userColumns} data={sampleUsers} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Full</h3>
          <DataTable preset="full" columns={userColumns} data={sampleUsers} />
        </div>
      </div>
    </div>
  )
}

/**
 * Example 10: All Examples Combined
 * Showcase all preset examples
 */
export function AllPresetsExample() {
  return (
    <div className="space-y-12 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">DataTable Preset System Examples</h1>
        <p className="text-muted-foreground">
          Explore different preset configurations and use cases
        </p>
      </div>

      <MinimalExample />
      <StandardExample />
      <AdvancedExample />
      <FullExample />
      <PresetWithOverridesExample />
      <ProgrammaticPresetExample />
      <CustomPresetExample />
      <ApplyPresetExample />
      <PresetComparisonExample />
    </div>
  )
}

export default AllPresetsExample
