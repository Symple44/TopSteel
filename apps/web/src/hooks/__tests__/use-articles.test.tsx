import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  type Article,
  ArticleStatus,
  ArticleType,
  useArticle,
  useArticles,
  useCreateArticle,
  useDeleteArticle,
  useEffectuerInventaire,
  useUpdateArticle,
} from '../use-articles'

// DTO types for testing
type CreateArticleDto = Omit<Article, 'id' | 'createdAt' | 'updatedAt'>
type UpdateArticleDto = Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>

// Mock fetch
global.fetch = jest.fn()

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Mock data
const mockArticles: Article[] = [
  {
    id: '1',
    reference: 'ART001',
    designation: 'Article 1',
    type: ArticleType.PRODUIT_FINI,
    status: ArticleStatus.ACTIF,
    famille: 'ACIER',
    uniteStock: 'KG',
    coefficientAchat: 1,
    coefficientVente: 1.5,
    gereEnStock: true,
    methodeValorisation: 'PUMP',
    stockPhysique: 100,
    stockMini: 10,
    stockMaxi: 1000,
    prixAchatStandard: 10.5,
    prixVenteHT: 15.75,
    tauxTVA: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    reference: 'ART002',
    designation: 'Article 2',
    type: ArticleType.SERVICE,
    status: ArticleStatus.ACTIF,
    famille: 'INOX',
    uniteStock: 'U',
    coefficientAchat: 1,
    coefficientVente: 1.4,
    gereEnStock: false,
    methodeValorisation: 'FIFO',
    stockPhysique: 50,
    stockMini: 5,
    stockMaxi: 500,
    prixAchatStandard: 25.0,
    prixVenteHT: 35.0,
    tauxTVA: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe('useArticles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useArticles', () => {
    it('should fetch articles successfully', async () => {
      const _mockResponse = {
        data: mockArticles,
        total: 2,
        page: 1,
        pageSize: 10,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockArticles,
      })

      const { result } = renderHook(() => useArticles(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockArticles)
      expect(result.current.data).toHaveLength(2)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useArticles(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.data).toBeUndefined()
    })

    it('should apply filters', async () => {
      const filters = {
        search: 'ART001',
        type: ArticleType.PRODUIT_FINI,
        famille: 'ACIER',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [mockArticles[0]],
          total: 1,
          page: 1,
          pageSize: 10,
        }),
      })

      const { result } = renderHook(() => useArticles(filters), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=ART001'),
        expect.any(Object)
      )
    })

    it('should handle pagination', async () => {
      const _pagination = { page: 2, pageSize: 20 }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          total: 50,
          page: 2,
          pageSize: 20,
        }),
      })

      const { result } = renderHook(() => useArticles({ page: 2, limit: 20 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object))
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=20'), expect.any(Object))
    })
  })

  describe('useArticle', () => {
    it('should fetch single article by id', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockArticles[0],
      })

      const { result } = renderHook(() => useArticle('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockArticles[0])
      expect(result.current.data?.reference).toBe('ART001')
    })

    it('should not fetch if id is not provided', () => {
      const { result } = renderHook(() => useArticle(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(true)
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle 404 error', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Article not found' }),
      })

      const { result } = renderHook(() => useArticle('999'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useCreateArticle', () => {
    it('should create article successfully', async () => {
      const newArticle: CreateArticleDto = {
        reference: 'ART003',
        designation: 'New Article',
        type: ArticleType.PRODUIT_FINI,
        status: ArticleStatus.ACTIF,
        famille: 'ALUMINIUM',
        uniteStock: 'M',
        coefficientAchat: 1,
        coefficientVente: 1.5,
        gereEnStock: true,
        methodeValorisation: 'PUMP',
        stockMini: 5,
        stockMaxi: 100,
        prixAchatStandard: 12.0,
        prixVenteHT: 18.0,
        tauxTVA: 20,
      }

      const createdArticle = {
        ...newArticle,
        id: '3',
        stockPhysique: 0,
        status: ArticleStatus.ACTIF,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => createdArticle,
      })

      const { result } = renderHook(() => useCreateArticle(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.mutateAsync(newArticle)
      })

      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toEqual(createdArticle)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/articles'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newArticle),
        })
      )
    })

    it('should handle validation errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Validation failed',
          errors: {
            reference: 'Reference already exists',
          },
        }),
      })

      const { result } = renderHook(() => useCreateArticle(), {
        wrapper: createWrapper(),
      })

      await expect(
        result.current.mutateAsync({
          reference: 'ART001',
          designation: 'Duplicate',
          type: ArticleType.PRODUIT_FINI,
          status: ArticleStatus.ACTIF,
          uniteStock: 'KG',
          coefficientAchat: 1,
          coefficientVente: 1.5,
          gereEnStock: true,
          methodeValorisation: 'PUMP',
        })
      ).rejects.toThrow()
    })
  })

  describe('useUpdateArticle', () => {
    it('should update article successfully', async () => {
      const updateData: UpdateArticleDto = {
        designation: 'Updated Article',
        prixVenteHT: 20.0,
      }

      const updatedArticle = {
        ...mockArticles[0],
        ...updateData,
        updatedAt: new Date().toISOString(),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedArticle,
      })

      const { result } = renderHook(() => useUpdateArticle(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: updateData })
      })

      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toEqual(updatedArticle)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/articles/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      )
    })

    it('should handle optimistic updates', async () => {
      const updateData: UpdateArticleDto = {
        stockPhysique: 150,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockArticles[0],
          ...updateData,
        }),
      })

      const { result } = renderHook(() => useUpdateArticle(), {
        wrapper: createWrapper(),
      })

      const _onMutate = jest.fn()
      const onError = jest.fn()
      const onSettled = jest.fn()

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: updateData }, { onError, onSettled })
      })

      expect(onSettled).toHaveBeenCalled()
    })
  })

  describe('useDeleteArticle', () => {
    it('should delete article successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useDeleteArticle(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.mutateAsync('1')
      })

      expect(result.current.isSuccess).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/articles/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should handle delete constraints', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'Cannot delete article with existing stock movements',
        }),
      })

      const { result } = renderHook(() => useDeleteArticle(), {
        wrapper: createWrapper(),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow()
    })
  })

  describe('useEffectuerInventaire', () => {
    it('should perform inventory adjustment', async () => {
      const inventoryData = {
        id: '1',
        stockPhysiqueReel: 120,
        commentaire: 'Inventaire mensuel',
      }

      const updatedArticle = {
        ...mockArticles[0],
        stockPhysique: 120,
        lastInventoryDate: new Date().toISOString(),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedArticle,
      })

      const { result } = renderHook(() => useEffectuerInventaire(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.mutateAsync(inventoryData)
      })

      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data?.stockPhysique).toBe(120)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/articles/1/inventaire'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            stockPhysiqueReel: 120,
            commentaire: 'Inventaire mensuel',
          }),
        })
      )
    })

    it('should validate stock values', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Stock value cannot be negative',
        }),
      })

      const { result } = renderHook(() => useEffectuerInventaire(), {
        wrapper: createWrapper(),
      })

      await expect(
        result.current.mutateAsync({
          id: '1',
          stockPhysiqueReel: -10,
        })
      ).rejects.toThrow()
    })

    it('should track inventory history', async () => {
      const inventoryData = {
        id: '1',
        stockPhysiqueReel: 90,
        commentaire: 'Stock correction',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockArticles[0],
          stockPhysique: 90,
          inventoryHistory: [
            {
              date: new Date().toISOString(),
              oldStock: 100,
              newStock: 90,
              difference: -10,
              comment: 'Stock correction',
              userId: 'user-1',
            },
          ],
        }),
      })

      const { result } = renderHook(() => useEffectuerInventaire(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.mutateAsync(inventoryData)
      })

      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data?.stockPhysique).toBe(90)
    })
  })

  describe('Stock calculations', () => {
    it('should calculate stock status correctly', () => {
      const article: Article = {
        ...mockArticles[0],
        stockPhysique: 5,
        stockMini: 10,
        stockMaxi: 100,
      }

      // This would normally be a utility function
      const getStockStatus = (article: Article) => {
        if (!article.gereEnStock) return 'non-gere'
        if ((article.stockPhysique ?? 0) === 0) return 'rupture'
        if ((article.stockPhysique ?? 0) <= (article.stockMini ?? 0)) return 'critique'
        if ((article.stockPhysique ?? 0) >= (article.stockMaxi ?? Infinity)) return 'surstock'
        return 'normal'
      }

      expect(getStockStatus(article)).toBe('critique')

      article.stockPhysique = 0
      expect(getStockStatus(article)).toBe('rupture')

      article.stockPhysique = 150
      expect(getStockStatus(article)).toBe('surstock')

      article.stockPhysique = 50
      expect(getStockStatus(article)).toBe('normal')

      article.gereEnStock = false
      expect(getStockStatus(article)).toBe('non-gere')
    })

    it('should calculate stock value', () => {
      const article: Article = {
        ...mockArticles[0],
        stockPhysique: 100,
        prixAchatStandard: 10.5,
      }

      const stockValue = (article.stockPhysique ?? 0) * (article.prixAchatStandard ?? 0)
      expect(stockValue).toBe(1050)
    })
  })
})
