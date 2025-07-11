import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import type { User } from '../users/entities/user.entity'
import type { AuthService } from './auth.service'
import type { ChangePasswordDto } from './dto/change-password.dto'
import { type LoginDto, RefreshTokenDto, type RegisterDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@ApiTags('🔐 Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur avec email et mot de passe',
  })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
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
}
