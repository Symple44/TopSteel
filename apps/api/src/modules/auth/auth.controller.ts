import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Req, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import type { User } from '../users/entities/user.entity'
import { AuthService } from './auth.service'
import { ChangePasswordDto } from './dto/change-password.dto'
import { type LoginDto, RefreshTokenDto, type RegisterDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { Roles } from './decorators/roles.decorator'
import { RolesGuard } from './guards/roles.guard'
import { SessionInvalidationService } from './services/session-invalidation.service'

@ApiTags('🔐 Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionInvalidationService: SessionInvalidationService
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur avec email et mot de passe. Peut retourner requiresMFA=true si MFA est activé.',
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie ou MFA requis',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Public()
  @Post('login-mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion avec MFA',
    description: 'Complète la connexion après vérification MFA',
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
    summary: 'Inscription utilisateur',
    description: 'Créer un nouveau compte utilisateur',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rafraîchir le token',
    description: "Obtenir un nouveau token d'accès",
  })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Déconnexion',
    description: "Invalider le token de l'utilisateur",
  })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id)
    return { message: 'Logout successful' }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Profil utilisateur',
    description: 'Récupérer les informations du profil',
  })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id)
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description: "Modifier le mot de passe de l'utilisateur connecté",
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
    summary: 'Vérifier le token',
    description: 'Vérifier la validité du token et retourner le profil',
  })
  async verify(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id)
  }

  @Get('societes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Récupérer les sociétés disponibles',
    description: 'Obtenir la liste des sociétés auxquelles l\'utilisateur a accès',
  })
  async getUserSocietes(@CurrentUser() user: User) {
    return this.authService.getUserSocietes(user.id)
  }

  @Post('login-societe/:societeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Se connecter à une société spécifique',
    description: 'Établir la session avec une société et obtenir un token multi-tenant',
  })
  async loginWithSociete(
    @CurrentUser() user: User,
    @Param('societeId') societeId: string,
    @Body() body: { siteId?: string },
    @Req() request: any
  ) {
    return this.authService.loginWithSociete(user.id, societeId, body.siteId, request)
  }

  @Post('societe-default/:societeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Définir une société par défaut',
    description: 'Définir une société comme société par défaut pour l\'utilisateur',
  })
  async setDefaultSociete(
    @CurrentUser() user: User,
    @Param('societeId') societeId: string
  ) {
    return this.authService.setDefaultSociete(user.id, societeId)
  }

  @Post('admin/invalidate-all-sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalider toutes les sessions',
    description: 'Invalider toutes les sessions actives (réservé aux administrateurs)',
  })
  async invalidateAllSessions(@CurrentUser() user: User) {
    const affectedUsers = await this.sessionInvalidationService.forceInvalidateAllSessions()
    return { 
      message: 'Toutes les sessions ont été invalidées',
      affectedUsers,
      invalidatedBy: user.email
    }
  }
}
