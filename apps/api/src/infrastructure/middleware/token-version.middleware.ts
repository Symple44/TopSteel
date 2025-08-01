import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { JwtService } from '@nestjs/jwt'

interface JwtPayload {
  sub: string
  iat: number
  exp: number
  [key: string]: any
}

@Injectable()
export class TokenVersionMiddleware implements NestMiddleware {
  private static serverStartTime: string = new Date().toISOString()
  private static serverStartTimestamp: number = Date.now()
  private readonly logger = new Logger(TokenVersionMiddleware.name)

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Ajouter le timestamp de démarrage du serveur dans les headers de réponse
    res.setHeader('X-Server-Start-Time', TokenVersionMiddleware.serverStartTime)

    // Si c'est une requête authentifiée, vérifier la version du token
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      try {
        // Vérifier si le token a été émis avant le démarrage du serveur
        if (this.isTokenObsolete(token)) {
          this.logger.warn('Token obsolète détecté', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('User-Agent'),
            tokenAge: this.getTokenAge(token),
          })

          // Ajouter un header pour indiquer que le token est obsolète
          res.setHeader('X-Token-Status', 'obsolete')
          
          // Selon votre politique, vous pouvez soit rejeter soit permettre avec avertissement
          // Pour l'instant, on rejette les tokens obsolètes
          throw new UnauthorizedException('Token obsolète. Veuillez vous reconnecter.')
        }

        // Token valide, ajouter des informations dans la requête
        const payload = this.jwtService.decode(token) as JwtPayload
        if (payload) {
          ;(req as any).tokenInfo = {
            issuedAt: payload.iat * 1000, // Convertir en millisecondes
            expiresAt: payload.exp * 1000,
            age: Date.now() - (payload.iat * 1000),
            isValid: true,
          }
        }

      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error
        }
        
        // Si le décodage échoue, c'est probablement un token invalide
        this.logger.warn('Erreur lors de la validation du token', {
          ip: req.ip,
          path: req.path,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
        
        res.setHeader('X-Token-Status', 'invalid')
        // Laisser passer, la validation JWT se fera plus tard dans le pipeline
      }
    }

    next()
  }

  private isTokenObsolete(token: string): boolean {
    try {
      const payload = this.jwtService.decode(token) as JwtPayload
      if (!payload || !payload.iat) {
        return false // Ne pas rejeter si on ne peut pas décoder
      }

      const tokenIssuedAt = payload.iat * 1000 // Convertir en millisecondes
      return tokenIssuedAt < TokenVersionMiddleware.serverStartTimestamp
    } catch (error) {
      // Si on ne peut pas décoder, laisser passer - la validation JWT se fera ailleurs
      return false
    }
  }

  private getTokenAge(token: string): number {
    try {
      const payload = this.jwtService.decode(token) as JwtPayload
      if (!payload || !payload.iat) {
        return 0
      }
      return Date.now() - (payload.iat * 1000)
    } catch (error) {
      return 0
    }
  }

  /**
   * Méthode statique pour obtenir l'heure de démarrage du serveur
   */
  static getServerStartTime(): string {
    return TokenVersionMiddleware.serverStartTime
  }

  /**
   * Méthode statique pour obtenir le timestamp de démarrage du serveur
   */
  static getServerStartTimestamp(): number {
    return TokenVersionMiddleware.serverStartTimestamp
  }

  /**
   * Méthode pour réinitialiser l'heure de démarrage (utile pour les tests ou redémarrages)
   */
  static resetServerStartTime(): void {
    TokenVersionMiddleware.serverStartTime = new Date().toISOString()
    TokenVersionMiddleware.serverStartTimestamp = Date.now()
  }

  /**
   * Méthode statique pour invalider tous les tokens existants
   * Utile en cas de compromission de sécurité
   */
  static invalidateAllTokens(): void {
    this.resetServerStartTime()
    Logger.log('Tous les tokens existants ont été invalidés', 'TokenVersionMiddleware')
  }
}
