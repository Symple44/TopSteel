import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class TokenVersionMiddleware implements NestMiddleware {
  private static serverStartTime: string = new Date().toISOString()
  
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Ajouter le timestamp de démarrage du serveur dans les headers de réponse
    res.setHeader('X-Server-Start-Time', TokenVersionMiddleware.serverStartTime)
    
    // Si c'est une requête authentifiée, vérifier la version du token
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Ici vous pouvez ajouter une logique pour vérifier si le token
      // a été émis avant le démarrage du serveur
      // Pour l'instant, on passe simplement au middleware suivant
    }
    
    next()
  }

  /**
   * Méthode statique pour obtenir l'heure de démarrage du serveur
   */
  static getServerStartTime(): string {
    return TokenVersionMiddleware.serverStartTime
  }

  /**
   * Méthode pour réinitialiser l'heure de démarrage (utile pour les tests)
   */
  static resetServerStartTime(): void {
    TokenVersionMiddleware.serverStartTime = new Date().toISOString()
  }
}