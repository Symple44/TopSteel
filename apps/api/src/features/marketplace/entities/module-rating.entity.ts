import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity('module_ratings')
@Index(['moduleId', 'userId'], { unique: true })
export class ModuleRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'module_id' })
  @Index()
  moduleId!: string

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string

  @Column({ type: 'integer', default: 5 })
  rating!: number // 1-5 étoiles

  @Column({ type: 'text', nullable: true })
  comment?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  version?: string // Version du module évaluée

  @Column({ type: 'boolean', default: true, name: 'is_visible' })
  isVisible!: boolean

  @Column({ type: 'integer', default: 0, name: 'helpful_count' })
  helpfulCount!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Note: Cross-database relationship removed for multi-tenant architecture
  // moduleId references MarketplaceModule.id from auth database
  // Fetch module details manually through service layer

  // Méthodes utilitaires
  static create(
    moduleId: string,
    userId: string,
    rating: number,
    comment?: string,
    version?: string
  ): ModuleRating {
    const moduleRating = new ModuleRating()
    moduleRating.moduleId = moduleId
    moduleRating.userId = userId
    moduleRating.rating = Math.max(1, Math.min(5, rating)) // S'assurer que la note est entre 1 et 5
    moduleRating.comment = comment
    moduleRating.version = version
    moduleRating.isVisible = true
    moduleRating.helpfulCount = 0
    return moduleRating
  }

  isPositive(): boolean {
    return this.rating >= 4
  }

  isNegative(): boolean {
    return this.rating <= 2
  }

  incrementHelpfulCount(): void {
    this.helpfulCount++
  }

  hide(): void {
    this.isVisible = false
  }

  show(): void {
    this.isVisible = true
  }
}
