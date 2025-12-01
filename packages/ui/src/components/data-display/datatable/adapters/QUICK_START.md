# Quick Start Guide - DataTable Adapters

## 🚀 30-Second Setup

### Local Adapter (Testing/Prototyping)

```tsx
import { LocalAdapter, useDataAdapter } from '@erp/ui/data-display'

const adapter = new LocalAdapter({
  data: myData,
  keyField: 'id',
})

const { data, isLoading } = useDataAdapter(adapter)
```

### REST API

```tsx
import { RestAdapter, useDataAdapter } from '@erp/ui/data-display'

const adapter = new RestAdapter({
  baseUrl: '/api/users',
  authToken: token,
})

const { data, isLoading, create, update, deleteItem } = useDataAdapter(adapter)
```

### GraphQL

```tsx
import { GraphQLAdapter, useDataAdapter } from '@erp/ui/data-display'

const adapter = new GraphQLAdapter({
  endpoint: '/graphql',
  typeName: 'User',
})

const { data, isLoading } = useDataAdapter(adapter)
```

### Supabase

```tsx
import { SupabaseAdapter, useDataAdapter } from '@erp/ui/data-display'

const adapter = new SupabaseAdapter({
  client: supabase,
  table: 'users',
})

const { data, isLoading } = useDataAdapter(adapter)
```

## 🎯 Common Operations

### Filtering

```tsx
const { refetch } = useDataAdapter(adapter)

// Simple filter
refetch({ filters: { role: 'admin' } })

// Multiple values
refetch({ filters: { role: ['admin', 'moderator'] } })

// Range filter
refetch({ filters: { age: { min: 18, max: 65 } } })
```

### Sorting

```tsx
// Single column
refetch({ sort: [{ column: 'name', direction: 'asc' }] })

// Multiple columns
refetch({
  sort: [
    { column: 'role', direction: 'asc' },
    { column: 'name', direction: 'desc' },
  ],
})
```

### Searching

```tsx
refetch({ search: 'john doe' })
```

### Pagination

```tsx
refetch({ page: 2, pageSize: 20 })
```

### CRUD Operations

```tsx
const { create, update, deleteItem, bulkDelete } = useDataAdapter(adapter)

// Create
await create({ name: 'New User', email: 'new@example.com' })

// Update
await update('user-id', { status: 'active' })

// Delete single
await deleteItem('user-id')

// Delete multiple
await bulkDelete(['id1', 'id2', 'id3'])
```

## 🔧 Configuration Cheatsheet

### LocalAdapter

```tsx
new LocalAdapter({
  data: [],                        // Required: Initial data
  keyField: 'id',                  // Optional: Key field (default: 'id')
  searchFields: ['name', 'email'], // Optional: Fields to search
  caseInsensitiveSearch: true,     // Optional: Case-insensitive (default: true)
  debug: false,                    // Optional: Debug logging (default: false)
})
```

### RestAdapter

```tsx
new RestAdapter({
  baseUrl: '/api/users',           // Required: Base URL
  endpoints: {                     // Optional: Custom endpoints
    fetch: '',
    create: '',
    update: '/:id',
    delete: '/:id',
    bulkDelete: '/bulk',
  },
  authToken: 'token',              // Optional: Auth token
  headers: { 'X-Custom': 'value' },// Optional: Custom headers
  convention: 'rest',              // Optional: 'rest' | 'jsonapi' | 'custom'
  queryParams: {                   // Optional: Query param mapping
    page: 'page',
    pageSize: 'limit',
    sort: 'sort',
    search: 'q',
  },
  debug: false,
})
```

### GraphQLAdapter

```tsx
new GraphQLAdapter({
  endpoint: '/graphql',            // Required: GraphQL endpoint
  typeName: 'User',                // Optional: Type name for auto-generation
  authToken: 'token',              // Optional: Auth token
  queries: {                       // Optional: Custom queries
    fetch: 'query { ... }',
  },
  mutations: {                     // Optional: Custom mutations
    create: 'mutation { ... }',
    update: 'mutation { ... }',
    delete: 'mutation { ... }',
  },
  debug: false,
})
```

### SupabaseAdapter

```tsx
new SupabaseAdapter({
  client: supabase,                // Required: Supabase client
  table: 'users',                  // Required: Table name
  selectColumns: ['id', 'name'],   // Optional: Columns to select
  realtime: false,                 // Optional: Enable real-time
  realtimeChannel: 'changes',      // Optional: Channel name
  debug: false,
})
```

## 🎨 Hook Options

```tsx
useDataAdapter(adapter, initialQuery, {
  autoFetch: true,              // Auto-fetch on mount
  refetchOnQueryChange: true,   // Refetch on query change
  enableRealtime: false,        // Enable real-time updates
  onDataChange: (data) => {},   // Data change callback
  onError: (error) => {},       // Error callback
  onSuccess: (op, data) => {},  // Success callback
})
```

## 📦 Return Values

```tsx
const {
  data,           // T[] - Current data
  total,          // number - Total items
  page,           // number - Current page
  pageSize,       // number - Items per page
  isLoading,      // boolean - Loading state
  error,          // Error | null - Error state
  metadata,       // Record<string, unknown> - Optional metadata
  refetch,        // (query?) => Promise<void> - Refetch function
  create,         // (item) => Promise<T | null> - Create function
  update,         // (id, item) => Promise<T | null> - Update function
  deleteItem,     // (id) => Promise<boolean> - Delete function
  bulkDelete,     // (ids) => Promise<boolean> - Bulk delete function
  setQuery,       // (query) => void - Update query
  query,          // DataQuery - Current query
} = useDataAdapter(adapter)
```

## ⚠️ Common Pitfalls

1. **Memoize adapter instances**
   ```tsx
   // ❌ Bad - Creates new adapter on every render
   const adapter = new RestAdapter({ ... })

   // ✅ Good - Memoized adapter
   const adapter = useMemo(() => new RestAdapter({ ... }), [])
   ```

2. **Handle errors**
   ```tsx
   const { error } = useDataAdapter(adapter)
   if (error) {
     // Handle error appropriately
   }
   ```

3. **Clean up real-time subscriptions**
   ```tsx
   // Hook automatically cleans up - no action needed
   // But ensure component unmounts properly
   ```

4. **Type safety**
   ```tsx
   // ✅ Good - Type-safe
   const adapter = new RestAdapter<User>({ ... })

   // ❌ Bad - No type safety
   const adapter = new RestAdapter({ ... })
   ```

## 🔗 Related Documentation

- [Full README](./README.md) - Complete documentation
- [Examples](./examples.tsx) - Working code examples
- [API Reference](./types.ts) - Type definitions

## 💡 Tips

- Use `LocalAdapter` for development and testing
- Use `RestAdapter` for standard REST APIs
- Use `GraphQLAdapter` for GraphQL backends
- Use `SupabaseAdapter` for Supabase with real-time needs
- Always provide TypeScript generics for type safety
- Enable `debug` mode during development
- Use callbacks (`onSuccess`, `onError`) for notifications
- Combine with DataTable component for full functionality
