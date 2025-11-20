// Temporary stub file to resolve module imports
// TODO: Properly migrate or create these entities

export type PermissionType = 'view' | 'edit' | 'delete' | 'share' | 'export' | 'execute'

export class QueryBuilder {
  id!: string
  name!: string
  description?: string
  database?: string
  createdById!: string
  isPublic!: boolean
  mainTable?: string
  maxRows?: number
  settings?: any
  layout?: any
  updatedAt?: Date
  columns?: QueryBuilderColumn[]
  joins?: QueryBuilderJoin[]
  calculatedFields?: QueryBuilderCalculatedField[]
}

export class QueryBuilderColumn {
  id!: string
  queryBuilderId!: string
  tableName?: string
  columnName?: string
  isFilterable?: boolean
  isSortable?: boolean
}

export class QueryBuilderJoin {
  id!: string
  queryBuilderId!: string
  alias?: string
  fromTable?: string
  toTable?: string
}

export class QueryBuilderCalculatedField {
  id!: string
  queryBuilderId!: string
  name?: string
  expression?: string
  isVisible?: boolean
  dataType?: string
  format?: string
}

export class QueryBuilderPermission {
  id!: string
  queryBuilderId!: string
  userId?: string
  roleId?: string
  permissionType!: PermissionType
  isAllowed!: boolean
}
