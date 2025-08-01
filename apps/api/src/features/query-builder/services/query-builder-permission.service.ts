import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { type PermissionType, QueryBuilderPermission } from '../entities'

@Injectable()
export class QueryBuilderPermissionService {
  constructor(
    @InjectRepository(QueryBuilderPermission, 'auth')
    private _permissionRepository: Repository<QueryBuilderPermission>,
  ) {}

  async checkPermission(
    queryBuilderId: string,
    userId: string,
    permissionType: PermissionType
  ): Promise<boolean> {
    // Check user-specific permission
    const userPermission = await this._permissionRepository.findOne({
      where: {
        queryBuilderId,
        userId,
        permissionType,
      },
    })

    if (userPermission) {
      return userPermission.isAllowed
    }

    // Check role-based permissions
    // TODO: Implement role-based permission check
    // This would require fetching user roles and checking against role permissions

    // Default: allow view permission for backward compatibility
    return permissionType === 'view'
  }

  async addPermission(data: {
    queryBuilderId: string
    userId?: string
    roleId?: string
    permissionType: PermissionType
    isAllowed: boolean
  }): Promise<QueryBuilderPermission> {
    const permission = this._permissionRepository.create(data)
    return this._permissionRepository.save(permission)
  }

  async removePermission(id: string): Promise<void> {
    await this._permissionRepository.delete(id)
  }

  async getPermissions(queryBuilderId: string): Promise<QueryBuilderPermission[]> {
    return this._permissionRepository.find({
      where: { queryBuilderId },
      relations: ['user', 'role'],
    })
  }

  async updatePermission(id: string, isAllowed: boolean): Promise<QueryBuilderPermission> {
    await this._permissionRepository.update(id, { isAllowed })
    const permission = await this._permissionRepository.findOne({ where: { id } })
    if (!permission) {
      throw new Error(`Permission with id ${id} not found`)
    }
    return permission
  }
}
