import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { v4 as uuidv4 } from 'uuid'

import { UsersService } from '../users/users.service'
import { UserRole } from '../users/entities/user.entity'
import { SocietesService } from '../societes/services/societes.service'
import { SocieteUsersService } from '../societes/services/societe-users.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtPayload, MultiTenantJwtPayload } from './interfaces/jwt-payload.interface'
import { SessionRedisService } from './services/session-redis.service'
import { GeolocationService } from './services/geolocation.service'
import { MFAService } from './services/mfa.service'
import { UserSession } from './entities/user-session.entity'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionRedisService: SessionRedisService,
    private readonly geolocationService: GeolocationService,
    private readonly mfaService: MFAService,
    private readonly societesService: SocietesService,
    private readonly societeUsersService: SocieteUsersService,
    @InjectRepository(UserSession, 'auth')
    private readonly userSessionRepository: Repository<UserSession>
  ) {}

  async validateUser(emailOrAcronym: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailOrAcronym(emailOrAcronym)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { password: _, ...result } = user
    return result
  }

  async login(loginDto: LoginDto, request?: any) {
    const user = await this.validateUser(loginDto.login, loginDto.password)

    // Vérifier si l'utilisateur a MFA activé
    const hasMFA = await this.mfaService.hasMFAEnabled(user.id)

    if (hasMFA) {
      // Retourner une réponse indiquant que MFA est requis
      return {
        requiresMFA: true,
        userId: user.id,
        email: user.email,
        availableMethods: await this.getAvailableMFAMethods(user.id),
        message: 'Authentification à deux facteurs requise'
      }
    }

    // Procéder avec la connexion normale si pas de MFA
    return await this.completeLogin(user, request)
  }

  /**
   * Récupérer les sociétés disponibles pour un utilisateur
   */
  async getUserSocietes(userId: string) {
    const userSocietes = await this.societeUsersService.findByUser(userId)
    
    return userSocietes.map(us => ({
      id: us.societe.id,
      nom: us.societe.nom,
      code: us.societe.code,
      role: us.role,
      isDefault: us.isDefault,
      permissions: us.permissions,
      sites: us.societe.sites?.map(site => ({
        id: site.id,
        nom: site.nom,
        code: site.code,
        isPrincipal: site.isPrincipal
      })) || []
    }))
  }

  /**
   * Login avec sélection de société
   */
  async loginWithSociete(userId: string, societeId: string, siteId?: string, request?: any) {
    // Vérifier que l'utilisateur a accès à cette société
    const userSociete = await this.societeUsersService.findUserSociete(userId, societeId)
    if (!userSociete || !userSociete.actif) {
      throw new UnauthorizedException('Accès non autorisé à cette société')
    }

    // Récupérer les informations complètes de l'utilisateur
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé')
    }

    // Générer un ID de session unique
    const sessionId = uuidv4()

    // Créer le payload multi-tenant
    const payload: MultiTenantJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      societeId: userSociete.societeId,
      societeCode: userSociete.societe.code,
      siteId: siteId,
      permissions: userSociete.permissions,
      tenantDatabase: userSociete.societe.databaseName
    }

    const accessToken = await this.generateAccessToken(payload)
    const refreshToken = await this.generateRefreshToken(payload)

    // Mettre à jour l'activité utilisateur
    await this.usersService.updateRefreshToken(user.id, refreshToken)
    await this.usersService.updateLastLogin(user.id)
    await this.societeUsersService.updateLastActivity(userId, societeId)

    // Extraire les informations de la requête pour le tracking
    let ipAddress = '0.0.0.0'
    let userAgent = 'Unknown'
    let location: any = null
    let deviceInfo: any = null

    if (request) {
      ipAddress = this.geolocationService.extractRealIP(request)
      userAgent = request.headers['user-agent'] || 'Unknown'
      location = await this.geolocationService.getLocationFromIP(ipAddress)
      deviceInfo = this.geolocationService.parseUserAgent(userAgent)
    }

    // Créer la session en base de données - TEMPORAIREMENT DÉSACTIVÉ
    /* const dbSession = UserSession.createNew(
      user.id,
      sessionId,
      accessToken,
      ipAddress,
      userAgent,
      refreshToken
    )
    
    if (location) {
      dbSession.location = location
    }
    if (deviceInfo) {
      dbSession.deviceInfo = deviceInfo
    }

    await this.userSessionRepository.save(dbSession) */

    return {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        societe: {
          id: userSociete.societe.id,
          nom: userSociete.societe.nom,
          code: userSociete.societe.code,
          databaseName: userSociete.societe.databaseName
        },
        permissions: userSociete.permissions
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      sessionId,
    }
  }

  /**
   * Compléter la connexion après validation MFA ou directement si pas de MFA
   */
  async completeLogin(user: any, request?: any) {
    // Générer un ID de session unique
    const sessionId = uuidv4()

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId, // Ajouter l'ID de session au payload JWT
    }

    const accessToken = await this.generateAccessToken(payload)
    const refreshToken = await this.generateRefreshToken(payload)

    await this.usersService.updateRefreshToken(user.id, refreshToken)
    await this.usersService.updateLastLogin(user.id)

    // Extraire les informations de la requête pour le tracking
    let ipAddress = '0.0.0.0'
    let userAgent = 'Unknown'
    let location: any = null
    let deviceInfo: any = null

    if (request) {
      ipAddress = this.geolocationService.extractRealIP(request)
      userAgent = request.headers['user-agent'] || 'Unknown'
      
      // Obtenir la géolocalisation et les infos de l'appareil
      location = await this.geolocationService.getLocationFromIP(ipAddress)
      deviceInfo = this.geolocationService.parseUserAgent(userAgent)
    }

    // Créer la session en base de données - TEMPORAIREMENT DÉSACTIVÉ
    /* const dbSession = UserSession.createNew(
      user.id,
      sessionId,
      accessToken,
      ipAddress,
      userAgent,
      refreshToken
    )

    if (location) {
      dbSession.location = location
    }

    if (deviceInfo) {
      dbSession.deviceInfo = deviceInfo
    }

    await this.userSessionRepository.save(dbSession) */

    // Ajouter la session à Redis pour le tracking temps réel
    await this.sessionRedisService.addActiveSession({
      sessionId,
      userId: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress,
      userAgent,
      deviceInfo,
      location,
      isIdle: false,
      warningCount: 0
    })

    // Détecter les activités suspectes - TEMPORAIREMENT DÉSACTIVÉ
    /* const previousSessions = await this.userSessionRepository.find({
      where: { userId: user.id },
      order: { loginTime: 'DESC' },
      take: 10
    })

    const suspiciousActivity = await this.geolocationService.detectSuspiciousActivity(
      user.id,
      location,
      previousSessions
    )

    if (suspiciousActivity.isSuspicious) {
      // Log de sécurité
      console.warn(`Activité suspecte détectée pour ${user.email}:`, suspiciousActivity.reasons)
      
      // Ajouter des métadonnées de sécurité
      dbSession.metadata = {
        security: {
          riskLevel: suspiciousActivity.riskLevel,
          alertReasons: suspiciousActivity.reasons,
          detectedAt: new Date().toISOString()
        }
      }
      
      // Mettre à jour le warning count
      if (suspiciousActivity.riskLevel === 'high') {
        dbSession.warningCount = 1
      }
      
      await this.userSessionRepository.save(dbSession)
    } */

    // Créer un objet d'activité suspecte par défaut pour éviter les erreurs
    const suspiciousActivity = { isSuspicious: false, riskLevel: 'none', reasons: [] }

    return {
      user,
      sessionId,
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresIn: 24 * 60 * 60, // 24 heures en secondes
      location: location ? `${location.city}, ${location.country}` : undefined,
      deviceInfo: deviceInfo ? `${deviceInfo.browser} sur ${deviceInfo.os}` : undefined,
      securityAlert: suspiciousActivity.isSuspicious ? {
        level: suspiciousActivity.riskLevel,
        reasons: suspiciousActivity.reasons
      } : undefined
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email)
    if (existingUser) {
      throw new ConflictException('User already exists')
    }

    try {
      const user = await this.usersService.create(registerDto)
      const { password, ...result } = user
      return result
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user')
    }
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required')
    }

    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret')
      if (!refreshSecret) {
        throw new InternalServerErrorException('JWT refresh secret not configured')
      }

      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      })

      const user = await this.usersService.findById(payload.sub)
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      }

      const newAccessToken = await this.generateAccessToken(newPayload)
      const newRefreshToken = await this.generateRefreshToken(newPayload)

      await this.usersService.updateRefreshToken(user.id, newRefreshToken)

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60, // 24 heures en secondes
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(userId: string, sessionId?: string) {
    await this.usersService.updateRefreshToken(userId, null)
    
    if (sessionId) {
      // Supprimer la session spécifique de Redis
      await this.sessionRedisService.removeActiveSession(sessionId)
      
      // Marquer la session comme terminée en base de données
      const dbSession = await this.userSessionRepository.findOne({
        where: { sessionId, userId }
      })
      
      if (dbSession) {
        dbSession.endSession('normal')
        await this.userSessionRepository.save(dbSession)
      }
    } else {
      // Déconnexion de toutes les sessions de l'utilisateur
      await this.sessionRedisService.forceLogoutUser(userId)
      
      // Temporairement désactivé car problème avec la structure de table
      /*
      // Marquer toutes les sessions actives comme terminées
      await this.userSessionRepository.update(
        { userId, status: 'active' },
        { 
          status: 'ended',
          logoutTime: new Date(),
          isActive: false
        }
      )
      */
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const { password, refreshToken, ...profile } = user
    return profile
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect')
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await this.usersService.update(userId, { password: hashedNewPassword })
  }

  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    const secret = this.configService.get<string>('jwt.secret')
    if (!secret) {
      throw new InternalServerErrorException('JWT secret not configured')
    }

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '24h',
    })
  }

  private async generateRefreshToken(payload: JwtPayload): Promise<string> {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret')
    if (!refreshSecret) {
      throw new InternalServerErrorException('JWT refresh secret not configured')
    }

    return this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
    })
  }

  // Méthodes de gestion des sessions

  /**
   * Mettre à jour l'activité d'une session
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    // Mettre à jour dans Redis
    await this.sessionRedisService.updateSessionActivity(sessionId)
    
    // Mettre à jour en base de données
    const dbSession = await this.userSessionRepository.findOne({
      where: { sessionId }
    })
    
    if (dbSession) {
      dbSession.updateActivity()
      await this.userSessionRepository.save(dbSession)
    }
  }

  /**
   * Obtenir toutes les sessions actives
   */
  async getAllActiveSessions(): Promise<any[]> {
    return await this.sessionRedisService.getAllActiveSessions()
  }

  /**
   * Obtenir l'historique des connexions
   */
  async getConnectionHistory(limit: number = 100, offset: number = 0): Promise<{
    sessions: UserSession[]
    total: number
  }> {
    const [sessions, total] = await this.userSessionRepository.findAndCount({
      order: { loginTime: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['user']
    })

    return { sessions, total }
  }

  /**
   * Obtenir l'historique d'un utilisateur spécifique
   */
  async getUserConnectionHistory(userId: string, limit: number = 50): Promise<UserSession[]> {
    return await this.userSessionRepository.find({
      where: { userId },
      order: { loginTime: 'DESC' },
      take: limit
    })
  }

  /**
   * Forcer la déconnexion d'un utilisateur (action admin)
   */
  async forceLogoutUser(userId: string, adminUserId: string, reason: string = 'Déconnexion administrative'): Promise<string[]> {
    // Supprimer de Redis
    const removedSessions = await this.sessionRedisService.forceLogoutUser(userId)
    
    // Mettre à jour en base de données
    const activeSessions = await this.userSessionRepository.find({
      where: { userId, status: 'active' }
    })

    for (const session of activeSessions) {
      session.endSession('forced', adminUserId)
      session.forcedLogoutReason = reason
      await this.userSessionRepository.save(session)
    }

    // Log de sécurité
    console.log(`Admin ${adminUserId} a forcé la déconnexion de l'utilisateur ${userId}. Sessions supprimées: ${removedSessions.length}`)

    return removedSessions
  }

  /**
   * Forcer la déconnexion d'une session spécifique (action admin)
   */
  async forceLogoutSession(sessionId: string, adminUserId: string, reason: string = 'Déconnexion administrative'): Promise<boolean> {
    // Supprimer de Redis
    const success = await this.sessionRedisService.forceLogoutSession(sessionId)
    
    if (success) {
      // Mettre à jour en base de données
      const dbSession = await this.userSessionRepository.findOne({
        where: { sessionId }
      })
      
      if (dbSession) {
        dbSession.endSession('forced', adminUserId)
        dbSession.forcedLogoutReason = reason
        await this.userSessionRepository.save(dbSession)
        
        // Log de sécurité
        console.log(`Admin ${adminUserId} a forcé la déconnexion de la session ${sessionId}`)
      }
    }

    return success
  }

  /**
   * Obtenir les statistiques des sessions
   */
  async getSessionStats(): Promise<{
    redis: {
      totalOnline: number
      totalActive: number
      totalIdle: number
      warningCount: number
    }
    database: {
      totalSessions: number
      activeSessions: number
      sessionsToday: number
      suspiciousSessions: number
    }
  }> {
    // Statistiques Redis (temps réel)
    const redisStats = await this.sessionRedisService.getSessionStats()
    
    // Statistiques base de données
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const totalSessions = await this.userSessionRepository.count()
    const activeSessions = await this.userSessionRepository.count({
      where: { status: 'active' }
    })
    const sessionsToday = await this.userSessionRepository
      .createQueryBuilder('session')
      .where('session.loginTime >= :today', { today })
      .getCount()
      
    const suspiciousSessions = await this.userSessionRepository
      .createQueryBuilder('session')
      .where('session.warningCount > :count', { count: 0 })
      .getCount()

    return {
      redis: redisStats,
      database: {
        totalSessions,
        activeSessions,
        sessionsToday,
        suspiciousSessions
      }
    }
  }

  /**
   * Nettoyer les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<{
    redisCleanedCount: number
    databaseCleanedCount: number
  }> {
    // Nettoyer Redis
    const redisCleanedCount = await this.sessionRedisService.cleanupExpiredSessions()
    
    // Nettoyer la base de données (marquer comme expirées)
    const expiredThreshold = new Date()
    expiredThreshold.setHours(expiredThreshold.getHours() - 24) // 24 heures

    const expiredSessions = await this.userSessionRepository
      .createQueryBuilder('session')
      .where('session.status = :status', { status: 'active' })
      .andWhere('session.lastActivity < :threshold', { threshold: expiredThreshold })
      .getMany()

    let databaseCleanedCount = 0
    for (const session of expiredSessions) {
      session.endSession('expired')
      await this.userSessionRepository.save(session)
      databaseCleanedCount++
    }

    return {
      redisCleanedCount,
      databaseCleanedCount
    }
  }

  /**
   * Obtenir les méthodes MFA disponibles pour un utilisateur
   */
  private async getAvailableMFAMethods(userId: string): Promise<Array<{
    type: string
    isEnabled: boolean
    lastUsed?: Date
  }>> {
    const methods = await this.mfaService.getUserMFAMethods(userId)
    return methods
      .filter(method => method.isEnabled && method.isVerified)
      .map(method => ({
        type: method.type,
        isEnabled: method.isEnabled,
        lastUsed: method.lastUsedAt
      }))
  }

  /**
   * Connexion avec MFA - après vérification du code MFA
   */
  async loginWithMFA(
    userId: string,
    mfaSessionToken: string,
    request?: any
  ): Promise<any> {
    try {
      // Vérifier que la session MFA est valide et vérifiée
      const mfaSession = await this.mfaService['mfaSessionRepository'].findOne({
        where: { 
          userId, 
          sessionToken: mfaSessionToken, 
          status: 'verified' 
        }
      })

      if (!mfaSession) {
        throw new UnauthorizedException('Session MFA invalide ou non vérifiée')
      }

      // Obtenir les informations de l'utilisateur
      const user = await this.usersService.findById(userId)
      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé')
      }

      // Compléter la connexion
      const loginResult = await this.completeLogin(user, request)

      // Marquer la session MFA comme utilisée (optionnel)
      // On peut garder la session pour des vérifications futures ou la supprimer
      
      return loginResult
    } catch (error) {
      throw new UnauthorizedException('Erreur lors de la connexion avec MFA')
    }
  }

  /**
   * Vérifier si un utilisateur peut se connecter sans MFA (backup)
   */
  async canBypassMFA(userId: string): Promise<boolean> {
    // Logique pour déterminer si l'utilisateur peut contourner MFA
    // Par exemple, pour les comptes d'urgence ou les administrateurs
    const user = await this.usersService.findById(userId)
    
    // Seuls les super admins peuvent contourner MFA en cas d'urgence
    return user?.role === UserRole.SUPER_ADMIN && 
           this.configService.get<boolean>('MFA_EMERGENCY_BYPASS_ENABLED', false)
  }

  /**
   * Réinitialiser MFA pour un utilisateur (admin uniquement)
   */
  async resetUserMFA(userId: string, adminUserId: string): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Vérifier que l'admin a les permissions
      const admin = await this.usersService.findById(adminUserId)
      if (!admin || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(admin.role)) {
        return {
          success: false,
          message: 'Permissions insuffisantes'
        }
      }

      // Désactiver toutes les méthodes MFA de l'utilisateur
      const mfaMethods = await this.mfaService.getUserMFAMethods(userId)
      
      for (const method of mfaMethods) {
        await this.mfaService.disableMFA(userId, method.type as any)
      }

      // Logger l'action pour audit
      console.log(`Admin ${adminUserId} a réinitialisé MFA pour l'utilisateur ${userId}`)

      return {
        success: true,
        message: 'MFA réinitialisé avec succès'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la réinitialisation MFA'
      }
    }
  }

  /**
   * Obtenir les statistiques MFA pour un utilisateur
   */
  async getUserMFAStats(userId: string): Promise<any> {
    return await this.mfaService.getMFAStats(userId)
  }

  /**
   * Vérifier si MFA est requis pour une action sensible
   */
  async requiresMFAForAction(userId: string, action: string): Promise<boolean> {
    const sensitiveActions = [
      'change_password',
      'update_email',
      'delete_account',
      'admin_access',
      'financial_operation'
    ]

    // Si l'action est sensible et que l'utilisateur a MFA, le demander
    if (sensitiveActions.includes(action)) {
      return await this.mfaService.hasMFAEnabled(userId)
    }

    return false
  }

  /**
   * Définir une société par défaut pour un utilisateur
   */
  async setDefaultSociete(userId: string, societeId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.societeUsersService.setDefault(userId, societeId)
      return {
        success: true,
        message: 'Société définie par défaut avec succès'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la définition de la société par défaut'
      }
    }
  }
}
