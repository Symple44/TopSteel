import { Controller, Get, Logger, Req, Res } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { SkipCsrf } from './csrf.guard'
import type { CsrfService } from './csrf.service'

@ApiTags('🔐 CSRF')
@Controller('api/csrf')
export class CsrfController {
  private readonly logger = new Logger(CsrfController.name)

  constructor(private readonly csrfService: CsrfService) {}

  @Get('token')
  @SkipCsrf()
  @ApiOperation({
    summary: 'Obtenir un nouveau token CSRF',
    description: 'Génère et retourne un nouveau token CSRF pour les requêtes protégées',
  })
  @ApiResponse({
    status: 200,
    description: 'Token CSRF généré avec succès',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Token CSRF à inclure dans les requêtes POST/PUT/PATCH/DELETE',
        },
        headerName: {
          type: 'string',
          description: 'Nom du header à utiliser pour envoyer le token',
        },
        cookieName: {
          type: 'string',
          description: 'Nom du cookie contenant le token',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur lors de la génération du token',
  })
  getToken(@Req() req: Request, @Res() res: Response) {
    try {
      const tokens = this.csrfService.generateTokens(req)
      const config = this.csrfService.getConfiguration()

      // Configurer les cookies
      this.csrfService.setCsrfCookies(req, res)

      this.logger.debug('🔐 Token CSRF généré via endpoint')

      return res.json({
        token: tokens.token,
        headerName: config.headerName,
        cookieName: config.cookieName,
      })
    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération du token CSRF:', error)
      return res.status(500).json({
        message: 'Erreur lors de la génération du token CSRF',
        error: 'CSRF_TOKEN_GENERATION_ERROR',
      })
    }
  }

  @Get('config')
  @SkipCsrf()
  @ApiOperation({
    summary: 'Obtenir la configuration CSRF',
    description: 'Retourne la configuration actuelle de la protection CSRF',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration CSRF',
    schema: {
      type: 'object',
      properties: {
        cookieName: {
          type: 'string',
          description: 'Nom du cookie CSRF',
        },
        headerName: {
          type: 'string',
          description: 'Nom du header CSRF',
        },
        valueName: {
          type: 'string',
          description: 'Nom du champ de formulaire CSRF',
        },
        isProduction: {
          type: 'boolean',
          description: 'Mode production activé',
        },
      },
    },
  })
  getConfig(@Res() res: Response) {
    try {
      const config = this.csrfService.getConfiguration()

      this.logger.debug('📋 Configuration CSRF demandée')

      return res.json({
        cookieName: config.cookieName,
        headerName: config.headerName,
        valueName: config.valueName,
        isProduction: config.isProduction,
      })
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération de la configuration CSRF:', error)
      return res.status(500).json({
        message: 'Erreur lors de la récupération de la configuration',
        error: 'CSRF_CONFIG_ERROR',
      })
    }
  }
}
