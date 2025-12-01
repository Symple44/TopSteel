# Migration Guide: Using DataTable Presets

This guide helps you migrate existing DataTable usage to the new preset system.

## Why Use Presets?

Before presets, configuring a DataTable required setting many props:

```tsx
// Old way - verbose and error-prone
<DataTable
  columns={columns}
  data={data}
  sortable={true}
  searchable={true}
  filterable={true}
  selectable={true}
  exportable={true}
  pagination={true}
  striped={true}
  bordered={true}
  hoverable={true}
  compact={false}
  // ... many more props
/>
```

With presets, you get the same configuration with one prop:

```tsx
// New way - clean and simple
<DataTable
  preset="advanced"
  columns={columns}
  data={data}
/>
```

## Migration Steps

### Step 1: Identify Your Use Case

Choose the preset that matches your current configuration:

- **Minimal**: Read-only tables with no features
- **Standard**: Basic CRUD tables (most common)
- **Advanced**: Tables with filters and export
- **Full**: Spreadsheet-like editing

### Step 2: Replace Props with Preset

#### Example 1: Simple Read-Only Table

**Before:**
```tsx
<DataTable
  columns={columns}
  data={data}
  sortable={false}
  searchable={false}
  filterable={false}
  selectable={false}
  exportable={false}
  pagination={false}
  striped={true}
  bordered={true}
/>
```

**After:**
```tsx
<DataTable
  preset="minimal"
  columns={columns}
  data={data}
/>
```

#### Example 2: Standard CRUD Table

**Before:**
```tsx
<DataTable
  columns={columns}
  data={data}
  sortable={true}
  searchable={true}
  pagination={true}
  striped={true}
  bordered={true}
  hoverable={true}
/>
```

**After:**
```tsx
<DataTable
  preset="standard"
  columns={columns}
  data={data}
/>
```

#### Example 3: Advanced Analytics Table

**Before:**
```tsx
<DataTable
  columns={columns}
  data={data}
  sortable={true}
  searchable={true}
  filterable={true}
  selectable={true}
  exportable={true}
  pagination={true}
  striped={true}
  bordered={true}
  hoverable={true}
/>
```

**After:**
```tsx
<DataTable
  preset="advanced"
  columns={columns}
  data={data}
/>
```

#### Example 4: Editable Spreadsheet

**Before:**
```tsx
<DataTable
  columns={columns}
  data={data}
  sortable={true}
  searchable={true}
  filterable={true}
  selectable={true}
  exportable={true}
  editable={true}
  pagination={true}
  virtualize={true}
  striped={true}
  bordered={true}
  hoverable={true}
  onCellEdit={handleEdit}
  onAddNew={handleAddNew}
/>
```

**After:**
```tsx
<DataTable
  preset="full"
  columns={columns}
  data={data}
  onCellEdit={handleEdit}
  onAddNew={handleAddNew}
/>
```

### Step 3: Handle Custom Configurations

If you have custom configurations that differ from presets, use overrides:

**Before:**
```tsx
<DataTable
  columns={columns}
  data={data}
  sortable={true}
  searchable={true}
  pagination={true}
  exportable={true}  // Custom: standard doesn't have this
  compact={true}     // Custom: different from default
  striped={false}    // Custom: different from default
/>
```

**After:**
```tsx
<DataTable
  preset="standard"
  columns={columns}
  data={data}
  // Only override what's different
  exportable={true}
  compact={true}
  striped={false}
/>
```

## Common Migration Patterns

### Pattern 1: User Management Tables

**Before:**
```tsx
function UserTable() {
  return (
    <DataTable
      title="Users"
      columns={userColumns}
      data={users}
      sortable={true}
      searchable={true}
      pagination={true}
      selectable={true}
      actions={[
        { label: 'Edit', onClick: handleEdit },
        { label: 'Delete', onClick: handleDelete },
      ]}
    />
  )
}
```

**After:**
```tsx
function UserTable() {
  return (
    <DataTable
      preset="standard"
      title="Users"
      columns={userColumns}
      data={users}
      selectable={true}  // Override: standard doesn't have selection
      actions={[
        { label: 'Edit', onClick: handleEdit },
        { label: 'Delete', onClick: handleDelete },
      ]}
    />
  )
}
```

### Pattern 2: Report Tables

