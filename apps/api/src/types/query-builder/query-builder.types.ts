/**
 * Types pour Query Builder
 * Créé pour résoudre les erreurs TypeScript dans query-builder-executor.service.ts
 */

export interface QueryBuilderData {
  id: string
  name: string
  description?: string
  query: string
  tables: QueryBuilderTable[]
  columns: QueryBuilderColumn[]
  joins: QueryBuilderJoin[]
  conditions: QueryBuilderCondition[]
  calculatedFields: QueryBuilderCalculatedField[]
  groupBy?: string[]
  orderBy?: QueryBuilderOrderBy[]
  limit?: number
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface QueryBuilderTable {
  id: string
  name: string
  alias?: string
  schema?: string
}

export interface QueryBuilderColumn {
  id: string
  table: string
  column: string
  alias?: string
  visible: boolean
  dataType?: string
  aggregation?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'
  format?: string
}

export interface QueryBuilderJoin {
  id: string
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  table: string
  alias?: string
  condition: string
}

export interface QueryBuilderCondition {
  id: string
  field: string
  operator: QueryOperator
  value: unknown
  logicalOperator?: 'AND' | 'OR'
  groupId?: string
}

export type QueryOperator =
  | '='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'LIKE'
  | 'NOT LIKE'
  | 'IN'
  | 'NOT IN'
  | 'IS NULL'
  | 'IS NOT NULL'
  | 'BETWEEN'
  | 'NOT BETWEEN'

export interface QueryBuilderCalculatedField {
  id: string
  name: string
  label: string
  expression: string
  dataType: 'NUMBER' | 'STRING' | 'DATE' | 'BOOLEAN'
  format?: string
  queryBuilderId: string
}

export interface QueryBuilderOrderBy {
  field: string
  direction: 'ASC' | 'DESC'
}

export interface QueryExecutionContext {
  userId: string
  societeId: string
  permissions: string[]
  parameters?: Record<string, unknown>
}

export interface QueryExecutionResult {
  data: unknown[]
  total: number
  executionTime: number
  query?: string
  error?: string
}

export interface QueryBuilderSaveRequest {
  name: string
  description?: string
  query: QueryBuilderData
  isPublic?: boolean
  tags?: string[]
}

export interface QueryBuilderExportOptions {
  format: 'CSV' | 'EXCEL' | 'JSON' | 'PDF'
  includeHeaders?: boolean
  dateFormat?: string
  numberFormat?: string
  fileName?: string
}
