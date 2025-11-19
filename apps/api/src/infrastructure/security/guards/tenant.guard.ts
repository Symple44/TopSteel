import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MultiTenantDatabaseConfig } from '../../../core/database/config/multi-tenant-database.config'
import { SocieteUser } from '../../../features/societes/entities/societe-user.entity'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(SocieteUser, 'auth')
    private _societeUserRepository: Repository<SocieteUser>,
    private multiTenantConfig: MultiTenantDatabaseConfig
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    // Vérifier si c'est une route commune (pas besoin de société)
    const isCommonDatabase = this.reflector.get<boolean>('commonDatabase', context.getHandler())
    if (isCommonDatabase) {
      return true
    }

    // Vérifier si la route nécessite un contexte société
    const requiresTenant = this.reflector.get<boolean>('requiresTenant', context.getHandler())
    if (!requiresTenant) {
      return true
    }

    // Extraire l'ID de société depuis les headers ou query params
    const societeId =
      request.headers['x-societe-id'] || request.query.societeId || request.body?.societeId

    if (!societeId) {
      throw new BadRequestException('Société non spécifiée')
    }

    // Vérifier que l'utilisateur a accès à cette société
    const societeUser = await this._societeUserRepository.findOne({
      where: {
        userId: user.id,
        societeId: societeId,
        actif: true,
      },
      relations: ['societe'],
    })

    if (!societeUser) {
      throw new ForbiddenException('Accès refusé à cette société')
    }

    // Vérifier les dates de validité
    const now = new Date()
    if (societeUser.dateDebut && societeUser.dateDebut > now) {
      throw new ForbiddenException('Accès pas encore actif')
    }
    if (societeUser.dateFin && societeUser.dateFin < now) {
      throw new ForbiddenException('Accès expiré')
    }

    // Vérifier le site si spécifié
    const siteId = request.headers['x-site-id'] || request.query.siteId
    if (siteId && societeUser.allowedSiteIds) {
      if (!societeUser.allowedSiteIds.includes(siteId)) {
        throw new ForbiddenException('Accès refusé à ce site')
      }
    }

    // Obtenir la connexion à la base de données de la société
    const tenantDataSource = await this.multiTenantConfig.getTenantConnection(
      societeUser.societe.code
    )

    // Construire le contexte société
    request.tenantContext = {
      societeId: societeUser.societeId,
      societeCode: societeUser.societe.code,
      siteId: siteId,
      userId: user.id,
      userRole: societeUser.role,
      permissions: this.calculatePermissions(user, societeUser),
      dataSource: tenantDataSource,
    }

    // Mettre à jour la dernière activité
    await this._societeUserRepository.update(societeUser.id, {
      lastActivityAt: new Date(),
    })

    return true
  }

  private calculatePermissions(user: unknown, societeUser: SocieteUser): string[] {
    // Commencer avec les permissions globales de l'utilisateur
    let permissions = [...((user as { permissions?: string[] }).permissions || [])]

    // Ajouter les permissions spécifiques à la société
    permissions = permissions.concat(societeUser.permissions || [])

    // Retirer les permissions restreintes
    const restricted = societeUser.restrictedPermissions || []
    permissions = permissions.filter((p) => !restricted.includes(p))

    // Ajouter les permissions par rôle société
    const rolePermissions = this.getRolePermissions(societeUser.role)
    permissions = [...new Set([...permissions, ...rolePermissions])]

    return permissions
  }

  private getRolePermissions(role: string): string[] {
    const rolePermissionsMap: Record<string, string[]> = {
      OWNER: ['*'], // Toutes les permissions
      ADMIN: ['users.manage', 'settings.manage', 'data.full_access', 'reports.view', 'export.data'],
      MANAGER: ['data.full_access', 'reports.view', 'export.data'],
      USER: ['data.read', 'data.write', 'reports.view'],
      VIEWER: ['data.read', 'reports.view'],
      GUEST: ['data.read'],
    }

    return rolePermissionsMap[role] || []
  }
}
import { SocieteUser } from '@prisma/client'
