import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum PlatformType {
  HELLOWORK = 'HELLOWORK',
  INDEED = 'INDEED',
  LINKEDIN = 'LINKEDIN',
  POLE_EMPLOI = 'POLE_EMPLOI',
  CUSTOM = 'CUSTOM'
}

export enum ConfigStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  TESTING = 'TESTING'
}

@Entity('hr_platform_configs')
export class PlatformConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ 
    type: 'enum', 
    enum: PlatformType 
  })
  platformType: PlatformType

  @Column({ 
    type: 'enum', 
    enum: ConfigStatus,
    default: ConfigStatus.INACTIVE 
  })
  status: ConfigStatus

  // Configuration d'API
  @Column({ type: 'varchar', length: 500, nullable: true })
  apiBaseUrl: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiKey: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiSecret: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  accessToken: string

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt: Date

  // Configuration de synchronisation
  @Column({ type: 'int', default: 60 })
  syncIntervalMinutes: number

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date

  @Column({ type: 'timestamp', nullable: true })
  nextSyncAt: Date

  @Column({ type: 'boolean', default: true })
  autoSync: boolean

  // Paramètres de filtrage
  @Column({ type: 'json', nullable: true })
  syncFilters: {
    locations?: string[]
    jobTypes?: string[]
    experienceLevels?: string[]
    salaryRange?: { min?: number; max?: number }
    keywords?: string[]
    excludeKeywords?: string[]
  }

  // Mapping des champs
  @Column({ type: 'json', nullable: true })
  fieldMapping: {
    [key: string]: string // mapping des champs de la plateforme vers nos champs
  }

  // Configuration des webhooks
  @Column({ type: 'varchar', length: 500, nullable: true })
  webhookUrl: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  webhookSecret: string

  // Statistiques
  @Column({ type: 'int', default: 0 })
  totalJobsSynced: number

  @Column({ type: 'int', default: 0 })
  totalCandidatesSynced: number

  @Column({ type: 'int', default: 0 })
  syncErrorCount: number

  @Column({ type: 'text', nullable: true })
  lastSyncError: string | null

  // Limites et quotas
  @Column({ type: 'int', nullable: true })
  dailyApiLimit: number

  @Column({ type: 'int', default: 0 })
  todayApiCalls: number

  @Column({ type: 'date', nullable: true })
  apiCallsResetDate: Date

  // Métadonnées
  @Column({ type: 'json', nullable: true })
  metadata: any

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Méthodes utilitaires
  static create(data: Partial<PlatformConfig>): PlatformConfig {
    const config = new PlatformConfig()
    Object.assign(config, data)
    return config
  }

  updateSyncStatus(success: boolean, error?: string): void {
    this.lastSyncAt = new Date()
    
    if (success) {
      this.status = ConfigStatus.ACTIVE
      this.syncErrorCount = 0
      this.lastSyncError = null
    } else {
      this.status = ConfigStatus.ERROR
      this.syncErrorCount++
      this.lastSyncError = error || 'Unknown error'
    }

    // Calculer la prochaine synchronisation
    if (this.autoSync) {
      this.nextSyncAt = new Date()
      this.nextSyncAt.setMinutes(this.nextSyncAt.getMinutes() + this.syncIntervalMinutes)
    }
  }

  incrementApiCalls(): void {
    const today = new Date().toDateString()
    const resetDate = this.apiCallsResetDate?.toDateString()

    if (resetDate !== today) {
      this.todayApiCalls = 0
      this.apiCallsResetDate = new Date()
    }

    this.todayApiCalls++
  }

  isApiLimitReached(): boolean {
    if (!this.dailyApiLimit) return false
    
    const today = new Date().toDateString()
    const resetDate = this.apiCallsResetDate?.toDateString()

    if (resetDate !== today) {
      return false // Les compteurs ont été réinitialisés
    }

    return this.todayApiCalls >= this.dailyApiLimit
  }

  isTokenExpired(): boolean {
    return this.tokenExpiresAt ? new Date() > this.tokenExpiresAt : false
  }

  needsSync(): boolean {
    if (!this.autoSync || this.status !== ConfigStatus.ACTIVE) return false
    if (!this.nextSyncAt) return true
    return new Date() >= this.nextSyncAt
  }

  getConnectionHealth(): 'healthy' | 'warning' | 'error' {
    if (this.status === ConfigStatus.ERROR) return 'error'
    if (this.syncErrorCount > 3) return 'warning'
    if (this.isTokenExpired()) return 'warning'
    if (this.isApiLimitReached()) return 'warning'
    return 'healthy'
  }

  updateSyncStats(jobsSynced: number, candidatesSynced: number): void {
    this.totalJobsSynced += jobsSynced
    this.totalCandidatesSynced += candidatesSynced
  }
}