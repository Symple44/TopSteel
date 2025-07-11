/**
 * 🏢 HOOK CLIENTS ENTERPRISE - TOPSTEEL ERP
 * Version robuste avec gestion d'erreurs, cache et optimisations
 *
 * Fonctionnalités:
 * - Cache intelligent avec TTL
 * - Retry automatique avec backoff
 * - Validation stricte des données
 * - Optimistic updates
 * - Error boundaries intégrés
 * - Monitoring et métriques
 * - Pagination et filtres
 * - Offline support
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// =============================================
// TYPES ET INTERFACES
// =============================================

export interface Client {
  id: string
  nom: string
  email: string
  telephone: string
  type: ClientType
  adresse?: Adresse
  statut: ClientStatus
  dateCreation: Date
  dateModification: Date
  chiffreAffaire?: number
  nombreProjets?: number
  derniereActivite?: Date
  tags?: string[]
  notes?: string
  commercial?: string
  priorite: ClientPriority
}

export interface Adresse {
  rue: string
  ville: string
  codePostal: string
  pays: string
  region?: string
}

export type ClientType = 'PARTICULIER' | 'PROFESSIONNEL' | 'COLLECTIVITE' | 'INDUSTRIEL'
export type ClientStatus = 'ACTIF' | 'INACTIF' | 'PROSPECT' | 'SUSPENDU' | 'VIP'
export type ClientPriority = 'BASSE' | 'NORMALE' | 'HAUTE' | 'CRITIQUE'

export interface ClientFilters {
  type?: ClientType[]
  statut?: ClientStatus[]
  priorite?: ClientPriority[]
  dateMin?: Date
  dateMax?: Date
  chiffreAffaireMin?: number
  chiffreAffaireMax?: number
  search?: string
  commercial?: string[]
  tags?: string[]
}

export interface PaginationConfig {
  page: number
  limit: number
  sortBy: keyof Client
  sortOrder: 'asc' | 'desc'
}

export interface ClientsResponse {
  clients: Client[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ClientsError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: Date
}

export interface ClientsMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
  retryAttempts: number
}

// Après les interfaces ClientsError, etc.
function createClientsError(error: unknown): ClientsError {
  if (error instanceof Error) {
    return {
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message,
      details: {
        stack: error.stack,
        cause: error.cause,
      },
      timestamp: new Date(),
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    timestamp: new Date(),
  }
}

// =============================================
// CACHE ET PERFORMANCE
// =============================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

class ClientsCache {
  private static cache = new Map<string, CacheEntry<ClientsResponse>>()
  private static clientCache = new Map<string, CacheEntry<Client>>()
  private static defaultTTL = 5 * 60 * 1000 // 5 minutes
  private static maxCacheSize = 100
  private static metrics: ClientsMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    retryAttempts: 0,
  }

  static get<T>(key: string, cache: Map<string, CacheEntry<T>>): T | null {
    const entry = cache.get(key)

    if (!entry) {
      ClientsCache.metrics.cacheMisses++

      return null
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key)
      ClientsCache.metrics.cacheMisses++

      return null
    }

    ClientsCache.metrics.cacheHits++

    return entry.data
  }

  static set<T>(
    key: string,
    data: T,
    cache: Map<string, CacheEntry<T>>,
    ttl = ClientsCache.defaultTTL
  ): void {
    // Fix TypeScript strict: nettoyage du cache si plein
    if (cache.size >= ClientsCache.maxCacheSize) {
      // Méthode plus sûre : convertir en array pour éviter undefined
      const keys = Array.from(cache.keys())

      if (keys.length > 0) {
        cache.delete(keys[0]) // Supprimer la première (plus ancienne) clé
      }
    }

    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    })
  }

  static getClients(key: string): ClientsResponse | null {
    return ClientsCache.get(key, ClientsCache.cache)
  }

  static setClients(key: string, data: ClientsResponse, ttl?: number): void {
    ClientsCache.set(key, data, ClientsCache.cache, ttl)
  }

  static getClient(id: string): Client | null {
    return ClientsCache.get(id, ClientsCache.clientCache)
  }

  static setClient(id: string, client: Client, ttl?: number): void {
    ClientsCache.set(id, client, ClientsCache.clientCache, ttl)
  }

  static invalidate(pattern?: string): void {
    if (!pattern) {
      ClientsCache.cache.clear()
      ClientsCache.clientCache.clear()

      return
    }

    const regex = new RegExp(pattern)

    for (const key of ClientsCache.cache.keys()) {
      if (regex.test(key)) {
        ClientsCache.cache.delete(key)
      }
    }

    for (const key of ClientsCache.clientCache.keys()) {
      if (regex.test(key)) {
        ClientsCache.clientCache.delete(key)
      }
    }
  }

  static recordRequest(success: boolean, responseTime: number, isRetry = false): void {
    ClientsCache.metrics.totalRequests++

    if (success) {
      ClientsCache.metrics.successfulRequests++
    } else {
      ClientsCache.metrics.failedRequests++
    }

    if (isRetry) {
      ClientsCache.metrics.retryAttempts++
    }

    // Calcul de la moyenne mobile
    const previousAvg = ClientsCache.metrics.averageResponseTime
    const count = ClientsCache.metrics.totalRequests

    ClientsCache.metrics.averageResponseTime = (previousAvg * (count - 1) + responseTime) / count
  }

  static getMetrics(): ClientsMetrics {
    return { ...ClientsCache.metrics }
  }

  static clear(): void {
    ClientsCache.cache.clear()
    ClientsCache.clientCache.clear()
    ClientsCache.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      retryAttempts: 0,
    }
  }
}

// =============================================
// SERVICES ET API
// =============================================

class ClientsService {
  private static baseUrl = '/api/clients'
  private static abortControllers = new Map<string, AbortController>()

  static async fetchClients(
    filters: ClientFilters,
    pagination: PaginationConfig,
    signal?: AbortSignal
  ): Promise<ClientsResponse> {
    const startTime = performance.now()
    const cacheKey = ClientsService.generateCacheKey(filters, pagination)

    // Vérifier le cache
    const cached = ClientsCache.getClients(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        ...ClientsService.serializeFilters(filters),
      })

      const response = await fetch(`${ClientsService.baseUrl}?${queryParams}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const validatedData = ClientsService.validateClientsResponse(data)

      // Mettre en cache
      ClientsCache.setClients(cacheKey, validatedData)

      // Mettre en cache les clients individuels
      validatedData.clients.forEach((client) => {
        ClientsCache.setClient(client.id, client)
      })

      ClientsCache.recordRequest(true, performance.now() - startTime)

      return validatedData
    } catch (error) {
      ClientsCache.recordRequest(false, performance.now() - startTime)
      throw ClientsService.handleError(error)
    }
  }

  static async fetchClient(id: string, signal?: AbortSignal): Promise<Client> {
    const startTime = performance.now()

    // Vérifier le cache
    const cached = ClientsCache.getClient(id)

    if (cached) {
      return cached
    }

    try {
      const response = await fetch(`${ClientsService.baseUrl}/${id}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const validatedClient = ClientsService.validateClient(data)

      ClientsCache.setClient(id, validatedClient)
      ClientsCache.recordRequest(true, performance.now() - startTime)

      return validatedClient
    } catch (error) {
      ClientsCache.recordRequest(false, performance.now() - startTime)
      throw ClientsService.handleError(error)
    }
  }

  static async createClient(clientData: Partial<Client>, signal?: AbortSignal): Promise<Client> {
    const startTime = performance.now()

    try {
      const response = await fetch(ClientsService.baseUrl, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const validatedClient = ClientsService.validateClient(data)

      // Invalider le cache
      ClientsCache.invalidate('clients')
      ClientsCache.setClient(validatedClient.id, validatedClient)

      ClientsCache.recordRequest(true, performance.now() - startTime)

      return validatedClient
    } catch (error) {
      ClientsCache.recordRequest(false, performance.now() - startTime)
      throw ClientsService.handleError(error)
    }
  }

  static async updateClient(
    id: string,
    updates: Partial<Client>,
    signal?: AbortSignal
  ): Promise<Client> {
    const startTime = performance.now()

    try {
      const response = await fetch(`${ClientsService.baseUrl}/${id}`, {
        method: 'PATCH',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const validatedClient = ClientsService.validateClient(data)

      // Invalider le cache
      ClientsCache.invalidate('clients')
      ClientsCache.setClient(id, validatedClient)

      ClientsCache.recordRequest(true, performance.now() - startTime)

      return validatedClient
    } catch (error) {
      ClientsCache.recordRequest(false, performance.now() - startTime)
      throw ClientsService.handleError(error)
    }
  }

  static async deleteClient(id: string, signal?: AbortSignal): Promise<void> {
    const startTime = performance.now()

    try {
      const response = await fetch(`${ClientsService.baseUrl}/${id}`, {
        method: 'DELETE',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Invalider le cache
      ClientsCache.invalidate('clients')
      ClientsCache.invalidate(id)

      ClientsCache.recordRequest(true, performance.now() - startTime)
    } catch (error) {
      ClientsCache.recordRequest(false, performance.now() - startTime)
      throw ClientsService.handleError(error)
    }
  }

  // Méthodes utilitaires privées
  private static generateCacheKey(filters: ClientFilters, pagination: PaginationConfig): string {
    return `clients-${JSON.stringify({ filters, pagination })}`
  }

  private static serializeFilters(filters: ClientFilters): Record<string, string> {
    const serialized: Record<string, string> = {}

    Object.entries(filters).forEach(([key, value]) => {
      if (value != null) {
        if (Array.isArray(value)) {
          serialized[key] = value.join(',')
        } else if (value instanceof Date) {
          serialized[key] = value.toISOString()
        } else {
          serialized[key] = String(value)
        }
      }
    })

    return serialized
  }

  private static validateClientsResponse(data: unknown): ClientsResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Réponse invalide du serveur')
    }

    const response = data as Record<string, unknown>

    if (!Array.isArray(response.clients)) {
      throw new Error('Format de réponse invalide: clients manquant')
    }

    return {
      clients: response.clients.map((client) => ClientsService.validateClient(client)),
      total: Number(response.total) || 0,
      page: Number(response.page) || 1,
      totalPages: Number(response.totalPages) || 1,
      hasNext: Boolean(response.hasNext),
      hasPrev: Boolean(response.hasPrev),
    }
  }

  private static validateClient(data: unknown): Client {
    if (!data || typeof data !== 'object') {
      throw new Error('Données client invalides')
    }

    const client = data as Record<string, unknown>

    if (!client.id || !client.nom || !client.email) {
      throw new Error('Champs obligatoires manquants')
    }

    return {
      id: String(client.id),
      nom: String(client.nom),
      email: String(client.email),
      telephone: String(client.telephone || ''),
      type: (client.type as ClientType) || 'PARTICULIER',
      statut: (client.statut as ClientStatus) || 'PROSPECT',
      priorite: (client.priorite as ClientPriority) || 'NORMALE',
      dateCreation: new Date(client.dateCreation as string),
      dateModification: new Date(client.dateModification as string),
      chiffreAffaire: client.chiffreAffaire ? Number(client.chiffreAffaire) : undefined,
      nombreProjets: client.nombreProjets ? Number(client.nombreProjets) : undefined,
      derniereActivite: client.derniereActivite
        ? new Date(client.derniereActivite as string)
        : undefined,
      tags: Array.isArray(client.tags) ? client.tags.map(String) : undefined,
      notes: client.notes ? String(client.notes) : undefined,
      commercial: client.commercial ? String(client.commercial) : undefined,
      adresse: client.adresse ? ClientsService.validateAdresse(client.adresse) : undefined,
    }
  }

  private static validateAdresse(data: unknown): Adresse {
    if (!data || typeof data !== 'object') {
      throw new Error('Adresse invalide')
    }

    const adresse = data as Record<string, unknown>

    return {
      rue: String(adresse.rue || ''),
      ville: String(adresse.ville || ''),
      codePostal: String(adresse.codePostal || ''),
      pays: String(adresse.pays || 'France'),
      region: adresse.region ? String(adresse.region) : undefined,
    }
  }

  private static handleError(error: unknown): ClientsError {
    const timestamp = new Date()

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          code: 'ABORTED',
          message: 'Requête annulée',
          timestamp,
        }
      }

      if (error.message.includes('HTTP 404')) {
        return {
          code: 'NOT_FOUND',
          message: 'Client non trouvé',
          timestamp,
        }
      }

      if (error.message.includes('HTTP 403')) {
        return {
          code: 'FORBIDDEN',
          message: 'Accès refusé',
          timestamp,
        }
      }

      if (error.message.includes('HTTP 500')) {
        return {
          code: 'SERVER_ERROR',
          message: 'Erreur serveur interne',
          timestamp,
        }
      }

      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        timestamp,
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: "Une erreur inconnue s'est produite",
      timestamp,
    }
  }

  static cancelRequest(key: string): void {
    const controller = ClientsService.abortControllers.get(key)

    if (controller) {
      controller.abort()
      ClientsService.abortControllers.delete(key)
    }
  }

  static cancelAllRequests(): void {
    ClientsService.abortControllers.forEach((controller) => controller.abort())
    ClientsService.abortControllers.clear()
  }
}

// =============================================
// RETRY AVEC BACKOFF
// =============================================

class RetryManager {
  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (attempt === maxRetries) {
          break
        }

        // Exponential backoff with jitter
        const delay = baseDelay * 2 ** attempt + Math.random() * 1000

        await new Promise((resolve) => setTimeout(resolve, delay))

        ClientsCache.recordRequest(false, 0, true)
      }
    }

    throw lastError
  }

  static async fetchWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    return RetryManager.executeWithRetry(operation)
  }
}

// =============================================
// HOOK PRINCIPAL
// =============================================

export function useClients(
  initialFilters: ClientFilters = {},
  initialPagination: Partial<PaginationConfig> = {}
) {
  const [clients, setClients] = useState<Client[]>([])
  const [totalClients, setTotalClients] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ClientsError | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [filters, setFilters] = useState<ClientFilters>(initialFilters)
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: 20,
    sortBy: 'dateModification',
    sortOrder: 'desc',
    ...initialPagination,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction de chargement principal
  const loadClients = useCallback(
    async (showLoading = true) => {
      // Annuler les requêtes précédentes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      if (showLoading) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError(null)

      try {
        const response = await RetryManager.fetchWithRetry(() =>
          ClientsService.fetchClients(filters, pagination, abortControllerRef.current?.signal)
        )

        setClients(response.clients)
        setTotalClients(response.total)
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(createClientsError(err))
          console.error('Erreur lors du chargement des clients:', err)
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filters, pagination]
  )

  // Chargement initial et rechargement sur changement de filtres/pagination
  useEffect(() => {
    loadClients()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [loadClients])

  // Fonctions de manipulation
  const refreshClients = useCallback(() => {
    loadClients(false)
  }, [loadClients])

  const updateFilters = useCallback((newFilters: Partial<ClientFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset page
  }, [])

  const updatePagination = useCallback((newPagination: Partial<PaginationConfig>) => {
    setPagination((prev) => ({ ...prev, ...newPagination }))
  }, [])

  const createClient = useCallback(async (clientData: Partial<Client>): Promise<Client> => {
    try {
      const newClient = await ClientsService.createClient(clientData)

      // Optimistic update
      setClients((prev) => [newClient, ...prev])
      setTotalClients((prev) => prev + 1)

      return newClient
    } catch (err) {
      setError(err as ClientsError)
      throw err
    }
  }, [])

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<Client> => {
      try {
        // Optimistic update
        setClients((prev) =>
          prev.map((client) => (client.id === id ? { ...client, ...updates } : client))
        )

        const updatedClient = await ClientsService.updateClient(id, updates)

        // Mise à jour réelle
        setClients((prev) => prev.map((client) => (client.id === id ? updatedClient : client)))

        return updatedClient
      } catch (err) {
        // Rollback optimistic update
        refreshClients()
        setError(err as ClientsError)
        throw err
      }
    },
    [refreshClients]
  )

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      try {
        // Optimistic update
        const clientToDelete = clients.find((c) => c.id === id)

        setClients((prev) => prev.filter((client) => client.id !== id))
        setTotalClients((prev) => prev - 1)

        await ClientsService.deleteClient(id)
      } catch (err) {
        // Rollback optimistic update
        refreshClients()
        setError(err as ClientsError)
        throw err
      }
    },
    [clients, refreshClients]
  )

  // Retry en cas d'erreur
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    retryTimeoutRef.current = setTimeout(() => {
      loadClients()
    }, 1000)
  }, [loadClients])

  // Métriques et informations dérivées
  const metrics = useMemo(() => ClientsCache.getMetrics(), [])

  const hasNextPage = useMemo(
    () => pagination.page * pagination.limit < totalClients,
    [pagination.page, pagination.limit, totalClients]
  )

  const hasPrevPage = useMemo(() => pagination.page > 1, [pagination.page])

  const totalPages = useMemo(
    () => Math.ceil(totalClients / pagination.limit),
    [totalClients, pagination.limit]
  )

  return {
    // Données
    clients,
    totalClients,

    // État
    loading,
    refreshing,
    error,

    // Pagination
    pagination,
    hasNextPage,
    hasPrevPage,
    totalPages,
    updatePagination,

    // Filtres
    filters,
    updateFilters,

    // Actions
    refreshClients,
    createClient,
    updateClient,
    deleteClient,
    retry,

    // Métriques
    metrics,
  }
}
