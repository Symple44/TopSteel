# Plan de Migration - Architecture Microservices TopSteel + TopTime

**Date**: 2025-11-19
**Version**: 2.0 (Révisé)
**Objectif**: Architecture microservices avec TopSteel (socle infra) + TopTime (business logic)

---

## 📊 Situation Actuelle RÉELLE

### TopSteel - État Réel

```typescript
// package.json
{
  "@nestjs/typeorm": "^11.0.0",    // ⚠️ TypeORM encore présent
  "typeorm": "^0.3.25",             // ⚠️ TypeORM actif
  "@prisma/client": "^6.19.0",     // ✅ Prisma installé
  "prisma": "^6.19.0"               // ✅ Prisma configuré
}
```

**Status**: **HYBRIDE TypeORM + Prisma**
- ✅ Phase 10 : Auth domain migré vers Prisma
- ✅ Endpoint `/auth/validate-token` créé (Prisma)
- ⚠️ Autres domains encore en TypeORM
- ⚠️ Migration Prisma partielle

### TopTime - État Réel

**Status**: **Prisma principal** (confirmé par utilisateur)
- ✅ 94 modèles Prisma définis
- ⚠️ Modèles en snake_case (à standardiser en PascalCase avec @@map)
- ✅ Infrastructure backend Express + TypeScript
- ⚠️ Auth locale (à migrer vers TopSteel)

---

## 🎯 Architecture Cible - Microservices

```
┌─────────────────────────────────────────────────────────────┐
│                  TopSteel API (NestJS)                       │
│               SOCLE INFRASTRUCTURE                            │
│                                                               │
│  ✅ Auth centralisée (Users, Roles, Sessions, Permissions)  │
│  📋 Prisma uniquement (retirer TypeORM)                     │
│  ✅ Multi-tenant (Sociétés)                                  │
│  ✅ Marketplace modules                                      │
│  📋 Tests complets (actuellement 17 tests auth)             │
│                                                               │
│  Endpoints exposés:                                          │
│  - POST /auth/login                                          │
│  - POST /auth/validate-token ✅                              │
│  - POST /auth/refresh                                        │
│  - POST /auth/logout                                         │
│  - GET  /users/:id                                           │
│  - GET  /roles                                               │
│  - GET  /permissions                                         │
└──────────────────────┬────────────────────────────────────────┘
                       │
                       │ JWT Token Validation
                       │ HTTP REST
                       │
┌──────────────────────▼────────────────────────────────────────┐
│                  TopTime API (Express)                        │
│              BUSINESS LOGIC - Gestion complète                │
│                                                               │
│  ✅ Prisma (94 modèles)                                       │
│  📋 Modèles standardisés PascalCase                          │
│  📋 Auth déléguée à TopSteel                                  │
│  📋 Tests unitaires + intégration                            │
│                                                               │
│  Domaines métier:                                            │
│  - Pointage d'atelier                                        │
│  - Opérations de production                                  │
│  - Ordres de fabrication                                     │
│  - Gestion des rebuts                                        │
│  - Analytics et reporting                                    │
│  - Planning et ressources                                    │
│                                                               │
│  Application Android:                                        │
│  - Scan QR codes (opérations, OF)                           │
│  - Pointage temps réel                                       │
│  - Déclaration production                                    │
│  - Offline mode                                              │
└───────────────────────────────────────────────────────────────┘
```

**Principe architectural**:
- **TopSteel** = Infrastructure transverse (auth, users, permissions) - réutilisable pour TopProject, TopCRM, etc.
- **TopTime** = Application métier spécialisée (gestion atelier)
- **Séparation claire** des responsabilités
- **Communication** via API REST (HTTP/JSON)

---

## 🚀 Plan de Migration Révisé

### Phase 1 - TopSteel : Compléter Migration Prisma (Priorité HAUTE)

**Durée estimée**: 5 jours

**Objectif**: Retirer TypeORM complètement de TopSteel, finaliser migration Prisma

