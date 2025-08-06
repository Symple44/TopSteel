import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { Logger } from '@nestjs/common'

interface NetError {
  code?: string
  message?: string
}

const execAsync = promisify(exec)
const logger = new Logger('ServerManager')

/**
 * Vérifie si un port est utilisé et tue le processus si nécessaire
 */
export async function killProcessOnPort(port: number): Promise<void> {
  const isWindows = process.platform === 'win32'

  try {
    if (isWindows) {
      // Commande Windows pour trouver et tuer le processus
      try {
        // Trouver le PID du processus utilisant le port
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
        const lines = stdout.trim().split('\n')

        const pids = new Set<string>()
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          const pid = parts[parts.length - 1]
          if (pid && !Number.isNaN(parseInt(pid))) {
            pids.add(pid)
          }
        })

        // Tuer chaque processus trouvé
        for (const pid of pids) {
          try {
            await execAsync(`taskkill /PID ${pid} /F`)
            logger.log(`✅ Processus PID ${pid} arrêté sur le port ${port}`)
          } catch (_error) {
            logger.warn(`⚠️  Impossible de tuer le processus ${pid}`)
          }
        }
      } catch (_error) {
        // Aucun processus trouvé sur ce port
        logger.debug(`Aucun processus trouvé sur le port ${port}`)
      }
    } else {
      // Commande Unix/Linux/Mac
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`)
        const pids = stdout.trim().split('\n').filter(Boolean)

        for (const pid of pids) {
          await execAsync(`kill -9 ${pid}`)
          logger.log(`✅ Processus PID ${pid} arrêté sur le port ${port}`)
        }
      } catch (_error) {
        // Aucun processus trouvé sur ce port
        logger.debug(`Aucun processus trouvé sur le port ${port}`)
      }
    }
  } catch (error) {
    logger.error(`Erreur lors de la tentative de libération du port ${port}:`, error)
  }
}

/**
 * Vérifie si un port est disponible
 */
export async function isPortAvailable(port: number, host: string = 'localhost'): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('node:net')
    const server = net.createServer()

    server.once('error', (err: NetError) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false)
      } else {
        resolve(false)
      }
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
export async function findAvailablePort(
  basePort: number,
  maxAttempts: number = 10
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = basePort + i
    if (await isPortAvailable(port)) {
      return port
    }
  }
  throw new Error(`Aucun port disponible trouvé entre ${basePort} et ${basePort + maxAttempts}`)
}
