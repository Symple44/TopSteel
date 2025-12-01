# DataTable Import System - Implementation Details

## Overview

A complete CSV/Excel import system for the TopSteel ERP DataTable component with column mapping, validation, and comprehensive error handling.

## File Structure

```
import/
├── types.ts              # TypeScript interfaces and types
├── parsers.ts            # CSV and Excel parsing utilities
├── validators.ts         # Validation logic and utilities
├── useImport.ts          # React hook for import state management
├── ImportDialog.tsx      # Main UI component
├── ImportExample.tsx     # Usage example
├── index.ts              # Public API exports
├── README.md             # User documentation
└── IMPLEMENTATION.md     # This file
```

## Architecture

### 1. Type System (`types.ts`)

**Purpose**: Defines all TypeScript interfaces for type safety

**Key Types**:
- `ImportFormat`: Supported file formats ('csv' | 'xlsx' | 'xls')
- `ImportConfig`: Configuration options for parsing
- `ParsedData`: Structure of parsed file data
- `ColumnMapping`: Maps source columns to target columns
- `ValidationSchema`: Defines validation rules
- `ImportResult`: Complete import operation result
- `ImportState`: State machine for import process
- `ImportProgress`: Progress tracking information

**Design Decisions**:
- Comprehensive type coverage for all operations
- Extensible interfaces for future enhancements
- Clear separation between config, data, and results

### 2. File Parsers (`parsers.ts`)

**Purpose**: Parse CSV and Excel files into a common format

**Key Functions**:
- `parseCSV()`: CSV parsing with Papa Parse fallback
- `parseExcel()`: Excel parsing using XLSX library
- `parseFile()`: Auto-detect format and parse
- `validateFile()`: Pre-parsing file validation
- `detectFormat()`: Extract format from filename

**Design Decisions**:
- Graceful fallback for Papa Parse (optional dependency)
- Unified `ParsedData` structure regardless of format
- Streaming approach for large files
- Performance tracking with `performance.now()`

**Dependencies**:
- `xlsx`: Required for Excel support
- `papaparse`: Optional for better CSV parsing

### 3. Validators (`validators.ts`)

**Purpose**: Validate imported data against schemas

**Key Functions**:
- `validateField()`: Single field validation
- `validateRow()`: Complete row validation
- `validateImport()`: Validate entire dataset
- `getAllErrors()`: Flatten errors for display
- `filterValidRows()`: Extract valid data
- `getValidationSummary()`: Create summary

**Validation Types**:
- Type validation (string, number, boolean, date, email, url, phone)
- Range validation (min/max)
- Pattern matching (regex)
- Enum validation
- Custom validators

**Design Decisions**:
- Composable validation functions
- Clear error messages
- Support for warnings (non-blocking)
- Performance-optimized for large datasets

### 4. Import Hook (`useImport.ts`)

**Purpose**: Manage import state and orchestrate the process

**State Management**:
- File selection and validation
- Parsing progress
- Column mapping (auto-detect + manual)
- Data validation
- Import execution

**Key Features**:
- Auto-detect column mappings using fuzzy matching
- Real-time progress updates
- Error recovery
- Reset functionality

**Design Decisions**:
- Single source of truth for import state
- Callback-based progress updates
- Separation of concerns (parsing, validation, import)
- Memoized callbacks for performance

### 5. Import Dialog (`ImportDialog.tsx`)

**Purpose**: Comprehensive UI for the import process

**UI Sections**:
1. File upload (drag & drop + file picker)
2. File info display
3. Column mapping interface
4. Data preview (first 5 rows)
5. Validation results
6. Progress tracking
7. Error/warning display

**Design Decisions**:
- Progressive disclosure (show sections as needed)
- Clear visual feedback for each state
- Accessible drag-and-drop
- Responsive layout
- Tailwind CSS for styling

**Components Used**:
- Dialog (from primitives)
- Button (with loading state)
- Progress (for import progress)
- SelectPortal (for column mapping)

## Import Flow

```
1. User selects file
   ├─> Validate file (size, format)
   └─> Parse file
       ├─> Extract headers
       ├─> Parse rows
       └─> Create ParsedData

2. Auto-detect column mappings
   ├─> Exact match
   ├─> Case-insensitive match
   └─> Fuzzy match (normalized)

3. User reviews/adjusts mappings
   └─> Update column mappings

4. Validate data (if schema provided)
   ├─> Validate each row
   ├─> Collect errors
   └─> Generate warnings

5. User confirms import
   ├─> Apply column mappings
   ├─> Filter valid rows
   └─> Return ImportResult

6. Consumer handles result
   ├─> Save valid data
   └─> Display errors/warnings
```