#### Étape 1.1: Audit de l'existant (1 jour)

**Actions**:

1. **Identifier tous les domaines encore en TypeORM**
   ```bash
   cd C:\GitHub\TopSteel\apps\api

   # Trouver toutes les entités TypeORM
   find src -name "*.entity.ts" -type f

   # Identifier les imports TypeORM
   grep -r "from 'typeorm'" src/ --include="*.ts"
   grep -r "@Entity" src/ --include="*.ts"
   grep -r "Repository<" src/ --include="*.ts"
   ```

2. **Lister les domaines à migrer**

   Domaines suspectés encore en TypeORM (à vérifier):
   - Users domain (si pas migré en Phase 10)
   - Sociétés domain
   - Marketplace modules
   - System settings
   - Autres domaines métier

3. **Créer matrice de migration**

   | Domain | Entités TypeORM | Services Prisma | Status | Priorité |
   |--------|----------------|-----------------|--------|----------|
   | Auth | 0 | ✅ Complet | ✅ Migré | — |
   | Users | ? | ? | ❓ À vérifier | HAUTE |
   | Roles | 0 | ✅ Complet | ✅ Migré | — |
   | Sessions | 0 | ✅ Complet | ✅ Migré | — |
   | Sociétés | ? | ? | ❓ À vérifier | HAUTE |
   | Marketplace | ? | ? | ❓ À vérifier | MOYENNE |
   | Settings | ? | ? | ❓ À vérifier | BASSE |

**Livrable**: `docs/AUDIT_TYPEORM_REMAINING.md` avec liste complète

#### Étape 1.2: Migration domaines critiques (3 jours)

**Approche**: Migration par domaine (1 domaine à la fois)

**Template de migration par domaine**:

```bash
# Exemple: Migration du domaine Users

# 1. Créer service Prisma pour Users
# Fichier: src/domains/users/prisma/user-prisma.service.ts
```

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserPrismaService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        userSocieteRoles: {
          include: {
            role: true,
            societe: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
      include: {
        userRoles: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }
}
```

```bash
# 2. Mettre à jour le controller pour utiliser Prisma
# Fichier: src/domains/users/users.controller.ts
```

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UserPrismaService } from './prisma/user-prisma.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userPrismaService: UserPrismaService, // ✅ Prisma
    // private readonly userRepository: Repository<User>,  // ❌ TypeORM - retirer
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userPrismaService.findById(id);
  }

  @Get()
  async findAll(@Query() query: UserQueryDto) {
    return this.userPrismaService.findMany({
      skip: query.skip,
      take: query.take,
      where: {
        isActive: query.isActive,
        email: query.email ? { contains: query.email } : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ... autres endpoints
}
```

```bash
# 3. Mettre à jour le module
# Fichier: src/domains/users/users.module.ts
```

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserPrismaService } from './prisma/user-prisma.service';
import { PrismaModule } from '@/core/database/prisma.module';

@Module({
  imports: [
    PrismaModule, // ✅ Prisma
    // TypeOrmModule.forFeature([User]), // ❌ TypeORM - retirer
  ],
  controllers: [UsersController],
  providers: [UserPrismaService],
  exports: [UserPrismaService],
})
export class UsersModule {}
```

```bash
# 4. Tests unitaires du service Prisma
# Fichier: src/domains/users/prisma/user-prisma.service.spec.ts
```

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserPrismaService } from './user-prisma.service';
import { PrismaService } from '@/core/database/prisma.service';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

describe('UserPrismaService', () => {
  let service: UserPrismaService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPrismaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UserPrismaService>(UserPrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        username: 'testuser',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findById('test-id');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: expect.any(Object),
      });
    });
  });

  // ... autres tests
});
```

```bash
# 5. Tester la migration
npm run build
npm test -- user-prisma.service.spec.ts
npm run dev

# 6. Supprimer entité TypeORM
rm src/domains/users/entities/user.entity.ts  # ❌ TypeORM

# 7. Commit
git add .
git commit -m "refactor(users): Migrate from TypeORM to Prisma"
```

