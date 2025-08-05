import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { PageSection } from './page-section.entity'

export enum PageType {
  HOME = 'home',
  CATEGORY = 'category',
  PRODUCT = 'product',
  CUSTOM = 'custom',
  LANDING = 'landing',
  ABOUT = 'about',
  CONTACT = 'contact',
}

export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived',
}

@Entity('marketplace_page_templates')
export class PageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  societeId!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', length: 255 })
  slug!: string

  @Column({
    type: 'varchar',
    length: 50,
    default: 'custom',
  })
  pageType!: string

  @Column({
    type: 'varchar',
    length: 50,
    default: 'draft',
  })
  status!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'jsonb', default: {} })
  metadata!: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
    canonical?: string
  }

  @Column({ type: 'jsonb', default: {} })
  settings!: {
    layout?: 'full-width' | 'boxed' | 'sidebar-left' | 'sidebar-right'
    showHeader?: boolean
    showFooter?: boolean
    showBreadcrumbs?: boolean
    customClass?: string
    backgroundColor?: string
    backgroundImage?: string
  }

  @OneToMany(
    () => PageSection,
    (section) => section.pageTemplate,
    {
      cascade: true,
      eager: true,
    }
  )
  sections!: PageSection[]

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date

  @Column({ type: 'integer', default: 0 })
  version!: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string
}
