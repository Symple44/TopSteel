import { IsBoolean, IsString, IsOptional, IsArray, IsEnum } from 'class-validator'

/**
 * DTO for creating a new role
 */
export class CreateRoleDto {
  @IsString()
  name!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

/**
 * DTO for updating an existing role
 */
export class UpdateRoleDto {
  @IsString()
  id!: string

  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

/**
 * Access level for permissions
 */
export enum AccessLevel {
  NONE = 'NONE',
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
}

/**
 * DTO for a single permission assignment
 */
export class PermissionAssignmentDto {
  @IsString()
  permissionId!: string

  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel

  @IsBoolean()
  isGranted!: boolean
}

/**
 * DTO for updating role permissions
 */
export class UpdateRolePermissionsDto {
  @IsArray()
  permissions!: PermissionAssignmentDto[]
}
