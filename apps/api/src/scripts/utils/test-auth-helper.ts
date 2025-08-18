/**
 * Helper pour l'authentification dans les tests et scripts
 * Permet d'obtenir un token JWT valide sans stocker de credentials
 */

import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

export interface TestAuthConfig {
  email?: string
  userId?: string
  societeId?: string
  role?: string
  permissions?: string[]
  expiresIn?: string
}

export class TestAuthHelper {
  private static jwtService: JwtService

  /**
   * Initialise le helper avec les services nécessaires
   */
  static initialize(jwtService?: JwtService, configService?: ConfigService) {
    TestAuthHelper.jwtService =
      jwtService ||
      new JwtService({
        secret: process.env.JWT_SECRET || TestAuthHelper.generateTestSecret(),
        signOptions: { expiresIn: '1h' },
      })
    TestAuthHelper.configService = configService || new ConfigService()
  }

  /**
   * Génère un secret de test sécurisé pour le développement
   */
  private static generateTestSecret(): string {
    const secret = crypto.randomBytes(32).toString('hex')
    console.warn('⚠️  Using generated test secret. For production, set JWT_SECRET in .env')
    return secret
  }

  /**
   * Génère un token JWT pour les tests
   */
  static generateTestToken(config: TestAuthConfig = {}): string {
    if (!TestAuthHelper.jwtService) {
      TestAuthHelper.initialize()
    }

    // Générer un societeId réaliste (UUID v4 format)
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    const payload = {
      sub: config.userId || generateUUID(),
      email: config.email || 'test@example.com',
      societeId: config.societeId || generateUUID(),
      societeCode: 'TOPSTEEL', // Code de la société
      societeName: 'TopSteel SA', // Nom de la société
      role: config.role || 'admin',
      permissions: config.permissions || ['*'],
      isTest: true,
      iat: Math.floor(Date.now() / 1000),
    }

    return TestAuthHelper.jwtService.sign(payload, {
      expiresIn: config.expiresIn || '1h',
    })
  }

  /**
   * Génère un token depuis les variables d'environnement
   */
  static async getTokenFromEnv(): Promise<string | null> {
    // Option 1: Token pré-généré dans .env.test
    if (process.env.TEST_AUTH_TOKEN) {
      console.log('✅ Using TEST_AUTH_TOKEN from environment')
      return process.env.TEST_AUTH_TOKEN
    }

    // Option 2: Générer avec les credentials de test depuis .env
    if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_ID) {
      console.log('✅ Generating token from TEST_USER credentials')
      return TestAuthHelper.generateTestToken({
        email: process.env.TEST_USER_EMAIL,
        userId: process.env.TEST_USER_ID,
        societeId: process.env.TEST_SOCIETE_ID,
        role: process.env.TEST_USER_ROLE || 'admin',
      })
    }

    // Option 3: Mode développement - générer un token de test
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log('⚠️  Generating development test token')
      return TestAuthHelper.generateTestToken()
    }

    console.error('❌ No test authentication method available')
    return null
  }

  /**
   * Sauvegarde un token dans un fichier temporaire sécurisé
   */
  static async saveTokenToFile(token: string): Promise<string> {
    const tempDir = path.join(process.cwd(), '.tmp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tokenFile = path.join(tempDir, `test-token-${Date.now()}.jwt`)
    fs.writeFileSync(tokenFile, token, { mode: 0o600 }) // Lecture seule pour le propriétaire

    console.log(`✅ Token saved to: ${tokenFile}`)
    console.log('⚠️  Remember to delete this file after use!')

    return tokenFile
  }

  /**
   * Lit un token depuis un fichier
   */
  static async readTokenFromFile(filePath: string): Promise<string | null> {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Token file not found: ${filePath}`)
        return null
      }

      const token = fs.readFileSync(filePath, 'utf-8').trim()

      // Optionnel: Supprimer le fichier après lecture pour la sécurité
      if (process.env.AUTO_DELETE_TOKEN_FILE === 'true') {
        fs.unlinkSync(filePath)
        console.log('🗑️  Token file deleted after reading')
      }

      return token
    } catch (error) {
      console.error('❌ Error reading token file:', error)
      return null
    }
  }

  /**
   * Génère un header d'autorisation complet
   */
  static async getAuthHeader(): Promise<{ Authorization: string } | null> {
    const token = await TestAuthHelper.getTokenFromEnv()
    if (!token) {
      return null
    }
    return { Authorization: `Bearer ${token}` }
  }

  /**
   * Nettoie les fichiers de tokens temporaires
   */
  static cleanupTokenFiles(): void {
    const tempDir = path.join(process.cwd(), '.tmp')
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir)
      files
        .filter((f) => f.startsWith('test-token-'))
        .forEach((file) => {
          fs.unlinkSync(path.join(tempDir, file))
        })
      console.log('🗑️  Cleaned up temporary token files')
    }
  }
}

// Export pour utilisation directe dans les scripts
export async function getTestAuthToken(): Promise<string | null> {
  TestAuthHelper.initialize()
  return TestAuthHelper.getTokenFromEnv()
}

export async function getTestAuthHeader(): Promise<{ Authorization: string } | null> {
  TestAuthHelper.initialize()
  return TestAuthHelper.getAuthHeader()
}
