import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard'
import { HrAggregatorService, JobSearchFilters, CandidateSearchFilters } from '../services/hr-aggregator.service'
import { JobPosting } from '../entities/job-posting.entity'
import { CandidateProfile } from '../entities/candidate-profile.entity'
import { JobApplication, ApplicationStatus } from '../entities/job-application.entity'
import { PlatformConfig } from '../entities/platform-config.entity'

@ApiTags('HR Aggregator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrAggregatorController {
  constructor(private readonly hrService: HrAggregatorService) {}

  // ===== DASHBOARD =====

  @Get('dashboard')
  @ApiOperation({ summary: 'Récupérer les statistiques du dashboard RH' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getDashboard() {
    return await this.hrService.getDashboardStats()
  }

  // ===== OFFRES D'EMPLOI =====

  @Get('jobs')
  @ApiOperation({ summary: 'Lister les offres d\'emploi avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des offres d\'emploi', type: [JobPosting] })
  async getJobPostings(@Query() filters: JobSearchFilters) {
    return await this.hrService.findJobPostings(filters)
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Récupérer une offre d\'emploi par ID' })
  @ApiResponse({ status: 200, description: 'Offre d\'emploi trouvée', type: JobPosting })
  @ApiResponse({ status: 404, description: 'Offre d\'emploi non trouvée' })
  async getJobPosting(@Param('id') id: string) {
    const job = await this.hrService.getJobPostingById(id)
    if (!job) {
      throw new Error('Offre d\'emploi non trouvée')
    }
    return job
  }

  @Post('jobs')
  @ApiOperation({ summary: 'Créer une nouvelle offre d\'emploi' })
  @ApiResponse({ status: 201, description: 'Offre d\'emploi créée', type: JobPosting })
  async createJobPosting(@Body() jobData: Partial<JobPosting>) {
    return await this.hrService.createJobPosting(jobData)
  }

  @Put('jobs/:id')
  @ApiOperation({ summary: 'Mettre à jour une offre d\'emploi' })
  @ApiResponse({ status: 200, description: 'Offre d\'emploi mise à jour', type: JobPosting })
  async updateJobPosting(@Param('id') id: string, @Body() jobData: Partial<JobPosting>) {
    return await this.hrService.updateJobPosting(id, jobData)
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Désactiver une offre d\'emploi' })
  @ApiResponse({ status: 200, description: 'Offre d\'emploi désactivée' })
  async deactivateJobPosting(@Param('id') id: string) {
    await this.hrService.deactivateJobPosting(id)
    return { message: 'Offre d\'emploi désactivée avec succès' }
  }

  @Get('jobs/:id/applications')
  @ApiOperation({ summary: 'Récupérer les candidatures pour une offre' })
  @ApiResponse({ status: 200, description: 'Liste des candidatures', type: [JobApplication] })
  async getJobApplications(@Param('id') jobId: string) {
    return await this.hrService.getApplicationsByJob(jobId)
  }

  @Get('jobs/:id/matching-candidates')
  @ApiOperation({ summary: 'Trouver des candidats correspondant à une offre' })
  @ApiResponse({ status: 200, description: 'Candidats correspondants', type: [CandidateProfile] })
  async getMatchingCandidates(
    @Param('id') jobId: string,
    @Query('limit') limit: string = '10'
  ) {
    return await this.hrService.findMatchingCandidates(jobId, parseInt(limit))
  }

  // ===== CANDIDATS =====

  @Get('candidates')
  @ApiOperation({ summary: 'Lister les candidats avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des candidats', type: [CandidateProfile] })
  async getCandidates(@Query() filters: CandidateSearchFilters) {
    return await this.hrService.findCandidates(filters)
  }

  @Get('candidates/:id')
  @ApiOperation({ summary: 'Récupérer un candidat par ID' })
  @ApiResponse({ status: 200, description: 'Candidat trouvé', type: CandidateProfile })
  @ApiResponse({ status: 404, description: 'Candidat non trouvé' })
  async getCandidate(@Param('id') id: string) {
    const candidate = await this.hrService.getCandidateById(id)
    if (!candidate) {
      throw new Error('Candidat non trouvé')
    }
    return candidate
  }

  @Post('candidates')
  @ApiOperation({ summary: 'Créer un nouveau profil candidat' })
  @ApiResponse({ status: 201, description: 'Candidat créé', type: CandidateProfile })
  async createCandidate(@Body() candidateData: Partial<CandidateProfile>) {
    return await this.hrService.createCandidateProfile(candidateData)
  }

  @Put('candidates/:id')
  @ApiOperation({ summary: 'Mettre à jour un profil candidat' })
  @ApiResponse({ status: 200, description: 'Candidat mis à jour', type: CandidateProfile })
  async updateCandidate(@Param('id') id: string, @Body() candidateData: Partial<CandidateProfile>) {
    return await this.hrService.updateCandidateProfile(id, candidateData)
  }

  @Get('candidates/:id/applications')
  @ApiOperation({ summary: 'Récupérer les candidatures d\'un candidat' })
  @ApiResponse({ status: 200, description: 'Liste des candidatures', type: [JobApplication] })
  async getCandidateApplications(@Param('id') candidateId: string) {
    return await this.hrService.getApplicationsByCandidate(candidateId)
  }

  // ===== CANDIDATURES =====

  @Post('applications')
  @ApiOperation({ summary: 'Créer une nouvelle candidature' })
  @ApiResponse({ status: 201, description: 'Candidature créée', type: JobApplication })
  async createApplication(@Body() applicationData: Partial<JobApplication>) {
    return await this.hrService.createApplication(applicationData)
  }

  @Put('applications/:id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une candidature' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour', type: JobApplication })
  async updateApplicationStatus(
    @Param('id') applicationId: string,
    @Body() data: { status: ApplicationStatus; changedBy: string; reason?: string }
  ) {
    return await this.hrService.updateApplicationStatus(
      applicationId,
      data.status,
      data.changedBy,
      data.reason
    )
  }

  // ===== PLATEFORMES ET SYNCHRONISATION =====

  @Get('platforms')
  @ApiOperation({ summary: 'Lister les configurations de plateformes' })
  @ApiResponse({ status: 200, description: 'Liste des plateformes', type: [PlatformConfig] })
  async getPlatformConfigs() {
    return await this.hrService.getPlatformConfigs()
  }

  @Post('platforms')
  @ApiOperation({ summary: 'Créer une nouvelle configuration de plateforme' })
  @ApiResponse({ status: 201, description: 'Configuration créée', type: PlatformConfig })
  async createPlatformConfig(@Body() configData: Partial<PlatformConfig>) {
    return await this.hrService.createPlatformConfig(configData)
  }

  @Put('platforms/:id')
  @ApiOperation({ summary: 'Mettre à jour une configuration de plateforme' })
  @ApiResponse({ status: 200, description: 'Configuration mise à jour', type: PlatformConfig })
  async updatePlatformConfig(@Param('id') id: string, @Body() configData: Partial<PlatformConfig>) {
    return await this.hrService.updatePlatformConfig(id, configData)
  }

  @Post('platforms/:id/sync')
  @ApiOperation({ summary: 'Synchroniser manuellement une plateforme' })
  @ApiResponse({ status: 200, description: 'Synchronisation lancée' })
  async syncPlatform(@Param('id') configId: string) {
    const result = await this.hrService.syncPlatform(configId)
    return {
      message: 'Synchronisation terminée',
      result
    }
  }

  @Post('sync/all')
  @ApiOperation({ summary: 'Synchroniser toutes les plateformes actives' })
  @ApiResponse({ status: 200, description: 'Synchronisation de toutes les plateformes lancée' })
  async syncAllPlatforms() {
    // Déclencher la synchronisation manuelle
    await this.hrService.handleAutomaticSync()
    return { message: 'Synchronisation de toutes les plateformes lancée' }
  }

  // ===== ANALYTICS ET RAPPORTS =====

  @Get('analytics/recruitment-funnel')
  @ApiOperation({ summary: 'Statistiques du funnel de recrutement' })
  @ApiResponse({ status: 200, description: 'Statistiques du funnel' })
  async getRecruitmentFunnel(@Query('period') period: string = '30') {
    // TODO: Implémenter avec vraies données de la base
    return {
      message: 'Analytics non disponibles - données réelles requises',
      period: `${period} derniers jours`
    }
  }

  @Get('analytics/source-effectiveness')
  @ApiOperation({ summary: 'Efficacité des sources de recrutement' })
  @ApiResponse({ status: 200, description: 'Efficacité par source' })
  async getSourceEffectiveness() {
    // TODO: Calculer depuis les vraies données
    return {
      message: 'Analytics non disponibles - intégration avec vraies plateformes requise'
    }
  }

  @Get('analytics/skills-demand')
  @ApiOperation({ summary: 'Demande de compétences' })
  @ApiResponse({ status: 200, description: 'Analyse de la demande' })
  async getSkillsDemand() {
    // TODO: Analyser depuis les vraies offres et candidats
    return {
      message: 'Analytics non disponibles - analyse des vraies données requise'
    }
  }
}