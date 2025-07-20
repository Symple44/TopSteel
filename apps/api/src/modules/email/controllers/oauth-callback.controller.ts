import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  Param, 
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Redirect
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { GoogleEmailProvider } from '../providers/google-email.provider'
import { MicrosoftEmailProvider } from '../providers/microsoft-email.provider'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'
import { ConfigService } from '@nestjs/config'

@ApiTags('OAuth Email')
@Controller('email/oauth')
export class OAuthCallbackController {
  private readonly logger = new Logger(OAuthCallbackController.name)

  constructor(
    private readonly googleProvider: GoogleEmailProvider,
    private readonly microsoftProvider: MicrosoftEmailProvider,
    private readonly configService: ConfigService,
  ) {}

  // === GOOGLE OAUTH2 ===

  @Get('google/authorize')
  @ApiOperation({ summary: 'Initier l\'autorisation Google OAuth2' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async initiateGoogleAuth(@CurrentUser() user: any) {
    try {
      // Configurer temporairement le provider pour obtenir l'URL
      await this.googleProvider.initialize({
        provider: 'google',
        enabled: true,
        defaultFrom: 'temp@example.com',
        oauth2: {
          clientId: this.configService.get('GOOGLE_CLIENT_ID') || '',
          clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET') || '',
          redirectUri: this.configService.get('GOOGLE_REDIRECT_URI') || '',
        }
      })

      const authUrl = this.googleProvider.getAuthorizationUrl()
      
      this.logger.log(`Autorisation Google initiée par ${user.email}`)
      
      return {
        authUrl,
        provider: 'google',
        message: 'Visitez l\'URL fournie pour autoriser l\'accès à Gmail'
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'initiation de l\'autorisation Google:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Callback Google OAuth2' })
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('error') error?: string,
    @Query('state') state?: string
  ) {
    if (error) {
      this.logger.error(`Erreur d'autorisation Google: ${error}`)
      throw new HttpException(`Autorisation refusée: ${error}`, HttpStatus.BAD_REQUEST)
    }

    if (!code) {
      throw new HttpException('Code d\'autorisation manquant', HttpStatus.BAD_REQUEST)
    }

    try {
      // Configurer temporairement le provider
      await this.googleProvider.initialize({
        provider: 'google',
        enabled: true,
        defaultFrom: 'temp@example.com',
        oauth2: {
          clientId: this.configService.get('GOOGLE_CLIENT_ID') || '',
          clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET') || '',
          redirectUri: this.configService.get('GOOGLE_REDIRECT_URI') || '',
        }
      })

      const tokens = await this.googleProvider.handleAuthorizationCode(code)
      
      this.logger.log('Tokens Google obtenus avec succès')
      
      // En production, sauvegarder les tokens de manière sécurisée
      // et rediriger vers une page de succès
      
      return {
        success: true,
        provider: 'google',
        message: 'Autorisation Google réussie',
        tokens: {
          // Ne pas exposer les tokens complets en production
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          expiryDate: tokens.expiryDate,
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors du traitement du callback Google:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('google/tokens')
  @ApiOperation({ summary: 'Configurer les tokens Google manuellement' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async configureGoogleTokens(
    @Body() dto: {
      accessToken: string
      refreshToken: string
      expiryDate?: number
    },
    @CurrentUser() user: any
  ) {
    try {
      // Valider les tokens en initialisant le provider
      await this.googleProvider.initialize({
        provider: 'google',
        enabled: true,
        defaultFrom: this.configService.get('DEFAULT_FROM_EMAIL') || '',
        oauth2: {
          clientId: this.configService.get('GOOGLE_CLIENT_ID') || '',
          clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET') || '',
          redirectUri: this.configService.get('GOOGLE_REDIRECT_URI') || '',
          accessToken: dto.accessToken,
          refreshToken: dto.refreshToken,
          tokenExpiry: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        }
      })

      // Tester la connexion
      const isValid = await this.googleProvider.validateConnection()
      
      if (!isValid) {
        throw new Error('Tokens invalides ou expirés')
      }

      this.logger.log(`Tokens Google configurés par ${user.email}`)
      
      return {
        success: true,
        provider: 'google',
        message: 'Tokens Google configurés et validés',
        connectionValid: isValid
      }
    } catch (error) {
      this.logger.error('Erreur lors de la configuration des tokens Google:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  // === MICROSOFT OAUTH2 ===

  @Get('microsoft/authorize')
  @ApiOperation({ summary: 'Initier l\'autorisation Microsoft OAuth2' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async initiateMicrosoftAuth(@CurrentUser() user: any) {
    try {
      // Configurer temporairement le provider pour obtenir l'URL
      await this.microsoftProvider.initialize({
        provider: 'microsoft',
        enabled: true,
        defaultFrom: 'temp@example.com',
        oauth2: {
          clientId: this.configService.get('MICROSOFT_CLIENT_ID') || '',
          clientSecret: this.configService.get('MICROSOFT_CLIENT_SECRET') || '',
          redirectUri: this.configService.get('MICROSOFT_REDIRECT_URI') || '',
        }
      })

      const authUrl = this.microsoftProvider.getAuthorizationUrl()
      
      this.logger.log(`Autorisation Microsoft initiée par ${user.email}`)
      
      return {
        authUrl,
        provider: 'microsoft',
        message: 'Visitez l\'URL fournie pour autoriser l\'accès à Outlook/Office365'
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'initiation de l\'autorisation Microsoft:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Get('microsoft/callback')
  @ApiOperation({ summary: 'Callback Microsoft OAuth2' })
  async handleMicrosoftCallback(
    @Query('code') code: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
    @Query('state') state?: string
  ) {
    if (error) {
      this.logger.error(`Erreur d'autorisation Microsoft: ${error} - ${errorDescription}`)
      throw new HttpException(`Autorisation refusée: ${errorDescription || error}`, HttpStatus.BAD_REQUEST)
    }

    if (!code) {
      throw new HttpException('Code d\'autorisation manquant', HttpStatus.BAD_REQUEST)
    }

    try {
      // Configurer temporairement le provider
      await this.microsoftProvider.initialize({
        provider: 'microsoft',
        enabled: true,
        defaultFrom: 'temp@example.com',
        oauth2: {
          clientId: this.configService.get('MICROSOFT_CLIENT_ID') || '',
          clientSecret: this.configService.get('MICROSOFT_CLIENT_SECRET') || '',
          redirectUri: this.configService.get('MICROSOFT_REDIRECT_URI') || '',
        }
      })

      const tokens = await this.microsoftProvider.handleAuthorizationCode(code)
      
      this.logger.log('Tokens Microsoft obtenus avec succès')
      
      return {
        success: true,
        provider: 'microsoft',
        message: 'Autorisation Microsoft réussie',
        tokens: {
          // Ne pas exposer les tokens complets en production
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          expiryDate: tokens.expiryDate,
        }
      }
    } catch (error) {
      this.logger.error('Erreur lors du traitement du callback Microsoft:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('microsoft/tokens')
  @ApiOperation({ summary: 'Configurer les tokens Microsoft manuellement' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async configureMicrosoftTokens(
    @Body() dto: {
      accessToken: string
      refreshToken: string
      expiryDate?: number
    },
    @CurrentUser() user: any
  ) {
    try {
      // Valider les tokens en initialisant le provider
      await this.microsoftProvider.initialize({
        provider: 'microsoft',
        enabled: true,
        defaultFrom: this.configService.get('DEFAULT_FROM_EMAIL') || '',
        oauth2: {
          clientId: this.configService.get('MICROSOFT_CLIENT_ID') || '',
          clientSecret: this.configService.get('MICROSOFT_CLIENT_SECRET') || '',
          redirectUri: this.configService.get('MICROSOFT_REDIRECT_URI') || '',
          accessToken: dto.accessToken,
          refreshToken: dto.refreshToken,
          tokenExpiry: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        }
      })

      // Tester la connexion
      const isValid = await this.microsoftProvider.validateConnection()
      
      if (!isValid) {
        throw new Error('Tokens invalides ou expirés')
      }

      this.logger.log(`Tokens Microsoft configurés par ${user.email}`)
      
      return {
        success: true,
        provider: 'microsoft',
        message: 'Tokens Microsoft configurés et validés',
        connectionValid: isValid
      }
    } catch (error) {
      this.logger.error('Erreur lors de la configuration des tokens Microsoft:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  // === UTILITAIRES ===

  @Get('providers/status')
  @ApiOperation({ summary: 'Statut des providers OAuth2' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async getProvidersStatus() {
    const status = {
      google: {
        configured: !!(
          this.configService.get('GOOGLE_CLIENT_ID') && 
          this.configService.get('GOOGLE_CLIENT_SECRET')
        ),
        connected: false,
        error: null as string | null
      },
      microsoft: {
        configured: !!(
          this.configService.get('MICROSOFT_CLIENT_ID') && 
          this.configService.get('MICROSOFT_CLIENT_SECRET')
        ),
        connected: false,
        error: null as string | null
      }
    }

    // Tester les connexions si configurées
    if (status.google.configured) {
      try {
        await this.googleProvider.initialize({
          provider: 'google',
          enabled: true,
          defaultFrom: 'test@example.com',
          oauth2: {
            clientId: this.configService.get('GOOGLE_CLIENT_ID') || '',
            clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET') || '',
            redirectUri: this.configService.get('GOOGLE_REDIRECT_URI') || '',
          }
        })
        status.google.connected = await this.googleProvider.validateConnection()
      } catch (error) {
        status.google.error = (error as Error).message
      }
    }

    if (status.microsoft.configured) {
      try {
        await this.microsoftProvider.initialize({
          provider: 'microsoft',
          enabled: true,
          defaultFrom: 'test@example.com',
          oauth2: {
            clientId: this.configService.get('MICROSOFT_CLIENT_ID') || '',
            clientSecret: this.configService.get('MICROSOFT_CLIENT_SECRET') || '',
            redirectUri: this.configService.get('MICROSOFT_REDIRECT_URI') || '',
          }
        })
        status.microsoft.connected = await this.microsoftProvider.validateConnection()
      } catch (error) {
        status.microsoft.error = (error as Error).message
      }
    }

    return status
  }

  @Post('tokens/refresh')
  @ApiOperation({ summary: 'Rafraîchir tous les tokens OAuth2' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async refreshAllTokens(@CurrentUser() user: any) {
    const results = {
      google: { success: false, error: null as string | null },
      microsoft: { success: false, error: null as string | null }
    }

    // Rafraîchir les tokens Google
    try {
      await this.googleProvider.refreshToken()
      results.google.success = true
    } catch (error) {
      results.google.error = (error as Error).message
    }

    // Rafraîchir les tokens Microsoft
    try {
      await this.microsoftProvider.refreshToken()
      results.microsoft.success = true
    } catch (error) {
      results.microsoft.error = (error as Error).message
    }

    this.logger.log(`Rafraîchissement des tokens par ${user.email}`, results)

    return {
      message: 'Rafraîchissement des tokens terminé',
      results
    }
  }

  @Get('configuration/guide')
  @ApiOperation({ summary: 'Guide de configuration OAuth2' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  async getConfigurationGuide() {
    const baseUrl = this.configService.get('APP_URL') || 'http://localhost:3000'
    
    return {
      google: {
        description: 'Configuration pour Google Gmail API',
        steps: [
          '1. Aller sur Google Cloud Console (console.cloud.google.com)',
          '2. Créer un nouveau projet ou sélectionner un projet existant',
          '3. Activer Gmail API dans "APIs & Services"',
          '4. Créer des credentials OAuth 2.0',
          '5. Ajouter les URIs de redirection autorisées',
          '6. Configurer les variables d\'environnement'
        ],
        redirectUris: [
          `${baseUrl}/api/email/oauth/google/callback`
        ],
        scopes: [
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        envVars: [
          'GOOGLE_CLIENT_ID=your_client_id',
          'GOOGLE_CLIENT_SECRET=your_client_secret',
          `GOOGLE_REDIRECT_URI=${baseUrl}/api/email/oauth/google/callback`
        ]
      },
      microsoft: {
        description: 'Configuration pour Microsoft Graph API (Outlook/Office365)',
        steps: [
          '1. Aller sur Azure Portal (portal.azure.com)',
          '2. Naviguer vers "Azure Active Directory" > "App registrations"',
          '3. Créer une nouvelle application',
          '4. Configurer les permissions API (Mail.Send, Mail.ReadWrite)',
          '5. Ajouter les URIs de redirection',
          '6. Générer un client secret',
          '7. Configurer les variables d\'environnement'
        ],
        redirectUris: [
          `${baseUrl}/api/email/oauth/microsoft/callback`
        ],
        permissions: [
          'Mail.Send',
          'Mail.ReadWrite',
          'User.Read'
        ],
        envVars: [
          'MICROSOFT_CLIENT_ID=your_client_id',
          'MICROSOFT_CLIENT_SECRET=your_client_secret',
          `MICROSOFT_REDIRECT_URI=${baseUrl}/api/email/oauth/microsoft/callback`,
          'AZURE_TENANT_ID=your_tenant_id (optional, defaults to "common")'
        ]
      }
    }
  }
}