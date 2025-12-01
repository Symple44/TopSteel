# Migration Guide - DataTable Adapters

## Overview

This guide helps you migrate existing DataTable implementations to use the new adapter pattern.

## Benefits of Migration

- **Separation of Concerns**: Data fetching logic separated from UI
- **Reusability**: Adapters can be shared across components
- **Type Safety**: Full TypeScript support
- **Consistency**: Standardized API across different data sources
- **Testing**: Easier to mock and test
- **Error Handling**: Comprehensive error handling built-in
- **Real-time**: Optional real-time updates (Supabase)

---

## Migration Scenarios

### Scenario 1: From Local State

**Before:**
```tsx
function UsersTable() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Manual filtering
  const filteredData = useMemo(() => {
    return data.filter(user => {
      // Complex filtering logic
    })
  }, [data, filters])

  // Manual sorting
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      // Complex sorting logic
    })
  }, [filteredData, sortColumn, sortDirection])

  // Manual pagination
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, page, pageSize])

  return <DataTable data={paginatedData} loading={loading} ... />
}
```

**After:**
```tsx
import { LocalAdapter, useDataAdapter } from '@erp/ui/data-display'

function UsersTable() {
  const adapter = useMemo(
    () => new LocalAdapter<User>({
      data: initialUsers,
      keyField: 'id',
      searchFields: ['name', 'email'],
    }),
    []
  )

  const { data, isLoading, refetch } = useDataAdapter(adapter, {
    page: 1,
    pageSize: 10,
  })

  return <DataTable data={data} loading={isLoading} ... />
}
```

**Benefits:**
- Removed ~50 lines of boilerplate
- Built-in filtering, sorting, pagination
- Type-safe operations
- Less complexity

---

### Scenario 2: From fetch/axios Calls

**Before:**
```tsx
function UsersTable() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  const fetchUsers = useCallback(async (query: QueryParams) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
        sort: query.sort?.join(',') || '',
        search: query.search || '',
      })

      const response = await fetch(`/api/users?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch')
      }

      const result = await response.json()
      setData(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers({ page: 1, pageSize: 10 })
  }, [fetchUsers])

  const handleCreate = async (user: Partial<User>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })

      if (!response.ok) throw new Error('Failed to create')

      await fetchUsers({ page: 1, pageSize: 10 })
    } catch (err) {
      // Handle error
    }
  }

  return <DataTable data={data} loading={loading} error={error?.message} ... />
}
```

**After:**
```tsx
import { RestAdapter, useDataAdapter } from '@erp/ui/data-display'

function UsersTable() {
  const adapter = useMemo(
    () => new RestAdapter<User>({
      baseUrl: '/api/users',
      queryParams: {
        page: 'page',
        pageSize: 'pageSize',
        sort: 'sort',
        search: 'search',
      },
    }),
    []
  )

  const { data, isLoading, error, create } = useDataAdapter(adapter, {
    page: 1,
    pageSize: 10,
  })

  const handleCreate = async (user: Partial<User>) => {
    await create(user)
    // Auto-refetch handled by hook
  }

  return <DataTable data={data} loading={isLoading} error={error?.message} ... />
}
```

**Benefits:**
- Removed ~40 lines of fetch logic
- Automatic refetch after mutations
- Better error handling
- Built-in loading states
- Timeout handling

---

### Scenario 3: From React Query / SWR

**Before:**
```tsx
import { useQuery, useMutation } from '@tanstack/react-query'

