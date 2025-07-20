import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Queue, Job } from 'bull'
import { EmailOptions, BulkEmailOptions, EmailResult, BulkEmailResult } from '../interfaces/email-provider.interface'

export interface EmailJobData {
  options: EmailOptions
  providerName?: string
  retryCount?: number
  originalJobId?: string
}

export interface BulkEmailJobData {
  options: BulkEmailOptions
  providerName?: string
  retryCount?: number
  originalJobId?: string
}

@Injectable()
@Processor('email')
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name)

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @Inject(forwardRef(() => 'EmailService')) private emailService?: any,
  ) {}

  /**
   * Ajouter un email à la queue
   */
  async addEmailJob(
    options: EmailOptions, 
    providerName?: string, 
    delay?: number,
    priority?: number,
    attempts?: number
  ): Promise<Job<EmailJobData>> {
    const jobData: EmailJobData = {
      options,
      providerName,
      retryCount: 0,
    }

    const jobOptions = {
      delay: delay || 0,
      priority: priority || 0,
      attempts: attempts || 3,
      removeOnComplete: 50,
      removeOnFail: 100,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
    }

    const job = await this.emailQueue.add('send-email', jobData, jobOptions)
    
    this.logger.log(`Email ajouté à la queue: ${job.id} (to: ${options.to})`)
    
    return job
  }

  /**
   * Ajouter des emails en masse à la queue
   */
  async addBulkEmailJob(
    options: BulkEmailOptions, 
    providerName?: string, 
    delay?: number,
    priority?: number
  ): Promise<Job<BulkEmailJobData>> {
    const jobData: BulkEmailJobData = {
      options,
      providerName,
      retryCount: 0,
    }

    const jobOptions = {
      delay: delay || 0,
      priority: priority || 0,
      attempts: 2, // Moins de tentatives pour les envois en masse
      removeOnComplete: 10,
      removeOnFail: 50,
      backoff: {
        type: 'exponential' as const,
        delay: 5000,
      },
    }

    const job = await this.emailQueue.add('send-bulk-email', jobData, jobOptions)
    
    this.logger.log(`Envoi en masse ajouté à la queue: ${job.id} (${options.emails.length} emails)`)
    
    return job
  }

  /**
   * Programmer un email pour un envoi ultérieur
   */
  async scheduleEmail(
    options: EmailOptions,
    sendAt: Date,
    providerName?: string
  ): Promise<Job<EmailJobData>> {
    const delay = sendAt.getTime() - Date.now()
    
    if (delay <= 0) {
      throw new Error('La date d\'envoi doit être dans le futur')
    }

    return await this.addEmailJob(options, providerName, delay, 5) // Priorité élevée pour les emails programmés
  }

  /**
   * Programmer des emails récurrents (ex: newsletters)
   */
  async scheduleRecurringEmail(
    options: EmailOptions,
    cron: string,
    providerName?: string
  ): Promise<void> {
    await this.emailQueue.add(
      'send-email',
      { options, providerName },
      {
        repeat: { cron },
        removeOnComplete: 5,
        removeOnFail: 10,
      }
    )

    this.logger.log(`Email récurrent programmé avec cron: ${cron}`)
  }

  /**
   * Obtenir les statistiques de la queue
   */
  async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    paused: number
  }> {
    const waiting = await this.emailQueue.getWaiting()
    const active = await this.emailQueue.getActive()
    const completed = await this.emailQueue.getCompleted()
    const failed = await this.emailQueue.getFailed()
    const delayed = await this.emailQueue.getDelayed()
    const paused = await this.emailQueue.isPaused()

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: paused ? 1 : 0,
    }
  }

  /**
   * Purger la queue
   */
  async purgeQueue(): Promise<void> {
    await this.emailQueue.clean(0, 'completed')
    await this.emailQueue.clean(0, 'failed')
    this.logger.log('Queue email purgée')
  }

  /**
   * Pauser la queue
   */
  async pauseQueue(): Promise<void> {
    await this.emailQueue.pause()
    this.logger.log('Queue email mise en pause')
  }

  /**
   * Reprendre la queue
   */
  async resumeQueue(): Promise<void> {
    await this.emailQueue.resume()
    this.logger.log('Queue email reprise')
  }

  /**
   * Obtenir les jobs en cours
   */
  async getActiveJobs(): Promise<Job[]> {
    return await this.emailQueue.getActive()
  }

  /**
   * Obtenir les jobs en attente
   */
  async getWaitingJobs(): Promise<Job[]> {
    return await this.emailQueue.getWaiting()
  }

  /**
   * Obtenir les jobs échoués
   */
  async getFailedJobs(): Promise<Job[]> {
    return await this.emailQueue.getFailed()
  }

  /**
   * Retraiter un job échoué
   */
  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.emailQueue.getJob(jobId)
    
    if (job && job.opts.attempts && job.attemptsMade < job.opts.attempts) {
      await job.retry()
      this.logger.log(`Job ${jobId} retraité`)
    } else {
      throw new Error(`Job ${jobId} ne peut pas être retraité`)
    }
  }

  /**
   * Supprimer un job
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.emailQueue.getJob(jobId)
    
    if (job) {
      await job.remove()
      this.logger.log(`Job ${jobId} supprimé`)
    }
  }

  /**
   * Traiter l'envoi d'un email simple
   */
  @Process('send-email')
  async processSendEmail(job: Job<EmailJobData>): Promise<EmailResult> {
    const { options, providerName, retryCount = 0 } = job.data
    
    this.logger.log(`Traitement du job email ${job.id}: ${options.subject}`)

    try {
      // Note: On injecte EmailService ici pour éviter la dépendance circulaire
      // En production, on utiliserait un pattern différent
      const emailService = this.getEmailService()
      const result = await emailService.sendEmail(options, providerName)

      if (result.success) {
        this.logger.log(`Email envoyé avec succès: ${job.id}`)
        return result
      } else {
        throw new Error(result.error || 'Échec de l\'envoi')
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email ${job.id}:`, error)
      
      // Incrémenter le compteur de retry
      job.data.retryCount = retryCount + 1
      
      throw error
    }
  }

  /**
   * Traiter l'envoi d'emails en masse
   */
  @Process('send-bulk-email')
  async processBulkEmail(job: Job<BulkEmailJobData>): Promise<BulkEmailResult> {
    const { options, providerName, retryCount = 0 } = job.data
    
    this.logger.log(`Traitement du job bulk email ${job.id}: ${options.emails.length} emails`)

    try {
      const emailService = this.getEmailService()
      const result = await emailService.sendBulkEmails(options, providerName)

      this.logger.log(`Envoi en masse terminé: ${job.id} (${result.totalSent}/${options.emails.length} envoyés)`)
      
      return result
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi en masse ${job.id}:`, error)
      
      // Incrémenter le compteur de retry
      job.data.retryCount = retryCount + 1
      
      throw error
    }
  }

  /**
   * Gestionnaire d'événements pour les jobs terminés
   */
  @Process('completed')
  async onJobCompleted(job: Job, result: any): Promise<void> {
    this.logger.log(`Job ${job.id} terminé avec succès`)
  }

  /**
   * Gestionnaire d'événements pour les jobs échoués
   */
  @Process('failed')
  async onJobFailed(job: Job, error: Error): Promise<void> {
    this.logger.error(`Job ${job.id} échoué:`, error)
    
    // Analyser l'erreur pour déterminer si c'est retryable
    if (this.isRetryableError(error) && job.attemptsMade < (job.opts.attempts || 3)) {
      this.logger.log(`Job ${job.id} sera retraité (tentative ${job.attemptsMade + 1})`)
    } else {
      this.logger.error(`Job ${job.id} définitivement échoué après ${job.attemptsMade} tentatives`)
      
      // Ici on pourrait envoyer une notification aux administrateurs
      // ou logger dans un système de monitoring
    }
  }

  /**
   * Déterminer si une erreur est retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'TIMEOUT',
      'Rate limit',
      'Temporary failure',
      '5xx',
    ]

    return retryableErrors.some(retryable => 
      error.message.toLowerCase().includes(retryable.toLowerCase())
    )
  }

  /**
   * Obtenir une instance du service email
   */
  private getEmailService(): any {
    if (!this.emailService) {
      throw new Error('EmailService non disponible dans le processeur de queue')
    }
    return this.emailService
  }

  /**
   * Créer des jobs d'email en batch pour optimiser les performances
   */
  async addEmailBatch(emails: EmailOptions[], providerName?: string): Promise<Job[]> {
    const jobs = emails.map((email, index) => ({
      name: 'send-email',
      data: {
        options: email,
        providerName,
        retryCount: 0,
      },
      opts: {
        delay: index * 100, // Espacement de 100ms entre chaque email
        attempts: 3,
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    }))

    const createdJobs = await this.emailQueue.addBulk(jobs)
    
    this.logger.log(`Batch de ${emails.length} emails ajouté à la queue`)
    
    return createdJobs
  }

  /**
   * Planifier l'envoi d'une newsletter
   */
  async scheduleNewsletter(
    emails: EmailOptions[],
    sendAt: Date,
    batchSize = 50,
    delayBetweenBatches = 5000
  ): Promise<void> {
    const delay = sendAt.getTime() - Date.now()
    
    if (delay <= 0) {
      throw new Error('La date d\'envoi doit être dans le futur')
    }

    // Diviser en batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      const batchDelay = delay + (i / batchSize) * delayBetweenBatches

      await this.addBulkEmailJob(
        { emails: batch, batchSize: Math.min(batchSize, 10) },
        undefined,
        batchDelay,
        3 // Priorité moyenne
      )
    }

    this.logger.log(`Newsletter programmée: ${emails.length} emails en ${Math.ceil(emails.length / batchSize)} batches`)
  }
}