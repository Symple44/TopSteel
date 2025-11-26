/**
 * 🛠️ STORE UTILITIES - TopSteel ERP Socle
 * Utilitaires pour création et gestion des stores Zustand
 */

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'

// ===== TYPES =====

export interface BaseStoreState {
  loading: boolean
  error: string | null
  lastUpdate: number
}

export interface BaseStoreActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export type InitialState<T> = Omit<T, keyof BaseStoreActions>

export interface StoreConfig {
  name: string
  persist?: boolean
  devtools?: boolean
}

export type StoreCreator<TState, TActions> = (
  set: (partial: Partial<TState> | ((state: TState) => Partial<TState>)) => void,
  get: () => TState
) => TActions

// ===== CACHE =====

interface CacheItem<T> {
  data: T
  timestamp: number
}

export interface StoreEvent {
  timestamp: number
  store: string
  action: string
  state: unknown
  prevState?: unknown
  duration?: number
}

// ===== STORE MONITOR =====

export class StoreMonitor {
  private static events: StoreEvent[] = []
  private static maxEvents = 100

  static log(store: string, action: string, state: unknown, prevState?: unknown, duration?: number) {
    const event: StoreEvent = {
      timestamp: Date.now(),
      store,
      action,
      state,
      prevState,
      duration,
    }
    this.events.unshift(event)
    if (this.events.length > this.maxEvents) {
      this.events.pop()
    }
  }

  static getEvents(limit = 50) {
    return this.events.slice(0, limit)
  }

  static getStats() {
    return {
      totalEvents: this.events.length,
      recentEvents: this.events.slice(0, 10),
    }
  }

  static clear() {
    this.events = []
  }
}

// ===== STORE UTILS =====

export class StoreUtils {
  private static cache = new Map<string, CacheItem<unknown>>()
  private static defaultCacheDuration = 5 * 60 * 1000 // 5 minutes

  static setCache<T>(key: string, data: T, duration?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + (duration || this.defaultCacheDuration),
    })
  }

  static getCache<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined
    if (!item) return null
    if (Date.now() > item.timestamp) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }

  static clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  static getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// ===== STORE FACTORY =====

export function createRobustStore<TState extends BaseStoreState, TActions extends BaseStoreActions>(
  initialState: InitialState<TState>,
  storeDefinition: StoreCreator<TState, TActions>,
  config: StoreConfig
) {
  const { name, persist: enablePersist = false, devtools: enableDevtools = true } = config

  let storeCreator = (set: any, get: any) => ({
    ...initialState,
    ...storeDefinition(set, get),
  })

  // Add subscribeWithSelector
  storeCreator = subscribeWithSelector(storeCreator as any) as any

  // Add persist if enabled
  if (enablePersist) {
    storeCreator = persist(storeCreator as any, {
      name: `topsteel-${name}`,
      partialize: (state: any) => {
        const { loading, error, ...rest } = state
        return rest
      },
    }) as any
  }

  // Add devtools if enabled
  if (enableDevtools && process.env.NODE_ENV === 'development') {
    storeCreator = devtools(storeCreator as any, { name }) as any
  }

  return create<TState & TActions>()(storeCreator as any)
}
