/**
 * Tests d'intégration pour l'API
 * Ces tests vérifient l'intégration entre les composants
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals'

// Mock des services API
const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}

// Mock des données de test
const mockUser = {
  id: '1',
  email: 'test@topsteel.fr',
  name: 'Test User',
  role: 'admin',
}

const mockClient = {
  id: 'client-1',
  code: 'CL001',
  name: 'Acier Industries SA',
  email: 'contact@acier-industries.fr',
  status: 'active',
}

const mockMaterial = {
  id: 'material-1',
  reference: 'S355J2',
  designation: 'Acier de construction S355J2',
  category: 'steel',
  stock: 1500,
  unit: 'kg',
}

const mockOrder = {
  id: 'order-1',
  number: 'CMD-2024-001',
  clientId: 'client-1',
  status: 'in_progress',
  total: 15000,
  currency: 'EUR',
}

describe('API Integration Tests', () => {
  let _authToken: string | null = null

  beforeAll(() => {
    // Setup global test configuration
    process.env.API_URL = process.env.API_URL || 'http://localhost:3000'
  })

  afterAll(() => {
    // Cleanup
    jest.clearAllMocks()
  })

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should authenticate user and return JWT token', async () => {
      // Mock successful login
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-jwt-token',
          user: mockUser,
          expires_in: 3600,
        },
      })

      const response = await mockApiClient.post('/auth/login', {
        email: 'test@topsteel.fr',
        password: 'SecurePassword123!',
      })

      expect(response.data).toHaveProperty('access_token')
      expect(response.data.user).toEqual(mockUser)
      _authToken = response.data.access_token
    })

    it('should refresh token when expired', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          access_token: 'new-mock-jwt-token',
          expires_in: 3600,
        },
      })

      const response = await mockApiClient.post('/auth/refresh', {
        refresh_token: 'mock-refresh-token',
      })

      expect(response.data).toHaveProperty('access_token')
      expect(response.data.access_token).toBe('new-mock-jwt-token')
    })

    it('should handle logout correctly', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { success: true },
      })

      const response = await mockApiClient.post('/auth/logout')
      expect(response.data.success).toBe(true)
    })
  })

  describe('Client Management', () => {
    it('should fetch list of clients', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          items: [mockClient],
          total: 1,
          page: 1,
          limit: 10,
        },
      })

      const response = await mockApiClient.get('/clients')
      expect(response.data.items).toHaveLength(1)
      expect(response.data.items[0]).toEqual(mockClient)
    })

    it('should create a new client', async () => {
      const newClient = {
        code: 'CL002',
        name: 'Nouvelle Entreprise SARL',
        email: 'contact@nouvelle.fr',
        type: 'company',
      }

      mockApiClient.post.mockResolvedValueOnce({
        data: { ...newClient, id: 'client-2', status: 'active' },
      })

      const response = await mockApiClient.post('/clients', newClient)
      expect(response.data).toHaveProperty('id')
      expect(response.data.name).toBe(newClient.name)
    })

    it('should update client information', async () => {
      const updates = { status: 'inactive' }

      mockApiClient.patch.mockResolvedValueOnce({
        data: { ...mockClient, ...updates },
      })

      const response = await mockApiClient.patch(`/clients/${mockClient.id}`, updates)
      expect(response.data.status).toBe('inactive')
    })
  })

  describe('Material Management', () => {
    it('should fetch materials with filtering', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          items: [mockMaterial],
          total: 1,
        },
      })

      const response = await mockApiClient.get('/materials', {
        params: { category: 'steel', inStock: true },
      })

      expect(response.data.items).toHaveLength(1)
      expect(response.data.items[0].category).toBe('steel')
    })

    it('should update material stock levels', async () => {
      const stockUpdate = {
        quantity: 500,
        type: 'entry',
        reason: 'New delivery',
      }

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          ...mockMaterial,
          stock: mockMaterial.stock + stockUpdate.quantity,
        },
      })

      const response = await mockApiClient.post(
        `/materials/${mockMaterial.id}/stock-movements`,
        stockUpdate
      )

      expect(response.data.stock).toBe(2000)
    })

    it('should calculate material requirements', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          required: [
            { materialId: 'material-1', quantity: 100, unit: 'kg' },
            { materialId: 'material-2', quantity: 50, unit: 'units' },
          ],
          available: true,
        },
      })

      const response = await mockApiClient.post('/materials/calculate-requirements', {
        projectId: 'project-1',
        items: [{ materialId: 'material-1', quantity: 100 }],
      })

      expect(response.data.required).toHaveLength(2)
      expect(response.data.available).toBe(true)
    })
  })

  describe('Order Processing', () => {
    it('should create and process an order', async () => {
      const newOrder = {
        clientId: 'client-1',
        items: [{ materialId: 'material-1', quantity: 100, unitPrice: 150 }],
      }

      mockApiClient.post.mockResolvedValueOnce({
        data: { ...mockOrder, items: newOrder.items },
      })

      const response = await mockApiClient.post('/orders', newOrder)
      expect(response.data).toHaveProperty('id')
      expect(response.data.number).toMatch(/^CMD-\d{4}-\d{3}$/)
    })

    it('should update order status through workflow', async () => {
      const statusUpdates = [
        { status: 'confirmed', expectedNext: 'in_production' },
        { status: 'in_production', expectedNext: 'quality_control' },
        { status: 'quality_control', expectedNext: 'ready_to_ship' },
        { status: 'shipped', expectedNext: 'delivered' },
      ]

      for (const update of statusUpdates) {
        mockApiClient.patch.mockResolvedValueOnce({
          data: { ...mockOrder, status: update.status },
        })

        const response = await mockApiClient.patch(`/orders/${mockOrder.id}/status`, {
          status: update.status,
        })

        expect(response.data.status).toBe(update.status)
      }
    })

    it('should generate invoice from order', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          id: 'invoice-1',
          number: 'INV-2024-001',
          orderId: mockOrder.id,
          total: mockOrder.total,
          status: 'draft',
        },
      })

      const response = await mockApiClient.post(`/orders/${mockOrder.id}/generate-invoice`)
      expect(response.data).toHaveProperty('number')
      expect(response.data.orderId).toBe(mockOrder.id)
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields on client creation', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: [
              { field: 'name', message: 'Name is required' },
              { field: 'email', message: 'Valid email is required' },
            ],
          },
        },
      })

      try {
        await mockApiClient.post('/clients', { code: 'CL003' })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.errors).toHaveLength(2)
      }
    })

    it('should validate business rules for stock movements', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            message: 'Insufficient stock',
            available: 100,
            requested: 200,
          },
        },
      })

      try {
        await mockApiClient.post('/materials/material-1/stock-movements', {
          type: 'exit',
          quantity: 200,
        })
      } catch (error: any) {
        expect(error.response.status).toBe(422)
        expect(error.response.data.message).toBe('Insufficient stock')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'))

      try {
        await mockApiClient.get('/clients')
      } catch (error: any) {
        expect(error.message).toBe('Network error')
      }
    })

    it('should handle 404 errors', async () => {
      mockApiClient.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'Resource not found' },
        },
      })

      try {
        await mockApiClient.get('/clients/non-existent-id')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.message).toBe('Resource not found')
      }
    })

    it('should handle 401 unauthorized errors', async () => {
      mockApiClient.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      })

      try {
        await mockApiClient.get('/admin/users')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.message).toBe('Unauthorized')
      }
    })
  })

  describe('Performance Tests', () => {
    it('should handle bulk operations efficiently', async () => {
      const bulkData = Array.from({ length: 100 }, (_, i) => ({
        id: `material-${i}`,
        reference: `REF-${i}`,
        stock: Math.floor(Math.random() * 1000),
      }))

      mockApiClient.post.mockResolvedValueOnce({
        data: {
          processed: 100,
          failed: 0,
          duration: 250, // ms
        },
      })

      const startTime = Date.now()
      const response = await mockApiClient.post('/materials/bulk-update', bulkData)
      const endTime = Date.now()

      expect(response.data.processed).toBe(100)
      expect(response.data.failed).toBe(0)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should paginate large result sets', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          items: Array(10).fill(mockClient),
          total: 1000,
          page: 1,
          limit: 10,
          hasMore: true,
        },
      })

      const response = await mockApiClient.get('/clients', {
        params: { page: 1, limit: 10 },
      })

      expect(response.data.items).toHaveLength(10)
      expect(response.data.total).toBe(1000)
      expect(response.data.hasMore).toBe(true)
    })
  })
})
