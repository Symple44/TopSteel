// apps/api/src/config/graceful-shutdown.service.ts

import type { INestApplication } from '@nestjs/common'
import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common'
import { cleanupPort, killProcessOnPort } from './enhanced-server-manager'

@Injectable()
export class GracefulShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(GracefulShutdownService.name)
  private app: INestApplication
  private actualPort: number
  private shutdownInProgress = false

  setApp(app: INestApplication, port: number) {
    this.app = app
    this.actualPort = port
  }

  async onApplicationShutdown(signal?: string) {
    if (this.shutdownInProgress) {
      this.logger.warn(`Arrêt déjà en cours, ignorer le signal ${signal}`)
      return
    }

    this.shutdownInProgress = true
    this.logger.log(`🔄 Début de l'arrêt gracieux (signal: ${signal})`)

    try {
      await this.performGracefulShutdown()
    } catch (error) {
      this.logger.error("❌ Erreur durant l'arrêt gracieux:", error)
      await this.forceShutdown()
    }
  }

  private async performGracefulShutdown(): Promise<void> {
    const _shutdownTimeout = 30000 // 30 secondes max
    const startTime = Date.now()

    // 1. Arrêter d'accepter de nouvelles connexions
    this.logger.log('📝 1/6 - Arrêt des nouvelles connexions...')
    const server = this.app?.getHttpServer()

    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout lors de la fermeture du serveur HTTP'))
        }, 10000)

        server.close((error) => {
          clearTimeout(timeout)
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })
      this.logger.log('✅ Serveur HTTP fermé')
    }

    // 2. Attendre que les connexions existantes se terminent
    this.logger.log('📝 2/6 - Attente de la fin des connexions actives...')
    await this.waitForActiveConnections(5000)

    // 3. Fermer les connexions de base de données
    this.logger.log('📝 3/6 - Fermeture des connexions base de données...')
    try {
      if (this.app) {
        // Essayer de fermer les connexions TypeORM
        try {
          const { getConnectionManager } = await import('typeorm')
          try {
            const connectionManager = getConnectionManager()
            const connections =
              connectionManager.connections?.filter((conn) => conn?.isConnected) || []

            for (const connection of connections) {
              if (connection?.isConnected) {
                await connection.close()
              }
            }

            if (connections.length > 0) {
              this.logger.log('✅ Connexions base de données fermées')
            }
          } catch (_legacyError) {
            // Fallback pour les versions plus récentes de TypeORM
            this.logger.warn('⚠️  Méthode legacy TypeORM non disponible')
          }
        } catch (_dbError) {
          // Essayer une approche alternative avec le service de l'app
          try {
            const dataSource =
              this.app.get('CONNECTION', { strict: false }) ||
              this.app.get('Database', { strict: false })
            if (dataSource?.isInitialized) {
              await dataSource.destroy()
              this.logger.log('✅ Connexions base de données fermées (alternative)')
            }
          } catch (_altError) {
            this.logger.warn('⚠️  Impossible de fermer les connexions BDD automatiquement')
          }
        }
      }
    } catch (error) {
      this.logger.warn('⚠️  Erreur lors de la fermeture des BDD:', error)
    }

    // 4. Fermer les connexions Redis/Cache
    this.logger.log('📝 4/6 - Fermeture des connexions cache...')
    try {
      // Fermer Redis si présent
      const redisService = this.app?.get('RedisService', { strict: false })
      if (redisService && typeof redisService.disconnect === 'function') {
        await redisService.disconnect()
        this.logger.log('✅ Connexions Redis fermées')
      }
    } catch (error) {
      this.logger.warn('⚠️  Erreur lors de la fermeture Redis:', error)
    }

    // 5. Fermer l'application NestJS
    this.logger.log("📝 5/6 - Fermeture de l'application NestJS...")
    if (this.app) {
      await this.app.close()
      this.logger.log('✅ Application NestJS fermée')
    }

    // 6. Libérer le port explicitement
    this.logger.log('📝 6/6 - Libération du port...')
    if (this.actualPort) {
      await cleanupPort(this.actualPort, 2)
    }

    const shutdownTime = Date.now() - startTime
    this.logger.log(`✅ Arrêt gracieux terminé en ${shutdownTime}ms`)
  }

  private async waitForActiveConnections(timeout: number): Promise<void> {
    const server = this.app?.getHttpServer()
    if (!server) return

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // @ts-ignore - Accès aux connexions internes
        const connections = server._connections || 0
        if (connections === 0) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkInterval)
        this.logger.warn('⚠️  Timeout atteint pour les connexions actives')
        resolve()
      }, timeout)
    })
  }

  private async forceShutdown(): Promise<void> {
    this.logger.warn('⚠️  Passage en mode arrêt forcé')

    // Tuer le processus current de force
    if (this.actualPort) {
      await killProcessOnPort(this.actualPort)
    }

    // Le nettoyage est déjà fait

    process.exit(1)
  }

  /**
   * Setup des handlers de signaux
   */
  setupSignalHandlers(): void {
    // SIGTERM (envoyé par Docker, PM2, etc.)
    process.on('SIGTERM', () => {
      this.logger.log('📡 Signal SIGTERM reçu')
      this.onApplicationShutdown('SIGTERM')
    })

    // SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.logger.log('📡 Signal SIGINT reçu (Ctrl+C)')
      this.onApplicationShutdown('SIGINT')
    })

    // SIGUSR2 (utilisé par nodemon)
    process.on('SIGUSR2', () => {
      this.logger.log('📡 Signal SIGUSR2 reçu (nodemon restart)')
      this.onApplicationShutdown('SIGUSR2')
    })

    // Exceptions non gérées
    process.on('uncaughtException', (error) => {
      this.logger.error('❌ Exception non capturée:', error)
      this.onApplicationShutdown('uncaughtException')
    })

    // Promesses rejetées non gérées
    process.on('unhandledRejection', (reason) => {
      this.logger.error('❌ Promesse rejetée non gérée:', reason)
      this.onApplicationShutdown('unhandledRejection')
    })

    // Windows - Ctrl+Break
    if (process.platform === 'win32') {
      process.on('SIGBREAK', () => {
        this.logger.log('📡 Signal SIGBREAK reçu (Windows)')
        this.onApplicationShutdown('SIGBREAK')
      })
    }
  }
}
