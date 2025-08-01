import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum InstallationStatus {
  PENDING = 'PENDING',
  INSTALLING = 'INSTALLING',
  INSTALLED = 'INSTALLED',
  FAILED = 'FAILED',
  UNINSTALLING = 'UNINSTALLING',
  UNINSTALLED = 'UNINSTALLED',
}

export interface InstallationConfig {
  menuConfigurationId?: string
  customPermissions?: string[]
  settings?: Record<string, any>
  enabledFeatures?: string[]
}

export interface InstallationLog {
  timestamp: Date
  level: 'INFO' | 'WARN' | 'ERROR'
  message: string
  details?: any
}

@Entity('module_installations')
@Index(['tenantId', 'moduleId'], { unique: true })
export class ModuleInstallation {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId!: string

  @Column({ type: 'uuid', name: 'module_id' })
  @Index()
  moduleId!: string

  @Column({ type: 'enum', enum: InstallationStatus, default: InstallationStatus.PENDING })
  @Index()
  status!: InstallationStatus

  @Column({ type: 'varchar', length: 50, name: 'installed_version' })
  installedVersion!: string

  @Column({ type: 'json', nullable: true })
  configuration?: InstallationConfig

  @Column({ type: 'json', nullable: true, name: 'installation_logs' })
  installationLogs?: InstallationLog[]

  @Column({ type: 'timestamp', nullable: true, name: 'installed_at' })
  installedAt?: Date

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive!: boolean

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true, name: 'installed_by' })
  installedBy?: string

  @Column({ type: 'uuid', nullable: true, name: 'uninstalled_by' })
  uninstalledBy?: string

  // Relations
  // Note: Relation cross-database supprimée pour l'architecture multitenant
  // Le module est dans la base auth, référencé par moduleId uniquement

  // Méthodes utilitaires
  static create(
    tenantId: string,
    moduleId: string,
    version: string,
    installedBy: string,
    configuration?: InstallationConfig
  ): ModuleInstallation {
    const installation = new ModuleInstallation()
    installation.tenantId = tenantId
    installation.moduleId = moduleId
    installation.installedVersion = version
    installation.status = InstallationStatus.PENDING
    installation.configuration = configuration
    installation.installationLogs = []
    installation.isActive = true
    installation.installedBy = installedBy
    return installation
  }

  markAsInstalling(): void {
    this.status = InstallationStatus.INSTALLING
    this.addLog('INFO', 'Installation démarrée')
  }

  markAsInstalled(): void {
    this.status = InstallationStatus.INSTALLED
    this.installedAt = new Date()
    this.addLog('INFO', 'Installation terminée avec succès')
  }

  markAsFailed(reason: string): void {
    this.status = InstallationStatus.FAILED
    this.failureReason = reason
    this.addLog('ERROR', `Installation échouée: ${reason}`)
  }

  markAsUninstalling(userId: string): void {
    this.status = InstallationStatus.UNINSTALLING
    this.uninstalledBy = userId
    this.addLog('INFO', 'Désinstallation démarrée')
  }

  markAsUninstalled(): void {
    this.status = InstallationStatus.UNINSTALLED
    this.isActive = false
    this.addLog('INFO', 'Désinstallation terminée')
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date()
  }

  addLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: any): void {
    if (!this.installationLogs) {
      this.installationLogs = []
    }

    this.installationLogs.push({
      timestamp: new Date(),
      level,
      message,
      details,
    })

    // Garder seulement les 100 derniers logs
    if (this.installationLogs.length > 100) {
      this.installationLogs = this.installationLogs.slice(-100)
    }
  }

  isInstalled(): boolean {
    return this.status === InstallationStatus.INSTALLED && this.isActive
  }

  canBeUninstalled(): boolean {
    return this.isInstalled()
  }

  canBeReinstalled(): boolean {
    return (
      this.status === InstallationStatus.FAILED || this.status === InstallationStatus.UNINSTALLED
    )
  }

  getDaysSinceInstallation(): number {
    if (!this.installedAt) return 0
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.installedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  getDaysSinceLastUse(): number {
    if (!this.lastUsedAt) return this.getDaysSinceInstallation()
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - this.lastUsedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  getRecentLogs(count: number = 10): InstallationLog[] {
    if (!this.installationLogs) return []
    return this.installationLogs.slice(-count).reverse()
  }
}
