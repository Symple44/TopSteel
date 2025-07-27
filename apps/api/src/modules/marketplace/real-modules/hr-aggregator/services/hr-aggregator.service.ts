import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, Between } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import { JobPosting, JobStatus, JobType } from '../entities/job-posting.entity'
import { CandidateProfile, CandidateStatus } from '../entities/candidate-profile.entity'
import { JobApplication, ApplicationStatus, ApplicationSource } from '../entities/job-application.entity'
import { PlatformConfig, PlatformType, ConfigStatus } from '../entities/platform-config.entity'

export interface JobSearchFilters {
  location?: string
  jobType?: JobType
  salaryMin?: number
  salaryMax?: number
  skills?: string[]
  experienceLevel?: string
  company?: string
}

export interface CandidateSearchFilters {
  location?: string
  skills?: string[]
  experienceYears?: { min?: number; max?: number }
  availability?: boolean
  educationLevel?: string
}

export interface SyncResult {
  success: boolean
  jobsSynced: number
  candidatesSynced: number
  errors: string[]
}

@Injectable()
export class HrAggregatorService {
  private readonly logger = new Logger(HrAggregatorService.name)

  constructor(
    @InjectRepository(JobPosting, 'tenant')
    private readonly jobPostingRepository: Repository<JobPosting>,
    @InjectRepository(CandidateProfile, 'tenant')
    private readonly candidateRepository: Repository<CandidateProfile>,
    @InjectRepository(JobApplication, 'tenant')
    private readonly applicationRepository: Repository<JobApplication>,
    @InjectRepository(PlatformConfig, 'tenant')
    private readonly platformConfigRepository: Repository<PlatformConfig>
  ) {}

  // ===== GESTION DES OFFRES D'EMPLOI =====

  async createJobPosting(data: Partial<JobPosting>): Promise<JobPosting> {
    const jobPosting = JobPosting.create(data)
    return await this.jobPostingRepository.save(jobPosting)
  }

  async findJobPostings(filters?: JobSearchFilters): Promise<JobPosting[]> {
    const queryBuilder = this.jobPostingRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.applications', 'applications')
      .where('job.isActive = :isActive', { isActive: true })

    if (filters) {
      if (filters.location) {
        queryBuilder.andWhere('job.location ILIKE :location', { 
          location: `%${filters.location}%` 
        })
      }

      if (filters.jobType) {
        queryBuilder.andWhere('job.jobType = :jobType', { jobType: filters.jobType })
      }

      if (filters.salaryMin) {
        queryBuilder.andWhere('job.salaryMin >= :salaryMin', { salaryMin: filters.salaryMin })
      }

      if (filters.salaryMax) {
        queryBuilder.andWhere('job.salaryMax <= :salaryMax', { salaryMax: filters.salaryMax })
      }

      if (filters.skills && filters.skills.length > 0) {
        queryBuilder.andWhere('job.requiredSkills && ARRAY[:...skills]', { skills: filters.skills })
      }

      if (filters.company) {
        queryBuilder.andWhere('job.company ILIKE :company', { 
          company: `%${filters.company}%` 
        })
      }
    }

    return await queryBuilder
      .orderBy('job.createdAt', 'DESC')
      .getMany()
  }

  async getJobPostingById(id: string): Promise<JobPosting | null> {
    const job = await this.jobPostingRepository.findOne({
      where: { id, isActive: true },
      relations: ['applications', 'applications.candidate']
    })

    if (job) {
      job.incrementViewCount()
      await this.jobPostingRepository.save(job)
    }

    return job
  }

  async updateJobPosting(id: string, data: Partial<JobPosting>): Promise<JobPosting> {
    await this.jobPostingRepository.update(id, data)
    const updated = await this.getJobPostingById(id)
    if (!updated) throw new Error('Job posting not found after update')
    return updated
  }

  async deactivateJobPosting(id: string): Promise<void> {
    await this.jobPostingRepository.update(id, { 
      status: JobStatus.CLOSED,
      isActive: false 
    })
  }

  // ===== GESTION DES CANDIDATS =====

  async createCandidateProfile(data: Partial<CandidateProfile>): Promise<CandidateProfile> {
    const candidate = CandidateProfile.create(data)
    return await this.candidateRepository.save(candidate)
  }

  async findCandidates(filters?: CandidateSearchFilters): Promise<CandidateProfile[]> {
    const queryBuilder = this.candidateRepository.createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.applications', 'applications')
      .where('candidate.isActive = :isActive', { isActive: true })

    if (filters) {
      if (filters.location) {
        queryBuilder.andWhere('candidate.city ILIKE :location', { 
          location: `%${filters.location}%` 
        })
      }

      if (filters.skills && filters.skills.length > 0) {
        queryBuilder.andWhere('candidate.skills && ARRAY[:...skills]', { skills: filters.skills })
      }

      if (filters.experienceYears) {
        if (filters.experienceYears.min) {
          queryBuilder.andWhere('candidate.yearsOfExperience >= :minExp', { 
            minExp: filters.experienceYears.min 
          })
        }
        if (filters.experienceYears.max) {
          queryBuilder.andWhere('candidate.yearsOfExperience <= :maxExp', { 
            maxExp: filters.experienceYears.max 
          })
        }
      }

      if (filters.availability !== undefined) {
        queryBuilder.andWhere('candidate.isAvailable = :available', { 
          available: filters.availability 
        })
      }
    }

    return await queryBuilder
      .orderBy('candidate.aiMatchScore', 'DESC')
      .addOrderBy('candidate.createdAt', 'DESC')
      .getMany()
  }

