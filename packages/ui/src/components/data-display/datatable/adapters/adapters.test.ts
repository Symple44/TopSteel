/**
 * Data Adapter Tests
 * Unit tests for all adapter implementations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalAdapter } from './LocalAdapter'
import { RestAdapter } from './RestAdapter'
import { GraphQLAdapter } from './GraphQLAdapter'
import type { DataQuery } from './types'

// ==============================================================================
// Test Data
// ==============================================================================

interface TestUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  age: number
  createdAt: string
}

const testUsers: TestUser[] = [
  {
    id: '1',
    name: 'Alice Admin',
    email: 'alice@example.com',
    role: 'admin',
    age: 30,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Bob User',
    email: 'bob@example.com',
    role: 'user',
    age: 25,
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Charlie Moderator',
    email: 'charlie@example.com',
    role: 'moderator',
    age: 35,
    createdAt: '2024-03-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Diana User',
    email: 'diana@example.com',
    role: 'user',
    age: 28,
    createdAt: '2024-04-01T00:00:00Z',
  },
]

// ==============================================================================
// LocalAdapter Tests
// ==============================================================================

describe('LocalAdapter', () => {
  let adapter: LocalAdapter<TestUser>

  beforeEach(() => {
    adapter = new LocalAdapter<TestUser>({
      data: testUsers,
      keyField: 'id',
      searchFields: ['name', 'email'],
    })
  })

  describe('fetch', () => {
    it('should fetch all data without query', async () => {
      const result = await adapter.fetch({})

      expect(result.data).toHaveLength(4)
      expect(result.total).toBe(4)
      expect(result.page).toBe(1)
    })

    it('should apply pagination', async () => {
      const result = await adapter.fetch({
        page: 2,
        pageSize: 2,
      })

      expect(result.data).toHaveLength(2)
      expect(result.data[0].id).toBe('3')
      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(2)
      expect(result.total).toBe(4)
    })

    it('should apply sorting (ascending)', async () => {
      const result = await adapter.fetch({
        sort: [{ column: 'name', direction: 'asc' }],
      })

      expect(result.data[0].name).toBe('Alice Admin')
      expect(result.data[1].name).toBe('Bob User')
      expect(result.data[2].name).toBe('Charlie Moderator')
      expect(result.data[3].name).toBe('Diana User')
    })

    it('should apply sorting (descending)', async () => {
      const result = await adapter.fetch({
        sort: [{ column: 'name', direction: 'desc' }],
      })

      expect(result.data[0].name).toBe('Diana User')
      expect(result.data[3].name).toBe('Alice Admin')
    })

    it('should apply multi-column sorting', async () => {
      const result = await adapter.fetch({
        sort: [
          { column: 'role', direction: 'asc' },
          { column: 'name', direction: 'desc' },
        ],
      })

      expect(result.data[0].role).toBe('admin')
      expect(result.data[1].role).toBe('moderator')
    })

    it('should filter by exact match', async () => {
      const result = await adapter.fetch({
        filters: { role: 'admin' },
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].role).toBe('admin')
    })

    it('should filter by array (IN operator)', async () => {
      const result = await adapter.fetch({
        filters: { role: ['admin', 'moderator'] },
      })

      expect(result.data).toHaveLength(2)
    })

    it('should filter by range', async () => {
      const result = await adapter.fetch({
        filters: { age: { min: 26, max: 32 } },
      })

      expect(result.data).toHaveLength(2)
      expect(result.data.every((u) => u.age >= 26 && u.age <= 32)).toBe(true)
    })

    it('should apply global search', async () => {
      const result = await adapter.fetch({
        search: 'alice',
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Alice Admin')
    })

    it('should apply case-insensitive search', async () => {
      const result = await adapter.fetch({
        search: 'ALICE',
      })

      expect(result.data).toHaveLength(1)
    })

    it('should combine filters, search, and sorting', async () => {
      const result = await adapter.fetch({
        filters: { role: 'user' },
        search: 'user',
        sort: [{ column: 'name', direction: 'asc' }],
      })

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.every((u) => u.role === 'user')).toBe(true)
    })
  })

  describe('create', () => {
    it('should create a new item', async () => {
      const newUser: Partial<TestUser> = {
        name: 'Eve User',
        email: 'eve@example.com',
        role: 'user',
        age: 27,
        createdAt: '2024-05-01T00:00:00Z',
      }

      const created = await adapter.create(newUser)

      expect(created.name).toBe('Eve User')
      expect(created.id).toBeDefined()

      const result = await adapter.fetch({})
      expect(result.total).toBe(5)
    })

    it('should preserve provided ID', async () => {
      const newUser: Partial<TestUser> = {
        id: 'custom-id',
        name: 'Custom ID User',
        email: 'custom@example.com',
        role: 'user',
        age: 30,
        createdAt: '2024-05-01T00:00:00Z',
      }

      const created = await adapter.create(newUser)

      expect(created.id).toBe('custom-id')
    })
  })

  describe('update', () => {
    it('should update an existing item', async () => {
      const updated = await adapter.update('1', {
        name: 'Alice Updated',
      })

      expect(updated.name).toBe('Alice Updated')
      expect(updated.id).toBe('1')

      const result = await adapter.fetch({ filters: { id: '1' } })
      expect(result.data[0].name).toBe('Alice Updated')
    })

    it('should throw error for non-existent item', async () => {
      await expect(
        adapter.update('non-existent', { name: 'Test' })
      ).rejects.toThrow()
    })
  })

  describe('delete', () => {
    it('should delete an item', async () => {
      await adapter.delete('1')

      const result = await adapter.fetch({})
      expect(result.total).toBe(3)
      expect(result.data.every((u) => u.id !== '1')).toBe(true)
    })

    it('should throw error for non-existent item', async () => {
      await expect(adapter.delete('non-existent')).rejects.toThrow()
    })
  })

  describe('bulkDelete', () => {
    it('should delete multiple items', async () => {
      await adapter.bulkDelete(['1', '2'])

      const result = await adapter.fetch({})
      expect(result.total).toBe(2)
      expect(result.data.every((u) => u.id !== '1' && u.id !== '2')).toBe(true)
    })
  })

  describe('getData and setData', () => {
    it('should get current data', () => {
      const data = adapter.getData()
      expect(data).toHaveLength(4)
    })

    it('should set new data', async () => {
      const newData = [testUsers[0]]
      adapter.setData(newData)

      const result = await adapter.fetch({})
      expect(result.total).toBe(1)
    })
  })
})

// ==============================================================================
// RestAdapter Tests
// ==============================================================================

describe('RestAdapter', () => {
  let adapter: RestAdapter<TestUser>
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock

    adapter = new RestAdapter<TestUser>({
      baseUrl: '/api/users',
      debug: false,
    })
  })

  describe('fetch', () => {
    it('should fetch data from REST API', async () => {
      const mockResponse = {
        data: testUsers,
        total: 4,
        page: 1,
        pageSize: 10,
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      const result = await adapter.fetch({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(4)
      expect(result.total).toBe(4)
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users?page=1&pageSize=10',
        expect.any(Object)
      )
    })

    it('should build correct URL with query parameters', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0, page: 1, pageSize: 10 }),
      })

      await adapter.fetch({
        page: 2,
        pageSize: 20,
        search: 'test',
        sort: [{ column: 'name', direction: 'asc' }],
        filters: { role: 'admin' },
      })

      const callUrl = fetchMock.mock.calls[0][0]
      expect(callUrl).toContain('page=2')
      expect(callUrl).toContain('pageSize=20')
      expect(callUrl).toContain('search=test')
      expect(callUrl).toContain('sort=name:asc')
      expect(callUrl).toContain('filter[role]=admin')
    })

    it('should handle array response format', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => testUsers,
      })

      const result = await adapter.fetch({})

      expect(result.data).toHaveLength(4)
      expect(result.total).toBe(4)
    })
  })

  describe('create', () => {
    it('should create a new item', async () => {
      const newUser: Partial<TestUser> = {
        name: 'New User',
        email: 'new@example.com',
        role: 'user',
        age: 25,
        createdAt: '2024-05-01T00:00:00Z',
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...newUser, id: '5' }),
      })

      const created = await adapter.create(newUser)

      expect(created.id).toBe('5')
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newUser),
        })
      )
    })
  })

  describe('update', () => {
    it('should update an item', async () => {
      const updates = { name: 'Updated Name' }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...testUsers[0], ...updates }),
      })

      const updated = await adapter.update('1', updates)

      expect(updated.name).toBe('Updated Name')
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/1',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })
  })

  describe('delete', () => {
    it('should delete an item', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({ 'content-length': '0' }),
      })

      await adapter.delete('1')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('error handling', () => {
    it('should throw NetworkError on network failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      await expect(adapter.fetch({})).rejects.toThrow('Network request failed')
    })

    it('should throw ValidationError on 400', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Validation failed' }),
      })

      await expect(adapter.fetch({})).rejects.toThrow('Validation failed')
    })

    it('should throw AuthenticationError on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Unauthorized' }),
      })

      await expect(adapter.fetch({})).rejects.toThrow('Unauthorized')
    })

    it('should throw NotFoundError on 404', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not found' }),
      })

      await expect(adapter.fetch({})).rejects.toThrow('Not found')
    })
  })

  describe('authentication', () => {
    it('should include auth token in headers', async () => {
      const adapterWithAuth = new RestAdapter<TestUser>({
        baseUrl: '/api/users',
        authToken: 'test-token',
      })

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0, page: 1, pageSize: 10 }),
      })

      await adapterWithAuth.fetch({})

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('should allow updating auth token', async () => {
      adapter.setAuthToken('new-token')

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0, page: 1, pageSize: 10 }),
      })

      await adapter.fetch({})

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-token',
          }),
        })
      )
    })
  })
})

// ==============================================================================
// GraphQLAdapter Tests
// ==============================================================================

describe('GraphQLAdapter', () => {
  let adapter: GraphQLAdapter<TestUser>
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock

    adapter = new GraphQLAdapter<TestUser>({
      endpoint: '/graphql',
      typeName: 'User',
    })
  })

  describe('fetch', () => {
    it('should fetch data from GraphQL API', async () => {
      const mockResponse = {
        data: {
          User: {
            data: testUsers,
            total: 4,
            page: 1,
            pageSize: 10,
          },
        },
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await adapter.fetch({ page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(4)
      expect(result.total).toBe(4)
    })

    it('should send correct GraphQL query', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { User: { data: [], total: 0, page: 1, pageSize: 10 } },
        }),
      })

      await adapter.fetch({
        page: 1,
        pageSize: 10,
        search: 'test',
      })

      const body = JSON.parse(fetchMock.mock.calls[0][1].body)
      expect(body.query).toBeDefined()
      expect(body.variables).toMatchObject({
        page: 1,
        pageSize: 10,
        search: 'test',
      })
    })

    it('should handle GraphQL errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [
            {
              message: 'GraphQL error',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        }),
      })

      await expect(adapter.fetch({})).rejects.toThrow('GraphQL error')
    })
  })

  describe('authentication', () => {
    it('should include auth token', async () => {
      const adapterWithAuth = new GraphQLAdapter<TestUser>({
        endpoint: '/graphql',
        typeName: 'User',
        authToken: 'test-token',
      })

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { User: { data: [], total: 0, page: 1, pageSize: 10 } },
        }),
      })

      await adapterWithAuth.fetch({})

      expect(fetchMock).toHaveBeenCalledWith(
        '/graphql',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })
  })
})
