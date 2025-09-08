/**
 * 💰 API QUOTES - DOMAINE DEVIS
 * Exports pour la gestion API des devis
 */

import { BaseApiClient } from '../core/base-api-client'
import type { RequestOptions } from '../core/http-client'

export interface Quote {
  id: string
  reference: string
  clientId: string
  clientName: string
  date: Date
  validUntil: Date
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  items: QuoteItem[]
  totalHT: number
  totalTVA: number
  totalTTC: number
  notes?: string
  conditions?: string
}

export interface QuoteItem {
  id: string
  articleId: string
  designation: string
  quantity: number
  unit: string
  unitPrice: number
  discount?: number
  totalHT: number
  tvaRate: number
}

export interface CreateQuoteDTO {
  clientId: string
  validityDays?: number
  items: Omit<QuoteItem, 'id' | 'totalHT'>[]
  notes?: string
  conditions?: string
}

// Client API pour la gestion des devis
export class QuotesApiClient extends BaseApiClient {
  private readonly endpoint = '/quotes'

  // Récupérer tous les devis
  async getQuotes(filters?: {
    status?: Quote['status']
    clientId?: string
    fromDate?: string
    toDate?: string
    search?: string
  }): Promise<Quote[]> {
    const params = this.buildQueryParams(filters || {})
    const response = await this.http.get<Quote[]>(this.endpoint, { params })
    return response.data
  }

  // Récupérer un devis par ID
  async getQuote(id: string): Promise<Quote> {
    const response = await this.http.get<Quote>(`${this.endpoint}/${this.normalizeId(id)}`)
    return response.data
  }

  // Créer un nouveau devis
  async createQuote(quote: CreateQuoteDTO): Promise<Quote> {
    const response = await this.http.post<Quote>(this.endpoint, quote)
    return response.data
  }

  // Mettre à jour un devis
  async updateQuote(id: string, updates: Partial<CreateQuoteDTO>): Promise<Quote> {
    const response = await this.http.patch<Quote>(
      `${this.endpoint}/${this.normalizeId(id)}`,
      updates
    )
    return response.data
  }

  // Dupliquer un devis
  async duplicateQuote(id: string): Promise<Quote> {
    const response = await this.http.post<Quote>(
      `${this.endpoint}/${this.normalizeId(id)}/duplicate`
    )
    return response.data
  }

  // Envoyer un devis par email
  async sendQuote(
    id: string,
    emailData: {
      to: string[]
      cc?: string[]
      subject?: string
      message?: string
    }
  ): Promise<{ success: boolean; messageId: string }> {
    const response = await this.http.post<{ success: boolean; messageId: string }>(
      `${this.endpoint}/${this.normalizeId(id)}/send`,
      emailData
    )
    return response.data
  }

  // Convertir un devis en commande
  async convertToOrder(id: string): Promise<{ orderId: string }> {
    const response = await this.http.post<{ orderId: string }>(
      `${this.endpoint}/${this.normalizeId(id)}/convert-to-order`
    )
    return response.data
  }

  // Changer le statut d'un devis
  async updateStatus(id: string, status: Quote['status']): Promise<Quote> {
    const response = await this.http.patch<Quote>(
      `${this.endpoint}/${this.normalizeId(id)}/status`,
      { status }
    )
    return response.data
  }

  // Générer le PDF d'un devis
  async generatePDF(id: string): Promise<Blob> {
    const response = await this.http.get<Blob>(`${this.endpoint}/${this.normalizeId(id)}/pdf`, {
      responseType: 'blob',
    } as RequestOptions)
    return response.data
  }

  // Obtenir les statistiques des devis
  async getStatistics(period?: 'day' | 'week' | 'month' | 'year'): Promise<{
    totalQuotes: number
    acceptedQuotes: number
    rejectedQuotes: number
    pendingQuotes: number
    conversionRate: number
    totalValue: number
    averageValue: number
  }> {
    const params = this.buildQueryParams({ period })
    const response = await this.http.get<{
      totalQuotes: number
      acceptedQuotes: number
      rejectedQuotes: number
      pendingQuotes: number
      conversionRate: number
      totalValue: number
      averageValue: number
    }>(`${this.endpoint}/statistics`, { params })
    return response.data
  }
}