  async getCandidateById(id: string): Promise<CandidateProfile | null> {
    return await this.candidateRepository.findOne({
      where: { id, isActive: true },
      relations: ['applications', 'applications.jobPosting']
    })
  }

  async updateCandidateProfile(id: string, data: Partial<CandidateProfile>): Promise<CandidateProfile> {
    await this.candidateRepository.update(id, data)
    const updated = await this.getCandidateById(id)
    if (!updated) throw new Error('Candidate not found after update')
    return updated
  }

  async findMatchingCandidates(jobId: string, limit: number = 10): Promise<CandidateProfile[]> {
    const jobPosting = await this.getJobPostingById(jobId)
    if (!jobPosting) return []

    const queryBuilder = this.candidateRepository.createQueryBuilder('candidate')
      .where('candidate.isActive = :isActive', { isActive: true })
      .andWhere('candidate.isAvailable = :available', { available: true })

    // Filtrer par compétences requises
    if (jobPosting.requiredSkills && jobPosting.requiredSkills.length > 0) {
      queryBuilder.andWhere('candidate.skills && ARRAY[:...skills]', { 
        skills: jobPosting.requiredSkills 
      })
    }

    // Filtrer par salaire si spécifié
    if (jobPosting.salaryMin) {
      queryBuilder.andWhere(
        '(candidate.expectedSalary IS NULL OR candidate.expectedSalary <= :maxSalary)',
        { maxSalary: jobPosting.salaryMax || jobPosting.salaryMin * 1.2 }
      )
    }

    const candidates = await queryBuilder
      .orderBy('candidate.aiMatchScore', 'DESC')
      .limit(limit)
      .getMany()

    // Mettre à jour les scores de correspondance
    for (const candidate of candidates) {
      candidate.updateAiMatchScore([], jobPosting.requiredSkills || [])
      await this.candidateRepository.save(candidate)
    }

    return candidates
  }

  // ===== GESTION DES CANDIDATURES =====

  async createApplication(data: Partial<JobApplication>): Promise<JobApplication> {
    const application = JobApplication.create(data)
    
    // Incrémenter le compteur de candidatures du poste
    if (data.jobPostingId) {
      const jobPosting = await this.getJobPostingById(data.jobPostingId)
      if (jobPosting) {
        jobPosting.incrementApplicationCount()
        await this.jobPostingRepository.save(jobPosting)
      }
    }

    return await this.applicationRepository.save(application)
  }

  async getApplicationsByJob(jobId: string): Promise<JobApplication[]> {
    return await this.applicationRepository.find({
      where: { jobPostingId: jobId, isActive: true },
      relations: ['candidate', 'jobPosting'],
      order: { createdAt: 'DESC' }
    })
  }

  async getApplicationsByCandidate(candidateId: string): Promise<JobApplication[]> {
    return await this.applicationRepository.find({
      where: { candidateId, isActive: true },
      relations: ['candidate', 'jobPosting'],
      order: { createdAt: 'DESC' }
    })
  }

