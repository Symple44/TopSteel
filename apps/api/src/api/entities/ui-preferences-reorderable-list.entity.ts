import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../../domains/users/entities/user.entity'
import { User } from '@prisma/client'


export interface ReorderableListPreferences {
  defaultExpanded: boolean
  showLevelIndicators: boolean
  showConnectionLines: boolean
  enableAnimations: boolean
  compactMode: boolean
  customColors: Record<string, string>
}

export interface ReorderableListLayout {
  maxDepth: number
  allowNesting: boolean
  dragHandlePosition: 'left' | 'right'
  expandButtonPosition: 'left' | 'right'
}

export type ReorderableListTheme = 'default' | 'compact' | 'modern' | 'minimal' | 'colorful'

@Entity('ui_preferences_reorderable_list')
@Unique(['user_id', 'component_id'])
@Index(['user_id'])
@Index(['component_id'])
@Index(['updated_at'])
export class UiPreferencesReorderableList {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  user_id!: string

  @Column({ type: 'varchar', length: 100 })
  component_id!: string

  @Column({
    type: 'varchar',
    length: 50,
    default: 'default',
    enum: ['default', 'compact', 'modern', 'minimal', 'colorful'],
  })
  theme!: ReorderableListTheme

  @Column({
    type: 'jsonb',
    default: {
      defaultExpanded: true,
      showLevelIndicators: true,
      showConnectionLines: true,
      enableAnimations: true,
      compactMode: false,
      customColors: {},
    },
  })
  preferences!: ReorderableListPreferences

  @Column({
    type: 'jsonb',
    default: {
      maxDepth: 10,
      allowNesting: true,
      dragHandlePosition: 'left',
      expandButtonPosition: 'left',
    },
  })
  layout!: ReorderableListLayout

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User
}

