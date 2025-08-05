import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { PageTemplate } from './page-template.entity'
import { type SectionContent, type SectionStyles, SectionType } from './types'

@Entity('marketplace_page_sections')
export class PageSection {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(
    () => PageTemplate,
    (template) => template.sections,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'pageTemplateId' })
  pageTemplate!: PageTemplate

  @Column({ type: 'uuid' })
  pageTemplateId!: string

  @Column({
    type: 'varchar',
    length: 50,
  })
  type!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'integer' })
  order!: number

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean

  @Column({ type: 'jsonb', default: {} })
  content!: SectionContent

  @Column({ type: 'jsonb', default: {} })
  styles!: SectionStyles

  @Column({ type: 'jsonb', default: {} })
  responsive!: {
    mobile?: {
      isVisible?: boolean
      content?: Partial<SectionContent>
      styles?: Partial<SectionStyles>
    }
    tablet?: {
      isVisible?: boolean
      content?: Partial<SectionContent>
      styles?: Partial<SectionStyles>
    }
    desktop?: {
      isVisible?: boolean
      content?: Partial<SectionContent>
      styles?: Partial<SectionStyles>
    }
  }

  @Column({ type: 'jsonb', default: {} })
  settings!: {
    container?: 'full-width' | 'boxed' | 'custom'
    customClass?: string
    id?: string
    conditions?: {
      showOn?: string[]
      hideOn?: string[]
      userRole?: string[]
      dateRange?: {
        start?: Date
        end?: Date
      }
    }
  }

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
