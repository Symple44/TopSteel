// apps/api/src/config/enhanced-server-manager.ts

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { Logger } from '@nestjs/common'

interface ProcessInfo {
  pid: string
  protocol: string
  localAddress: string
  localPort: string
  foreignAddress: string
  foreignPort: string
  state: string
}

interface DiagnosticResult {
  port: number
  processes?: ProcessInfo[]
  lsof?: string
  available: boolean
  error?: string
}

const execAsync = promisify(exec)
const logger = new Logger('EnhancedServerManager')

/**
 * Vérifie et nettoie complètement un port
 */
export async function cleanupPort(port: number, retries: number = 3): Promise<boolean> {
  // Vérifier d'abord si le port est déjà libre
  const initialCheck = await isPortAvailable(port)
  if (initialCheck) {
    logger.debug(`Port ${port} déjà disponible`)
    return true
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    logger.debug(`🔍 Tentative ${attempt}/${retries} - Nettoyage du port ${port}`)

    try {
      const killedPids = await killProcessOnPort(port)

      if (killedPids.length > 0) {
        logger.log(`⚡ Port ${port} libéré - Processus tués: ${killedPids.join(', ')}`)

        // Attendre un peu pour que le port soit vraiment libéré
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Vérifier si le port est maintenant disponible
      const isAvailable = await isPortAvailable(port)
      if (isAvailable) {
        logger.log(`✅ Port ${port} maintenant disponible`)
        return true
      }

      if (attempt < retries) {
        logger.warn(`⚠️ Port ${port} toujours occupé, nouvelle tentative...`)
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
      }
    } catch (error) {
      logger.error(`Erreur lors du nettoyage du port ${port}:`, error)
      if (attempt === retries) {
        return false
      }
    }
  }

  logger.error(`❌ Impossible de libérer le port ${port} après ${retries} tentatives`)
  return false
}

/**
 * Tue les processus utilisant un port spécifique
 */
export async function killProcessOnPort(port: number): Promise<string[]> {
  const isWindows = process.platform === 'win32'
  const killedPids: string[] = []

  try {
    if (isWindows) {
      // Windows
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
      const lines = stdout.trim().split('\n')

      const pids = new Set<string>()
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && !Number.isNaN(parseInt(pid)) && pid !== '0') {
          pids.add(pid)
        }
      }

      // Tuer chaque processus
      for (const pid of pids) {
        try {
          await execAsync(`taskkill /PID ${pid} /F`)
          killedPids.push(pid)
          logger.debug(`PID ${pid} tué`)
        } catch (error) {
          logger.warn(`Impossible de tuer le PID ${pid}: ${error}`)
        }
      }
    } else {
      // Unix/Linux/Mac
      const { stdout } = await execAsync(`lsof -ti :${port}`)
      const pids = stdout.trim().split('\n').filter(Boolean)

      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`)
          killedPids.push(pid)
          logger.debug(`PID ${pid} tué`)
        } catch (error) {
          logger.warn(`Impossible de tuer le PID ${pid}: ${error}`)
        }
      }
    }
  } catch (_error) {
    // Aucun processus trouvé - c'est normal
    logger.debug(`Aucun processus trouvé sur le port ${port}`)
  }

  return killedPids
}

/**
 * Vérifie si un port est disponible
 */
export async function isPortAvailable(port: number, host: string = 'localhost'): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('node:net')
    const server = net.createServer()

    const cleanup = () => {
      try {
        server.close()
      } catch (_error) {
        // Ignore error
      }
    }

    const timeout = setTimeout(() => {
      cleanup()
      resolve(false)
    }, 5000)

    server.once('error', (_error: Error) => {
      clearTimeout(timeout)
      cleanup()
      resolve(false)
    })

    server.once('listening', () => {
      clearTimeout(timeout)
      cleanup()
      resolve(true)
    })

    try {
      server.listen(port, host)
    } catch (_error) {
      clearTimeout(timeout)
      resolve(false)
    }
  })
}

/**
 * Diagnostic complet d'un port
 */
export async function diagnosePort(port: number): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    port,
    available: false,
  }

  try {
    // Test de disponibilité
    result.available = await isPortAvailable(port)

    if (!result.available) {
      const isWindows = process.platform === 'win32'

      if (isWindows) {
        // Diagnostic Windows
        try {
          const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
          const lines = stdout.trim().split('\n')
          result.processes = []

          for (const line of lines) {
            const parts = line.trim().split(/\s+/)
            if (parts.length >= 5) {
              const [protocol, localAddress, foreignAddress, state, pid] = parts
              const [localHost, localPort] = localAddress.split(':')
              const [foreignHost, foreignPort] = foreignAddress.split(':')

              result.processes.push({
                pid,
                protocol,
                localAddress: localHost || '',
                localPort: localPort || '',
                foreignAddress: foreignHost || '',
                foreignPort: foreignPort || '',
                state: state || '',
              })
            }
          }
        } catch (error) {
          result.error = `Erreur diagnostic Windows: ${error}`
        }
      } else {
        // Diagnostic Unix/Linux/Mac
        try {
          const { stdout } = await execAsync(`lsof -i :${port}`)
          result.lsof = stdout
        } catch (error) {
          result.error = `Erreur diagnostic Unix: ${error}`
        }
      }
    }
  } catch (error) {
    result.error = `Erreur diagnostic: ${error}`
  }

  return result
}

/**
 * Trouve le prochain port disponible
 */
export async function findNextAvailablePort(
  startPort: number,
  maxAttempts: number = 100
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    if (await isPortAvailable(port)) {
      return port
    }
  }
  throw new Error(`Aucun port disponible trouvé à partir de ${startPort}`)
}

/**
 * Prépare un port pour utilisation (avec nettoyage si nécessaire)
 */
export async function preparePort(port: number): Promise<boolean> {
  logger.debug(`🔧 Préparation du port ${port}...`)

  const diagnostic = await diagnosePort(port)

  if (diagnostic.available) {
    logger.debug(`✅ Port ${port} déjà disponible`)
    return true
  }

  logger.debug(`🧹 Port ${port} occupé, nettoyage en cours...`)

  if (diagnostic.processes && diagnostic.processes.length > 0) {
    logger.debug(
      `📊 Processus trouvés: ${diagnostic.processes
        .map((p) => `PID ${p.pid} (${p.state})`)
        .join(', ')}`
    )
  }

  return await cleanupPort(port, 3)
}

/**
 * Configuration de port avec gestion d'erreur avancée
 */
export async function setupPort(
  preferredPort: number,
  fallbackRange: number = 10
): Promise<{ port: number; wasPreferred: boolean }> {
  logger.debug(`🎯 Configuration du port: préféré=${preferredPort}`)

  // Essayer le port préféré
  if (await preparePort(preferredPort)) {
    return { port: preferredPort, wasPreferred: true }
  }

  logger.warn(`⚠️ Port préféré ${preferredPort} non disponible, recherche d'alternative...`)

  // Chercher un port alternatif
  try {
    const alternativePort = await findNextAvailablePort(preferredPort + 1, fallbackRange)
    logger.log(`🔄 Port alternatif trouvé: ${alternativePort}`)
    return { port: alternativePort, wasPreferred: false }
  } catch (_error) {
    throw new Error(
      `Impossible de trouver un port disponible entre ${preferredPort} et ${
        preferredPort + fallbackRange
      }`
    )
  }
}

/**
 * Nettoie plusieurs ports en parallèle
 */
export async function cleanupPorts(ports: number[]): Promise<boolean[]> {
  logger.debug(`🧹 Nettoyage de ${ports.length} ports: ${ports.join(', ')}`)

  const cleanupPromises = ports.map((port) => cleanupPort(port))
  const results = await Promise.all(cleanupPromises)

  const successful = results.filter(Boolean).length
  logger.log(`📊 Nettoyage terminé: ${successful}/${ports.length} ports libérés`)

  return results
}

/**
 * Monitore l'état d'un port pendant une durée donnée
 */
export async function monitorPort(
  port: number,
  duration: number = 30000
): Promise<{ samples: boolean[]; availability: number }> {
  logger.debug(`👀 Surveillance du port ${port} pendant ${duration}ms`)

  const samples: boolean[] = []
  const interval = 1000 // Échantillonnage chaque seconde
  const totalSamples = Math.floor(duration / interval)

  for (let i = 0; i < totalSamples; i++) {
    const isAvailable = await isPortAvailable(port)
    samples.push(isAvailable)

    if (i < totalSamples - 1) {
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  const availability = samples.filter(Boolean).length / samples.length
  logger.debug(`📈 Disponibilité du port ${port}: ${(availability * 100).toFixed(1)}%`)

  return { samples, availability }
}

/**
 * Test de stress pour un port
 */
export async function stressTestPort(
  port: number,
  connections: number = 10
): Promise<{ success: number; failed: number; avgTime: number }> {
  logger.debug(`💪 Test de stress du port ${port} avec ${connections} connexions`)

  const results: { success: boolean; time: number }[] = []

  const testConnection = (): Promise<{ success: boolean; time: number }> => {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const net = require('node:net')
      const socket = net.createConnection(port, 'localhost')

      const cleanup = () => {
        try {
          socket.destroy()
        } catch (_error) {
          // Ignore
        }
      }

      const timeout = setTimeout(() => {
        cleanup()
        resolve({ success: false, time: Date.now() - startTime })
      }, 5000)

      socket.once('connect', () => {
        clearTimeout(timeout)
        cleanup()
        resolve({ success: true, time: Date.now() - startTime })
      })

      socket.once('error', () => {
        clearTimeout(timeout)
        cleanup()
        resolve({ success: false, time: Date.now() - startTime })
      })
    })
  }

  // Lancer les tests en parallèle
  const promises = Array(connections)
    .fill(null)
    .map(() => testConnection())
  const testResults = await Promise.all(promises)
  results.push(...testResults)

  const success = results.filter((r) => r.success).length
  const failed = results.length - success
  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length

  logger.debug(
    `📊 Test terminé: ${success} succès, ${failed} échecs, temps moyen: ${avgTime.toFixed(0)}ms`
  )

  return { success, failed, avgTime }
}
