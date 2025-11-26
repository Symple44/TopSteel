import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { AuthPrismaModule } from './auth/prisma/auth-prisma.module'
import { UsersPrismaModule } from './users/prisma/users-prisma.module'
import { SocietesPrismaModule } from './societes/prisma/societes-prisma.module'
import { NotificationsPrismaModule } from './notifications/prisma/notifications-prisma.module'
import { ParametersPrismaModule } from './parameters/prisma/parameters-prisma.module'
import { LicensingPrismaModule } from './licensing/prisma/licensing-prisma.module'
import { EmailModule } from '../core/email/email.module'

// Import new Prisma controllers (without -prisma suffix)
import { UsersController } from './users/users.controller'
import { AuthController } from './auth/auth.controller'
import { RolesController } from './auth/roles.controller'
import { SessionsController } from './auth/sessions.controller'
import { SocietesController } from './societes/societes.controller'
import { SitesController } from './societes/sites.controller'
import { SocieteLicensesController } from './societes/societe-licenses.controller'
import { SocieteUsersController } from './societes/societe-users.controller'
import { NotificationsController } from './notifications/notifications.controller'
import { ParametersController } from './parameters/parameters.controller'
import { LicensesController } from './licensing/controllers/licenses.controller'
import { LicenseFeaturesController } from './licensing/controllers/license-features.controller'
import { LicenseStatusController } from './licensing/controllers/license-status.controller'
import { LicenseActivationsController } from './licensing/controllers/license-activations.controller'
import { LicenseUsageController } from './licensing/controllers/license-usage.controller'

/**
 * ApiControllersModule - Phase 9
 *
 * Module centralisé pour les nouveaux contrôleurs Prisma (routes standards)
 *
 * Ce module importe:
 * - AuthModule: Pour accès aux guards (CombinedSecurityGuard, etc.)
 * - Tous les modules de services Prisma: Pour accès aux services
 *
 * Et déclare tous les nouveaux contrôleurs avec routes standards:
 * - /users (UsersController)
 * - /auth (AuthController)
 * - /roles (RolesController)
 * - /sessions (SessionsController)
 * - /societes (SocietesController)
 * - /sites (SitesController)
 * - /societe-licenses (SocieteLicensesController)
 * - /societe-users (SocieteUsersController)
 * - /notifications (NotificationsController)
 * - /parameters (ParametersController)
 * - /api/licensing/licenses (LicensesController)
 * - /api/licensing/licenses/:id/features (LicenseFeaturesController)
 * - /api/licensing/licenses/:id/... (LicenseStatusController)
 * - /api/licensing/licenses/:id/activations (LicenseActivationsController)
 * - /api/licensing/licenses/:id/usage (LicenseUsageController)
 *
 * Note: Ce module évite les dépendances circulaires car il n'est pas importé par AuthModule
 */
@Module({
  imports: [
    AuthModule, // Provides guards: CombinedSecurityGuard, EnhancedTenantGuard, etc.
    AuthPrismaModule, // Provides AuthPrismaService, RolePrismaService, SessionPrismaService
    UsersPrismaModule, // Provides UserPrismaService
    SocietesPrismaModule, // Provides Societe services
    NotificationsPrismaModule, // Provides Notification services
    ParametersPrismaModule, // Provides Parameter services
    LicensingPrismaModule, // Provides LicensePrismaService
    EmailModule, // Provides EmailService for AuthController
  ],
  controllers: [
    // Core Auth & Users
    AuthController, // /auth/* - Authentication endpoints
    UsersController, // /users/* - User management
    RolesController, // /roles/* - Role management
    SessionsController, // /sessions/* - Session management

    // Societes (Multi-tenant)
    SocietesController, // /societes/* - Company management
    SitesController, // /sites/* - Site management
    SocieteLicensesController, // /societe-licenses/* - License management
    SocieteUsersController, // /societe-users/* - Company user associations

    // Features
    NotificationsController, // /notifications/* - Notification management
    ParametersController, // /parameters/* - Parameter management

    // Licensing (Prisma)
    LicensesController, // /api/licensing/licenses/* - License CRUD
    LicenseFeaturesController, // /api/licensing/licenses/:id/features/* - Features management
    LicenseStatusController, // /api/licensing/licenses/:id/activate|suspend|revoke|renew
    LicenseActivationsController, // /api/licensing/licenses/:id/activations/* - Activations tracking
    LicenseUsageController, // /api/licensing/licenses/:id/usage/* - Usage analytics
  ],
})
export class ApiControllersModule {}
