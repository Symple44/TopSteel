import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { JobPosting } from './job-posting.entity'
import { CandidateProfile } from './candidate-profile.entity'

export enum ApplicationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEWED = 'INTERVIEWED',
  OFFER_MADE = 'OFFER_MADE',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum ApplicationSource {
  DIRECT = 'DIRECT',
  HELLOWORK = 'HELLOWORK',
  INDEED = 'INDEED',
  LINKEDIN = 'LINKEDIN',
  POLE_EMPLOI = 'POLE_EMPLOI',
  INTERNAL_REFERRAL = 'INTERNAL_REFERRAL'
}

@Entity('hr_job_applications')
export class JobApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Relations
  @ManyToOne(() => JobPosting, jobPosting => jobPosting.applications)
  @JoinColumn({ name: 'job_posting_id' })
  jobPosting: JobPosting

  @Column({ name: 'job_posting_id' })
  jobPostingId: string

  @ManyToOne(() => CandidateProfile, candidate => candidate.applications)
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateProfile

  @Column({ name: 'candidate_id' })
  candidateId: string

  // Informations de candidature
  @Column({ 
    type: 'enum', 
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING 
  })
  status: ApplicationStatus

  @Column({ 
    type: 'enum', 
    enum: ApplicationSource,
    default: ApplicationSource.DIRECT 
  })
  source: ApplicationSource

  @Column({ type: 'text', nullable: true })
  coverLetter: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  resumeUrl: string

  @Column({ type: 'json', nullable: true })
  attachments: { name: string; url: string; type: string }[]

  // Informations de traitement
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  matchScore: number // Score de correspondance avec l'offre

  @Column({ type: 'text', nullable: true })
  hrNotes: string

  @Column({ type: 'json', nullable: true })
  interviewNotes: { date: Date; interviewer: string; notes: string; rating: number }[]

  @Column({ type: 'date', nullable: true })
  interviewDate: Date

  @Column({ type: 'varchar', length: 100, nullable: true })
  interviewer: string

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  interviewRating: number // Note de 1 à 5

  // Informations de suivi
  @Column({ type: 'timestamp', nullable: true })
  lastStatusChangeAt: Date

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastStatusChangedBy: string

  @Column({ type: 'text', nullable: true })
  rejectionReason: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  offerAmount: number

  @Column({ type: 'varchar', length: 10, nullable: true })
  offerCurrency: string

  @Column({ type: 'date', nullable: true })
  offerExpiryDate: Date

  // Métadonnées
  @Column({ type: 'varchar', length: 100, nullable: true })
  externalId: string // ID de la candidature sur la plateforme externe

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date

  @Column({ type: 'json', nullable: true })
  metadata: any // Données supplémentaires spécifiques à la plateforme

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Méthodes utilitaires
  static create(data: Partial<JobApplication>): JobApplication {
    const application = new JobApplication()
    Object.assign(application, data)
    return application
  }

  updateStatus(newStatus: ApplicationStatus, changedBy: string, reason?: string): void {
    this.status = newStatus
    this.lastStatusChangeAt = new Date()
    this.lastStatusChangedBy = changedBy
    
    if (newStatus === ApplicationStatus.REJECTED && reason) {
      this.rejectionReason = reason
    }
  }

  scheduleInterview(date: Date, interviewer: string): void {
    this.status = ApplicationStatus.INTERVIEW_SCHEDULED
    this.interviewDate = date
    this.interviewer = interviewer
    this.lastStatusChangeAt = new Date()
  }

  addInterviewNote(interviewer: string, notes: string, rating: number): void {
    if (!this.interviewNotes) this.interviewNotes = []
    
    this.interviewNotes.push({
      date: new Date(),
      interviewer,
      notes,
      rating
    })
    
    this.status = ApplicationStatus.INTERVIEWED
    this.interviewRating = rating
    this.lastStatusChangeAt = new Date()
  }

  makeOffer(amount: number, currency: string = 'EUR', expiryDays: number = 7): void {
    this.status = ApplicationStatus.OFFER_MADE
    this.offerAmount = amount
    this.offerCurrency = currency
    this.offerExpiryDate = new Date()
    this.offerExpiryDate.setDate(this.offerExpiryDate.getDate() + expiryDays)
    this.lastStatusChangeAt = new Date()
  }

  acceptOffer(): void {
    this.status = ApplicationStatus.ACCEPTED
    this.lastStatusChangeAt = new Date()
  }

  isOfferExpired(): boolean {
    return this.offerExpiryDate ? new Date() > this.offerExpiryDate : false
  }

  getDaysInCurrentStatus(): number {
    const statusDate = this.lastStatusChangeAt || this.createdAt
    const now = new Date()
    const diffTime = now.getTime() - statusDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  isStale(maxDays: number = 30): boolean {
    return this.getDaysInCurrentStatus() > maxDays
  }
}