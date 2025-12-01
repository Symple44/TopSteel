# Quick Start Guide - DataTable Import System

Get started with the import system in 5 minutes!

## 1. Basic Setup

```tsx
import { ImportDialog } from '@erp/ui/data-display'
import { useState } from 'react'

function MyComponent() {
  const [open, setOpen] = useState(false)

  // Define your columns
  const columns = [
    { id: '1', key: 'name', title: 'Name', type: 'text' },
    { id: '2', key: 'email', title: 'Email', type: 'text' },
  ]

  // Handle import
  const handleImport = (result) => {
    console.log('Imported data:', result.data)
    // Save to your backend here
  }

  return (
    <>
      <button onClick={() => setOpen(true)}>Import</button>
      <ImportDialog
        open={open}
        onOpenChange={setOpen}
        columns={columns}
        onImport={handleImport}
      />
    </>
  )
}
```

## 2. Add Validation

```tsx
const validationSchema = {
  name: {
    required: true,
    type: 'string',
    min: 2,
  },
  email: {
    required: true,
    type: 'email',
  },
}

<ImportDialog
  columns={columns}
  validationSchema={validationSchema}  // ← Add this
  onImport={handleImport}
/>
```

## 3. Handle Results

```tsx
const handleImport = async (result) => {
  if (result.success) {
    // ✅ Import successful
    console.log('Imported:', result.data)
    console.log('Stats:', result.stats)

    // Save to backend
    await saveData(result.data)

  } else {
    // ❌ Import failed
    console.error('Errors:', result.errors)
    alert(`Import failed with ${result.errors.length} errors`)
  }
}
```

## 4. Configure Options

```tsx
<ImportDialog
  columns={columns}
  validationSchema={validationSchema}
  onImport={handleImport}

  // Optional configurations
  title="Import Users"
  description="Upload your user data"
  allowedFormats={['csv', 'xlsx']}
  maxFileSize={5 * 1024 * 1024}  // 5MB
/>
```

## 5. Sample CSV Format

Create a CSV file like this:

```csv
name,email
John Doe,john@example.com
Jane Smith,jane@example.com
```

## Common Validation Rules

```tsx
const validationSchema = {
  // Required field
  name: {
    required: true,
    type: 'string',
  },

  // Email validation
  email: {
    required: true,
    type: 'email',
  },

  // Number with range
  age: {
    type: 'number',
    min: 18,
    max: 100,
  },

  // Enum/Select
  status: {
    enum: ['active', 'inactive', 'pending'],
  },

  // Phone number
  phone: {
    type: 'phone',
  },

  // URL
  website: {
    type: 'url',
  },

  // Date
  birthdate: {
    type: 'date',
  },

  // Custom validator
  username: {
    custom: (value) => {
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return 'Username can only contain letters, numbers, and underscores'
      }
      return null
    },
  },
}
```

## TypeScript Support

```tsx
interface User {
  name: string
  email: string
  age?: number
}

<ImportDialog<User>
  columns={columns}
  validationSchema={validationSchema}
  onImport={(result: ImportResult<User>) => {
    // result.data is typed as User[]
    result.data.forEach(user => {
      console.log(user.name, user.email)
    })
  }}
/>
```

## Using the Hook Directly

```tsx
import { useImport } from '@erp/ui/data-display'

function CustomImport() {
  const {
    state,
    preview,
    selectFile,
    executeImport,
  } = useImport({
    columns,
    validationSchema,
  })

  return (
    <div>
      <input
        type="file"
        onChange={(e) => selectFile(e.target.files[0])}
      />

      {preview.length > 0 && (
        <button onClick={executeImport}>
          Import {preview.length} rows
        </button>
      )}
    </div>
  )
}
```

## Common Patterns

### Pattern 1: Import and Add to Existing Data

```tsx
const [users, setUsers] = useState([])

const handleImport = (result) => {
  if (result.success) {
    setUsers(prev => [...prev, ...result.data])
  }
}
```

### Pattern 2: Import and Replace Data

```tsx
const handleImport = (result) => {
  if (result.success) {
    setUsers(result.data)
  }
}
```

### Pattern 3: Import with Backend Save

```tsx
const handleImport = async (result) => {
  if (result.success) {
    try {
      await fetch('/api/users/import', {
        method: 'POST',
        body: JSON.stringify(result.data),
      })
      alert('Import successful!')
    } catch (error) {
      alert('Failed to save data')
    }
  }
}
```

### Pattern 4: Import with ID Generation

```tsx
const handleImport = (result) => {
  if (result.success) {
    const dataWithIds = result.data.map((item, index) => ({
      ...item,
      id: `import-${Date.now()}-${index}`,
    }))
    setUsers(dataWithIds)
  }
}
```

## Error Handling

```tsx
const handleImport = (result) => {
  if (!result.success) {
    // Group errors by row
    const errorsByRow = new Map()
    result.errors.forEach(error => {
      if (!errorsByRow.has(error.row)) {
        errorsByRow.set(error.row, [])
      }
      errorsByRow.get(error.row).push(error)
    })

    // Display to user
    console.log('Errors by row:', errorsByRow)
  }
}
```

## Troubleshooting

### File not parsing?
- Check file format (CSV, XLSX, XLS)
- Verify file has headers
- Check file encoding (UTF-8)

### Validation failing?
- Review validation schema
- Check sample data matches schema
- Look at error messages in console

### Column mapping not working?
- Ensure column names match (case-insensitive)
- Manually map in the UI
- Check column keys in your config

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [ImportExample.tsx](./ImportExample.tsx) for complete example
- Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) for architecture details

## Need Help?

1. Check the [README](./README.md) for detailed docs
2. Look at [ImportExample.tsx](./ImportExample.tsx) for working code
3. Review validation errors in the console
4. Check TypeScript types for API details

---

**Ready to go!** 🚀 Start importing data into your DataTable.