**Ordre de migration recommandé**:

1. ✅ **Auth** (déjà fait - Phase 10)
2. 🔴 **Users** (priorité HAUTE - dépend de Auth)
3. 🔴 **Sociétés** (priorité HAUTE - multi-tenant)
4. 🟡 **Marketplace** (priorité MOYENNE)
5. 🟢 **Settings** (priorité BASSE)

#### Étape 1.3: Retrait complet de TypeORM (1 jour)

**Actions**:

```bash
cd C:\GitHub\TopSteel\apps\api

# 1. Vérifier qu'aucune entité TypeORM ne reste
find src -name "*.entity.ts" -type f
# Doit retourner: aucun fichier

# 2. Vérifier qu'aucun import TypeORM ne reste
grep -r "from 'typeorm'" src/ --include="*.ts"
grep -r "from '@nestjs/typeorm'" src/ --include="*.ts"
# Doit retourner: aucun import

# 3. Retirer dépendances TypeORM du package.json
npm uninstall typeorm @nestjs/typeorm

# 4. Supprimer fichiers de configuration TypeORM
rm -f src/core/database/data-source*.ts
rm -f ormconfig.json

# 5. Rebuild complet
npm run build

# 6. Tests complets
npm test

# 7. Commit final
git add .
git commit -m "refactor: Remove TypeORM completely - Prisma migration complete"
```

**Checklist de validation**:
- [ ] 0 fichiers `*.entity.ts`
- [ ] 0 imports TypeORM
- [ ] TypeORM retiré de `package.json`
- [ ] 0 erreurs TypeScript
- [ ] 100% tests passent
- [ ] API démarre sans erreur

---

### Phase 2 - TopTime : Standardisation Prisma (Priorité MOYENNE)

**Durée estimée**: 2 jours

**Objectif**: Standardiser les 94 modèles Prisma en PascalCase avec @@map()

**Note**: TopTime est déjà sur Prisma, mais les modèles sont en snake_case (non standard)

#### Étape 2.1: Conversion schéma Prisma (3h)

**Utiliser les scripts existants de TopTime**:

```bash
cd C:\GitHub\TopTime\backend

# 1. Analyser le schéma actuel
npm run migrate:generate-mapping

# 2. Convertir automatiquement
npm run migrate:convert-schema

# 3. Valider
npx prisma validate
npx prisma generate
```

**Exemple de conversion**:

```prisma
// AVANT
model appels_offres {
  id String @id @default(uuid())
  numero_ao String
  date_creation DateTime @default(now())
  familles_article familles_article[]
}

// APRÈS
model AppelsOffres {
  id String @id @default(uuid())
  numeroAo String @map("numero_ao")
  dateCreation DateTime @default(now()) @map("date_creation")
  famillesArticle FamillesArticle[]

  @@map("appels_offres")
}
```

#### Étape 2.2: Conversion code TypeScript (4h)

```bash
# Scanner l'utilisation de Prisma
npm run migrate:scan-usage

# Convertir automatiquement le code
npm run migrate:convert-code

# Revue manuelle des fichiers critiques
git diff src/services/
git diff src/controllers/
```

**Validation**:
```bash
npm run build     # 0 erreurs TypeScript
npm test         # 100% tests passent
npm run dev      # API démarre
```

---

### Phase 3 - Intégration Microservices TopSteel ↔ TopTime (Priorité HAUTE)

**Durée estimée**: 3 jours

**Objectif**: TopTime délègue auth à TopSteel

#### Étape 3.1: Configuration environnement (30 min)

**TopTime**: `backend/.env`

