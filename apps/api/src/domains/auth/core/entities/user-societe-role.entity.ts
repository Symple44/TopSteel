import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Societe } from '../../../../features/societes/entities/societe.entity'
import { User } from '../../../users/entities/user.entity'
import { Role } from './role.entity'

@Entity('user_societe_roles')
export class UserSocieteRole {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  userId: string

  @Column('uuid')
  societeId: string

  @Column('uuid', {
    nullable: true,
    comment: 'Référence vers un rôle spécifique, null = utiliser le rôle par défaut',
  })
  roleId?: string

  @Column('varchar', {
    length: 50,
    comment: 'Type de rôle (référence vers parameters_system.user_roles)',
  })
  roleType: string

  @Column('boolean', { default: false, comment: 'Société par défaut pour cet utilisateur' })
  isDefaultSociete: boolean

  @Column('jsonb', { default: [], comment: 'Permissions supplémentaires accordées' })
  additionalPermissions: string[]

  @Column('jsonb', { default: [], comment: 'Permissions retirées pour cet utilisateur' })
  restrictedPermissions: string[]

  @Column('uuid', {
    array: true,
    nullable: true,
    comment: 'Sites autorisés pour cet utilisateur dans cette société',
  })
  allowedSiteIds?: string[]

  @Column('uuid', { nullable: true, comment: 'Utilisateur qui a accordé ce rôle' })
  grantedById?: string

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  grantedAt: Date

  @Column('timestamp', { nullable: true, comment: "Date d'expiration du rôle" })
  expiresAt?: Date

  @Column('boolean', { default: true })
  isActive: boolean

