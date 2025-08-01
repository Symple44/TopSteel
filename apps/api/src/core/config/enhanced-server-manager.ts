// apps/api/src/config/enhanced-server-manager.ts

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { Logger } from '@nestjs/common'

const execAsync = promisify(exec)

export class EnhancedServerManager {
  private static readonly logger = new Logger('EnhancedServerManager')

  /**
   * Vérifie et nettoie complètement un port
   */
  static async cleanupPort(port: number, retries: number = 3): Promise<boolean> {
    // Vérifier d'abord si le port est déjà libre
    const initialCheck = await EnhancedServerManager.isPortAvailable(port)
    if (initialCheck) {
      EnhancedServerManager.logger.debug(`Port ${port} déjà disponible`)
      return true
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      EnhancedServerManager.logger.debug(
        `🔍 Tentative ${attempt}/${retries} - Nettoyage du port ${port}`
      )

      try {
        const killedPids = await EnhancedServerManager.killProcessOnPort(port)

        if (killedPids.length > 0) {
          EnhancedServerManager.logger.log(
            `🔧 ${killedPids.length} processus arrêté(s) sur le port ${port}`
          )

          // Attendre que le port se libère
          await EnhancedServerManager.waitForPortRelease(port, 5000)
        }

        const isAvailable = await EnhancedServerManager.isPortAvailable(port)
        if (isAvailable) {
          if (killedPids.length > 0) {
            EnhancedServerManager.logger.log(`✅ Port ${port} libéré avec succès`)
          }
          return true
        }

        if (attempt < retries) {
          EnhancedServerManager.logger.warn(
            `⚠️  Port ${port} encore occupé, nouvelle tentative dans 2s...`
          )
          await EnhancedServerManager.sleep(2000)
        }
      } catch (error) {
        EnhancedServerManager.logger.error(`❌ Erreur lors du nettoyage du port ${port}:`, error)
      }
    }

    EnhancedServerManager.logger.error(
      `❌ Impossible de libérer le port ${port} après ${retries} tentatives`
    )
    return false
  }

  /**
   * Tue tous les processus sur un port avec vérification
   */
  static async killProcessOnPort(port: number): Promise<string[]> {
    const isWindows = process.platform === 'win32'
    const killedPids: string[] = []

    try {
      if (isWindows) {
        // Windows - Méthode améliorée
        try {
          const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
          const lines = stdout.trim().split('\n').filter(Boolean)

          if (lines.length === 0) {
            EnhancedServerManager.logger.debug(`Aucun processus trouvé sur le port ${port}`)
            return killedPids
          }

          const pids = new Set<string>()
          lines.forEach((line) => {
            const parts = line.trim().split(/\s+/)
            const pid = parts[parts.length - 1]
            if (pid && !Number.isNaN(parseInt(pid)) && pid !== '0') {
              pids.add(pid)
            }
          })

          // Tuer chaque processus avec vérification
          for (const pid of pids) {
            try {
              // Vérifier que le processus existe encore
              await execAsync(`tasklist /FI "PID eq ${pid}" | findstr ${pid}`)

              // Essayer d'abord un arrêt gracieux
              try {
                await execAsync(`taskkill /PID ${pid} /T`)
                await EnhancedServerManager.sleep(1000)
              } catch {}

              // Vérifier si le processus est encore là, sinon forcer
              try {
                await execAsync(`tasklist /FI "PID eq ${pid}" | findstr ${pid}`)
                await execAsync(`taskkill /PID ${pid} /F /T`)
                EnhancedServerManager.logger.log(`✅ Processus PID ${pid} forcé à s'arrêter`)
              } catch {
                // Le processus s'est arrêté gracieusement
                EnhancedServerManager.logger.log(`✅ Processus PID ${pid} arrêté gracieusement`)
              }

              killedPids.push(pid)
            } catch (_error) {
              EnhancedServerManager.logger.warn(`⚠️  Processus ${pid} déjà terminé ou inaccessible`)
            }
          }
        } catch (netstatError: any) {
          // netstat ne trouve rien (normal si port libre)
          if (netstatError.code === 1 && netstatError.stdout === '') {
            EnhancedServerManager.logger.debug(`Port ${port} libre, aucun processus à arrêter`)
            return killedPids
          }
          throw netstatError
        }
      } else {
        // Unix/Linux/Mac - Méthode améliorée
        try {
          const { stdout } = await execAsync(`lsof -ti:${port}`)
          const pids = stdout.trim().split('\n').filter(Boolean)

          for (const pid of pids) {
            try {
              // Essayer SIGTERM d'abord
              await execAsync(`kill -TERM ${pid}`)
              await EnhancedServerManager.sleep(2000)

              // Vérifier si le processus existe encore
              try {
                await execAsync(`kill -0 ${pid}`)
                // Le processus existe encore, forcer avec SIGKILL
                await execAsync(`kill -KILL ${pid}`)
                EnhancedServerManager.logger.log(`✅ Processus PID ${pid} forcé à s'arrêter`)
              } catch {
                // Le processus s'est arrêté gracieusement
                EnhancedServerManager.logger.log(`✅ Processus PID ${pid} arrêté gracieusement`)
              }

              killedPids.push(pid)
            } catch (_error) {
              EnhancedServerManager.logger.warn(`⚠️  Impossible de tuer le processus ${pid}`)
            }
          }
        } catch (lsofError: any) {
          // lsof ne trouve rien (normal si port libre)
          if (lsofError.code === 1) {
            EnhancedServerManager.logger.debug(`Port ${port} libre, aucun processus à arrêter`)
            return killedPids
          }
          throw lsofError
        }
      }
    } catch (error: any) {
      // Seulement logger les vraies erreurs, pas les "port libre"
      if (error.code !== 1) {
        EnhancedServerManager.logger.error(
          `Erreur lors de la recherche de processus sur le port ${port}:`,
          error
        )
      }
    }

    return killedPids
  }

