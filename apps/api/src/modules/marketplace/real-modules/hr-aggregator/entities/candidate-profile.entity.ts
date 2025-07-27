import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { JobApplication } from './job-application.entity'

export enum CandidateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum EducationLevel {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  VOCATIONAL = 'VOCATIONAL',
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  PHD = 'PHD'
}

@Entity('hr_candidate_profiles')
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Informations personnelles
  @Column({ type: 'varchar', length: 100 })
  firstName: string

  @Column({ type: 'varchar', length: 100 })
  lastName: string

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  postalCode: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string

  // Informations professionnelles
  @Column({ type: 'varchar', length: 200, nullable: true })
  currentPosition: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  currentCompany: string

  @Column({ type: 'int', nullable: true })
  yearsOfExperience: number

  @Column({ 
    type: 'enum', 
    enum: EducationLevel,
    nullable: true 
  })
  educationLevel: EducationLevel

  @Column({ type: 'varchar', length: 200, nullable: true })
  lastDegree: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  school: string

  @Column({ type: 'json', nullable: true })
  skills: string[]

  @Column({ type: 'json', nullable: true })
  languages: { language: string; level: string }[]

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedSalary: number

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  salaryCurrency: string

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean

  @Column({ type: 'date', nullable: true })
  availabilityDate: Date

  // Informations de sourcing
  @Column({ type: 'varchar', length: 50 })
  sourcePlatform: string // 'HelloWork', 'Indeed', 'LinkedIn', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  externalId: string // ID du candidat sur la plateforme externe

  @Column({ type: 'varchar', length: 500, nullable: true })
  profileUrl: string // URL du profil sur la plateforme

  @Column({ type: 'varchar', length: 500, nullable: true })
  resumeUrl: string // URL du CV

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date

  @Column({ 
    type: 'enum', 
    enum: CandidateStatus,
    default: CandidateStatus.ACTIVE 
  })
  status: CandidateStatus

  // Scores et évaluations
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  aiMatchScore: number // Score de correspondance IA (0-100)

  @Column({ type: 'json', nullable: true })
  assessmentScores: { [key: string]: number }

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'json', nullable: true })
  tags: string[]

  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @OneToMany(() => JobApplication, application => application.candidate)
  applications: JobApplication[]

  // Méthodes utilitaires
  static create(data: Partial<CandidateProfile>): CandidateProfile {
    const candidate = new CandidateProfile()
    Object.assign(candidate, data)
    return candidate
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  updateAiMatchScore(jobRequirements: string[], jobSkills: string[]): void {
    // Algorithme simple de matching basé sur les compétences
    if (!this.skills || this.skills.length === 0) {
      this.aiMatchScore = 0
      return
    }

    const candidateSkills = this.skills.map(skill => skill.toLowerCase())
    const requiredSkills = jobSkills.map(skill => skill.toLowerCase())
    
    const matchingSkills = candidateSkills.filter(skill => 
      requiredSkills.some(reqSkill => 
        skill.includes(reqSkill) || reqSkill.includes(skill)
      )
    )

    this.aiMatchScore = (matchingSkills.length / requiredSkills.length) * 100
  }

  addTag(tag: string): void {
    if (!this.tags) this.tags = []
    if (!this.tags.includes(tag)) {
      this.tags.push(tag)
    }
  }

  removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter(t => t !== tag)
    }
  }

  isExperienced(minYears: number): boolean {
    return this.yearsOfExperience ? this.yearsOfExperience >= minYears : false
  }
}