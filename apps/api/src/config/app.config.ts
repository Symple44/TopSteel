// apps/api/src/config/app.config.ts
import { registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME || 'ERP TopSteel',
  version: process.env.APP_VERSION || '1.0.0',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '3001', 10),
  host: process.env.API_HOST || '0.0.0.0',
  url: process.env.API_URL || 'http://localhost:3001',
  cors: {
    origin: process.env.API_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
    destination: process.env.UPLOAD_DIR || 'uploads',
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['image/*', 'application/pdf'],
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
    cookieName: process.env.COOKIE_NAME || 'topsteel-session',
  },
}))

// Fonction utilitaire pour vérifier la disponibilité d'un port
export async function isPortAvailable(port: number): Promise<boolean> {
  const net = await import('net')
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, () => {
      server.close(() => resolve(true))
    })
    server.on('error', () => resolve(false))
  })
}

// Fonction pour obtenir un port disponible
export async function getAvailablePort(
  preferredPort: number, 
  fallbackPorts: number[] = [3002, 3003, 3004, 3005]
): Promise<number> {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort
  }

  for (const port of fallbackPorts) {
    if (await isPortAvailable(port)) {
      console.warn(`⚠️ Port ${preferredPort} occupé, utilisation du port ${port}`)
      return port
    }
  }

  throw new Error(
    `Aucun port disponible parmi: ${preferredPort}, ${fallbackPorts.join(', ')}`
  )
}
