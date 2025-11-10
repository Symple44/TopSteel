import type React from 'react'

// packages/ui/src/types/common.ts
export type ComponentVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'

export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl'

export interface BaseComponentProps {
  className?: string
  variant?: ComponentVariant
  size?: ComponentSize
  disabled?: boolean
}

export interface WithChildren {
  children?: React.ReactNode
}

export interface WithForwardRef<T = HTMLElement> {
  ref?: React.Ref<T>
}

// Strict type replacements for 'any'
export type SafeRecord<K extends string | number | symbol, V> = Record<K, V>
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }
export type SafeObject = SafeRecord<string, JsonValue>

// Base Request type (not using express to avoid server dependency in UI package)
export interface BaseRequest {
  query: SafeRecord<string, string | string[]>
  body: SafeObject
  params: SafeRecord<string, string>
  headers: SafeRecord<string, string | string[] | undefined>
  method?: string
  url?: string
}

// Request types to replace @Req() req: any
export interface RequestWithUser extends BaseRequest {
  user: {
    id: string
    email: string
    roles?: string[]
    permissions?: string[]
    societeId?: string
  } & { [key: string]: JsonValue }
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

// PaginatedResponse is already defined in helpers.ts

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

// Form data types
export interface FormData extends SafeRecord<string, JsonValue> {}
export interface FormErrors extends SafeRecord<string, string[]> {}

// Error context for logging
export interface ErrorContext {
  userId?: JsonValue
  action?: JsonValue
  resource?: JsonValue
  timestamp?: JsonValue
  [key: string]: JsonValue | undefined
}

// Translation types
export type TranslationValue = string | SafeRecord<string, JsonValue>
export type TranslationMap = SafeRecord<string, TranslationValue>

// Query and filter types
export interface QueryOptions {
  page?: number
  limit?: number
  sort?: string
  order?: 'ASC' | 'DESC'
  search?: string
  filters?: SafeRecord<string, JsonValue>
}

// Reorderable list item renderer
export interface ItemRenderProps<T = SafeObject> {
  item: T
  index: number
  isDragging: boolean
  isPreview?: boolean
  style?: React.CSSProperties
}

export type ItemRenderer<T = SafeObject> = (props: ItemRenderProps<T>) => React.ReactNode

// Component factory types
export type ComponentFactory<P = SafeObject> = (props: P) => React.ReactNode

// Generic event handlers
export type EventHandler<T = Event> = (event: T) => void
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>

// Metadata and configuration
export interface ConfigurationValue {
  key: string
  value: JsonValue
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  encrypted?: boolean
}
