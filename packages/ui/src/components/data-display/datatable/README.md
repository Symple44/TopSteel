# DataTable Component Documentation

## Overview
The DataTable is a powerful, feature-rich table component built with React and TypeScript. It provides sorting, filtering, searching, pagination, selection, and export capabilities with a clean, modular architecture.

## Quick Start

```tsx
import { DataTable, type ColumnConfig } from '@erp/ui'

const data = [
  { id: 1, name: 'John Doe', role: 'Developer', salary: 75000 },
  { id: 2, name: 'Jane Smith', role: 'Designer', salary: 65000 },
]

const columns: ColumnConfig<typeof data[0]>[] = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', searchable: true },
  { key: 'role', header: 'Role', filterable: true },
  { key: 'salary', header: 'Salary', 
    render: (row) => `$${row.salary.toLocaleString()}` 
  },
]

function MyTable() {
  return (
    <DataTable
      data={data}
      columns={columns}
      keyField="id"
      searchable
      sortable
      selectable
    />
  )
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `T[]` | Array of data objects to display |
| `columns` | `ColumnConfig<T>[]` | Column configuration array |
| `keyField` | `keyof T` | Unique identifier field for each row |

### Feature Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sortable` | `boolean` | `true` | Enable column sorting |
| `filterable` | `boolean` | `true` | Enable column filtering |
| `searchable` | `boolean` | `true` | Enable global search |
| `selectable` | `boolean` | `false` | Enable row selection |
| `editable` | `boolean` | `false` | Enable inline editing |
| `exportable` | `boolean` | `false` | Enable data export |
| `pagination` | `boolean \| PaginationConfig` | `false` | Enable pagination |

### Appearance Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Table title |
| `className` | `string` | - | Custom CSS class |
| `height` | `number \| string` | - | Fixed table height |
| `striped` | `boolean` | `true` | Alternate row colors |
| `bordered` | `boolean` | `true` | Show table borders |
| `hoverable` | `boolean` | `true` | Highlight rows on hover |
| `compact` | `boolean` | `false` | Reduce padding |
| `loading` | `boolean` | `false` | Show loading state |
| `error` | `string \| null` | `null` | Show error message |
| `emptyMessage` | `string` | `'No data'` | Message when no data |

### Action Props

| Prop | Type | Description |
|------|------|-------------|
| `actions` | `Action[]` | Row action buttons |
| `onRowClick` | `(row: T, index: number) => void` | Row click handler |
| `onRowDoubleClick` | `(row: T, index: number) => void` | Row double-click handler |
| `onCellEdit` | `(row: T, column: ColumnConfig<T>, value: any) => void` | Cell edit handler |
| `onSelectionChange` | `(selection: SelectionState) => void` | Selection change handler |
| `onPaginationChange` | `(config: PaginationConfig) => void` | Pagination change handler |
| `onAddNew` | `() => void` | Add new row handler |

## Column Configuration

```typescript
interface ColumnConfig<T> {
  key: keyof T | string        // Column key/field name
  header: string                // Column header text
  description?: string          // Column description tooltip
  width?: number | string       // Column width
  minWidth?: number            // Minimum column width
  maxWidth?: number            // Maximum column width
  
  // Features
  sortable?: boolean           // Enable sorting for this column
  filterable?: boolean         // Enable filtering for this column
  searchable?: boolean         // Include in global search
  editable?: boolean           // Enable inline editing
  exportable?: boolean         // Include in exports
  resizable?: boolean          // Enable column resizing
  
  // Rendering
  render?: (row: T) => React.ReactNode              // Custom cell renderer
  headerRender?: () => React.ReactNode              // Custom header renderer
  editRender?: (row: T, value: any) => React.ReactNode  // Custom edit renderer
  
  // Formatting
  formatter?: (value: any) => string                // Value formatter
  exportFormatter?: (value: any) => string          // Export formatter
  
  // Validation
  validator?: (value: any) => boolean | string      // Edit validator
  
  // Alignment
  align?: 'left' | 'center' | 'right'              // Text alignment
}
```

## Examples

### Basic Table with Sorting and Search