```env
# TopSteel API (Socle Infrastructure)
TOPSTEEL_API_URL=https://api.topsteel.tech
# ou en dev: http://localhost:4000

# Endpoints TopSteel
TOPSTEEL_AUTH_VALIDATE_ENDPOINT=/api/auth/validate-token
TOPSTEEL_AUTH_LOGIN_ENDPOINT=/api/auth/login
TOPSTEEL_AUTH_REFRESH_ENDPOINT=/api/auth/refresh
TOPSTEEL_AUTH_LOGOUT_ENDPOINT=/api/auth/logout

# JWT (DOIT être identique à TopSteel!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Cache Redis (optionnel)
REDIS_URL=redis://localhost:6379
TOKEN_CACHE_ENABLED=true
TOKEN_CACHE_TTL=300  # 5 minutes
```

⚠️ **CRITIQUE**: `JWT_SECRET` doit être **IDENTIQUE** entre TopSteel et TopTime!

#### Étape 3.2: Service d'authentification TopSteel (2h)

**Fichier**: `backend/src/services/topsteel-auth.service.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
  };
  permissions?: {
    roles: string[];
    societes: Array<{
      societeId: string;
      roles: string[];
    }>;
  };
  session?: {
    sessionId: string;
    isActive: boolean;
    lastActivity: Date;
  };
  error?: string;
}

interface LoginResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}

export class TopSteelAuthService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.TOPSTEEL_API_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Valider un token JWT via TopSteel
   */
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const response = await this.client.post<ValidateTokenResponse>(
        process.env.TOPSTEEL_AUTH_VALIDATE_ENDPOINT || '/api/auth/validate-token',
        { token }
      );

      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      return {
        valid: false,
        error: 'Token validation failed',
      };
    }
  }

  /**
   * Login via TopSteel
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>(
      process.env.TOPSTEEL_AUTH_LOGIN_ENDPOINT || '/api/auth/login',
      { email, password }
    );

    return response.data;
  }

  /**
   * Refresh token via TopSteel
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await this.client.post(
      process.env.TOPSTEEL_AUTH_REFRESH_ENDPOINT || '/api/auth/refresh',
      { refreshToken }
    );

    return response.data;
  }

  /**
   * Logout via TopSteel
   */
  async logout(sessionId: string): Promise<void> {
    await this.client.post(
      process.env.TOPSTEEL_AUTH_LOGOUT_ENDPOINT || '/api/auth/logout',
      { sessionId }
    );
  }
}

export const topSteelAuthService = new TopSteelAuthService();
```

#### Étape 3.3: Middleware d'authentification (2h)

**Fichier**: `backend/src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { topSteelAuthService } from '../services/topsteel-auth.service';

// Étendre types Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        firstName?: string;
        lastName?: string;
        isActive: boolean;
      };
      permissions?: {
        roles: string[];
        societes: Array<{
          societeId: string;
          roles: string[];
        }>;
      };
      session?: {
        sessionId: string;
        isActive: boolean;
        lastActivity: Date;
      };
    }
  }
}

/**
 * Middleware d'authentification via TopSteel
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Extraire token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // 2. Valider via TopSteel
    const validation = await topSteelAuthService.validateToken(token);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        message: validation.error || 'Invalid token',
      });
    }

    // 3. Attacher données à la requête
    req.user = validation.user;
    req.permissions = validation.permissions;
    req.session = validation.session;

    // 4. Continuer
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Authentication service unavailable',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
}

/**
 * Middleware de vérification de rôle
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.permissions?.roles) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    const hasRole = roles.some(role =>
      req.permissions!.roles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Requires one of these roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
}
```

#### Étape 3.4: Mise à jour des routes (2h)

**Fichier**: `backend/src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import { topSteelAuthService } from '../services/topsteel-auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Login via TopSteel (délégation)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Déléguer à TopSteel
    const result = await topSteelAuthService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.response?.data?.message || 'Authentication failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Récupérer utilisateur actuel (protégé)
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      permissions: req.permissions,
      session: req.session,
    },
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.session?.sessionId;

    if (sessionId) {
      await topSteelAuthService.logout(sessionId);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

export default router;
```

**Protéger toutes les autres routes**:

