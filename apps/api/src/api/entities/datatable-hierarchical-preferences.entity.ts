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

export interface HierarchyConfig {
  parentField: string
  childrenField: string
  levelField: string
  orderField: string
  maxDepth: number
  allowNesting: boolean
  defaultExpanded: boolean
  expandedNodes: string[]
}

export interface ReorderConfig {
  enableDragDrop: boolean
  allowLevelChange: boolean
  preserveHierarchy: boolean
  autoExpand: boolean
  dragHandleVisible: boolean
  dropIndicatorStyle: 'line' | 'highlight'
}

export interface DisplayConfig {
  showLevelIndicators: boolean
  showConnectionLines: boolean
  indentSize: number
  levelColors: string[]
  compactMode: boolean
  collapsibleGroups: boolean
}

export interface HierarchyFilters {
  showOnlyLevels: number[]
  hideEmptyParents: boolean
  filterPreservesHierarchy: boolean
  searchInChildren: boolean
}

@Entity('datatable_hierarchical_preferences')
@Unique(['user_id', 'table_id'])
@Index(['user_id'])
@Index(['table_id'])
@Index(['updated_at'])
export class DatatableHierarchicalPreferences {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  user_id!: string

  @Column({ type: 'varchar', length: 100 })
  table_id!: string

  @Column({
    type: 'jsonb',
    default: {
      parentField: 'parent_id',
      childrenField: 'children',
      levelField: 'level',
      orderField: 'display_order',
      maxDepth: 10,
      allowNesting: true,
      defaultExpanded: true,
      expandedNodes: [],
    },
  })
  hierarchy_config!: HierarchyConfig

  @Column({
    type: 'jsonb',
    default: {
      enableDragDrop: true,
      allowLevelChange: true,
      preserveHierarchy: true,
      autoExpand: true,
      dragHandleVisible: true,
      dropIndicatorStyle: 'line',
    },
  })
  reorder_config!: ReorderConfig

  @Column({
    type: 'jsonb',
    default: {
      showLevelIndicators: true,
      showConnectionLines: true,
      indentSize: 24,
      levelColors: [],
      compactMode: false,
      collapsibleGroups: true,
    },
  })
  display_config!: DisplayConfig

  @Column({
    type: 'jsonb',
    default: {
      showOnlyLevels: [],
      hideEmptyParents: false,
      filterPreservesHierarchy: true,
      searchInChildren: true,
    },
  })
  hierarchy_filters!: HierarchyFilters

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User
}