  @Column('jsonb', { default: {}, comment: 'Métadonnées additionnelles' })
  metadata: Record<string, unknown>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ name: 'deleted_at', nullable: true, type: 'timestamp' })
  deletedAt?: Date

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User

  @ManyToOne(() => Role, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'roleId' })
  role?: Role

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'grantedById' })
  grantedBy?: User

  @ManyToOne(() => Societe, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'societeId' })
  societe?: Societe

  // ===== MÉTHODES STATIQUES DE CRÉATION =====

  static create(
    userId: string,
    societeId: string,
    roleType: string,
    grantedById?: string
  ): UserSocieteRole {
    const userSocieteRole = new UserSocieteRole()
    userSocieteRole.userId = userId
    userSocieteRole.societeId = societeId
    userSocieteRole.roleType = roleType
    userSocieteRole.grantedById = grantedById
    userSocieteRole.grantedAt = new Date()
    userSocieteRole.isActive = true
    userSocieteRole.additionalPermissions = []
    userSocieteRole.restrictedPermissions = []
    userSocieteRole.metadata = {}
    return userSocieteRole
  }

  static createWithSpecificRole(
    userId: string,
    societeId: string,
    roleId: string,
    roleType: string,
    grantedById?: string
  ): UserSocieteRole {
    const userSocieteRole = UserSocieteRole.create(userId, societeId, roleType, grantedById)
    userSocieteRole.roleId = roleId
    return userSocieteRole
  }

  static createAsDefault(
    userId: string,
    societeId: string,
    roleType: string,
    grantedById?: string
  ): UserSocieteRole {
    const userSocieteRole = UserSocieteRole.create(userId, societeId, roleType, grantedById)
    userSocieteRole.isDefaultSociete = true
    return userSocieteRole
  }

  // ===== MÉTHODES D'INSTANCE =====

  /**
   * Vérifie si ce rôle a expiré
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false
    return new Date() > this.expiresAt
  }

  /**
   * Vérifie si ce rôle est effectivement actif (actif ET non expiré)
   */
  isEffectivelyActive(): boolean {
    return this.isActive && !this.isExpired()
  }

  /**
   * Définit ce rôle comme société par défaut
   */
  setAsDefault(): void {
    this.isDefaultSociete = true
    this.updatedAt = new Date()
  }

  /**
   * Retire le statut de société par défaut
   */
  removeDefaultStatus(): void {
    this.isDefaultSociete = false
    this.updatedAt = new Date()
  }

  /**
   * Ajoute une permission supplémentaire
   */
  addAdditionalPermission(permission: string): void {
    if (!this.additionalPermissions.includes(permission)) {
      this.additionalPermissions.push(permission)
      this.updatedAt = new Date()
    }
  }

  /**
   * Retire une permission supplémentaire
   */
  removeAdditionalPermission(permission: string): void {
    const index = this.additionalPermissions.indexOf(permission)
    if (index > -1) {
      this.additionalPermissions.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  /**
   * Ajoute une restriction de permission
   */
  addRestrictedPermission(permission: string): void {
    if (!this.restrictedPermissions.includes(permission)) {
      this.restrictedPermissions.push(permission)
      this.updatedAt = new Date()
    }
  }

  /**
   * Retire une restriction de permission
   */
  removeRestrictedPermission(permission: string): void {
    const index = this.restrictedPermissions.indexOf(permission)
    if (index > -1) {
      this.restrictedPermissions.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  /**
   * Définit la date d'expiration
   */
  setExpiration(expiresAt: Date): void {
    this.expiresAt = expiresAt
    this.updatedAt = new Date()
  }

  /**
   * Supprime la date d'expiration (rôle permanent)
   */
  removExpiration(): void {
    this.expiresAt = undefined
    this.updatedAt = new Date()
  }

  /**
   * Désactive ce rôle
   */
  deactivate(): void {
    this.isActive = false
    this.updatedAt = new Date()
  }

  /**
   * Reactive ce rôle
   */
  activate(): void {
    this.isActive = true
    this.updatedAt = new Date()
  }

  /**
   * Ajoute des métadonnées
   */
  addMetadata(key: string, value: unknown): void {
    this.metadata[key] = value
    this.updatedAt = new Date()
  }

  /**
   * Récupère une métadonnée
   */
  getMetadata(key: string): unknown {
    return this.metadata[key]
  }

  /**
   * Vérifie si l'utilisateur a accès à un site spécifique
   */
  hasAccessToSite(siteId: string): boolean {
    // Si aucune restriction de site, accès à tous les sites
    if (!this.allowedSiteIds || this.allowedSiteIds.length === 0) {
      return true
    }
    return this.allowedSiteIds.includes(siteId)
  }

  /**
   * Ajoute l'accès à un site
   */
  addSiteAccess(siteId: string): void {
    if (!this.allowedSiteIds) {
      this.allowedSiteIds = []
    }
    if (!this.allowedSiteIds.includes(siteId)) {
      this.allowedSiteIds.push(siteId)
      this.updatedAt = new Date()
    }
  }

  /**
   * Retire l'accès à un site
   */
  removeSiteAccess(siteId: string): void {
    if (this.allowedSiteIds) {
      const index = this.allowedSiteIds.indexOf(siteId)
      if (index > -1) {
        this.allowedSiteIds.splice(index, 1)
        this.updatedAt = new Date()
      }
    }
  }

  /**
   * Calcule les permissions effectives (rôle + additionnelles - restrictions)
   */
  getEffectivePermissions(baseRolePermissions: string[]): string[] {
    // Commencer avec les permissions de base du rôle
    let effectivePermissions = [...baseRolePermissions]

    // Ajouter les permissions supplémentaires
    this.additionalPermissions.forEach((perm) => {
      if (!effectivePermissions.includes(perm)) {
        effectivePermissions.push(perm)
      }
    })

    // Retirer les permissions restreintes
    effectivePermissions = effectivePermissions.filter(
      (perm) => !this.restrictedPermissions.includes(perm)
    )

    return effectivePermissions
  }

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  hasPermission(permission: string, baseRolePermissions: string[]): boolean {
    const effectivePermissions = this.getEffectivePermissions(baseRolePermissions)
    return effectivePermissions.includes(permission)
  }

  /**
   * Retourne un résumé du rôle pour les logs
   */
  toLogSummary(): string {
    return (
      `UserSocieteRole[${this.id}]: User=${this.userId}, Societe=${this.societeId}, ` +
      `RoleType=${this.roleType}, Default=${this.isDefaultSociete}, Active=${this.isActive}`
    )
  }

  /**
   * Valide la cohérence des données
   */
  validate(): string[] {
    const errors: string[] = []

    if (!this.userId) errors.push('userId est requis')
    if (!this.societeId) errors.push('societeId est requis')
    if (!this.roleType) errors.push('roleType est requis')

    if (this.expiresAt && this.expiresAt <= new Date()) {
      errors.push('expiresAt doit être dans le futur')
    }

    if (this.additionalPermissions && this.restrictedPermissions) {
      const conflicts = this.additionalPermissions.filter((perm) =>
        this.restrictedPermissions.includes(perm)
      )
      if (conflicts.length > 0) {
        errors.push(
          `Conflit permissions: ${conflicts.join(', ')} sont à la fois ajoutées et restreintes`
        )
      }
    }

    return errors
  }
}