  /**
   * Attend qu'un port se libère
   */
  static async waitForPortRelease(port: number, timeout: number = 10000): Promise<void> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const isAvailable = await EnhancedServerManager.isPortAvailable(port)
      if (isAvailable) {
        return
      }
      await EnhancedServerManager.sleep(500)
    }

    throw new Error(`Timeout: Port ${port} non libéré après ${timeout}ms`)
  }

  /**
   * Vérifie si un port est disponible
   */
  static async isPortAvailable(port: number, host: string = 'localhost'): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('node:net')
      const server = net.createServer()

      server.once('error', (_err: any) => {
        resolve(false)
      })

      server.once('listening', () => {
        server.close()
        resolve(true)
      })

      server.listen(port, host)
    })
  }

  /**
   * Trouve un port disponible à partir d'un port de base
   */
  static async findAvailablePort(basePort: number, maxAttempts: number = 10): Promise<number> {
    for (let i = 0; i < maxAttempts; i++) {
      const port = basePort + i
      if (await EnhancedServerManager.isPortAvailable(port)) {
        return port
      }
    }
    throw new Error(`Aucun port disponible trouvé entre ${basePort} et ${basePort + maxAttempts}`)
  }

  /**
   * Nettoie tous les processus Node.js qui pourraient rester
   */
  static async cleanupOrphanedProcesses(): Promise<void> {
    const isWindows = process.platform === 'win32'

    try {
      if (isWindows) {
        // Chercher les processus node.exe qui écoutent sur des ports
        const { stdout } = await execAsync('netstat -ano | findstr LISTENING | findstr node')
        EnhancedServerManager.logger.log('Processus Node.js en écoute nettoyés')
      } else {
        // Unix - chercher les processus node orphelins
        await execAsync('pkill -f "node.*nest"')
        EnhancedServerManager.logger.log('Processus Nest.js orphelins nettoyés')
      }
    } catch (_error) {
      // Pas de processus orphelins trouvés
      EnhancedServerManager.logger.debug('Aucun processus orphelin trouvé')
    }
  }

  /**
   * Utilitaire de sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Diagnostic complet des ports
   */
  static async diagnosePort(port: number): Promise<any> {
    const isWindows = process.platform === 'win32'

    try {
      if (isWindows) {
        try {
          const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
          const lines = stdout.trim().split('\n').filter(Boolean)

          if (lines.length === 0) {
            return { port, processes: [], available: true }
          }

          const processes: any[] = []
          for (const line of lines) {
            const parts = line.trim().split(/\s+/)
            const pid = parts[parts.length - 1]

            if (pid && !Number.isNaN(parseInt(pid))) {
              try {
                const { stdout: processInfo } = await execAsync(
                  `tasklist /FI "PID eq ${pid}" /FO CSV`
                )
                processes.push({
                  pid,
                  line: line.trim(),
                  processInfo: processInfo.split('\n')[1],
                })
              } catch {}
            }
          }

          return { port, processes, available: processes.length === 0 }
        } catch (netstatError: any) {
          // Port libre (netstat ne trouve rien)
          if (netstatError.code === 1 && netstatError.stdout === '') {
            return { port, processes: [], available: true }
          }
          throw netstatError
        }
      } else {
        try {
          const { stdout } = await execAsync(`lsof -i:${port}`)
          return { port, lsof: stdout, available: false }
        } catch (lsofError: any) {
          // Port libre (lsof ne trouve rien)
          if (lsofError.code === 1) {
            return { port, available: true, error: null }
          }
          throw lsofError
        }
      }
    } catch (error: any) {
      // Vraie erreur
      return { port, available: false, error: error.message }
    }
  }
}