```typescript
// backend/src/routes/pointages.routes.ts
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes protégées
router.use(authMiddleware);

// Route accessible à tous les users authentifiés
router.get('/', async (req, res) => {
  const userId = req.user.id; // ✅ Utilisateur authentifié
  // ... récupérer pointages de l'utilisateur
});

// Route nécessitant rôle admin
router.delete('/:id', requireRole('admin', 'manager'), async (req, res) => {
  // Supprimer pointage (admin only)
});

export default router;
```

#### Étape 3.5: Tests d'intégration (2h)

**Fichier**: `backend/src/tests/integration/auth.integration.test.ts`

```typescript
import request from 'supertest';
import app from '../../app';

describe('TopSteel Auth Integration', () => {
  let accessToken: string;

  describe('POST /api/auth/login', () => {
    it('should login via TopSteel', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@toptime.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();

      accessToken = response.body.data.accessToken;
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.permissions).toBeDefined();
    });

    it('should reject without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Protected endpoints', () => {
    it('should access pointages with valid token', async () => {
      const response = await request(app)
        .get('/api/pointages')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject pointages without token', async () => {
      const response = await request(app).get('/api/pointages');

      expect(response.status).toBe(401);
    });
  });
});
```

---

### Phase 4 - Fiabilisation & Tests (Priorité HAUTE)

**Durée estimée**: 4 jours

#### Étape 4.1: Tests TopSteel (2 jours)

**Objectif**: Augmenter couverture tests (actuellement 17 tests auth)

**Actions**:

1. **Tests des domaines migrés vers Prisma**

   Pour chaque domaine migré (Users, Sociétés, etc.):

   ```typescript
   // src/domains/users/prisma/user-prisma.service.spec.ts
   describe('UserPrismaService', () => {
     // Tests CRUD complets
     // Tests relations (userRoles, userSocieteRoles)
     // Tests edge cases (user not found, email duplicate, etc.)
   });
   ```

2. **Tests d'intégration auth**

   ```bash
   # Tester flow complet
   npm run test -- auth.integration.spec.ts
   ```

**Objectif**: 80%+ couverture pour domaines critiques

#### Étape 4.2: Tests TopTime (2 jours)

**Objectif**: Fiabiliser l'application de gestion

**Actions**:

1. **Tests unitaires services**

   ```typescript
   // src/services/pointage.service.test.ts
   describe('PointageService', () => {
     it('should start pointage', async () => {
       // Test démarrage pointage
     });

     it('should stop pointage', async () => {
       // Test arrêt pointage
     });

     it('should not allow duplicate active pointage', async () => {
       // Test contraintes métier
     });
   });
   ```

2. **Tests intégration avec TopSteel auth**

   ```typescript
   // src/tests/integration/pointage-with-auth.test.ts
   describe('Pointage with TopSteel Auth', () => {
     it('should allow authenticated user to start pointage', async () => {
       // Login via TopSteel → Start pointage
     });

     it('should reject unauthenticated user', async () => {
       // No token → 401
     });
   });
   ```

**Objectif**: 70%+ couverture services métier

---

## 📊 Planning Détaillé

| Phase | Tâche | Durée | Dev | Validation |
|-------|-------|-------|-----|------------|
| **1.1** | Audit TypeORM TopSteel | 1j | Backend | Rapport audit |
| **1.2** | Migration domaines Prisma | 3j | Backend | Tests passent |
| **1.3** | Retrait TypeORM complet | 1j | Backend | 0 imports TypeORM |
| **2.1** | Conversion schéma TopTime | 0.5j | Backend | Prisma validate |
| **2.2** | Conversion code TopTime | 0.5j | Backend | Build OK |
| **3.1** | Config environnement | 0.25j | Backend | .env configuré |
| **3.2** | Service auth TopSteel | 0.5j | Backend | Service créé |
| **3.3** | Middleware auth | 0.5j | Backend | Middleware OK |
| **3.4** | Routes protégées | 0.5j | Backend | Routes OK |
| **3.5** | Tests intégration auth | 0.5j | Backend | Tests passent |
| **4.1** | Tests TopSteel | 2j | Backend | 80%+ couverture |
| **4.2** | Tests TopTime | 2j | Backend | 70%+ couverture |
| **Total** | — | **12 jours** | 1 dev | — |

