/**
 * 📦 API INVENTORY - DOMAINE STOCK
 * Exports pour la gestion API du stock
 */

import { BaseApiClient } from '../core/base-api-client'

export interface InventoryItem {
  id: string
  reference: string
  designation: string
  quantity: number
  unit: string
  location?: string
  lastMovement?: Date
}

export interface StockMovement {
  id: string
  itemId: string
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  date: Date
  reference?: string
  notes?: string
}

// Client API pour la gestion des stocks
export class InventoryApiClient extends BaseApiClient {
  private readonly endpoint = '/inventory'

  // Récupérer tous les articles en stock
  async getItems(filters?: {
    search?: string
    location?: string
    lowStock?: boolean
  }): Promise<InventoryItem[]> {
    const params = this.buildQueryParams(filters || {})
    const response = await this.http.get<InventoryItem[]>(`${this.endpoint}/items`, { params })
    return response.data
  }

  // Récupérer un article par ID
  async getItem(id: string): Promise<InventoryItem> {
    const response = await this.http.get<InventoryItem>(`${this.endpoint}/items/${this.normalizeId(id)}`)
    return response.data
  }

  // Créer un mouvement de stock
  async createMovement(movement: Omit<StockMovement, 'id'>): Promise<StockMovement> {
    const response = await this.http.post<StockMovement>(`${this.endpoint}/movements`, movement)
    return response.data
  }

  // Récupérer l'historique des mouvements
  async getMovements(itemId?: string, limit = 50): Promise<StockMovement[]> {
    const params = this.buildQueryParams({ itemId, limit })
    const response = await this.http.get<StockMovement[]>(`${this.endpoint}/movements`, { params })
    return response.data
  }

  // Ajuster le stock d'un article
  async adjustStock(itemId: string, quantity: number, reason?: string): Promise<InventoryItem> {
    const response = await this.http.post<InventoryItem>(`${this.endpoint}/items/${this.normalizeId(itemId)}/adjust`, {
      quantity,
      reason
    })
    return response.data
  }

  // Obtenir les alertes de stock
  async getStockAlerts(): Promise<Array<{
    item: InventoryItem
    alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK'
    threshold: number
  }>> {
    const response = await this.http.get<Array<{
      item: InventoryItem
      alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK'
      threshold: number
    }>>(`${this.endpoint}/alerts`)
    return response.data
  }
}