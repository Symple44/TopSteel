# DataTable Preset System

The DataTable preset system provides predefined configurations for common table use cases, allowing you to quickly set up tables with appropriate features without manually configuring every prop.

## Available Presets

### 1. Minimal
**Use case**: Simple read-only data display, embedded tables

**Features**:
- ❌ No pagination
- ❌ No filters
- ❌ No search
- ❌ No column visibility toggle
- ❌ No export
- ❌ No selection
- ✅ Basic table display with striped rows

**Example**:
```tsx
<DataTable
  preset="minimal"
  columns={columns}
  data={data}
/>
```

### 2. Standard (Recommended for most use cases)
**Use case**: Typical CRUD tables, admin panels, user management

**Features**:
- ✅ Pagination
- ✅ Basic search
- ✅ Column sorting
- ✅ Column visibility toggle
- ✅ Hover effects
- ❌ No advanced filters
- ❌ No export
- ❌ No row selection

**Example**:
```tsx
<DataTable
  preset="standard"
  columns={columns}
  data={data}
  title="Users"
/>
```

### 3. Advanced
**Use case**: Data analysis, reporting, advanced admin panels

**Features**:
- ✅ All Standard features
- ✅ Advanced column filters
- ✅ Row selection
- ✅ Export to CSV/Excel/PDF
- ✅ Bulk actions
- ❌ No inline editing

**Example**:
```tsx
<DataTable
  preset="advanced"
  columns={columns}
  data={data}
  title="Sales Report"
  actions={[
    {
      label: 'Export Selected',
      onClick: (row) => exportRow(row),
    },
  ]}
/>
```

### 4. Full
**Use case**: Spreadsheet-like interfaces, complex data management

**Features**:
- ✅ All Advanced features
- ✅ Inline editing
- ✅ Drag & drop (when implemented)
- ✅ Add new rows
- ✅ Virtualization for performance
- ✅ All possible features enabled

**Example**:
```tsx
<DataTable
  preset="full"
  columns={columns}
  data={data}
  title="Product Inventory"
  onCellEdit={handleCellEdit}
  onAddNew={handleAddNew}
/>
```

## Using Presets with Overrides

You can use a preset as a base and override specific features:

```tsx
// Start with standard preset but enable export
<DataTable
  preset="standard"
  exportable={true}
  columns={columns}
  data={data}
/>

// Start with minimal but add search
<DataTable
  preset="minimal"
  searchable={true}
  columns={columns}
  data={data}
/>

// Start with advanced but disable row selection
<DataTable
  preset="advanced"
  selectable={false}
  columns={columns}
  data={data}
/>
```

## Programmatic Usage

### Get Recommended Preset

```tsx
import { getRecommendedPreset } from '@topsteel/ui'

const preset = getRecommendedPreset('crud') // Returns 'standard'
const preset = getRecommendedPreset('read-only') // Returns 'minimal'
const preset = getRecommendedPreset('data-analysis') // Returns 'advanced'
const preset = getRecommendedPreset('spreadsheet') // Returns 'full'
```

### Apply Preset Configuration

```tsx
import { applyPreset } from '@topsteel/ui'

// Get full preset config with custom overrides
const config = applyPreset('standard', {
  exportable: true,
  compact: true,
})

// Use config in your component
<DataTable {...config} columns={columns} data={data} />
```

### Create Custom Preset

```tsx
import { createCustomPreset } from '@topsteel/ui'

// Create a custom preset based on minimal with specific additions
const myCustomPreset = createCustomPreset('minimal', {
  searchable: true,
  exportable: true,
  showSearch: true,
  showExport: true,
})

<DataTable {...myCustomPreset} columns={columns} data={data} />
```

### Compare Presets

```tsx
import { comparePresets } from '@topsteel/ui'

// See differences between presets
const differences = comparePresets('standard', 'advanced')
console.log(differences)
// Output:
// {
//   filterable: { preset1: false, preset2: true },
//   selectable: { preset1: false, preset2: true },
//   exportable: { preset1: false, preset2: true },
//   ...
// }
```

### Check Features

```tsx
import { hasFeature, getEnabledFeatures } from '@topsteel/ui'

// Check if a preset has a specific feature
const canExport = hasFeature('advanced', 'exportable') // true
const canEdit = hasFeature('standard', 'editable') // false

// Get all enabled features
const features = getEnabledFeatures('advanced')
// Returns: ['sortable', 'searchable', 'filterable', 'selectable', 'exportable', ...]
```

## Preset Configuration Details

### Minimal Preset Configuration
```typescript
{
  sortable: false,
  searchable: false,
  filterable: false,
  editable: false,
  selectable: false,
  exportable: false,
  pagination: false,
  striped: true,
  bordered: true,
  hoverable: false,
  compact: false,
  showSearch: false,
  showFilters: false,
  showExport: false,
  showColumnToggle: false,
  showAddNew: false,
  showPagination: false,
  showSelection: false,
}
```

### Standard Preset Configuration
```typescript
{
  sortable: true,
  searchable: true,
  filterable: false,
  editable: false,
  selectable: false,
  exportable: false,
  pagination: true,
  striped: true,
  bordered: true,
  hoverable: true,
  compact: false,
  showSearch: true,
  showFilters: false,
  showExport: false,
  showColumnToggle: true,
  showAddNew: false,
  showPagination: true,
  showSelection: false,
  showSizeChanger: true,
  pageSizeOptions: [10, 25, 50, 100],
}
```

### Advanced Preset Configuration
```typescript
{
  sortable: true,
  searchable: true,
  filterable: true,
  editable: false,
  selectable: true,
  exportable: true,
  pagination: true,
  striped: true,
  bordered: true,
  hoverable: true,
  compact: false,
  showSearch: true,
  showFilters: true,
  showExport: true,
  showColumnToggle: true,
  showAddNew: false,
  showPagination: true,
  showSelection: true,
  showSizeChanger: true,
  pageSizeOptions: [10, 25, 50, 100, 250],
}
```

### Full Preset Configuration
```typescript
{
  sortable: true,
  searchable: true,
  filterable: true,
  editable: true,
  selectable: true,
  exportable: true,
  pagination: true,
  virtualize: true,
  virtualizeThreshold: 50,
  striped: true,
  bordered: true,
  hoverable: true,
  compact: false,
  showSearch: true,
  showFilters: true,
  showExport: true,
  showColumnToggle: true,
  showAddNew: true,
  showPagination: true,
  showSelection: true,
  showSizeChanger: true,
  pageSizeOptions: [10, 25, 50, 100, 250, 500],
}
```

## Best Practices

1. **Start with the appropriate preset** for your use case rather than manually configuring all props
2. **Override only what you need** - let the preset handle the rest
3. **Use `standard` for most CRUD operations** - it's the sweet spot for typical admin tables
4. **Use `minimal` for embedded tables** or when you just need to display data
5. **Use `advanced` when users need to analyze data** with filters and exports
6. **Use `full` only when you need spreadsheet-like functionality** with editing

## Migration Guide

### Before (Manual Configuration)
```tsx
<DataTable
  columns={columns}
  data={data}
  sortable={true}
  searchable={true}
  filterable={false}
  selectable={false}
  exportable={false}
  pagination={true}
  striped={true}
  bordered={true}
  hoverable={true}
/>
```

### After (Using Preset)
```tsx
<DataTable
  preset="standard"
  columns={columns}
  data={data}
/>
```

Much cleaner! The preset handles all the configuration for you.
