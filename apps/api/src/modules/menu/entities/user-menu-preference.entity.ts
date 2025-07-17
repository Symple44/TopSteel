import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
// Note: Import relatif pour éviter les problèmes de dépendances circulaires

@Entity('user_menu_preferences')
export class UserMenuPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  userId: string

  // Relation optionnelle pour éviter les problèmes de dépendance
  // @ManyToOne(() => User, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'userId' })
  // user: User

  @Column('jsonb', { default: [] })
  selectedPages: string[]

  @Column({ default: 'standard' })
  menuMode: 'standard' | 'custom'

  @Column('jsonb', { nullable: true })
  pageCustomizations: Record<string, {
    customTitle?: string
    customIcon?: string
    customColor?: string
    customOrder?: number
  }>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}