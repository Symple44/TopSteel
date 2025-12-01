# DataTable Preset System API Reference

Complete API documentation for the DataTable preset system.

## Types

### `DataTablePreset`

```typescript
type DataTablePreset = 'minimal' | 'standard' | 'advanced' | 'full'
```

Available preset types:
- `'minimal'` - Basic read-only table
- `'standard'` - Standard CRUD table (recommended)
- `'advanced'` - Advanced features with filters and export
- `'full'` - All features including editing

---

### `PresetConfig`

```typescript
interface PresetConfig {
  // Core features
  sortable: boolean
  searchable: boolean
  filterable: boolean
  editable: boolean
  selectable: boolean
  exportable: boolean
  pagination: boolean

  // Advanced features
  virtualize?: boolean
  virtualizeThreshold: number
  estimatedRowHeight: number
  searchDebounceMs: number

  // Appearance
  striped: boolean
  bordered: boolean
  hoverable: boolean
  compact: boolean

  // Header features
  showSearch: boolean
  showFilters: boolean
  showExport: boolean
  showColumnToggle: boolean
  showAddNew: boolean

  // Footer features
  showPagination: boolean
  showSelection: boolean
  showSizeChanger: boolean
  pageSizeOptions: number[]
}
```

Complete configuration object containing all DataTable features.

---

## Constants

### `DATATABLE_PRESETS`

```typescript
const DATATABLE_PRESETS: Record<DataTablePreset, PresetConfig>
```

Object containing all predefined preset configurations.

**Example:**
```typescript
import { DATATABLE_PRESETS } from '@topsteel/ui'

// Access preset configuration
const standardConfig = DATATABLE_PRESETS.standard
console.log(standardConfig.sortable) // true
console.log(standardConfig.exportable) // false

// List all presets
Object.keys(DATATABLE_PRESETS) // ['minimal', 'standard', 'advanced', 'full']
```

---

## Functions

### `applyPreset()`

Apply a preset configuration with optional overrides.

**Signature:**
```typescript
function applyPreset(
  preset: DataTablePreset,
  overrides?: Partial<PresetConfig>
): PresetConfig
```

**Parameters:**
- `preset` - The preset type to apply
- `overrides` - Optional partial configuration to override preset values

**Returns:**
- Complete preset configuration with overrides applied

**Throws:**
- Error if preset is invalid

**Examples:**
```typescript
import { applyPreset } from '@topsteel/ui'

// Apply preset without overrides
const config = applyPreset('standard')

// Apply preset with overrides
const config = applyPreset('standard', {
  exportable: true,
  compact: true,
})

// Use in DataTable
<DataTable {...config} columns={columns} data={data} />
```

---

### `getRecommendedPreset()`

Get the recommended preset for a specific use case.

**Signature:**
```typescript
function getRecommendedPreset(
  useCase: 'read-only' | 'crud' | 'data-analysis' | 'spreadsheet'
): DataTablePreset
```

**Parameters:**
- `useCase` - Description of the use case

**Returns:**
- Recommended preset name

**Use Case Mapping:**
- `'read-only'` → `'minimal'`
- `'crud'` → `'standard'`
- `'data-analysis'` → `'advanced'`
- `'spreadsheet'` → `'full'`

**Examples:**
```typescript
import { getRecommendedPreset } from '@topsteel/ui'

// Get preset for CRUD table
const preset = getRecommendedPreset('crud') // 'standard'

// Use in component
<DataTable
  preset={getRecommendedPreset('data-analysis')}
  columns={columns}
  data={data}
/>
```

---

### `createCustomPreset()`

Create a custom preset by merging a base preset with custom features.

**Signature:**
```typescript
function createCustomPreset(
  basePreset: DataTablePreset,
  additions: Partial<PresetConfig>
): PresetConfig
```

**Parameters:**
- `basePreset` - Base preset to start from
- `additions` - Features to add or override

**Returns:**
- Custom preset configuration

**Examples:**
```typescript
import { createCustomPreset } from '@topsteel/ui'

// Start with minimal, add search and export
const customPreset = createCustomPreset('minimal', {
  searchable: true,
  exportable: true,
  showSearch: true,
  showExport: true,
})

// Use in DataTable
<DataTable {...customPreset} columns={columns} data={data} />

// Reusable custom preset
const compactStandard = createCustomPreset('standard', {
  compact: true,
  striped: false,
})

// Use across multiple tables
<DataTable {...compactStandard} columns={cols1} data={data1} />
<DataTable {...compactStandard} columns={cols2} data={data2} />
```

---

### `comparePresets()`

Compare two preset configurations and return differences.

**Signature:**
```typescript
function comparePresets(
  preset1: DataTablePreset,
  preset2: DataTablePreset
): Partial<Record<keyof PresetConfig, { preset1: any; preset2: any }>>
```

**Parameters:**
- `preset1` - First preset to compare
- `preset2` - Second preset to compare

**Returns:**
- Object containing only properties that differ between presets