function UsersTable() {
  const [queryParams, setQueryParams] = useState({ page: 1, pageSize: 10 })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/users?${new URLSearchParams({
        page: String(queryParams.page),
        pageSize: String(queryParams.pageSize),
      })}`)
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (user: Partial<User>) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      })
      return response.json()
    },
    onSuccess: () => refetch(),
  })

  return (
    <DataTable
      data={data?.data || []}
      loading={isLoading}
      onPaginationChange={(config) => {
        setQueryParams({ page: config.page, pageSize: config.pageSize })
      }}
    />
  )
}
```

**After:**
```tsx
import { RestAdapter, useDataAdapter } from '@erp/ui/data-display'

function UsersTable() {
  const adapter = useMemo(
    () => new RestAdapter<User>({ baseUrl: '/api/users' }),
    []
  )

  const { data, isLoading, error, refetch, create } = useDataAdapter(
    adapter,
    { page: 1, pageSize: 10 }
  )

  return (
    <DataTable
      data={data}
      loading={isLoading}
      onPaginationChange={(config) => {
        refetch({ page: config.page, pageSize: config.pageSize })
      }}
    />
  )
}
```

**Notes:**
- Can still use React Query if needed
- Adapter pattern complements React Query
- Consider keeping React Query for caching if needed

---

### Scenario 4: From GraphQL Client

**Before:**
```tsx
import { useQuery, useMutation, gql } from '@apollo/client'

const GET_USERS = gql`
  query GetUsers($page: Int, $pageSize: Int) {
    users(page: $page, pageSize: $pageSize) {
      data { id name email }
      total
      page
      pageSize
    }
  }
`

const CREATE_USER = gql`
  mutation CreateUser($input: UserInput!) {
    createUser(input: $input) { id name email }
  }
`

function UsersTable() {
  const { data, loading, error, refetch } = useQuery(GET_USERS, {
    variables: { page: 1, pageSize: 10 },
  })

  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: () => refetch(),
  })

  return (
    <DataTable
      data={data?.users?.data || []}
      loading={loading}
      onAddNew={() => createUser({ variables: { input: {...} } })}
    />
  )
}
```

**After:**
```tsx
import { GraphQLAdapter, useDataAdapter } from '@erp/ui/data-display'

function UsersTable() {
  const adapter = useMemo(
    () => new GraphQLAdapter<User>({
      endpoint: '/graphql',
      typeName: 'User',
      queries: {
        fetch: GET_USERS, // Can reuse existing queries
      },
      mutations: {
        create: CREATE_USER,
      },
    }),
    []
  )

  const { data, isLoading, error, create } = useDataAdapter(adapter, {
    page: 1,
    pageSize: 10,
  })

  return (
    <DataTable
      data={data}
      loading={isLoading}
      onAddNew={() => create({ ... })}
    />
  )
}
```

---

### Scenario 5: From Supabase Client

**Before:**
```tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function UsersTable() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: users, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .range(from, to)

    if (error) {
      console.error(error)
    } else {
      setData(users || [])
      setTotal(count || 0)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreate = async (user: Partial<User>) => {
    const { error } = await supabase.from('users').insert(user)
    if (!error) {
      fetchUsers()
    }
  }

  return <DataTable data={data} loading={loading} onAddNew={handleCreate} />
}
```

**After:**
```tsx
import { SupabaseAdapter, useDataAdapter } from '@erp/ui/data-display'
import { supabase } from '@/lib/supabase'

function UsersTable() {
  const adapter = useMemo(
    () => new SupabaseAdapter<User>({
      client: supabase,
      table: 'users',
      realtime: true, // Enable real-time updates!
    }),
    []
  )

  const { data, isLoading, create } = useDataAdapter(
    adapter,
    { page: 1, pageSize: 10 },
    { enableRealtime: true } // Auto-update on changes
  )

  return <DataTable data={data} loading={isLoading} onAddNew={create} />
}
```

**Benefits:**
- Real-time updates out of the box
- Automatic cleanup
- Better error handling
- Less boilerplate

---

## Step-by-Step Migration

### Step 1: Choose Your Adapter

| Current Implementation | Recommended Adapter |
|------------------------|---------------------|
| Local state / static data | `LocalAdapter` |
| fetch() / axios / REST API | `RestAdapter` |
| Apollo Client / GraphQL | `GraphQLAdapter` |
| Supabase client | `SupabaseAdapter` |

### Step 2: Install Dependencies (if needed)

Most dependencies are already in `@erp/ui`. For Supabase:

```bash
pnpm add @supabase/supabase-js
```

### Step 3: Create Adapter Instance

```tsx
import { RestAdapter } from '@erp/ui/data-display'

const adapter = useMemo(
  () => new RestAdapter<YourType>({
    baseUrl: '/api/your-endpoint',
    // ... configuration
  }),
  [] // Empty deps - create once
)
```

### Step 4: Replace Data Fetching

Remove manual fetch logic and use the hook:

```tsx
const {
  data,
  isLoading,
  error,
  refetch,
  create,
  update,
  deleteItem,
} = useDataAdapter(adapter, {
  page: 1,
  pageSize: 10,
})
```

### Step 5: Update DataTable Props

```tsx
<DataTable
  data={data}
  loading={isLoading}
  error={error?.message}
  // ... other props
/>
```

### Step 6: Migrate CRUD Operations

Replace manual API calls with adapter methods:

```tsx
// Before
const handleCreate = async (item) => {
  const response = await fetch('/api/items', {
    method: 'POST',
    body: JSON.stringify(item),
  })
  await fetchItems() // Manual refetch
}

// After
const handleCreate = async (item) => {
  await create(item) // Auto-refetch
}
```

### Step 7: Test Thoroughly

- Test pagination
- Test filtering
- Test sorting
- Test CRUD operations
- Test error states
- Test loading states

---

## Common Challenges

### Challenge 1: Custom API Response Format

**Solution:** Use custom transformer

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

### Challenge 2: Custom Query Parameters

**Solution:** Use custom query transformer

```tsx
const adapter = new RestAdapter({
  baseUrl: '/api/users',
  transformQuery: (query) => ({
    p: query.page,
    size: query.pageSize,
    q: query.search,
  }),
})
```

### Challenge 3: Authentication

**Solution:** Pass auth token

```tsx
const adapter = new RestAdapter({
  baseUrl: '/api/users',
  authToken: session.token,
})

// Or update dynamically
adapter.setAuthToken(newToken)
```

### Challenge 4: Complex Filtering

**Solution:** Use custom filter function (LocalAdapter)

```tsx
const adapter = new LocalAdapter({
  data: users,
  customFilter: (item, filters) => {
    // Your custom filtering logic
    return true // or false
  },
})
```

---

## Rollback Plan

If migration causes issues:

1. Keep old implementation alongside new one
2. Use feature flag to toggle between implementations
3. Gradually migrate page by page
4. Monitor errors and performance

```tsx
const USE_ADAPTERS = process.env.NEXT_PUBLIC_USE_ADAPTERS === 'true'

function UsersTable() {
  if (USE_ADAPTERS) {
    // New implementation with adapters
  } else {
    // Old implementation
  }
}
```

---

## Performance Considerations

### Before Migration
- Measure current load times
- Note bundle size
- Monitor re-renders

### After Migration
- Compare load times
- Check bundle size (adapters add ~15KB)
- Verify re-renders are minimized
- Use React DevTools Profiler

### Optimization Tips

```tsx
// 1. Memoize adapter
const adapter = useMemo(() => new RestAdapter(...), [])

// 2. Debounce search
const { refetch } = useDataAdapter(adapter)
const debouncedSearch = useMemo(
  () => debounce((term) => refetch({ search: term }), 300),
  [refetch]
)

// 3. Disable auto-fetch if not needed
const { data } = useDataAdapter(adapter, {}, {
  autoFetch: false,
  refetchOnQueryChange: false,
})
```

---

## Checklist

- [ ] Choose appropriate adapter
- [ ] Create adapter instance with useMemo
- [ ] Replace fetch logic with useDataAdapter
- [ ] Update component state management
- [ ] Migrate CRUD operations
- [ ] Test all functionality
- [ ] Update error handling
- [ ] Monitor performance
- [ ] Update documentation
- [ ] Remove old code

---

## Need Help?

- Check `README.md` for full documentation
- Review `examples.tsx` for working examples
- Check `QUICK_START.md` for quick reference
- Contact: engineering@topsteel.tech

---

**Last Updated**: 2025-11-30
