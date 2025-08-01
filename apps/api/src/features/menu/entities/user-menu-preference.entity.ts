import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// Note: Import relatif pour éviter les problèmes de dépendances circulaires

@Entity('user_menu_preference_items')
@Index(['userId', 'menuId'], { unique: true })
export class UserMenuPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid', { name: 'user_id' })
  userId: string

  // Relation optionnelle pour éviter les problèmes de dépendance
  // @ManyToOne(() => User, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'user_id' })
  // user: User

  @Column('varchar', { name: 'menu_id' })
  menuId: string

  @Column('boolean', { name: 'is_visible', default: true })
  isVisible: boolean

  @Column('integer', { name: 'order', default: 0 })
  order: number

  @Column('varchar', { name: 'custom_label', nullable: true })
  customLabel: string

  @Column('jsonb', { name: 'title_translations', nullable: true })
  titleTranslations: Record<string, string>

  @Column('integer', { default: 1 })
  version: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @Column('timestamp', { name: 'deleted_at', nullable: true })
  deletedAt: Date
}
