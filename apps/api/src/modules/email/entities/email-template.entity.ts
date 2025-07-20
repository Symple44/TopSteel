import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'name', length: 100, unique: true })
  name: string

  @Column({ name: 'subject', length: 500 })
  subject: string

  @Column({ name: 'html_content', type: 'text' })
  htmlContent: string

  @Column({ name: 'text_content', type: 'text', nullable: true })
  textContent: string | null

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'variables', type: 'jsonb', default: '[]' })
  variables: string[]

  @Column({ name: 'category', length: 50, nullable: true })
  category: string | null

  @Column({ name: 'enabled', type: 'boolean', default: true })
  enabled: boolean

  @Column({ name: 'version', type: 'int', default: 1 })
  version: number

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[] | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean

  @Column({ name: 'preview_data', type: 'jsonb', nullable: true })
  previewData: Record<string, any> | null
}