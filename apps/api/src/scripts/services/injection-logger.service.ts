/**
 * Service de logging pour injection d'articles
 * TopSteel ERP - Clean Architecture
 */

import type {
  GlobalInjectionConfig,
  InjectionLogger,
  InjectionResult,
} from '../types/article-injection.types'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class InjectionLoggerService implements InjectionLogger {
  private config: GlobalInjectionConfig
  private startTime: number
  private logs: Array<{
    timestamp: Date
    level: string
    message: string
    meta?: any
  }> = []

  constructor(config: GlobalInjectionConfig) {
    this.config = config
    this.startTime = Date.now()
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      this.log('DEBUG', message, meta)
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      this.log('INFO', message, meta)
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      this.log('WARN', message, meta)
    }
  }

  error(message: string, error?: Error, meta?: any): void {
    if (this.shouldLog('error')) {
      const errorMeta = {
        ...meta,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      }
      this.log('ERROR', message, errorMeta)
    }
  }

  logResult(result: InjectionResult): void {
    this.info('='.repeat(60))
    this.info(`RÉSULTAT INJECTION: ${result.famille}/${result.sousFamille}`)
    this.info('='.repeat(60))

    this.info(`✅ Articles créés: ${result.articlesCreated}`)
    this.info(`⏭️  Articles ignorés: ${result.articlesSkipped}`)
    this.info(`❌ Erreurs: ${result.errors.length}`)
    this.info(`⏱️  Durée: ${result.duration}ms`)

    if (result.examples.length > 0) {
      this.info("\n📋 Exemples d'articles créés:")
      result.examples.forEach((example, index) => {
        this.info(
          `  ${index + 1}. ${example.reference} - ${example.designation} (${example.price}€)`
        )
      })
    }

    if (result.errors.length > 0) {
      this.info('\n🔍 Détail des erreurs:')
      result.errors.forEach((error, index) => {
        this.error(`  ${index + 1}. ${error}`)
      })
    }

    this.info('='.repeat(60))
  }

  // Méthodes utilitaires

  getLogSummary(): {
    totalLogs: number
    byLevel: Record<string, number>
    duration: number
    recentErrors: string[]
  } {
    const byLevel = this.logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const recentErrors = this.logs
      .filter((log) => log.level === 'ERROR')
      .slice(-5)
      .map((log) => log.message)

    return {
      totalLogs: this.logs.length,
      byLevel,
      duration: Date.now() - this.startTime,
      recentErrors,
    }
  }

  exportLogs(): string {
    const header = [
      "# TopSteel ERP - Journal d'injection",
      `Date: ${new Date().toISOString()}`,
      `Société: ${this.config.societeId}`,
      `Environnement: ${this.config.environment}`,
      `Niveau de log: ${this.config.logLevel}`,
      '',
    ].join('\n')

    const logLines = this.logs.map((log) => {
      const timestamp = log.timestamp.toISOString()
      const metaStr = log.meta ? ` | ${JSON.stringify(log.meta)}` : ''
      return `[${timestamp}] ${log.level.padEnd(5)} | ${log.message}${metaStr}`
    })

    return header + logLines.join('\n')
  }

  clearLogs(): void {
    this.logs = []
    this.startTime = Date.now()
  }

  // Méthodes de formatage spécialisées

  logProgress(current: number, total: number, operation: string): void {
    const percentage = Math.round((current / total) * 100)
    const progressBar = this.createProgressBar(percentage)
    this.info(`${operation}: ${progressBar} ${current}/${total} (${percentage}%)`)
  }

  logPerformance(operation: string, duration: number, itemsProcessed?: number): void {
    let message = `⚡ Performance ${operation}: ${duration}ms`

    if (itemsProcessed) {
      const itemsPerSecond = Math.round((itemsProcessed / duration) * 1000)
      message += ` (${itemsProcessed} items, ${itemsPerSecond} items/sec)`
    }

    this.debug(message)
  }

  logMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage()
      this.debug('Memory usage:', {
        rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memory.external / 1024 / 1024)}MB`,
      })
    }
  }

  logDatabaseStats(stats: {
    totalArticles?: number
    articlesByFamily?: Record<string, number>
    connectionCount?: number
  }): void {
    this.info('📊 Statistiques base de données:', stats)
  }

  // Méthodes privées

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const configLevel = levels.indexOf(this.config.logLevel)
    const messageLevel = levels.indexOf(level)
    return messageLevel >= configLevel
  }

  private log(level: string, message: string, meta?: any): void {
    const logEntry = {
      timestamp: new Date(),
      level,
      message,
      meta,
    }

    this.logs.push(logEntry)

    // Console output avec couleurs
    const coloredMessage = this.colorizeMessage(level, message)
    console.log(coloredMessage)

    if (meta && this.config.logLevel === 'debug') {
      console.log('  Meta:', JSON.stringify(meta, null, 2))
    }

    // Limite le nombre de logs en mémoire
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000) // Garde les 5000 derniers
    }
  }

  private colorizeMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString().substring(11, 23) // HH:mm:ss.sss

    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m', // Vert
      WARN: '\x1b[33m', // Jaune
      ERROR: '\x1b[31m', // Rouge
    }

    const reset = '\x1b[0m'
    const color = colors[level as keyof typeof colors] || ''

    return `${color}[${timestamp}] ${level.padEnd(5)}${reset} | ${message}`
  }

  private createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`
  }

  // Méthodes statiques utilitaires

  static formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`
  }

  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 100) / 10}s`
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.round((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  static createBanner(title: string, width: number = 60): string {
    const padding = Math.max(0, width - title.length - 2)
    const leftPad = Math.floor(padding / 2)
    const rightPad = padding - leftPad

    return [
      '='.repeat(width),
      `${' '.repeat(leftPad)}${title}${' '.repeat(rightPad)}`,
      '='.repeat(width),
    ].join('\n')
  }
}
