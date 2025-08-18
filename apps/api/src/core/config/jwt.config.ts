// apps/api/src/config/jwt.config.ts
import { registerAs } from '@nestjs/config'

// Fonction pour valider et récupérer le secret JWT de manière sécurisée
const getJwtSecret = (envVar: string, name: string): string => {
  const secret = process.env[envVar]

  // En développement uniquement, permettre un secret généré
  if (process.env.NODE_ENV === 'development' && !secret) {
    const devSecret = `dev-only-${name}-${Math.random().toString(36).substring(2, 15)}-min-32-chars-long`
    return devSecret
  }

  // En production, exiger un vrai secret
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
    throw new Error(`${name} must be defined and at least 32 characters long in production`)
  }

  return secret || `test-${name}-${Date.now()}-min-32-chars-for-testing`
}

export const jwtConfig = registerAs('jwt', () => ({
  secret: getJwtSecret('JWT_SECRET', 'JWT_SECRET'),
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret: getJwtSecret('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET'),
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}))