**Examples:**
```typescript
import { comparePresets } from '@topsteel/ui'

// Compare minimal and standard
const diff = comparePresets('minimal', 'standard')
console.log(diff)
// {
//   sortable: { preset1: false, preset2: true },
//   searchable: { preset1: false, preset2: true },
//   pagination: { preset1: false, preset2: true },
//   ...
// }

// Check specific differences
if (diff.exportable) {
  console.log(`Export: ${diff.exportable.preset1} → ${diff.exportable.preset2}`)
}

// Count differences
const differenceCount = Object.keys(diff).length
console.log(`${differenceCount} features differ between presets`)
```

---

### `hasFeature()`

Check if a preset has a specific feature enabled.

**Signature:**
```typescript
function hasFeature(
  preset: DataTablePreset,
  feature: keyof PresetConfig
): boolean
```

**Parameters:**
- `preset` - Preset to check
- `feature` - Feature key to check

**Returns:**
- `true` if feature is enabled, `false` otherwise

**Examples:**
```typescript
import { hasFeature } from '@topsteel/ui'

// Check if preset has feature
if (hasFeature('standard', 'exportable')) {
  console.log('Standard preset supports export')
} else {
  console.log('Export not available in standard preset')
}

// Conditional rendering based on feature
function TableControls({ preset }) {
  return (
    <div>
      {hasFeature(preset, 'exportable') && <ExportButton />}
      {hasFeature(preset, 'searchable') && <SearchBox />}
      {hasFeature(preset, 'filterable') && <FilterPanel />}
    </div>
  )
}

// Validate preset before use
const requiredFeatures = ['sortable', 'searchable', 'exportable']
const preset = 'standard'
const hasAllFeatures = requiredFeatures.every(f =>
  hasFeature(preset, f as keyof PresetConfig)
)
```

---

### `getEnabledFeatures()`

Get a list of all enabled features for a preset.

**Signature:**
```typescript
function getEnabledFeatures(
  preset: DataTablePreset
): Array<keyof PresetConfig>
```

**Parameters:**
- `preset` - Preset to analyze

**Returns:**
- Array of enabled feature names (where value is `true`)

**Examples:**
```typescript
import { getEnabledFeatures } from '@topsteel/ui'

// Get all enabled features
const features = getEnabledFeatures('advanced')
console.log(features)
// ['sortable', 'searchable', 'filterable', 'selectable',
//  'exportable', 'pagination', 'striped', 'bordered', ...]

// Display feature list
function PresetInfo({ preset }) {
  const features = getEnabledFeatures(preset)
  return (
    <div>
      <h3>{preset} Preset Features:</h3>
      <ul>
        {features.map(feature => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  )
}

// Feature count
const featureCount = getEnabledFeatures('full').length
console.log(`Full preset has ${featureCount} enabled features`)

// Compare feature counts
const presets: DataTablePreset[] = ['minimal', 'standard', 'advanced', 'full']
presets.forEach(preset => {
  const count = getEnabledFeatures(preset).length
  console.log(`${preset}: ${count} features`)
})
```

---

## Usage in DataTable Component

### Direct Preset Usage

```typescript
import { DataTable } from '@topsteel/ui'

<DataTable
  preset="standard"
  columns={columns}
  data={data}
/>
```

### Preset with Overrides

```typescript
<DataTable
  preset="standard"
  exportable={true}  // Override: enable export
  compact={true}     // Override: compact layout
  columns={columns}
  data={data}
/>
```

### Programmatic Configuration

```typescript
import { applyPreset, getRecommendedPreset } from '@topsteel/ui'

// Method 1: Direct preset
const preset = getRecommendedPreset('crud')
<DataTable preset={preset} columns={columns} data={data} />

// Method 2: Apply with overrides
const config = applyPreset('standard', { exportable: true })
<DataTable {...config} columns={columns} data={data} />

// Method 3: Custom preset
const customConfig = createCustomPreset('minimal', {
  searchable: true,
  showSearch: true,
})
<DataTable {...customConfig} columns={columns} data={data} />
```

---

## Integration Examples

### Dynamic Preset Selection

```typescript
import { useState } from 'react'
import { DataTable, type DataTablePreset } from '@topsteel/ui'

function ConfigurableTable() {
  const [preset, setPreset] = useState<DataTablePreset>('standard')

  return (
    <div>
      <select value={preset} onChange={(e) => setPreset(e.target.value)}>
        <option value="minimal">Minimal</option>
        <option value="standard">Standard</option>
        <option value="advanced">Advanced</option>
        <option value="full">Full</option>
      </select>

      <DataTable
        preset={preset}
        columns={columns}
        data={data}
      />
    </div>
  )
}
```

### Feature-Based Preset Selection

```typescript
import { hasFeature, type DataTablePreset } from '@topsteel/ui'

function SmartTable({ requireExport, requireEdit }) {
  // Select preset based on requirements
  let preset: DataTablePreset = 'standard'

  if (requireEdit) {
    preset = 'full'
  } else if (requireExport) {
    preset = 'advanced'
  }

  // Verify preset has required features
  if (requireExport && !hasFeature(preset, 'exportable')) {
    console.warn('Selected preset does not support export')
  }

  return <DataTable preset={preset} columns={columns} data={data} />
}
```

