// Temporary stub file to resolve module imports
// TODO: Properly migrate or create these entities

export type PermissionType = 'view' | 'edit' | 'delete' | 'share' | 'export'

export class QueryBuilder {
  id!: string
  name!: string
  createdById!: string
  isPublic!: boolean
  columns?: QueryBuilderColumn[]
  joins?: QueryBuilderJoin[]
  calculatedFields?: QueryBuilderCalculatedField[]
}

export class QueryBuilderColumn {
  id!: string
  queryBuilderId!: string
}

export class QueryBuilderJoin {
  id!: string
  queryBuilderId!: string
}

export class QueryBuilderCalculatedField {
  id!: string
  queryBuilderId!: string
}

export class QueryBuilderPermission {
  id!: string
  queryBuilderId!: string
  userId?: string
  roleId?: string
  permissionType!: PermissionType
  isAllowed!: boolean
}
