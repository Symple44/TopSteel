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
import { DatatableHierarchicalPreferences } from './datatable-hierarchical-preferences.entity'

@Entity('datatable_hierarchy_order')
@Unique(['user_id', 'table_id', 'item_id'])
@Index(['user_id', 'table_id'])
@Index(['parent_id'])
@Index(['display_order'])
@Index(['level'])
@Index(['path'])
@Index(['updated_at'])
export class DatatableHierarchyOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  user_id!: string

  @Column({ type: 'varchar', length: 100 })
  table_id!: string

  @Column({ type: 'varchar', length: 100 })
  item_id!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  parent_id!: string | null

  @Column({ type: 'int', default: 0 })
  display_order!: number

  @Column({ type: 'int', default: 0 })
  level!: number

  @Column({ type: 'varchar', length: 1000, nullable: true })
  path!: string | null

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @ManyToOne(() => DatatableHierarchicalPreferences, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'user_id', referencedColumnName: 'user_id' },
    { name: 'table_id', referencedColumnName: 'table_id' },
  ])
  preferences!: DatatableHierarchicalPreferences
}
import { User } from '@prisma/client'