## State Machine

```
idle → uploading → parsing → mapping → validating → importing → complete
                                                                    ↓
                                                                  error
```

## Performance Optimizations

1. **Chunk Processing**: Process large files in chunks
2. **Memoization**: Memoize expensive operations in hook
3. **Virtual Scrolling**: Preview table uses virtual scrolling for large datasets
4. **Lazy Validation**: Validate only when needed
5. **Web Workers**: Consider for very large files (future enhancement)

## Error Handling

### Three Levels of Issues:

1. **Blocking Errors**: Prevent import
   - File validation failures
   - Parse errors
   - Required field violations
   - Type mismatches

2. **Validation Errors**: Row-level issues
   - Failed validation rules
   - Invalid data types
   - Range violations

3. **Warnings**: Non-blocking issues
   - Empty optional fields
   - Data quality concerns
   - Format inconsistencies

## Testing Considerations

### Unit Tests:
- Parser functions with various file formats
- Validation functions with edge cases
- Column mapping auto-detection
- Error message generation

### Integration Tests:
- Full import flow
- Error recovery
- Progress updates
- State transitions

### E2E Tests:
- User interaction flow
- File upload
- Column mapping UI
- Import completion

## Future Enhancements

1. **Advanced Features**:
   - Web Worker for parsing large files
   - Undo/redo for column mappings
   - Import templates/presets
   - Bulk import from multiple files
   - Import history/audit log

2. **Validation**:
   - Cross-field validation
   - Conditional validation
   - Async validation (e.g., check for duplicates)
   - Validation rule builder UI

3. **UX Improvements**:
   - Preview more rows (pagination)
   - Export validation errors as CSV
   - Dark mode support
   - Keyboard shortcuts
   - Drag-and-drop column mapping

4. **Performance**:
   - Streaming parser for very large files
   - Progressive import (import in batches)
   - Background processing
   - Memory optimization

## Integration with DataTable

The import system is designed to work seamlessly with DataTable:

```tsx
<DataTable
  data={importedData}
  columns={columns}
  // ... other props
/>

<ImportDialog
  columns={columns} // Same columns as DataTable
  onImport={(result) => {
    setImportedData(result.data)
  }}
/>
```

## Dependencies

### Required:
- `xlsx`: ^0.18.5 (Excel parsing)
- React: ^18.0.0
- TypeScript: ^5.0.0

### Optional:
- `papaparse`: ^5.5.3 (Better CSV parsing)
- `@types/papaparse`: ^5.5.0 (Type definitions)

### Internal:
- `@erp/ui/primitives` (Dialog, Button, Progress, SelectPortal)
- `@erp/ui/lib/utils` (cn utility)

## API Summary

### Components:
- `ImportDialog`: Main import UI component

### Hooks:
- `useImport`: Import state management

### Functions:
- `parseCSV`: Parse CSV files
- `parseExcel`: Parse Excel files
- `parseFile`: Auto-detect and parse
- `validateFile`: Pre-parsing validation
- `validateRow`: Validate single row
- `validateImport`: Validate entire dataset
- `filterValidRows`: Extract valid data
- `getAllErrors`: Get all validation errors

### Types:
- `ImportResult`: Import operation result
- `ValidationSchema`: Validation rules
- `ColumnMapping`: Column mapping definition
- `ImportConfig`: Parser configuration
- `ImportDialogProps`: Dialog component props

## Configuration Options

### ImportDialog Props:
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnConfig[]
  validationSchema?: ValidationSchema
  onImport: (result: ImportResult) => void
  allowedFormats?: ['csv', 'xlsx', 'xls']
  maxFileSize?: number // bytes
  defaultConfig?: Partial<ImportConfig>
  title?: string
  description?: string
}
```

### ImportConfig Options:
```typescript
{
  format: 'csv' | 'xlsx' | 'xls'
  delimiter?: string // default: ','
  hasHeader?: boolean // default: true
  dateFormat?: string // default: 'YYYY-MM-DD'
  encoding?: string // default: 'UTF-8'
  skipEmptyRows?: boolean // default: true
  maxRows?: number // default: undefined
  trimValues?: boolean // default: true
}
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- IE11: Not supported (use polyfills)

## License

Part of TopSteel ERP - UNLICENSED
