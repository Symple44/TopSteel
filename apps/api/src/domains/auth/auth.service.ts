import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import type { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { SocieteUser, UserSocieteRole } from '../../features/societes/entities/societe-user.entity'
import type { SocieteUsersService } from '../../features/societes/services/societe-users.service'
import type { SocietesService } from '../../features/societes/services/societes.service'
import { User } from '../users/entities/user.entity'
import type { UsersService } from '../users/users.service'
import { GlobalUserRole, SocieteRoleType } from './core/constants/roles.constants'
import { UserSession } from './core/entities/user-session.entity'
import type { LoginDto } from './external/dto/login.dto'
import type { RegisterDto } from './external/dto/register.dto'
import type { JwtPayload, MultiTenantJwtPayload } from './interfaces/jwt-payload.interface'
import type { AuthPerformanceService } from './services/auth-performance.service'
import type { GeolocationService } from './services/geolocation.service'
import type { MFAService } from './services/mfa.service'
import type { SessionRedisService } from './services/session-redis.service'
import type { UnifiedRolesService } from './services/unified-roles.service'
import type { UserSocieteRolesService } from './services/user-societe-roles.service'

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
    private readonly userSocieteRolesService: UserSocieteRolesService,
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly performanceService: AuthPerformanceService,
    @InjectRepository(UserSession, 'auth')
    private readonly _userSessionRepository: Repository<UserSession>
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
    let user: any
    try {
      user = await this.validateUser(loginDto.login, loginDto.password)
    } catch (error: any) {
      throw error
    }

    // Vérifier si l'utilisateur a MFA activé
    const hasMFA = await this.mfaService.hasMFAEnabled(user.id)

    if (hasMFA) {
      // Retourner une réponse indiquant que MFA est requis
      return {
        requiresMFA: true,
        userId: user.id,
        email: user.email,
        availableMethods: await this.getAvailableMFAMethods(user.id),
        message: 'Authentification à deux facteurs requise',
      }
    }

    // Procéder avec la connexion normale si pas de MFA
    return await this.completeLogin(user, request)
  }

  /**
   * Récupérer les sociétés disponibles pour un utilisateur (version unifiée)
   */
  async getUserSocietes(userId: string) {
    return this.performanceService.trackOperation(
      'getUserSocietes',
      async () => {
        try {
          // Utiliser le service unifié pour récupérer les rôles
          const userSocieteInfos = await this.unifiedRolesService.getUserSocieteRoles(userId)

          // Si l'utilisateur est SUPER_ADMIN et n'a pas de rôles spécifiques, récupérer toutes les sociétés
          const user = await this.usersService.findById(userId)
          if (user?.role === GlobalUserRole.SUPER_ADMIN && userSocieteInfos.length === 0) {
            return await this.getSuperAdminAllSocietes(userId)
          }

          // OPTIMIZED: Use société data from the joined query
          return userSocieteInfos.map((info) => ({
            id: info.societeId,
            nom: info.societe?.nom || 'Société inconnue',
            code: info.societe?.code || info.societeId,
            role: info.effectiveRole,
            isDefault: info.isDefaultSociete,
            permissions: info.permissions,
            sites:
              info.societe?.sites?.map((site) => ({
                id: site.id,
                nom: site.nom,
                code: site.code,
              })) || [],
          }))
        } catch (error) {
          console.error('Erreur lors de la récupération des sociétés:', error)
          // Fallback sur l'ancienne méthode si nécessaire
          return await this.getUserSocietesLegacy(userId)
        }
      },
      { trackQueries: true }
    )
  }

  /**
   * Récupérer toutes les sociétés pour un SUPER_ADMIN
   */
  private async getSuperAdminAllSocietes(userId: string) {
    const allSocietes = await this.societesService.findActive()
    return allSocietes.map((societe) => ({
      id: societe.id,
      nom: societe.nom,
      code: societe.code,
      role: 'SUPER_ADMIN',
      isDefault: false, // SUPER_ADMIN n'a pas de société par défaut
      permissions: [], // SUPER_ADMIN a toutes les permissions
      sites:
        societe.sites?.map((site) => ({
          id: site.id,
          nom: site.nom,
          code: site.code,
        })) || [],
    }))
  }

  /**
   * Récupérer les sociétés avec la nouvelle structure de rôles
   */
  private async getUserSocietesWithNewStructure(userId: string) {
    const userRoles = await this.userSocieteRolesService.findUserRolesInSocietes(userId)

    return userRoles.map((ur) => {
      // Utiliser directement le roleType stocké dans UserSocieteRole
      const displayRole = ur.roleType || 'USER'

      return {
        id: ur.societe.id,
        nom: ur.societe.nom,
        code: ur.societe.code,
        role: displayRole,
        isDefault: ur.isDefaultSociete,
        permissions: ur.permissions || [],
        sites: [], // TODO: Adapter si nécessaire pour inclure les sites
      }
    })
  }

  /**
   * Récupérer les sociétés avec l'ancienne structure (compatibilité)
   */
  private async getUserSocietesLegacy(userId: string) {
    const userSocietes = await this.societeUsersService.findByUser(userId)

    // Récupérer le rôle global de l'utilisateur pour la logique de priorité
    const user = await this.usersService.findById(userId)
    const userGlobalRole = user?.role

    return userSocietes.map((us) => {
      // Déterminer le rôle à afficher :
      // Si l'utilisateur est SUPER_ADMIN globalement, toujours afficher SUPER_ADMIN
      // Sinon utiliser le rôle spécifique à la société
      let displayRole: string = us.role.toString()

      if (userGlobalRole === 'SUPER_ADMIN') {
        displayRole = 'SUPER_ADMIN' // Toujours prioritaire
      } else if (userGlobalRole === 'ADMIN' && us.role !== UserSocieteRole.ADMIN) {
        // Si l'utilisateur est ADMIN globalement, utiliser ADMIN sauf si le rôle société est ADMIN
        displayRole = 'ADMIN'
      }

      return {
        id: us.societe.id,
        nom: us.societe.nom,
        code: us.societe.code,
        role: displayRole,
        isDefault: us.isDefault,
        permissions: us.permissions,
        sites:
          us.societe.sites?.map((site) => ({
            id: site.id,
            nom: site.nom,
            code: site.code,
            isPrincipal: site.isPrincipal,
          })) || [],
      }
    })
  }

  /**
   * Login avec sélection de société (version unifiée)
   */
  async loginWithSociete(userId: string, societeId: string, siteId?: string, request?: any) {
    // Récupérer les informations complètes de l'utilisateur
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé')
    }

    // Utiliser le service unifié pour récupérer ou créer le rôle
    let userSocieteInfo = await this.unifiedRolesService.getUserSocieteRole(userId, societeId)

    // Si pas de rôle trouvé et que l'utilisateur n'est pas SUPER_ADMIN, refuser l'accès
    if (!userSocieteInfo && user.role !== GlobalUserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Accès non autorisé à cette société')
    }

    // Pour SUPER_ADMIN, le service unifié crée automatiquement un rôle virtuel
    if (!userSocieteInfo && user.role === GlobalUserRole.SUPER_ADMIN) {
      userSocieteInfo = {
        userId: user.id,
        societeId: societeId,
        globalRole: GlobalUserRole.SUPER_ADMIN,
        societeRole: SocieteRoleType.OWNER,
        effectiveRole: SocieteRoleType.OWNER,
        isDefaultSociete: false,
        isActive: true,
        permissions: [],
        additionalPermissions: [],
        restrictedPermissions: [],
      }
    }

    // Vérifier que le rôle est actif
    if (!userSocieteInfo || !userSocieteInfo.isActive) {
      throw new UnauthorizedException('Accès non autorisé à cette société')
    }

    // Récupérer les informations de la société
    const societe = await this.societesService.findById(societeId)
    if (!societe) {
      throw new UnauthorizedException('Société non trouvée')
    }

    // Générer un ID de session unique
    const sessionId = uuidv4()

    // Créer le payload multi-tenant avec le système unifié
    const payload: MultiTenantJwtPayload = {
      sub: user.id,
      email: user.email,
      role: userSocieteInfo.effectiveRole,
      sessionId,
      societeId: societeId,
      societeCode: societe.code,
      siteId: siteId,
      permissions: userSocieteInfo.permissions,
      tenantDatabase: societe.databaseName,
    }

    const accessToken = await this.generateAccessToken(payload)
    const refreshToken = await this.generateRefreshToken(payload)

    // Mettre à jour l'activité utilisateur
    await this.usersService.updateLastLogin(user.id)

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

    // Créer la session en base de données
    const dbSession = UserSession.createNew(
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

    await this._userSessionRepository.save(dbSession)

    return {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: payload.role,
        // Ajouter les informations de rôle société pour le frontend
        userSocieteRoles: [
          {
            societeId: societeId,
            roleType: userSocieteInfo.effectiveRole,
            isDefaultSociete: userSocieteInfo.isDefaultSociete,
            isActive: userSocieteInfo.isActive,
          },
        ],
        societe: {
          id: societe.id,
          nom: societe.nom,
          code: societe.code,
          databaseName: societe.databaseName,
        },
        permissions: payload.permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60, // 24 heures en secondes
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

    // Ne plus stocker le refreshToken dans la table users pour permettre le multi-device
    // await this.usersService.updateRefreshToken(user.id, refreshToken)
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

    // Créer la session en base de données
    const dbSession = UserSession.createNew(
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

    await this._userSessionRepository.save(dbSession)

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
      warningCount: 0,
    })

    // Détecter les activités suspectes - TEMPORAIREMENT DÉSACTIVÉ
    /* const previousSessions = await this._userSessionRepository.find({
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
      
      await this._userSessionRepository.save(dbSession)
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
      securityAlert: suspiciousActivity.isSuspicious
        ? {
            level: suspiciousActivity.riskLevel,
            reasons: suspiciousActivity.reasons,
          }
        : undefined,
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
    } catch (_error) {
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

      // Vérifier que la session existe et est active
      const session = await this._userSessionRepository.findOne({
        where: {
          sessionId: payload.sessionId,
          userId: payload.sub,
          isActive: true,
          refreshToken: refreshToken,
        },
      })

      if (!session) {
        throw new UnauthorizedException('Invalid or expired session')
      }

      // Vérifier que l'utilisateur existe et est actif
      const user = await this.usersService.findById(payload.sub)
      if (!user || !user.actif) {
        throw new UnauthorizedException('User not found or inactive')
      }

      // Générer de nouveaux tokens
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.sessionId,
      }

      const newAccessToken = await this.generateAccessToken(newPayload)
      const newRefreshToken = await this.generateRefreshToken(newPayload)

      // Mettre à jour la session avec le nouveau refresh token
      session.refreshToken = newRefreshToken
      session.accessToken = newAccessToken
      session.lastActivity = new Date()
      await this._userSessionRepository.save(session)

      // Mettre à jour aussi dans Redis
      await this.sessionRedisService.updateSessionActivity(session.sessionId)

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60, // 24 heures en secondes
      }
    } catch (_error) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(userId: string, sessionId?: string) {
    // Ne plus mettre à jour le refreshToken dans users car il est maintenant dans sessions
    // await this.usersService.updateRefreshToken(userId, null)

    if (sessionId) {
      // Supprimer la session spécifique de Redis
      await this.sessionRedisService.removeActiveSession(sessionId)

      // Marquer la session comme terminée en base de données
      const dbSession = await this._userSessionRepository.findOne({
        where: { sessionId, userId },
      })

      if (dbSession) {
        dbSession.endSession('normal')
        await this._userSessionRepository.save(dbSession)
      }
    } else {
      // Déconnexion de toutes les sessions de l'utilisateur
      await this.sessionRedisService.forceLogoutUser(userId)

      // Marquer toutes les sessions actives comme terminées
      await this._userSessionRepository.update(
        { userId, status: 'active' },
        {
          status: 'ended',
          logoutTime: new Date(),
          isActive: false,
        }
      )
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
    const dbSession = await this._userSessionRepository.findOne({
      where: { sessionId },
    })

    if (dbSession) {
      dbSession.updateActivity()
      await this._userSessionRepository.save(dbSession)
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
  async getConnectionHistory(
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    sessions: UserSession[]
    total: number
  }> {
    const [sessions, total] = await this._userSessionRepository.findAndCount({
      order: { loginTime: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['user'],
    })

    return { sessions, total }
  }

  /**
   * Obtenir l'historique d'un utilisateur spécifique
   */
  async getUserConnectionHistory(userId: string, limit: number = 50): Promise<UserSession[]> {
    return await this._userSessionRepository.find({
      where: { userId },
      order: { loginTime: 'DESC' },
      take: limit,
    })
  }

  /**
   * Forcer la déconnexion d'un utilisateur (action admin)
   */
  async forceLogoutUser(
    userId: string,
    adminUserId: string,
    reason: string = 'Déconnexion administrative'
  ): Promise<string[]> {
    // Supprimer de Redis
    const removedSessions = await this.sessionRedisService.forceLogoutUser(userId)

    // Mettre à jour en base de données
    const activeSessions = await this._userSessionRepository.find({
      where: { userId, status: 'active' },
    })

    for (const session of activeSessions) {
      session.endSession('forced', adminUserId)
      session.forcedLogoutReason = reason
      await this._userSessionRepository.save(session)
    }

    return removedSessions
  }

  /**
   * Forcer la déconnexion d'une session spécifique (action admin)
   */
  async forceLogoutSession(
    sessionId: string,
    adminUserId: string,
    reason: string = 'Déconnexion administrative'
  ): Promise<boolean> {
    // Supprimer de Redis
    const success = await this.sessionRedisService.forceLogoutSession(sessionId)

    if (success) {
      // Mettre à jour en base de données
      const dbSession = await this._userSessionRepository.findOne({
        where: { sessionId },
      })

      if (dbSession) {
        dbSession.endSession('forced', adminUserId)
        dbSession.forcedLogoutReason = reason
        await this._userSessionRepository.save(dbSession)
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

    const totalSessions = await this._userSessionRepository.count()
    const activeSessions = await this._userSessionRepository.count({
      where: { status: 'active' },
    })
    const sessionsToday = await this._userSessionRepository
      .createQueryBuilder('session')
      .where('session.loginTime >= :today', { today })
      .getCount()

    const suspiciousSessions = await this._userSessionRepository
      .createQueryBuilder('session')
      .where('session.warningCount > :count', { count: 0 })
      .getCount()

    return {
      redis: redisStats,
      database: {
        totalSessions,
        activeSessions,
        sessionsToday,
        suspiciousSessions,
      },
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

    const expiredSessions = await this._userSessionRepository
      .createQueryBuilder('session')
      .where('session.status = :status', { status: 'active' })
      .andWhere('session.lastActivity < :threshold', { threshold: expiredThreshold })
      .getMany()

    let databaseCleanedCount = 0
    for (const session of expiredSessions) {
      session.endSession('expired')
      await this._userSessionRepository.save(session)
      databaseCleanedCount++
    }

    return {
      redisCleanedCount,
      databaseCleanedCount,
    }
  }

  /**
   * Obtenir les méthodes MFA disponibles pour un utilisateur
   */
  private async getAvailableMFAMethods(userId: string): Promise<
    Array<{
      type: string
      isEnabled: boolean
      lastUsed?: Date
    }>
  > {
    const methods = await this.mfaService.getUserMFAMethods(userId)
    return methods
      .filter((method) => method.isEnabled && method.isVerified)
      .map((method) => ({
        type: method.type,
        isEnabled: method.isEnabled,
        lastUsed: method.lastUsedAt,
      }))
  }

  /**
   * Connexion avec MFA - après vérification du code MFA
   */
  async loginWithMFA(userId: string, mfaSessionToken: string, request?: any): Promise<any> {
    try {
      // Vérifier que la session MFA est valide et vérifiée
      const mfaSession = await this.mfaService.mfaSessionRepository.findOne({
        where: {
          userId,
          sessionToken: mfaSessionToken,
          status: 'verified',
        },
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
    } catch (_error) {
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
    return (
      user?.role === GlobalUserRole.SUPER_ADMIN &&
      this.configService.get<boolean>('MFA_EMERGENCY_BYPASS_ENABLED', false)
    )
  }

  /**
   * Réinitialiser MFA pour un utilisateur (admin uniquement)
   */
  async resetUserMFA(
    userId: string,
    adminUserId: string
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Vérifier que l'admin a les permissions
      const admin = await this.usersService.findById(adminUserId)
      if (!admin || ![GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN].includes(admin.role)) {
        return {
          success: false,
          message: 'Permissions insuffisantes',
        }
      }

      // Désactiver toutes les méthodes MFA de l'utilisateur
      const mfaMethods = await this.mfaService.getUserMFAMethods(userId)

      for (const method of mfaMethods) {
        await this.mfaService.disableMFA(userId, method.type as any)
      }

      return {
        success: true,
        message: 'MFA réinitialisé avec succès',
      }
    } catch (_error) {
      return {
        success: false,
        message: 'Erreur lors de la réinitialisation MFA',
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
      'financial_operation',
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
  async setDefaultSociete(
    userId: string,
    societeId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Utiliser le nouveau service si disponible
      if (this.userSocieteRolesService) {
        await this.userSocieteRolesService.setDefaultSociete(userId, societeId)
      } else {
        // Fallback sur l'ancien service
        await this.societeUsersService.setDefault(userId, societeId)
      }
      return {
        success: true,
        message: 'Société définie par défaut avec succès',
      }
    } catch (error) {
      console.error('Error setting default company:', error)
      return {
        success: false,
        message: 'Erreur lors de la définition de la société par défaut',
      }
    }
  }

  /**
   * Récupérer la société par défaut d'un utilisateur
   */
  async getDefaultSociete(userId: string): Promise<{
    success: boolean
    data?: { id: string; nom: string; code: string }
    message?: string
  }> {
    try {
      const userSocietes = await this.getUserSocietes(userId)
      const defaultSociete = userSocietes.find((s) => s.isDefault)

      if (!defaultSociete) {
        return {
          success: false,
          message: 'Aucune société par défaut définie',
        }
      }

      return {
        success: true,
        data: {
          id: defaultSociete.id,
          nom: defaultSociete.nom,
          code: defaultSociete.code,
        },
      }
    } catch (_error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération de la société par défaut',
      }
    }
  }
}
