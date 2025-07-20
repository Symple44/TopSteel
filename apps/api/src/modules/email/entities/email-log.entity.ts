import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'provider', length: 50 })
  provider: string

  @Column({ name: 'message_id', length: 255, nullable: true })
  messageId: string | null

  @Column({ name: 'to_recipients', type: 'text' })
  to: string

  @Column({ name: 'cc_recipients', type: 'text', nullable: true })
  cc: string | null

  @Column({ name: 'bcc_recipients', type: 'text', nullable: true })
  bcc: string | null

  @Column({ name: 'subject', length: 500 })
  subject: string

  @Column({ name: 'success', type: 'boolean' })
  success: boolean

  @Column({ name: 'error_message', type: 'text', nullable: true })
  error: string | null

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: string | null

  @Column({ name: 'template_name', length: 100, nullable: true })
  templateName: string | null

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number

  @Column({ name: 'queue_job_id', length: 50, nullable: true })
  queueJobId: string | null

  @Column({ name: 'processing_time_ms', type: 'int', nullable: true })
  processingTimeMs: number | null

  @Column({ name: 'email_size_bytes', type: 'int', nullable: true })
  emailSizeBytes: number | null

  @Column({ name: 'attachments_count', type: 'int', default: 0 })
  attachmentsCount: number

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[] | null
}