  async updateApplicationStatus(
    applicationId: string, 
    status: ApplicationStatus, 
    changedBy: string,
    reason?: string
  ): Promise<JobApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
      relations: ['candidate', 'jobPosting']
    })

    if (!application) {
      throw new Error('Application not found')
    }

    application.updateStatus(status, changedBy, reason)
    return await this.applicationRepository.save(application)
  }

  // ===== GESTION DES PLATEFORMES =====

  async createPlatformConfig(data: Partial<PlatformConfig>): Promise<PlatformConfig> {
    const config = PlatformConfig.create(data)
    return await this.platformConfigRepository.save(config)
  }

  async getPlatformConfigs(): Promise<PlatformConfig[]> {
    return await this.platformConfigRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    })
  }

  async updatePlatformConfig(id: string, data: Partial<PlatformConfig>): Promise<PlatformConfig> {
    await this.platformConfigRepository.update(id, data)
    const updated = await this.platformConfigRepository.findOne({ where: { id } })
    if (!updated) throw new Error('Platform config not found after update')
    return updated
  }

  // ===== SYNCHRONISATION AUTOMATIQUE =====

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleAutomaticSync(): Promise<void> {
    this.logger.log('Démarrage de la synchronisation automatique')

    const activeConfigs = await this.platformConfigRepository.find({
      where: { 
        status: ConfigStatus.ACTIVE,
        autoSync: true,
        isActive: true 
      }
    })

    for (const config of activeConfigs) {
      if (config.needsSync()) {
        try {
          await this.syncPlatform(config.id)
        } catch (error) {
          this.logger.error(`Erreur lors de la sync de ${config.name}:`, error)
        }
      }
    }
  }

  async syncPlatform(configId: string): Promise<SyncResult> {
    const config = await this.platformConfigRepository.findOne({ where: { id: configId } })
    if (!config) {
      throw new Error('Configuration de plateforme non trouvée')
    }

    this.logger.log(`Synchronisation de ${config.name} (${config.platformType})`)

    try {
      let jobsSynced = 0
      let candidatesSynced = 0
      const errors: string[] = []

      // Simuler la synchronisation selon le type de plateforme
      switch (config.platformType) {
        case PlatformType.HELLOWORK:
          const helloworkResult = await this.syncHelloWork(config)
          jobsSynced += helloworkResult.jobsSynced
          candidatesSynced += helloworkResult.candidatesSynced
          errors.push(...helloworkResult.errors)
          break

        case PlatformType.INDEED:
          const indeedResult = await this.syncIndeed(config)
          jobsSynced += indeedResult.jobsSynced
          candidatesSynced += indeedResult.candidatesSynced
          errors.push(...indeedResult.errors)
          break

        case PlatformType.LINKEDIN:
          const linkedinResult = await this.syncLinkedIn(config)
          jobsSynced += linkedinResult.jobsSynced
          candidatesSynced += linkedinResult.candidatesSynced
          errors.push(...linkedinResult.errors)
          break

        default:
          errors.push(`Type de plateforme non supporté: ${config.platformType}`)
      }

      // Mettre à jour les statistiques
      config.updateSyncStats(jobsSynced, candidatesSynced)
      config.updateSyncStatus(errors.length === 0, errors.join('; '))
      await this.platformConfigRepository.save(config)

      return {
        success: errors.length === 0,
        jobsSynced,
        candidatesSynced,
        errors
      }

    } catch (error) {
      config.updateSyncStatus(false, error instanceof Error ? error.message : String(error))
      await this.platformConfigRepository.save(config)
      throw error
    }
  }

  private async syncHelloWork(config: PlatformConfig): Promise<SyncResult> {
    this.logger.log('Synchronisation HelloWork...')
    
    // TODO: Implémenter la vraie API HelloWork
    // Nécessite: API Key, endpoints réels, mapping des champs
    
    return {
      success: false,
      jobsSynced: 0,
      candidatesSynced: 0,
      errors: ['API HelloWork non implémentée - configuration réelle requise']
    }
  }

  private async syncIndeed(config: PlatformConfig): Promise<SyncResult> {
    this.logger.log('Synchronisation Indeed...')
    
    // TODO: Implémenter la vraie API Indeed
    // Nécessite: Indeed Publisher Account, API credentials
    
    return {
      success: false,
      jobsSynced: 0,
      candidatesSynced: 0,
      errors: ['API Indeed non implémentée - Indeed Publisher Account requis']
    }
  }

  private async syncLinkedIn(config: PlatformConfig): Promise<SyncResult> {
    this.logger.log('Synchronisation LinkedIn...')
    
    // TODO: Implémenter la vraie API LinkedIn
    // Nécessite: LinkedIn App, OAuth 2.0, permissions Jobs API
    
    return {
      success: false,
      jobsSynced: 0,
      candidatesSynced: 0,
      errors: ['API LinkedIn non implémentée - LinkedIn App avec Jobs API requis']
    }
  }


  // ===== STATISTIQUES ET RAPPORTS =====

  async getDashboardStats(): Promise<any> {
    const [
      totalJobs,
      activeJobs,
      totalCandidates,
      availableCandidates,
      totalApplications,
      pendingApplications
    ] = await Promise.all([
      this.jobPostingRepository.count({ where: { isActive: true } }),
      this.jobPostingRepository.count({ where: { status: JobStatus.ACTIVE, isActive: true } }),
      this.candidateRepository.count({ where: { isActive: true } }),
      this.candidateRepository.count({ where: { isAvailable: true, isActive: true } }),
      this.applicationRepository.count({ where: { isActive: true } }),
      this.applicationRepository.count({ where: { status: ApplicationStatus.PENDING, isActive: true } })
    ])

    const platformStats = await this.platformConfigRepository
      .createQueryBuilder('config')
      .select('config.platformType', 'platform')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(config.totalJobsSynced)', 'totalJobs')
      .addSelect('SUM(config.totalCandidatesSynced)', 'totalCandidates')
      .where('config.isActive = :isActive', { isActive: true })
      .groupBy('config.platformType')
      .getRawMany()

    return {
      overview: {
        totalJobs,
        activeJobs,
        totalCandidates,
        availableCandidates,
        totalApplications,
        pendingApplications
      },
      platforms: platformStats
    }
  }
}