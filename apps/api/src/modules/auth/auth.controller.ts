// apps/api/src/modules/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('🔐 Auth')
@Controller('auth')

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // ✅ Route publique
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Connexion utilisateur',
    description: 'Authentifie un utilisateur avec email et mot de passe'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion réussie',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'number' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
            role: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credentials invalides' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public() // ✅ Route publique
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Inscription utilisateur',
    description: 'Crée un nouveau compte utilisateur'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Inscription réussie',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'number' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            nom: { type: 'string' },
            prenom: { type: 'string' },
            role: { type: 'string' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public() // ✅ Route publique
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Rafraîchir les tokens',
    description: 'Génère de nouveaux tokens avec un refresh token valide'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tokens rafraîchis',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'number' },
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Refresh token invalide' })
  @ApiBody({ type: RefreshTokenDto })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Déconnexion utilisateur',
    description: 'Invalide le refresh token de l\'utilisateur'
  })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  @ApiResponse({ status: 401, description: 'Token invalide' })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return { message: 'Déconnexion réussie' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Profil utilisateur',
    description: 'Récupère les informations du profil utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil récupéré',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        nom: { type: 'string' },
        prenom: { type: 'string' },
        role: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token invalide' })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Changer mot de passe',
    description: 'Change le mot de passe de l\'utilisateur connecté'
  })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 401, description: 'Ancien mot de passe incorrect' })
  @ApiResponse({ status: 400, description: 'Nouveau mot de passe invalide' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    await this.authService.changePassword(
      user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword
    );
    return { message: 'Mot de passe changé avec succès' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Informations utilisateur courantes (alias de profile)',
    description: 'Alias pour la route /profile'
  })
  @ApiResponse({ status: 200, description: 'Informations utilisateur' })
  @ApiResponse({ status: 401, description: 'Token invalide' })
  async getCurrentUser(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }
}
