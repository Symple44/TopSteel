/**
 * Data Adapter Examples
 * Comprehensive examples demonstrating all adapter types and usage patterns
 */

'use client'

import { useMemo, useState } from 'react'
import {
  LocalAdapter,
  RestAdapter,
  GraphQLAdapter,
  SupabaseAdapter,
  useDataAdapter,
} from './index'
import type { DataQuery } from './types'

// ==============================================================================
// Example Data Types
// ==============================================================================

interface User extends Record<string, unknown> {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  status: 'active' | 'inactive'
  createdAt: string
}

// ==============================================================================
// Example 1: Local Adapter - In-Memory Data
// ==============================================================================

const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-02-20T14:30:00Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'moderator',
    status: 'inactive',
    createdAt: '2024-03-10T09:15:00Z',
  },
]

export function LocalAdapterExample() {
  const adapter = useMemo(
    () =>
      new LocalAdapter<User>({
        data: sampleUsers,
        keyField: 'id',
        searchFields: ['name', 'email'],
        caseInsensitiveSearch: true,
        debug: true,
      }),
    []
  )

  const {
    data,
    total,
    isLoading,
    error,
    page,
    pageSize,
    refetch,
    create,
    update,
    deleteItem,
  } = useDataAdapter(adapter, {
    page: 1,
    pageSize: 10,
  })

  const handleCreate = async () => {
    const newUser = await create({
      name: 'New User',
      email: 'new@example.com',
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    })
    console.log('Created user:', newUser)
  }

  const handleUpdate = async (id: string) => {
    const updated = await update(id, {
      status: 'inactive',
    })
    console.log('Updated user:', updated)
  }

  const handleDelete = async (id: string) => {
    const success = await deleteItem(id)
    console.log('Delete success:', success)
  }

  const handleSearch = async (search: string) => {
    await refetch({ search })
  }

  const handleFilter = async (role: string) => {
    await refetch({ filters: { role } })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Local Adapter Example</h2>

      <div className="flex gap-2">
        <button onClick={handleCreate} className="px-4 py-2 bg-blue-500 text-white rounded">
          Create User
        </button>
        <input
          type="text"
          placeholder="Search users..."
          onChange={(e) => handleSearch(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        <select onChange={(e) => handleFilter(e.target.value)} className="px-4 py-2 border rounded">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
        </select>
      </div>

      {error && <div className="text-red-500">Error: {error.message}</div>}

      <div className="text-sm text-gray-600">
        Showing {data.length} of {total} users
      </div>

      <div className="space-y-2">
        {data.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded">
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-gray-600">{user.email}</div>
              <div className="text-xs text-gray-500">
                {user.role} - {user.status}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate(user.id)}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
              >
                Toggle Status
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==============================================================================
// Example 2: REST Adapter - Standard REST API
// ==============================================================================

export function RestAdapterExample() {
  const adapter = useMemo(
    () =>
      new RestAdapter<User>({
        baseUrl: '/api/users',
        endpoints: {
          fetch: '',
          create: '',
          update: '/:id',
          delete: '/:id',
          bulkDelete: '/bulk-delete',
        },
        headers: {
          'X-Custom-Header': 'value',
        },
        queryParams: {
          page: 'page',
          pageSize: 'limit',
          sort: 'sort',
          search: 'q',
        },
        debug: true,
      }),
    []
  )

  const { data, isLoading, error, refetch, create } = useDataAdapter(
    adapter,
    {
      page: 1,
      pageSize: 20,
    },
    {
      onSuccess: (operation, data) => {
        console.log(`${operation} succeeded:`, data)
      },
      onError: (error) => {
        console.error('Operation failed:', error)
      },
    }
  )

  const handleSortByName = () => {
    refetch({
      sort: [{ column: 'name', direction: 'asc' }],
    })
  }

  const handleFilterActive = () => {
    refetch({
      filters: { status: 'active' },
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">REST Adapter Example</h2>

      <div className="flex gap-2">
        <button onClick={handleSortByName} className="px-4 py-2 bg-blue-500 text-white rounded">
          Sort by Name
        </button>
        <button onClick={handleFilterActive} className="px-4 py-2 bg-green-500 text-white rounded">
          Filter Active
        </button>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">Error: {error.message}</div>}

      {/* Render data here */}
    </div>
  )
}

// ==============================================================================
// Example 3: REST Adapter - JSON:API Convention
// ==============================================================================

export function RestAdapterJsonApiExample() {
  const adapter = useMemo(
    () =>
      new RestAdapter<User>({
        baseUrl: '/api/v1',
        convention: 'jsonapi',
        endpoints: {
          fetch: '/users',
          create: '/users',
          update: '/users/:id',
          delete: '/users/:id',
        },
        authToken: 'your-jwt-token',
      }),
    []
  )

  const { data, isLoading } = useDataAdapter(adapter)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">REST Adapter (JSON:API) Example</h2>
      {/* Render data here */}
    </div>
  )
}

// ==============================================================================
// Example 4: REST Adapter - Custom Query/Response Transformation
// ==============================================================================

export function RestAdapterCustomTransformExample() {
  const adapter = useMemo(
    () =>
      new RestAdapter<User>({
        baseUrl: '/api/users',
        transformQuery: (query) => {
          // Custom query parameter mapping
          const params: Record<string, unknown> = {}

          if (query.page) params.p = query.page
          if (query.pageSize) params.size = query.pageSize
          if (query.search) params.q = query.search
          if (query.sort && query.sort.length > 0) {
            params.sortBy = query.sort.map((s) => s.column).join(',')
            params.order = query.sort.map((s) => s.direction).join(',')
          }

          return params
        },
        transformResponse: (response: any) => ({
          data: response.results,
          total: response.totalCount,
          page: response.currentPage,
          pageSize: response.itemsPerPage,
          metadata: {
            hasNextPage: response.hasNext,
            hasPrevPage: response.hasPrev,
          },
        }),
      }),
    []
  )

  const { data, metadata } = useDataAdapter(adapter)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">REST Adapter (Custom Transform) Example</h2>
      {metadata && (
        <div className="text-sm">
          Has Next: {String(metadata.hasNextPage)} | Has Prev: {String(metadata.hasPrevPage)}
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// Example 5: GraphQL Adapter - Basic Usage
// ==============================================================================

export function GraphQLAdapterExample() {
  const adapter = useMemo(
    () =>
      new GraphQLAdapter<User>({
        endpoint: '/graphql',
        authToken: 'your-jwt-token',
        typeName: 'User',
        queries: {
          fetch: `
            query FetchUsers($page: Int, $pageSize: Int, $search: String, $filters: FilterInput) {
              users(page: $page, pageSize: $pageSize, search: $search, filters: $filters) {
                data {
                  id
                  name
                  email
                  role
                  status
                  createdAt
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
                status
                createdAt
              }
            }
          `,
          update: `
            mutation UpdateUser($id: ID!, $input: UserInput!) {
              updateUser(id: $id, input: $input) {
                id
                name
                email
                role
                status
                createdAt
              }
            }
          `,
          delete: `
            mutation DeleteUser($id: ID!) {
              deleteUser(id: $id)
            }
          `,
        },
        debug: true,
      }),
    []
  )

  const { data, isLoading, create, update } = useDataAdapter(adapter)

  const handleCreateUser = async () => {
    await create({
      name: 'GraphQL User',
      email: 'graphql@example.com',
      role: 'user',
      status: 'active',
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">GraphQL Adapter Example</h2>

      <button onClick={handleCreateUser} className="px-4 py-2 bg-blue-500 text-white rounded">
        Create User (GraphQL)
      </button>

      {isLoading && <div>Loading...</div>}
      {/* Render data here */}
    </div>
  )
}

// ==============================================================================
// Example 6: Supabase Adapter - Basic Usage
// ==============================================================================

export function SupabaseAdapterExample() {
  // Note: You need to import and initialize Supabase client
  // import { createClient } from '@supabase/supabase-js'
  // const supabase = createClient('YOUR_URL', 'YOUR_KEY')

  const supabaseClient = {} as any // Placeholder

  const adapter = useMemo(
    () =>
      new SupabaseAdapter<User>({
        client: supabaseClient,
        table: 'users',
        selectColumns: ['id', 'name', 'email', 'role', 'status', 'created_at'],
        debug: true,
      }),
    [supabaseClient]
  )

  const { data, isLoading, create, update, deleteItem } = useDataAdapter(adapter, {
    page: 1,
    pageSize: 10,
  })

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Supabase Adapter Example</h2>
      {/* Render data here */}
    </div>
  )
}

// ==============================================================================
// Example 7: Supabase Adapter - Real-time Updates
// ==============================================================================

export function SupabaseAdapterRealtimeExample() {
  const supabaseClient = {} as any // Placeholder

  const adapter = useMemo(
    () =>
      new SupabaseAdapter<User>({
        client: supabaseClient,
        table: 'users',
        realtime: true,
        realtimeChannel: 'users_changes',
        debug: true,
      }),
    [supabaseClient]
  )

  const { data, isLoading } = useDataAdapter(
    adapter,
    { page: 1, pageSize: 10 },
    {
      enableRealtime: true,
      onDataChange: (response) => {
        console.log('Data updated in real-time:', response)
      },
    }
  )

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Supabase Adapter (Real-time) Example</h2>
      <div className="text-sm text-green-600">Real-time updates enabled</div>
      {/* Render data here */}
    </div>
  )
}

// ==============================================================================
// Example 8: Advanced Filtering
// ==============================================================================

export function AdvancedFilteringExample() {
  const adapter = useMemo(
    () =>
      new LocalAdapter<User>({
        data: sampleUsers,
      }),
    []
  )

  const { data, refetch } = useDataAdapter(adapter)

  const handleComplexFilter = () => {
    // Multiple filters
    refetch({
      filters: {
        role: ['admin', 'moderator'], // IN filter
        status: 'active', // Exact match
      },
      sort: [
        { column: 'role', direction: 'asc' },
        { column: 'name', direction: 'desc' },
      ],
      search: 'john',
    })
  }

  const handleDateRangeFilter = () => {
    refetch({
      filters: {
        createdAt: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Advanced Filtering Example</h2>

      <div className="flex gap-2">
        <button onClick={handleComplexFilter} className="px-4 py-2 bg-blue-500 text-white rounded">
          Complex Filter
        </button>
        <button
          onClick={handleDateRangeFilter}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Date Range Filter
        </button>
      </div>

      <div className="space-y-2">
        {data.map((user) => (
          <div key={user.id} className="p-4 border rounded">
            {user.name} - {user.role}
          </div>
        ))}
      </div>
    </div>
  )
}

// ==============================================================================
// Example 9: Pagination Controls
// ==============================================================================

export function PaginationExample() {
  const adapter = useMemo(
    () =>
      new LocalAdapter<User>({
        data: [...Array(100)].map((_, i) => ({
          id: String(i + 1),
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: ['admin', 'user', 'moderator'][i % 3] as any,
          status: i % 2 === 0 ? 'active' : 'inactive',
          createdAt: new Date().toISOString(),
        })),
      }),
    []
  )

  const { data, page, pageSize, total, refetch } = useDataAdapter(adapter, {
    page: 1,
    pageSize: 10,
  })

  const totalPages = Math.ceil(total / pageSize)

  const handlePrevPage = () => {
    if (page > 1) {
      refetch({ page: page - 1 })
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      refetch({ page: page + 1 })
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    refetch({ pageSize: newSize, page: 1 })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Pagination Example</h2>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages} ({total} total items)
        </span>

        <button
          onClick={handleNextPage}
          disabled={page === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>

        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      <div className="space-y-2">
        {data.map((user) => (
          <div key={user.id} className="p-4 border rounded">
            {user.name} - {user.email}
          </div>
        ))}
      </div>
    </div>
  )
}
