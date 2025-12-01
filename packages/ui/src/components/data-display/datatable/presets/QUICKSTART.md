# DataTable Presets - Quick Start Guide

Get started with DataTable presets in 2 minutes!

## What are Presets?

Presets are predefined DataTable configurations that let you set up tables with one prop instead of many.

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
  // ... 10 more props
/>
```

**After:**
```tsx
<DataTable preset="standard" columns={columns} data={data} />
```

## Choose Your Preset

### 1️⃣ Minimal - Simple Read-Only Table
**When:** Displaying static data, embedded tables, simple lists

```tsx
<DataTable preset="minimal" columns={columns} data={data} />
```

Features: Basic table display, no extras

---

### 2️⃣ Standard - Typical CRUD Table (⭐ Recommended)
**When:** User management, admin panels, most data tables

```tsx
<DataTable preset="standard" columns={columns} data={data} />
```

Features: Sort, search, pagination, column toggle

---

### 3️⃣ Advanced - Analytics & Reports
**When:** Data analysis, filtering data, exporting reports

```tsx
<DataTable preset="advanced" columns={columns} data={data} />
```

Features: All Standard + filters, export, row selection

---

### 4️⃣ Full - Spreadsheet Editor
**When:** Data entry, product management, editable tables

```tsx
<DataTable preset="full" columns={columns} data={data} />
```

Features: Everything + inline editing, add rows, virtualization

---

## Common Scenarios

### User List (CRUD)
```tsx
<DataTable
  preset="standard"
  title="Users"
  columns={userColumns}
  data={users}
  actions={[
    { label: 'Edit', onClick: handleEdit },
    { label: 'Delete', onClick: handleDelete },
  ]}
/>
```

### Sales Report (Analytics)
```tsx
<DataTable
  preset="advanced"
  title="Sales Report"
  columns={reportColumns}
  data={sales}
/>
```

### Product Editor (Editable)
```tsx
<DataTable
  preset="full"
  title="Products"
  columns={productColumns}
  data={products}
  onCellEdit={handleEdit}
  onAddNew={handleAddNew}
/>
```

### Order Items (Simple)
```tsx
<DataTable
  preset="minimal"
  columns={itemColumns}
  data={orderItems}
/>
```

## Customizing Presets

Need to tweak a preset? Just add the prop you want to override:

```tsx
{/* Standard + Export */}
<DataTable
  preset="standard"
  exportable={true}
  columns={columns}
  data={data}
/>

{/* Advanced + Compact */}
<DataTable
  preset="advanced"
  compact={true}
  columns={columns}
  data={data}
/>

{/* Minimal + Search */}
<DataTable
  preset="minimal"
  searchable={true}
  columns={columns}
  data={data}
/>
```

## Need Help Choosing?

Use the helper function:

```tsx
import { getRecommendedPreset } from '@topsteel/ui'

// For CRUD operations
const preset = getRecommendedPreset('crud') // 'standard'

// For read-only display
const preset = getRecommendedPreset('read-only') // 'minimal'

// For data analysis
const preset = getRecommendedPreset('data-analysis') // 'advanced'

// For editing like a spreadsheet
const preset = getRecommendedPreset('spreadsheet') // 'full'
```

## Feature Comparison

| Feature | Minimal | Standard | Advanced | Full |
|---------|---------|----------|----------|------|
| Sort columns | ❌ | ✅ | ✅ | ✅ |
| Search | ❌ | ✅ | ✅ | ✅ |
| Pagination | ❌ | ✅ | ✅ | ✅ |
| Filters | ❌ | ❌ | ✅ | ✅ |
| Export | ❌ | ❌ | ✅ | ✅ |
| Row selection | ❌ | ❌ | ✅ | ✅ |
| Inline editing | ❌ | ❌ | ❌ | ✅ |
| Add new rows | ❌ | ❌ | ❌ | ✅ |

## Import Path

```tsx
import { DataTable } from '@topsteel/ui'

// Or with types
import { DataTable, type DataTablePreset } from '@topsteel/ui'
```

## Pro Tips

1. **Start with Standard** - It's the sweet spot for most use cases
2. **Override sparingly** - If you're overriding many props, use a different preset
3. **Keep it simple** - The whole point is less configuration!

## Decision Tree

```
Need to edit data?
├─ Yes → preset="full"
└─ No → Need filters/export?
    ├─ Yes → preset="advanced"
    └─ No → Need pagination/search?
        ├─ Yes → preset="standard"
        └─ No → preset="minimal"
```

## Next Steps

- 📖 Read [README.md](./README.md) for detailed documentation
- 🔧 Check [API.md](./API.md) for complete API reference
- 🚀 See [examples.tsx](./examples.tsx) for live examples
- 📝 Follow [MIGRATION.md](./MIGRATION.md) to migrate existing tables

## That's It!

You're ready to use DataTable presets. Start with `preset="standard"` and adjust as needed.

**Questions?** Check the [README.md](./README.md) for more details.