### Preset Configuration Store

```typescript
import { applyPreset, type PresetConfig } from '@topsteel/ui'

// Store custom configurations
const tableConfigs = {
  userTable: applyPreset('standard', { selectable: true }),
  reportTable: applyPreset('advanced', { compact: true }),
  readOnlyList: applyPreset('minimal', { hoverable: true }),
}

// Use in components
<DataTable {...tableConfigs.userTable} columns={userColumns} data={users} />
<DataTable {...tableConfigs.reportTable} columns={reportColumns} data={reports} />
<DataTable {...tableConfigs.readOnlyList} columns={listColumns} data={items} />
```

---

## Best Practices

### 1. Choose the Right Preset

```typescript
// ✅ Good: Use appropriate preset for use case
<DataTable preset="minimal" columns={cols} data={data} />  // Read-only
<DataTable preset="standard" columns={cols} data={data} /> // CRUD
<DataTable preset="advanced" columns={cols} data={data} /> // Analytics
<DataTable preset="full" columns={cols} data={data} />     // Editing

// ❌ Bad: Manual configuration when preset exists
<DataTable
  sortable={true}
  searchable={true}
  pagination={true}
  columns={cols}
  data={data}
/>
```

### 2. Override Sparingly

```typescript
// ✅ Good: Override only what's necessary
<DataTable preset="standard" exportable={true} columns={cols} data={data} />

// ❌ Bad: Too many overrides (use different preset or custom)
<DataTable
  preset="minimal"
  sortable={true}
  searchable={true}
  filterable={true}
  exportable={true}
  columns={cols}
  data={data}
/>
```

### 3. Reuse Custom Presets

```typescript
// ✅ Good: Create reusable custom preset
const compactStandard = createCustomPreset('standard', { compact: true })
<DataTable {...compactStandard} columns={cols1} data={data1} />
<DataTable {...compactStandard} columns={cols2} data={data2} />

// ❌ Bad: Duplicate overrides everywhere
<DataTable preset="standard" compact={true} columns={cols1} data={data1} />
<DataTable preset="standard" compact={true} columns={cols2} data={data2} />
```

### 4. Type Safety

```typescript
// ✅ Good: Use TypeScript types
import type { DataTablePreset, PresetConfig } from '@topsteel/ui'

function getConfig(preset: DataTablePreset): PresetConfig {
  return applyPreset(preset)
}

// ❌ Bad: Avoid string literals without types
function getConfig(preset: string) {  // No type safety
  return applyPreset(preset)  // TypeScript error
}
```

---

## TypeScript Support

All exports are fully typed:

```typescript
import type {
  DataTablePreset,
  PresetConfig,
} from '@topsteel/ui'

// Type-safe preset selection
const preset: DataTablePreset = 'standard'

// Type-safe configuration
const config: PresetConfig = applyPreset('standard')

// Type-safe feature checking
const feature: keyof PresetConfig = 'exportable'
const hasIt: boolean = hasFeature('standard', feature)
```

---

## Performance Considerations

### Virtualization Settings

Presets include optimized virtualization settings:

```typescript
// Minimal, Standard, Advanced: virtualizeThreshold = 100
DATATABLE_PRESETS.standard.virtualizeThreshold // 100

// Full: virtualizeThreshold = 50, virtualize = true
DATATABLE_PRESETS.full.virtualizeThreshold // 50
DATATABLE_PRESETS.full.virtualize // true
```

Override for specific needs:

```typescript
<DataTable
  preset="standard"
  virtualize={true}
  virtualizeThreshold={50}
  columns={columns}
  data={largeDataset}
/>
```

### Search Debounce

All presets use 300ms search debounce by default:

```typescript
// Adjust for faster/slower responses
<DataTable
  preset="standard"
  searchDebounceMs={500}  // Slower, less CPU usage
  columns={columns}
  data={data}
/>
```

---

## Troubleshooting

### Preset Not Applied

If preset doesn't seem to work, check:

1. Explicit props override preset values
2. Preset prop spelling is correct
3. TypeScript types are imported

```typescript
// ✅ Correct
<DataTable preset="standard" columns={cols} data={data} />

// ❌ Incorrect: typo
<DataTable preset="standart" columns={cols} data={data} />

// ⚠️ Override: explicit prop takes precedence
<DataTable preset="minimal" sortable={true} columns={cols} data={data} />
// sortable will be true, not false from minimal preset
```

### Feature Not Working

Use helper functions to debug:

```typescript
import { hasFeature, getEnabledFeatures } from '@topsteel/ui'

// Check if feature is enabled
console.log('Has export?', hasFeature('standard', 'exportable'))

// List all features
console.log('Enabled features:', getEnabledFeatures('standard'))
```

---

## See Also

- [README.md](./README.md) - General preset documentation
- [MIGRATION.md](./MIGRATION.md) - Migration guide
- [examples.tsx](./examples.tsx) - Usage examples
- [index.test.ts](./index.test.ts) - Test cases
