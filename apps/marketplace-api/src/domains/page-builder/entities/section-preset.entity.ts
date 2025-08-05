import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { PresetCategory, type SectionContent, type SectionStyles, SectionType } from './types'

@Entity('marketplace_section_presets')
export class SectionPreset {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'varchar',
    length: 50,
  })
  type!: string

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  category?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail?: string

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean

  @Column({ type: 'uuid', nullable: true })
  societeId?: string

  @Column({ type: 'jsonb', default: {} })
  content!: SectionContent

  @Column({ type: 'jsonb', default: {} })
  styles!: SectionStyles

  @Column({ type: 'jsonb', default: {} })
  defaultSettings!: {
    container?: 'full-width' | 'boxed' | 'custom'
    responsive?: any
  }

  @Column({ type: 'text', array: true, nullable: true })
  tags?: string[]

  @Column({ type: 'integer', default: 0 })
  usageCount!: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
