# DataTable Adapter System

A flexible adapter pattern for abstracting data sources in the DataTable component. Supports multiple backends including REST APIs, GraphQL, Supabase, and local in-memory data.

## Features

- **Multiple Data Sources**: REST API, GraphQL, Supabase, Local/In-Memory
- **Unified Interface**: Consistent API across all adapters
- **Full CRUD Support**: Create, Read, Update, Delete operations
- **Real-time Updates**: Optional real-time subscriptions (Supabase)
- **Type Safety**: Full TypeScript support with generics
- **Flexible Filtering**: Support for complex filters and search
- **Pagination & Sorting**: Built-in support for server-side and client-side operations
- **Error Handling**: Standardized error types and handling
- **React Hook**: `useDataAdapter` hook for easy integration

## Installation

The adapters are part of the `@erp/ui` package and are already available.

```tsx
import {
  LocalAdapter,
  RestAdapter,
  GraphQLAdapter,
  SupabaseAdapter,
  useDataAdapter,
} from '@erp/ui/data-display'
```

## Quick Start

### 1. Local Adapter (In-Memory)

Perfect for prototyping, testing, or small datasets.

```tsx
import { LocalAdapter, useDataAdapter } from '@erp/ui/data-display'

interface User {
  id: string
  name: string
  email: string
  role: string
}

const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
]

function UsersTable() {
  const adapter = new LocalAdapter<User>({
    data: users,
    keyField: 'id',
    searchFields: ['name', 'email'],
    caseInsensitiveSearch: true,
  })

  const { data, isLoading, create, update, deleteItem } = useDataAdapter(adapter)

  return (
    <DataTable
      data={data}
      loading={isLoading}
      columns={columns}
      keyField="id"
    />
  )
}
```

### 2. REST Adapter

For traditional RESTful APIs.

```tsx
import { RestAdapter, useDataAdapter } from '@erp/ui/data-display'

const adapter = new RestAdapter<User>({
  baseUrl: '/api/users',
  endpoints: {
    fetch: '',           // GET /api/users
    create: '',          // POST /api/users
    update: '/:id',      // PUT /api/users/:id
    delete: '/:id',      // DELETE /api/users/:id
    bulkDelete: '/bulk', // POST /api/users/bulk
  },
  authToken: 'your-auth-token',
  queryParams: {
    page: 'page',
    pageSize: 'limit',
    sort: 'sort',
    search: 'q',
  },
})

function UsersTable() {
  const { data, isLoading, refetch, create } = useDataAdapter(adapter, {
    page: 1,
    pageSize: 10,
  })

  const handleCreateUser = async () => {
    await create({ name: 'New User', email: 'new@example.com' })
  }

  return (
    <>
      <button onClick={handleCreateUser}>Add User</button>
      <DataTable data={data} loading={isLoading} columns={columns} />
    </>
  )
}
```

### 3. GraphQL Adapter

For GraphQL APIs with automatic query generation.

```tsx
import { GraphQLAdapter, useDataAdapter } from '@erp/ui/data-display'

const adapter = new GraphQLAdapter<User>({
  endpoint: '/graphql',
  authToken: 'your-auth-token',
  typeName: 'User',
  queries: {
    fetch: `
      query FetchUsers($page: Int, $pageSize: Int, $search: String) {
        users(page: $page, pageSize: $pageSize, search: $search) {
          data {
            id
            name
            email
            role
          }
          total
          page
          pageSize
        }
      }
    `,
  },
  mutations: {
    create: `
      mutation CreateUser($input: UserInput!) {
        createUser(input: $input) {
          id
          name
          email
          role
        }
      }
    `,
  },
})

function UsersTable() {
  const { data, isLoading } = useDataAdapter(adapter, {
    page: 1,
    pageSize: 20,
  })

  return <DataTable data={data} loading={isLoading} columns={columns} />
}
```

### 4. Supabase Adapter

For Supabase backend with real-time support.

```tsx
import { createClient } from '@supabase/supabase-js'
import { SupabaseAdapter, useDataAdapter } from '@erp/ui/data-display'

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_KEY')

const adapter = new SupabaseAdapter<User>({
  client: supabase,
  table: 'users',
  selectColumns: ['id', 'name', 'email', 'role', 'created_at'],
  realtime: true,
  realtimeChannel: 'users_changes',
})

function UsersTable() {
  const { data, isLoading, create, update, deleteItem } = useDataAdapter(
    adapter,
    { page: 1, pageSize: 10 },
    { enableRealtime: true }
  )

  return <DataTable data={data} loading={isLoading} columns={columns} />
}
```

## Advanced Usage

### Custom Query Transformation (REST)

```tsx
const adapter = new RestAdapter({
  baseUrl: '/api/users',
  transformQuery: (query) => ({
    // Custom query parameter mapping
    p: query.page,
    size: query.pageSize,
    sortBy: query.sort?.map(s => s.column).join(','),
    order: query.sort?.map(s => s.direction).join(','),
    q: query.search,
  }),
})
```

