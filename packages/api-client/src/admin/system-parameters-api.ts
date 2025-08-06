/**
 * 🔧 SYSTEM PARAMETERS API CLIENT
 * Client pour la gestion des paramètres système
 */

import type { AxiosResponse } from 'axios'
import { BaseApiClient } from '../core/base-api-client'

// ===== TYPES =====

export interface SystemParameter {
  id: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENUM'
  category:
    | 'GENERAL'
    | 'COMPTABILITE'
    | 'PROJETS'
    | 'PRODUCTION'
    | 'ACHATS'
    | 'STOCKS'
    | 'NOTIFICATION'
    | 'SECURITY'
  description: string
  defaultValue?: string
  isEditable: boolean
  isSecret: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CreateSystemParameterDto {
  key: string
  value: string
  type: SystemParameter['type']
  category: SystemParameter['category']
  description: string
  defaultValue?: string
  isEditable?: boolean
  isSecret?: boolean
  metadata?: Record<string, unknown>
}

export interface UpdateSystemParameterDto {
  value?: string
  description?: string
  defaultValue?: string
  isEditable?: boolean
  isSecret?: boolean
  metadata?: Record<string, unknown>
}

export interface SystemParameterQueryDto {
  category?: SystemParameter['category']
  search?: string
}

export interface SystemCompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  siret: string
  tva: string
}

// ===== API CLIENT =====

export class SystemParametersApiClient extends BaseApiClient {
  private readonly basePath = '/admin/system-parameters'

  // ===== CRUD OPERATIONS =====

  async create(data: CreateSystemParameterDto): Promise<SystemParameter> {
    const response: AxiosResponse<SystemParameter> = await this.http.post(this.basePath, data)
    return response.data
  }

  async findAll(query?: SystemParameterQueryDto): Promise<SystemParameter[]> {
    const response: AxiosResponse<SystemParameter[]> = await this.http.get(this.basePath, {
      params: query,
    })
    return response.data
  }

  async findByKey(key: string): Promise<SystemParameter> {
    const response: AxiosResponse<SystemParameter> = await this.http.get(`${this.basePath}/${key}`)
    return response.data
  }

  async getByCategory(): Promise<Record<string, SystemParameter[]>> {
    const response: AxiosResponse<Record<string, SystemParameter[]>> = await this.http.get(
      `${this.basePath}/by-category`
    )
    return response.data
  }

  async update(key: string, data: UpdateSystemParameterDto): Promise<SystemParameter> {
    const response: AxiosResponse<SystemParameter> = await this.http.patch(
      `${this.basePath}/${key}`,
      data
    )
    return response.data
  }

  async updateMultiple(updates: Array<{ key: string; value: string }>): Promise<SystemParameter[]> {
    const response: AxiosResponse<SystemParameter[]> = await this.http.patch(this.basePath, updates)
    return response.data
  }

  async remove(key: string): Promise<void> {
    await this.http.delete(`${this.basePath}/${key}`)
  }

  // ===== PUBLIC ENDPOINTS =====

  async getCompanyInfo(): Promise<SystemCompanyInfo> {
    const response: AxiosResponse<SystemCompanyInfo> = await this.http.get(
      `${this.basePath}/public/company-info`
    )
    return response.data
  }

  async getEnums(category: string): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.http.get(
      `${this.basePath}/public/enums/${category}`
    )
    return response.data
  }

  // ===== UTILITY METHODS =====

  async getStringValue(key: string): Promise<string> {
    const parameter = await this.findByKey(key)
    return parameter.value || parameter.defaultValue || ''
  }

  async getNumberValue(key: string): Promise<number> {
    const parameter = await this.findByKey(key)
    const value = parseFloat(parameter.value || parameter.defaultValue || '0')
    return Number.isNaN(value) ? 0 : value
  }

  async getBooleanValue(key: string): Promise<boolean> {
    const parameter = await this.findByKey(key)
    const value = parameter.value || parameter.defaultValue || 'false'
    return value.toLowerCase() === 'true'
  }

  async getJsonValue<T>(key: string): Promise<T> {
    const parameter = await this.findByKey(key)
    const value = parameter.value || parameter.defaultValue || '{}'
    return JSON.parse(value) as T
  }
}
