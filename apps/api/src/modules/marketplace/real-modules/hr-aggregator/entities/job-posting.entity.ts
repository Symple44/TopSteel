import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { JobApplication } from './job-application.entity'

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  TEMPORARY = 'TEMPORARY',
  INTERNSHIP = 'INTERNSHIP'
}

export enum JobStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
  DRAFT = 'DRAFT'
}

export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  EXECUTIVE = 'EXECUTIVE'
}

@Entity('hr_job_postings')
export class JobPosting {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'varchar', length: 100 })
  company: string

  @Column({ type: 'varchar', length: 100 })
  location: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string

  @Column({ 
    type: 'enum', 
    enum: JobType,
    default: JobType.FULL_TIME 
  })
  jobType: JobType

  @Column({ 
    type: 'enum', 
    enum: JobStatus,
    default: JobStatus.DRAFT 
  })
  status: JobStatus

  @Column({ 
    type: 'enum', 
    enum: ExperienceLevel,
    default: ExperienceLevel.MID 
  })
  experienceLevel: ExperienceLevel

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salaryMin: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salaryMax: number

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  salaryCurrency: string

  @Column({ type: 'json', nullable: true })
  requiredSkills: string[]

  @Column({ type: 'json', nullable: true })
  benefits: string[]

  @Column({ type: 'text', nullable: true })
  requirements: string

  // Informations sur la source de l'offre
  @Column({ type: 'varchar', length: 100 })
  sourceUrl: string

  @Column({ type: 'varchar', length: 50 })
  sourcePlatform: string // 'HelloWork', 'Indeed', 'LinkedIn', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  externalId: string // ID de l'offre sur la plateforme externe

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date

  @Column({ type: 'date', nullable: true })
  applicationDeadline: Date

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'int', default: 0 })
  viewCount: number

  @Column({ type: 'int', default: 0 })
  applicationCount: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @OneToMany(() => JobApplication, application => application.jobPosting)
  applications: JobApplication[]

  // Méthodes utilitaires
  static create(data: Partial<JobPosting>): JobPosting {
    const jobPosting = new JobPosting()
    Object.assign(jobPosting, data)
    return jobPosting
  }

  incrementViewCount(): void {
    this.viewCount++
  }

  incrementApplicationCount(): void {
    this.applicationCount++
  }

  isExpired(): boolean {
    if (!this.applicationDeadline) return false
    return new Date() > this.applicationDeadline
  }

  getSalaryRange(): string {
    if (!this.salaryMin && !this.salaryMax) return 'Non spécifié'
    if (!this.salaryMax) return `À partir de ${this.salaryMin} ${this.salaryCurrency}`
    if (!this.salaryMin) return `Jusqu'à ${this.salaryMax} ${this.salaryCurrency}`
    return `${this.salaryMin} - ${this.salaryMax} ${this.salaryCurrency}`
  }
}