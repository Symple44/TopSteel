# DataTable Import System

A complete import system for CSV and Excel files with column mapping, validation, and error handling.

## Features

- **Multi-format Support**: CSV, XLSX, and XLS files
- **Column Mapping**: Interactive UI for mapping file columns to table columns
- **Auto-detection**: Automatically detect column mappings based on header names
- **Validation**: Comprehensive validation with type checking and custom rules
- **Preview**: Display first 5 rows before import
- **Progress Tracking**: Real-time progress updates during import
- **Error Handling**: Detailed error messages with row and column information
- **Warnings**: Non-blocking warnings for data quality issues

## Installation

The import system is included with the DataTable component. Required dependencies:

```bash
pnpm add papaparse xlsx
pnpm add -D @types/papaparse
```

## Basic Usage

```tsx
import { ImportDialog } from '@erp/ui/data-display'
import { useState } from 'react'

function MyComponent() {
  const [importOpen, setImportOpen] = useState(false)

  const columns = [
    { id: '1', key: 'name', title: 'Name', type: 'text' },
    { id: '2', key: 'email', title: 'Email', type: 'text' },
    { id: '3', key: 'age', title: 'Age', type: 'number' },
  ]

  const validationSchema = {
    name: { required: true, type: 'string' },
    email: { required: true, type: 'email' },
    age: { type: 'number', min: 0, max: 150 },
  }

  const handleImport = async (result) => {
    if (result.success) {
      console.log('Imported data:', result.data)
      console.log('Stats:', result.stats)
      // Save data to your backend
    } else {
      console.error('Import failed:', result.errors)
    }
  }

  return (
    <>
      <button onClick={() => setImportOpen(true)}>Import Data</button>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        columns={columns}
        validationSchema={validationSchema}
        onImport={handleImport}
      />
    </>
  )
}
```

## Advanced Usage

### Custom Import Configuration

```tsx
<ImportDialog
  columns={columns}
  validationSchema={validationSchema}
  onImport={handleImport}
  allowedFormats={['csv', 'xlsx']}
  maxFileSize={5 * 1024 * 1024} // 5MB
  defaultConfig={{
    hasHeader: true,
    delimiter: ',',
    skipEmptyRows: true,
    trimValues: true,
    dateFormat: 'DD/MM/YYYY',
  }}
  title="Import Users"
  description="Upload a CSV or Excel file with user data"
/>
```

### Using the useImport Hook

For more control, use the `useImport` hook directly:

```tsx
import { useImport } from '@erp/ui/data-display'

function CustomImport() {
  const {
    state,
    progress,
    preview,
    columnMapping,
    validationResult,
    selectFile,
    updateColumnMapping,
    executeImport,
    reset,
  } = useImport({
    columns,
    validationSchema,
    autoMapColumns: true,
  })

  return (
    <div>
      <input type="file" onChange={(e) => selectFile(e.target.files[0])} />

      {preview.length > 0 && (
        <div>
          <h3>Preview</h3>
          <pre>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}

      {validationResult && (
        <div>
          <p>Valid rows: {validationResult.validRows}</p>
          <p>Invalid rows: {validationResult.invalidRows}</p>
        </div>
      )}

      <button onClick={executeImport}>Import</button>
    </div>
  )
}
```

## Validation Schema

Define validation rules for your data:

```tsx
const validationSchema = {
  email: {
    required: true,
    type: 'email',
    message: 'Valid email is required',
  },
  age: {
    type: 'number',
    min: 18,
    max: 100,
    message: 'Age must be between 18 and 100',
  },
  status: {
    enum: ['active', 'inactive', 'pending'],
    message: 'Status must be active, inactive, or pending',
  },
  phone: {
    type: 'phone',
    pattern: /^\+?[\d\s\-\(\)]+$/,
  },
  website: {
    type: 'url',
    required: false,
  },
  custom: {
    custom: (value, row) => {
      if (value === 'admin' && row.age < 25) {
        return 'Admins must be at least 25 years old'
      }
      return null
    },
  },
}
```

### Supported Validation Types

- `string`: String validation
- `number`: Numeric validation
- `boolean`: Boolean validation (accepts true/false, 1/0, yes/no)
- `date`: Date validation
- `email`: Email validation
- `url`: URL validation
- `phone`: Phone number validation

### Validation Options

