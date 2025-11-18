/**
 * @deprecated This controller uses TypeORM and is kept for backward compatibility only.
 * Use AuthController (Prisma-based) at /auth/* endpoints instead.
 * This legacy controller will be removed in v3.0.0.
 *
 * Migration: Replace /auth-legacy/* with /auth/* in your API calls.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { Public } from '../../../core/common/decorators/public.decorator'
import { ThrottleAuth } from '../../../core/common/decorators/throttle-config.decorator'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { SkipCsrf } from '../../../infrastructure/security/csrf'
import type { User } from '../../users/entities/user.entity'
import { AuthService } from '../auth.service'
import { Roles } from '../decorators/roles.decorator'
import type { ChangePasswordDto } from '../external/dto/change-password.dto'
import { type LoginDto, RefreshTokenDto, type RegisterDto } from '../external/dto/login.dto'
import { JwtAuthGuard } from '../security/guards/jwt-auth.guard'
import { RolesGuard } from '../security/guards/roles.guard'
import { SessionInvalidationService } from '../services/session-invalidation.service'

@ApiTags('🔐 Auth (Legacy - Deprecated)')
@Controller('auth-legacy')
export class AuthLegacyController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionInvalidationService: SessionInvalidationService,
    private readonly cacheService: OptimizedCacheService
  ) {}

  @Public()
  @SkipCsrf()
  @ThrottleAuth()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Connexion utilisateur',
    description:
      '⚠️ DEPRECATED: Use POST /auth/login instead. This endpoint will be removed in v3.0.0. Authentifie un utilisateur avec email et mot de passe. Peut retourner requiresMFA=true si MFA est activé.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie ou MFA requis',
  })
  async login(@Body() loginDto: LoginDto, @Req() request: Request) {
    // Utiliser les données brutes si le DTO est vide mais que request.body a des données
    const actualData = loginDto?.login || loginDto?.password ? loginDto : request.body

    return this.authService.login(actualData)
  }

  @Public()
  @ThrottleAuth()
  @Post('login-mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Connexion avec MFA',
    description: '⚠️ DEPRECATED: Use POST /auth/login-mfa instead. Complète la connexion après vérification MFA',
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion MFA réussie',
  })
  async loginWithMFA(@Body() body: { userId: string; mfaSessionToken: string }) {
    return this.authService.loginWithMFA(body.userId, body.mfaSessionToken)
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: '[DEPRECATED] Inscription utilisateur',
    description: '⚠️ DEPRECATED: Use POST /auth/register instead. Créer un nouveau compte utilisateur',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Public()
  @SkipCsrf()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Rafraîchir le token',
    description: "⚠️ DEPRECATED: Use POST /auth/refresh instead. Obtenir un nouveau token d'accès",
  })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken)
  }

  @SkipCsrf()
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '[DEPRECATED] Déconnexion',
    description: "⚠️ DEPRECATED: Use POST /auth/logout instead. Invalider le token de l'utilisateur",
  })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id)
    return { message: 'Logout successful' }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[DEPRECATED] Profil utilisateur',
    description: '⚠️ DEPRECATED: Use GET /auth/profile instead. Récupérer les informations du profil',
  })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id)
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Changer le mot de passe',
    description: "⚠️ DEPRECATED: Use POST /auth/change-password instead. Modifier le mot de passe de l'utilisateur connecté",
  })
  async changePassword(@CurrentUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    await this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    )
    return { message: 'Password changed successfully' }
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[DEPRECATED] Vérifier le token',
    description: '⚠️ DEPRECATED: Use GET /auth/verify instead. Vérifier la validité du token et retourner le profil',
  })
  async verify(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id)
  }

  @Get('societes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[DEPRECATED] Récupérer les sociétés disponibles',
    description: "⚠️ DEPRECATED: Use GET /auth/societes instead. Obtenir la liste des sociétés auxquelles l'utilisateur a accès",
  })
  async getUserSocietes(@CurrentUser() user: User) {
    const cacheKey = `auth:societes:${user.id}`

    // Vérifier le cache d'abord
    const cachedResult = await this.cacheService.get(cacheKey)
    if (cachedResult) {
      return cachedResult
    }
    const result = await this.authService.getUserSocietes(user.id)

    // Mettre en cache pour 5 minutes (300 secondes)
    await this.cacheService.set(cacheKey, result, 300)

    return result
  }

  @Post('societes/cache/invalidate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Invalider le cache des sociétés',
    description: '⚠️ DEPRECATED: Use POST /auth/societes/cache/invalidate instead. Force la recharge des sociétés depuis la base de données',
  })
  async invalidateSocietesCache(@CurrentUser() user: User) {
    const cacheKey = `auth:societes:${user.id}`
    await this.cacheService.delete(cacheKey)
    return { message: 'Cache invalidated successfully' }
  }

  @ThrottleAuth()
  @Post('login-societe/:societeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Se connecter à une société spécifique',
    description: '⚠️ DEPRECATED: Use POST /auth/login-societe/:societeId instead. Établir la session avec une société et obtenir un token multi-tenant',
  })
  async loginWithSociete(
    @CurrentUser() user: User,
    @Param('societeId') societeId: string,
    @Body() body: { siteId?: string },
    @Req() request: Request
  ) {
    return this.authService.loginWithSociete(user.id, societeId, body.siteId, request)
  }

  @Post('societe-default/:societeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Définir une société par défaut',
    description: "⚠️ DEPRECATED: Use POST /auth/societe-default/:societeId instead. Définir une société comme société par défaut pour l'utilisateur",
  })
  async setDefaultSociete(@CurrentUser() user: User, @Param('societeId') societeId: string) {
    return this.authService.setDefaultSociete(user.id, societeId)
  }

  @Post('user/default-company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Définir une société par défaut (nouvelle API)',
    description: "⚠️ DEPRECATED: Use POST /auth/user/default-company instead. Définir une société comme société par défaut pour l'utilisateur connecté",
  })
  async setUserDefaultCompany(@CurrentUser() user: User, @Body() body: { companyId: string }) {
    return this.authService.setDefaultSociete(user.id, body.companyId)
  }

  @Get('user/default-company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[DEPRECATED] Récupérer la société par défaut',
    description: "⚠️ DEPRECATED: Use GET /auth/user/default-company instead. Récupérer la société par défaut de l'utilisateur connecté",
  })
  async getUserDefaultCompany(@CurrentUser() user: User) {
    return this.authService.getDefaultSociete(user.id)
  }

  @Post('admin/invalidate-all-sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[DEPRECATED] Invalider toutes les sessions',
    description: '⚠️ DEPRECATED: Use POST /auth/admin/invalidate-all-sessions instead. Invalider toutes les sessions actives (réservé aux administrateurs)',
  })
  async invalidateAllSessions(@CurrentUser() user: User) {
    const affectedUsers = await this.sessionInvalidationService.forceInvalidateAllSessions()
    return {
      message: 'Toutes les sessions ont été invalidées',
      affectedUsers,
      invalidatedBy: user.email,
    }
  }
}