### Custom Response Transformation (REST)

```tsx
const adapter = new RestAdapter({
  baseUrl: '/api/users',
  transformResponse: (response: any) => ({
    data: response.results,
    total: response.count,
    page: response.current_page,
    pageSize: response.per_page,
  }),
})
```

### Complex Filtering

```tsx
const { refetch } = useDataAdapter(adapter)

// Filter by role
refetch({
  filters: {
    role: 'admin',
  },
})

// Filter by multiple roles
refetch({
  filters: {
    role: ['admin', 'moderator'],
  },
})

// Range filter
refetch({
  filters: {
    age: { min: 18, max: 65 },
  },
})

// Date range filter
refetch({
  filters: {
    created_at: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    },
  },
})
```

### Multi-Column Sorting

```tsx
refetch({
  sort: [
    { column: 'role', direction: 'asc' },
    { column: 'name', direction: 'desc' },
  ],
})
```

### Error Handling

```tsx
const { error } = useDataAdapter(adapter, undefined, {
  onError: (error) => {
    if (error instanceof AuthenticationError) {
      // Redirect to login
      router.push('/login')
    } else if (error instanceof ValidationError) {
      // Show validation error
      toast.error(error.message)
    } else {
      // Generic error
      toast.error('Something went wrong')
    }
  },
})
```

### Success Callbacks

```tsx
const { create, update, deleteItem } = useDataAdapter(adapter, undefined, {
  onSuccess: (operation, data) => {
    switch (operation) {
      case 'create':
        toast.success('User created successfully')
        break
      case 'update':
        toast.success('User updated successfully')
        break
      case 'delete':
        toast.success('User deleted successfully')
        break
    }
  },
})
```

## API Reference

### DataAdapter Interface

```typescript
interface DataAdapter<T> {
  fetch(query: DataQuery): Promise<DataResponse<T>>
  create?(item: Partial<T>): Promise<T>
  update?(id: string | number, item: Partial<T>): Promise<T>
  delete?(id: string | number): Promise<void>
  bulkDelete?(ids: (string | number)[]): Promise<void>
  subscribe?(callback: (data: T[]) => void): () => void
}
```

### DataQuery

```typescript
interface DataQuery {
  page?: number
  pageSize?: number
  sort?: SortQuery[]
  filters?: Record<string, FilterValue>
  search?: string
  params?: Record<string, unknown>
}
```

### DataResponse

```typescript
interface DataResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  metadata?: Record<string, unknown>
}
```

### useDataAdapter Hook

```typescript
function useDataAdapter<T>(
  adapter: DataAdapter<T>,
  initialQuery?: DataQuery,
  options?: UseDataAdapterOptions
): UseDataAdapterReturn<T>
```

**Options:**
- `autoFetch`: Automatically fetch data on mount (default: `true`)
- `refetchOnQueryChange`: Refetch when query changes (default: `true`)
- `enableRealtime`: Enable real-time updates (default: `false`)
- `onDataChange`: Callback when data changes
- `onError`: Callback when error occurs
- `onSuccess`: Callback when operation succeeds

**Returns:**
- `data`: Current data array
- `total`: Total number of items
- `page`: Current page number
- `pageSize`: Items per page
- `isLoading`: Loading state
- `error`: Error state
- `refetch`: Refetch data function
- `create`: Create item function
- `update`: Update item function
- `deleteItem`: Delete item function
- `bulkDelete`: Bulk delete function
- `setQuery`: Update query function
- `query`: Current query

## Error Types

```typescript
AdapterError          // Base error class
NetworkError          // Network/connection errors
ValidationError       // Validation errors (400)
AuthenticationError   // Auth errors (401, 403)
NotFoundError         // Not found errors (404)
```

## Best Practices

1. **Type Safety**: Always provide generic type parameter for better type inference
   ```tsx
   const adapter = new RestAdapter<User>({ ... })
   ```

2. **Error Handling**: Always handle errors appropriately
   ```tsx
   const { error } = useDataAdapter(adapter)
   if (error) {
     // Handle error
   }
   ```

3. **Cleanup**: The hook automatically cleans up subscriptions and pending requests

4. **Memoization**: For complex adapters, memoize the adapter instance
   ```tsx
   const adapter = useMemo(
     () => new RestAdapter({ baseUrl: '/api/users' }),
     []
   )
   ```

5. **Real-time**: Only enable real-time when needed to avoid unnecessary connections
   ```tsx
   const { data } = useDataAdapter(adapter, query, {
     enableRealtime: shouldEnableRealtime,
   })
   ```

## Examples

See the `examples/` directory for complete working examples:
- Basic CRUD operations
- Advanced filtering
- Real-time updates
- Custom adapters
- Integration with DataTable

## Contributing

When creating custom adapters:

1. Implement the `DataAdapter<T>` interface
2. Handle errors appropriately using adapter error types
3. Add comprehensive JSDoc comments
4. Include unit tests
5. Update this README with usage examples

## License

UNLICENSED - TopSteel ERP Internal Use Only