- `required`: Field is required
- `type`: Expected data type
- `min`: Minimum value (numbers) or length (strings)
- `max`: Maximum value (numbers) or length (strings)
- `pattern`: Regular expression to match
- `enum`: Array of allowed values
- `custom`: Custom validation function
- `message`: Custom error message

## Column Mapping

The import system automatically detects column mappings based on header names. You can also manually map columns:

```tsx
const {
  columnMapping,
  updateColumnMapping,
  removeColumnMapping,
  autoDetectMappings,
} = useImport({ columns })

// Update a mapping
updateColumnMapping('Full Name', 'name')

// Remove a mapping
removeColumnMapping('Full Name')

// Re-run auto-detection
autoDetectMappings()
```

## Import Result

The `onImport` callback receives a comprehensive result object:

```tsx
interface ImportResult {
  success: boolean
  data: T[] // Successfully imported data
  errors: Array<{
    row: number
    column: string
    message: string
    value?: unknown
  }>
  warnings: Array<{
    row: number
    column: string
    message: string
  }>
  stats: {
    totalRows: number
    successfulRows: number
    failedRows: number
    warningRows: number
    duration: number
  }
  mappings: ColumnMapping[]
}
```

## Direct Parsing

You can also use the parser utilities directly:

```tsx
import { parseCSV, parseExcel, parseFile } from '@erp/ui/data-display'

// Parse CSV
const csvData = await parseCSV(file, {
  format: 'csv',
  delimiter: ',',
  hasHeader: true,
})

// Parse Excel
const excelData = await parseExcel(file, {
  format: 'xlsx',
  hasHeader: true,
})

// Auto-detect format
const data = await parseFile(file)
```

## Direct Validation

Use validation utilities independently:

```tsx
import { validateRow, validateImport } from '@erp/ui/data-display'

// Validate a single row
const rowResult = validateRow(row, validationSchema)
if (!rowResult.valid) {
  console.error('Errors:', rowResult.errors)
}

// Validate all data
const importResult = validateImport(parsedData, validationSchema)
console.log('Valid rows:', importResult.validRows)
console.log('Invalid rows:', importResult.invalidRows)
```

## File Validation

Validate files before parsing:

```tsx
import { validateFile } from '@erp/ui/data-display'

const validation = validateFile(file, {
  allowedFormats: ['csv', 'xlsx'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
})

if (!validation.valid) {
  console.error(validation.error)
}
```

## TypeScript Support

All components and hooks are fully typed:

```tsx
import type {
  ImportFormat,
  ImportConfig,
  ImportResult,
  ValidationSchema,
  ColumnMapping,
} from '@erp/ui/data-display'

// Type your data
interface User {
  name: string
  email: string
  age: number
}

// Use with components
<ImportDialog<User>
  columns={columns}
  validationSchema={validationSchema}
  onImport={(result: ImportResult<User>) => {
    // result.data is typed as User[]
  }}
/>
```

## Error Handling

The import system provides detailed error information:

```tsx
const handleImport = async (result: ImportResult) => {
  if (!result.success) {
    // Group errors by row
    const errorsByRow = new Map()
    result.errors.forEach(error => {
      if (!errorsByRow.has(error.row)) {
        errorsByRow.set(error.row, [])
      }
      errorsByRow.get(error.row).push(error)
    })

    // Display errors to user
    errorsByRow.forEach((errors, row) => {
      console.error(`Row ${row + 1}:`, errors)
    })
  }
}
```

## Best Practices

1. **Always provide validation schema** for data integrity
2. **Set appropriate file size limits** to prevent memory issues
3. **Handle errors gracefully** and provide clear feedback to users
4. **Use auto-detection** for better user experience
5. **Test with various file formats** to ensure compatibility
6. **Provide clear column names** in your table for better mapping
7. **Use custom validators** for complex business logic
8. **Show preview** before final import to let users verify data

## Browser Compatibility

The import system works in all modern browsers that support:
- File API
- Promises
- ES6+

For older browsers, use appropriate polyfills.

## Performance

- **Large files**: The system handles files up to 10MB by default (configurable)
- **Progress tracking**: Real-time updates during parsing and validation
- **Efficient parsing**: Uses streaming for CSV and optimized binary reading for Excel
- **Memory management**: Processes data in chunks to avoid memory issues

## License

Part of the TopSteel ERP UI library - UNLICENSED