```tsx
<DataTable
  data={users}
  columns={[
    { key: 'name', header: 'Name', sortable: true, searchable: true },
    { key: 'email', header: 'Email', searchable: true },
    { key: 'role', header: 'Role', filterable: true },
  ]}
  keyField="id"
  searchable
  sortable
/>
```

### Table with Row Selection

```tsx
function SelectableTable() {
  const [selection, setSelection] = useState<SelectionState>({
    selectedRows: new Set(),
    selectAll: false,
  })

  return (
    <DataTable
      data={data}
      columns={columns}
      keyField="id"
      selectable
      onSelectionChange={setSelection}
    />
  )
}
```

### Table with Row Actions

```tsx
<DataTable
  data={products}
  columns={columns}
  keyField="id"
  actions={[
    {
      label: 'Edit',
      icon: <Edit size={16} />,
      onClick: (row) => handleEdit(row),
    },
    {
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: (row) => handleDelete(row),
      variant: 'destructive',
      disabled: (row) => !row.canDelete,
    },
  ]}
/>
```

### Table with Pagination

```tsx
<DataTable
  data={largeDataset}
  columns={columns}
  keyField="id"
  pagination={{
    pageSize: 20,
    currentPage: 1,
    showPageSizeOptions: true,
    pageSizeOptions: [10, 20, 50, 100],
  }}
/>
```

### Table with Custom Cell Rendering

```tsx
const columns: ColumnConfig<User>[] = [
  {
    key: 'avatar',
    header: 'Avatar',
    render: (user) => (
      <img 
        src={user.avatarUrl} 
        alt={user.name}
        className="w-8 h-8 rounded-full"
      />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (user) => (
      <Badge variant={user.active ? 'success' : 'secondary'}>
        {user.active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'salary',
    header: 'Salary',
    align: 'right',
    render: (user) => `$${user.salary.toLocaleString()}`,
    exportFormatter: (value) => value.toString(),
  },
]
```

### Table with Inline Editing

```tsx
function EditableTable() {
  const [data, setData] = useState(initialData)

  const handleCellEdit = (row, column, value) => {
    setData(prev => 
      prev.map(item => 
        item.id === row.id 
          ? { ...item, [column.key]: value }
          : item
      )
    )
  }

  return (
    <DataTable
      data={data}
      columns={[
        { key: 'name', header: 'Name', editable: true },
        { key: 'email', header: 'Email', editable: true,
          validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email'
        },
      ]}
      keyField="id"
      editable
      onCellEdit={handleCellEdit}
    />
  )
}
```

### Table with Export Functionality

```tsx
<DataTable
  data={reports}
  columns={[
    { key: 'date', header: 'Date', exportable: true,
      exportFormatter: (value) => new Date(value).toLocaleDateString()
    },
    { key: 'amount', header: 'Amount', exportable: true },
    { key: 'internalNotes', header: 'Notes', exportable: false }, // Won't be exported
  ]}
  keyField="id"
  exportable
/>
```

## Advanced Features

### Persisted Settings

The DataTable can persist user preferences (column visibility, order, width, filters) using the `tableId` prop:

```tsx
<DataTable
  data={data}
  columns={columns}
  keyField="id"
  tableId="user-management-table" // Enables persistence
  settings={savedSettings}         // Optional: provide saved settings
  onSettingsChange={handleSettingsChange} // Optional: handle settings changes
/>
```

### Custom Filtering

```tsx
const columns: ColumnConfig<Product>[] = [
  {
    key: 'price',
    header: 'Price',
    filterable: true,
    filterOptions: {
      type: 'range',
      min: 0,
      max: 1000,
    },
  },
  {
    key: 'category',
    header: 'Category',
    filterable: true,
    filterOptions: {
      type: 'select',
      options: ['Electronics', 'Clothing', 'Books'],
    },
  },
]
```

### Multi-Column Sorting

Hold Shift while clicking column headers to sort by multiple columns:

```tsx
<DataTable
  data={data}
  columns={columns}
  keyField="id"
  sortable
  multiSort // Enable multi-column sorting
/>
```

### Virtual Scrolling (for large datasets)

