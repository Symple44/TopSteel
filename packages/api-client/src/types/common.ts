/**
 * Common type definitions for API client
 * Replaces 'any' types with strict, reusable types
 */

import type { Request } from 'express'

// Base utility types
export type SafeRecord<K extends string | number | symbol, V> = Record<K, V>
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }
export type SafeObject = SafeRecord<string, JsonValue>

// Request types
export interface RequestWithUser extends Request {
  user: {
    id: string
    email: string
    roles?: string[]
    permissions?: string[]
    societeId?: string
  } & SafeRecord<string, JsonValue>
  query: SafeRecord<string, string | string[]>
  body: SafeObject
  params: SafeRecord<string, string>
}

export interface AuthenticatedRequest extends RequestWithUser {
  user: RequestWithUser['user'] & {
    id: string
    email: string
  }
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: SafeObject
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Entity base types
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export type EntityWithRelations<T extends BaseEntity, R = SafeObject> = T & {
  relations?: R
}

// Database query types
export interface QueryOptions {
  page?: number
  limit?: number
  sort?: string
  order?: 'ASC' | 'DESC'
  search?: string
  filters?: SafeRecord<string, JsonValue>
}

export interface DatabaseQueryResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Error types
export type ErrorContext = SafeRecord<string, JsonValue> & {
  userId?: string
  action?: string
  resource?: string
  timestamp?: string
}

// Webhook types
export interface WebhookPayload {
  event: string
  data: SafeObject
  timestamp: string
  signature?: string
}

// Configuration types
export interface ConfigurationValue {
  key: string
  value: JsonValue
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  encrypted?: boolean
}

// File upload types
export interface FileUploadInfo {
  filename: string
  originalName: string
  mimetype: string
  size: number
  path: string
  url?: string
}

// Audit log types
export interface AuditLogEntry {
  action: string
  resource: string
  resourceId: string
  userId: string
  changes?: SafeRecord<string, { before: JsonValue; after: JsonValue }>
  metadata?: SafeObject
  timestamp: Date
}

// Generic form data types
export interface FormData extends SafeRecord<string, JsonValue> {}
export interface FormErrors extends SafeRecord<string, string[]> {}

// Email and notification types
export interface EmailTemplate {
  subject: string
  body: string
  isHtml?: boolean
  templateData?: SafeObject
}

export interface NotificationPayload {
  type: string
  title: string
  message: string
  data?: SafeObject
  priority?: 'low' | 'normal' | 'high'
}

// Search and filter types
export interface SearchCriteria {
  query?: string
  filters: SafeRecord<string, JsonValue>
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  pagination?: {
    page: number
    size: number
  }
}

export interface FilterDefinition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin'
  value: JsonValue
}

// Translation types
export type TranslationValue = string | SafeRecord<string, JsonValue>
export type TranslationMap = SafeRecord<string, TranslationValue>

// Permission and role types
export interface PermissionCheck {
  resource: string
  action: string
  context?: SafeObject
}

export interface RoleDefinition {
  name: string
  permissions: string[]
  description?: string
  metadata?: SafeObject
}

// Logging types
export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  timestamp: Date
  context?: SafeObject
  userId?: string
  requestId?: string
}

// Cache types
export interface CacheEntry<T = JsonValue> {
  key: string
  value: T
  ttl?: number
  tags?: string[]
}

// Validation types
export interface ValidationError {
  field: string
  message: string
  value?: JsonValue
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
