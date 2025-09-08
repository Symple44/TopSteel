import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CsrfController } from './csrf.controller'
import { CsrfGuard } from './csrf.guard'
import { CsrfMiddleware } from './csrf.middleware'
import { CsrfService } from './csrf.service'

/**
 * Module CSRF - Protection contre les attaques Cross-Site Request Forgery
 *
 * Ce module fournit une protection complète contre les attaques CSRF en utilisant
 * le pattern "Double Submit Cookie" avec le package csrf-csrf.
 *
 * Fonctionnalités:
 * - Génération et validation de tokens CSRF
 * - Middleware pour protection automatique des routes sensibles
 * - Guard personnalisable avec décorateurs @SkipCsrf et @RequireCsrf
 * - Controller pour obtenir les tokens côté frontend
 * - Configuration sécurisée pour production et développement
 *
 * Routes protégées par défaut: POST, PUT, PATCH, DELETE
 * Routes exclues: /api/auth/login, /api/auth/refresh, /api/webhooks, etc.
 */
@Module({
  imports: [ConfigModule],
  controllers: [CsrfController],
  providers: [CsrfService, CsrfMiddleware, CsrfGuard],
  exports: [CsrfService, CsrfMiddleware, CsrfGuard],
})
export class CsrfModule {}