**Before:**
```tsx
function ReportTable() {
  return (
    <DataTable
      title="Sales Report"
      columns={reportColumns}
      data={reportData}
      sortable={true}
      searchable={true}
      filterable={true}
      exportable={true}
      pagination={true}
    />
  )
}
```

**After:**
```tsx
function ReportTable() {
  return (
    <DataTable
      preset="advanced"
      title="Sales Report"
      columns={reportColumns}
      data={reportData}
    />
  )
}
```

### Pattern 3: Embedded Simple Tables

**Before:**
```tsx
function OrderItemsTable() {
  return (
    <DataTable
      columns={itemColumns}
      data={items}
      sortable={false}
      searchable={false}
      filterable={false}
      pagination={false}
      compact={true}
    />
  )
}
```

**After:**
```tsx
function OrderItemsTable() {
  return (
    <DataTable
      preset="minimal"
      columns={itemColumns}
      data={items}
      compact={true}
    />
  )
}
```

### Pattern 4: Data Entry Forms

**Before:**
```tsx
function ProductEditor() {
  return (
    <DataTable
      title="Products"
      columns={productColumns}
      data={products}
      sortable={true}
      searchable={true}
      filterable={true}
      editable={true}
      selectable={true}
      exportable={true}
      pagination={true}
      onCellEdit={handleCellEdit}
      onAddNew={handleAddNew}
    />
  )
}
```

**After:**
```tsx
function ProductEditor() {
  return (
    <DataTable
      preset="full"
      title="Products"
      columns={productColumns}
      data={products}
      onCellEdit={handleCellEdit}
      onAddNew={handleAddNew}
    />
  )
}
```

## Preset Selection Decision Tree

```
┌─────────────────────────┐
│ Does the table need to  │
│ support data editing?   │
└──────────┬──────────────┘
           │
    ┌──────┴──────┐
    │             │
   Yes           No
    │             │
    v             v
┌───────┐  ┌────────────────────────┐
│ FULL  │  │ Does it need filters   │
└───────┘  │ or export?             │
           └──────────┬─────────────┘
                      │
               ┌──────┴──────┐
               │             │
              Yes           No
               │             │
               v             v
           ┌──────────┐  ┌────────────────────┐
           │ ADVANCED │  │ Does it need       │
           └──────────┘  │ pagination/search? │
                         └──────────┬─────────┘
                                    │
                             ┌──────┴──────┐
                             │             │
                            Yes           No
                             │             │
                             v             v
                         ┌──────────┐  ┌─────────┐
                         │ STANDARD │  │ MINIMAL │
                         └──────────┘  └─────────┘
```

## Verification Checklist

After migration, verify:

- [ ] Table displays correctly
- [ ] Sorting works (if expected)
- [ ] Search works (if expected)
- [ ] Filters work (if expected)
- [ ] Pagination works (if expected)
- [ ] Export works (if expected)
- [ ] Selection works (if expected)
- [ ] Editing works (if expected)
- [ ] Custom overrides are applied
- [ ] Performance is acceptable

## Rollback Plan

If you encounter issues, you can easily rollback:

```tsx
// Remove preset prop and add back explicit props
<DataTable
  // preset="standard"  // Comment out or remove
  columns={columns}
  data={data}
  sortable={true}
  searchable={true}
  // ... other explicit props
/>
```

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| Lines of code | 15-20 props | 1-3 props |
| Configuration time | 5-10 minutes | 30 seconds |
| Error potential | High (missing props) | Low (preset validated) |
| Consistency | Varies per developer | Standardized |
| Maintenance | Update each table | Update preset once |
| Readability | Hard to see intent | Clear preset name |

## Need Help?

If you're unsure which preset to use:

```tsx
import { getRecommendedPreset } from '@topsteel/ui'

// Get recommended preset based on use case
const preset = getRecommendedPreset('crud') // 'standard'
const preset = getRecommendedPreset('read-only') // 'minimal'
const preset = getRecommendedPreset('data-analysis') // 'advanced'
const preset = getRecommendedPreset('spreadsheet') // 'full'
```

Or check preset features programmatically:

```tsx
import { hasFeature, getEnabledFeatures } from '@topsteel/ui'

// Check if preset has a feature
if (hasFeature('advanced', 'exportable')) {
  console.log('This preset supports export')
}

// List all enabled features
const features = getEnabledFeatures('standard')
console.log('Enabled:', features)
```