**Équipe**: 1 développeur backend (full-stack TypeScript, NestJS, Express, Prisma)

---

## ✅ Critères de Succès

### TopSteel

- [ ] 0 dépendances TypeORM dans `package.json`
- [ ] 0 fichiers `*.entity.ts`
- [ ] 0 imports TypeORM dans le code
- [ ] Tous les domaines migrés vers Prisma
- [ ] 80%+ couverture tests domaines critiques
- [ ] API démarre sans erreur
- [ ] Endpoint `/auth/validate-token` fonctionne

### TopTime

- [ ] Modèles Prisma standardisés (PascalCase avec @@map)
- [ ] Auth déléguée à TopSteel (middleware actif)
- [ ] Toutes les routes protégées
- [ ] Tests d'intégration passent
- [ ] 70%+ couverture tests services
- [ ] API démarre et répond
- [ ] Application Android se connecte

### Architecture Microservices

- [ ] TopSteel = Socle infrastructure (auth centralisée)
- [ ] TopTime = Business logic (gestion atelier)
- [ ] Communication REST fonctionnelle
- [ ] JWT_SECRET identique entre services
- [ ] Documentation API complète (Swagger)

---

## 🚨 Gestion des Risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Migration Prisma casse TopSteel** | Moyenne | Critique | Backup complet, migration par domaine, tests continus |
| **TopSteel API down → TopTime inaccessible** | Faible | Élevé | Cache Redis, retry logic, monitoring |
| **JWT_SECRET différent** | Moyenne | Bloquant | Validation automatisée, documentation claire |
| **Timeline dépassée** | Moyenne | Moyen | Buffer 20% inclus (12j → 14j) |
| **Tests échouent après migration** | Élevée | Élevé | Tests à chaque étape, rollback si nécessaire |

---

## 🎯 Prochaines Étapes Immédiates

### Semaine 1 - TopSteel Migration Prisma

```bash
# Jour 1: Audit
cd C:\GitHub\TopSteel\apps\api
find src -name "*.entity.ts" -type f > docs/audit-typeorm-entities.txt
grep -r "from 'typeorm'" src/ --include="*.ts" > docs/audit-typeorm-imports.txt

# Jours 2-4: Migration domaines
# Pour chaque domaine:
# 1. Créer service Prisma
# 2. Mettre à jour controller
# 3. Mettre à jour module
# 4. Tests
# 5. Commit

# Jour 5: Retrait TypeORM
npm uninstall typeorm @nestjs/typeorm
npm run build
npm test
```

### Semaine 2 - TopTime + Intégration

```bash
# Jours 6-7: TopTime standardisation (si nécessaire)
cd C:\GitHub\TopTime\backend
npm run migrate:convert-schema
npm run migrate:convert-code
npm test

# Jours 8-9: Intégration microservices
# Implémenter service auth TopSteel
# Créer middleware
# Protéger routes
# Tests d'intégration

# Jour 10: Tests finaux
npm test -- --coverage
```

---

## 📚 Documents à Créer

1. 📋 `AUDIT_TYPEORM_REMAINING.md` - Audit complet TypeORM TopSteel
2. 📋 `MIGRATION_PRISMA_TOPSTEEL_GUIDE.md` - Guide migration par domaine
3. 📋 `INTEGRATION_MICROSERVICES_GUIDE.md` - Guide intégration TopSteel ↔ TopTime
4. 📋 `TESTS_COVERAGE_REPORT.md` - Rapport de couverture final

---

**Créé par**: Claude
**Date**: 2025-11-19
**Version**: 2.0 (Révisé selon situation réelle)
**Statut**: ✅ Prêt pour validation et exécution