```tsx
<DataTable
  data={largeDataset} // 10,000+ rows
  columns={columns}
  keyField="id"
  virtual // Enable virtual scrolling
  height={600} // Required for virtual scrolling
/>
```

## Hooks

The DataTable provides several hooks for custom implementations:

### useDataTableState

Main hook that manages all table state:

```tsx
import { useDataTableState } from '@erp/ui/datatable/hooks'

const tableState = useDataTableState({
  data,
  columns,
  keyField: 'id',
  sortable: true,
  filterable: true,
})
```

### useDataSelection

Manages row selection state:

```tsx
import { useDataSelection } from '@erp/ui/datatable/hooks'

const selection = useDataSelection(data, 'id', onSelectionChange)
```

### useDataSorting

Handles data sorting:

```tsx
import { useDataSorting } from '@erp/ui/datatable/hooks'

const sortedData = useDataSorting(data, sortConfig)
```

### useDataFiltering

Handles data filtering:

```tsx
import { useDataFiltering } from '@erp/ui/datatable/hooks'

const filteredData = useDataFiltering(data, filters, searchTerm)
```

### useDataPagination

Manages pagination:

```tsx
import { useDataPagination } from '@erp/ui/datatable/hooks'

const { paginatedData, pagination, nextPage, prevPage } = useDataPagination(
  data,
  { pageSize: 20 }
)
```

### useDataExport

Handles data export:

```tsx
import { useDataExport } from '@erp/ui/datatable/hooks'

const { exportToCSV, exportToJSON, exportToExcel } = useDataExport(data, columns)
```

## Performance Optimization

### Memoization

The DataTable uses React.memo and useMemo extensively. Ensure your data and column configs are memoized:

```tsx
const columns = useMemo(() => [...], [])
const data = useMemo(() => processData(rawData), [rawData])
```

### Virtual Scrolling

For datasets with 1000+ rows, enable virtual scrolling:

```tsx
<DataTable
  data={largeData}
  columns={columns}
  keyField="id"
  virtual
  height={600}
/>
```

### Lazy Loading

Implement lazy loading with pagination:

```tsx
function LazyTable() {
  const [page, setPage] = useState(1)
  const { data, loading } = useFetch(`/api/data?page=${page}`)

  return (
    <DataTable
      data={data}
      columns={columns}
      keyField="id"
      loading={loading}
      pagination={{
        currentPage: page,
        totalPages: 10,
        onPageChange: setPage,
      }}
    />
  )
}
```

## Migration from Legacy DataTable

If you're migrating from the legacy DataTable:

### Old (Legacy)
```tsx
<DataTable
  columns={[
    { accessorKey: 'name', header: 'Name', cell: (value) => value },
  ]}
  data={data}
  loading={loading}
/>
```

### New (Current)
```tsx
<DataTable
  data={data}
  columns={[
    { key: 'name', header: 'Name', render: (row) => row.name },
  ]}
  keyField="id"
  loading={loading}
/>
```

### Key Changes:
- `accessorKey` → `key`
- `cell: (value)` → `render: (row)`
- Added required `keyField` prop
- Actions are now passed as a prop, not in columns
- Better TypeScript support with generics

## TypeScript

The DataTable is fully typed with TypeScript generics:

```tsx
interface User {
  id: number
  name: string
  email: string
  role: string
}

const columns: ColumnConfig<User>[] = [
  { key: 'name', header: 'Name' },    // Type-safe keys
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
]

<DataTable<User>
  data={users}
  columns={columns}
  keyField="id"
/>
```

## Styling

The DataTable uses Tailwind CSS classes and can be customized:

```tsx
<DataTable
  data={data}
  columns={columns}
  keyField="id"
  className="custom-table"
  striped={false}
  bordered={false}
  compact={true}
/>
```

Custom CSS variables for theming:
```css
.custom-table {
  --datatable-border-color: #e5e7eb;
  --datatable-header-bg: #f9fafb;
  --datatable-row-hover: #f3f4f6;
  --datatable-row-selected: #dbeafe;
}
```

## Accessibility

The DataTable follows WAI-ARIA guidelines:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- Focus management
- High contrast mode support

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for development setup and guidelines.