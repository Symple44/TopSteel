# Plan de Migration Complet - Intégration TopTime + TopSteel

**Date**: 2025-11-19
**Version**: 1.0
**Objectif**: Migrer TopTime vers Prisma et intégrer l'infrastructure d'authentification TopSteel

---

## 📊 Vue d'Ensemble

### Architecture Cible

```
┌─────────────────────────────────────────────────────────────┐
│                     TopSteel API (NestJS)                    │
│          Infrastructure centralisée d'authentification        │
│                                                               │
│  ✅ Auth, Users, Roles, Sessions, Permissions                │
│  ✅ Prisma ORM                                                │
│  ✅ Tests unitaires (17 tests - 100% pass)                   │
│  ✅ Endpoint /auth/validate-token (production-ready)         │
└──────────────────────┬────────────────────────────────────────┘
                       │
                       │ JWT Token Validation
                       │ HTTP POST
                       │
┌──────────────────────▼────────────────────────────────────────┐
│                   TopTime API (Express)                       │
│              Application de pointage d'atelier                │
│                                                               │
│  📋 Migration TypeORM → Prisma (94 modèles)                  │
│  📋 Intégration auth TopSteel                                 │
│  📋 Fiabilisation socle back + front (Android)               │
└───────────────────────────────────────────────────────────────┘
```

### État Actuel

| Projet | ORM | Auth | Tests | Status |
|--------|-----|------|-------|--------|
| **TopSteel** | ✅ Prisma | ✅ Centralisé | ✅ 17 tests | ✅ Phase 10 complétée |
| **TopTime** | ⚠️ TypeORM + Prisma | ⚠️ Local JWT | ⏳ À faire | 📋 Migration planifiée |

---

## 🎯 Objectifs de Migration

### Phase A - TopTime Backend (Priorité HAUTE)

1. **Migration ORM complète**
   - Retirer TypeORM complètement
   - Migrer tous les services vers Prisma
   - Convertir modèles snake_case → PascalCase avec @@map()
   - 94 modèles Prisma à standardiser

2. **Intégration authentification TopSteel**
   - Implémenter middleware de validation de token
   - Appeler endpoint TopSteel `/auth/validate-token`
   - Gérer les permissions et rôles
   - Implémenter refresh token automatique

3. **Fiabilisation du socle backend**
   - Tests unitaires des services critiques
   - Tests d'intégration avec TopSteel
   - Validation des endpoints API
   - Documentation OpenAPI/Swagger

### Phase B - TopTime Android (Priorité MOYENNE)

4. **Adaptation authentification**
   - Rediriger login vers TopSteel
   - Stocker tokens de manière sécurisée
   - Gérer refresh automatique
   - Gérer déconnexion et révocation

5. **Fiabilisation application Android**
   - Tests unitaires ViewModels
   - Tests d'intégration API
   - Validation workflow pointage
   - Tests offline mode

---

## 📅 Plan Détaillé - Phase A : Backend TopTime

### Phase A.1 - Migration Prisma (Durée: 2-3 jours)

#### Étape 1.1: Préparation (2h)

**Objectif**: Sécuriser le projet avant migration

```bash
# 1. Créer branche de backup
cd C:\GitHub\TopTime
git checkout -b backup-before-prisma-migration
git add .
git commit -m "Backup: État avant migration Prisma complète"
git push -u origin backup-before-prisma-migration

# 2. Créer branche de travail
git checkout main
git checkout -b feature/prisma-complete-migration

# 3. Backup base de données
cd backend
npm run db:backup

# 4. Backup fichiers critiques
cp prisma/schema.prisma prisma/schema.prisma.backup
cp .env .env.backup
```

**Checklist**:
- [ ] Tous les commits poussés sur Git
- [ ] Backup base de données créé
- [ ] Environnement de dev fonctionnel
- [ ] Tests passent avant migration
- [ ] Documentation lue et comprise

#### Étape 1.2: Conversion schéma Prisma (3h)

**Objectif**: Standardiser les 94 modèles Prisma en PascalCase

**Actions**:

1. **Analyser le schéma actuel**
   ```bash
   npm run migrate:generate-mapping
   ```
   - Génère mapping complet des 94 modèles
   - Identifie relations self-referential
   - Liste les zones à risque

2. **Convertir le schéma**
   ```bash
   npm run migrate:convert-schema
   ```
   - Convertit model names: `appels_offres` → `AppelsOffres`
   - Ajoute `@@map("appels_offres")` pour chaque modèle
   - Convertit relation fields: `familles_article` → `famillesArticle`

3. **Valider le nouveau schéma**
   ```bash
   npx prisma validate
   npx prisma generate
   ```

**Exemple de conversion**:

```prisma
// AVANT
model appels_offres {
  id String @id @default(uuid())
  numero_ao String
  familles_article familles_article[]
}

// APRÈS
model AppelsOffres {
  id String @id @default(uuid())
  numeroAo String @map("numero_ao")
  famillesArticle FamillesArticle[]

  @@map("appels_offres")
}
```

**Risques identifiés**:
- ⚠️ Relations self-referential (familles_article parent/enfant)
- ⚠️ Accès dynamique aux modèles: `prisma[modelName]`
- ⚠️ Middleware Prisma vérifiant noms de modèles

#### Étape 1.3: Migration du code TypeScript (6h)

**Objectif**: Convertir tous les fichiers utilisant Prisma

**Actions**:

1. **Scanner l'utilisation de Prisma**
   ```bash
   npm run migrate:scan-usage
   ```
   - Identifie ~352 fichiers TypeScript
   - Génère rapport d'usage par fichier
   - Crée liste de revue manuelle

2. **Conversion automatisée**
   ```bash
   npm run migrate:convert-code
   ```
   Convertit automatiquement:
   - `prisma.appels_offres` → `prisma.appelsOffres`
   - `import { appels_offres }` → `import { AppelsOffres }`
   - `appels_offres[]` → `AppelsOffres[]`

3. **Revue manuelle obligatoire**

   Fichiers critiques à vérifier:
   - `src/controllers/*.ts` - Tous les contrôleurs
   - `src/services/*.ts` - Tous les services
   - `src/middleware/*.ts` - Middleware Prisma
   - `src/routes/*.ts` - Validation des routes

**Zones nécessitant revue manuelle**:

```typescript
// ❌ AVANT - Accès dynamique (ne fonctionne pas)
const model = 'appels_offres';
const data = await prisma[model].findMany();

// ✅ APRÈS - Map statique
const modelMap = {
  'appels_offres': prisma.appelsOffres,
  'articles': prisma.articles,
};
const data = await modelMap[model].findMany();

// ❌ AVANT - Check nom modèle dans middleware
if (params.model === 'articles') { }

// ✅ APRÈS - PascalCase
if (params.model === 'Articles') { }
```

4. **Retrait de TypeORM**

```bash
# 1. Identifier tous les imports TypeORM
grep -r "from 'typeorm'" src/

# 2. Supprimer les entités TypeORM
rm -rf src/entities/

# 3. Retirer dépendances
npm uninstall typeorm @types/typeorm

# 4. Supprimer configuration TypeORM
rm -f ormconfig.json
rm -f src/config/typeorm.ts
```

**Fichiers à migrer de TypeORM vers Prisma**:

Priorité HAUTE (services critiques):
- [ ] `src/services/pointage.service.ts`
- [ ] `src/services/operations.service.ts`
- [ ] `src/services/ordre-fabrication.service.ts`
- [ ] `src/services/rebuts.service.ts`
- [ ] `src/services/users.service.ts`

Priorité MOYENNE:
- [ ] `src/services/analytics.service.ts`
- [ ] `src/services/reports.service.ts`
- [ ] Autres services non critiques

#### Étape 1.4: Validation et tests (4h)

**Objectif**: Garantir zéro régression

**Actions**:

1. **Compilation TypeScript**
   ```bash
   npm run build
   npx tsc --noEmit
   ```
   Objectif: **0 erreurs TypeScript**

2. **Tests unitaires**
   ```bash
   npm test
   ```
   Objectif: **100% des tests passent**

3. **Tests d'intégration**

   Endpoints critiques à tester manuellement:

   ```bash
   # Auth
   POST /api/auth/login

   # Pointage
   POST /api/pointages
   GET /api/pointages/actif
   PUT /api/pointages/:id/stop

   # Opérations
   GET /api/operations
   GET /api/operations/:code

   # Ordres de fabrication
   GET /api/ordres-fabrication
   GET /api/ordres-fabrication/:numero

   # Analytics
   GET /api/dashboard
   GET /api/analytics/production
   ```

4. **Validation base de données**
   ```bash
   # Vérifier qu'aucune table n'a été modifiée
   npx prisma migrate diff \
     --from-schema-datasource prisma/schema.prisma \
     --to-schema-datamodel prisma/schema.prisma
   ```
   Objectif: **Aucun changement détecté**

**Checklist de validation**:
- [ ] 0 erreurs TypeScript
- [ ] 100% tests unitaires passent
- [ ] Endpoints critiques testés et fonctionnels
- [ ] Aucune modification de schéma DB
- [ ] Réponses API identiques (format JSON)
- [ ] Relations self-referential fonctionnent
- [ ] Middleware Prisma fonctionnel

---

### Phase A.2 - Intégration Auth TopSteel (Durée: 2 jours)

#### Étape 2.1: Configuration environnement (1h)

**Objectif**: Configurer connexion avec TopSteel API

**Fichier**: `backend/.env`

```env
# TopSteel API Configuration
TOPSTEEL_API_URL=https://api.topsteel.tech
TOPSTEEL_API_VALIDATE_TOKEN_ENDPOINT=/api/auth/validate-token
TOPSTEEL_API_LOGIN_ENDPOINT=/api/auth/login
TOPSTEEL_API_REFRESH_ENDPOINT=/api/auth/refresh
TOPSTEEL_API_LOGOUT_ENDPOINT=/api/auth/logout

# JWT Configuration (MUST match TopSteel)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Cache Configuration
TOKEN_VALIDATION_CACHE_TTL=300  # 5 minutes
TOKEN_VALIDATION_CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379

# Request Configuration
TOPSTEEL_API_TIMEOUT=5000  # 5 seconds
TOPSTEEL_API_RETRY_ATTEMPTS=2
```

**⚠️ CRITIQUE**: Le `JWT_SECRET` **DOIT être identique** entre TopSteel et TopTime!

#### Étape 2.2: Middleware d'authentification (4h)

**Fichier**: `backend/src/middleware/auth-topsteel.middleware.ts`

```typescript
import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

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

/**
 * Middleware d'authentification TopTime via TopSteel API
 * Valide le JWT en appelant TopSteel /auth/validate-token
 */
export async function authTopSteelMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Extraire le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // 2. Valider le token via TopSteel API
    const response = await axios.post<ValidateTokenResponse>(
      `${process.env.TOPSTEEL_API_URL}${process.env.TOPSTEEL_API_VALIDATE_TOKEN_ENDPOINT}`,
      { token },
      {
        timeout: parseInt(process.env.TOPSTEEL_API_TIMEOUT || '5000', 10),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // 3. Vérifier la validité
    if (!response.data.valid) {
      return res.status(401).json({
        success: false,
        message: response.data.error || 'Invalid token',
      });
    }

    // 4. Attacher les données utilisateur à la requête
    req.user = response.data.user;
    req.permissions = response.data.permissions;
    req.session = response.data.session;

    // 5. Continuer vers le prochain middleware
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'Authentication service unavailable',
        });
      }

      if (error.response?.status === 400) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authentication request',
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
}

/**
 * Middleware de vérification de rôle
 * Utilise après authTopSteelMiddleware
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

**Fichier**: `backend/src/types/express.d.ts`

```typescript
import { Express } from 'express';

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
```

#### Étape 2.3: Service d'authentification TopSteel (2h)

**Fichier**: `backend/src/services/topsteel-auth.service.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import Redis from 'ioredis';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TopSteelAuthService {
  private apiClient: AxiosInstance;
  private redis?: Redis;

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.TOPSTEEL_API_URL,
      timeout: parseInt(process.env.TOPSTEEL_API_TIMEOUT || '5000', 10),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialiser Redis si activé
    if (process.env.TOKEN_VALIDATION_CACHE_ENABLED === 'true') {
      this.redis = new Redis(process.env.REDIS_URL);
    }
  }

  /**
   * Login via TopSteel API
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.apiClient.post<LoginResponse>(
        process.env.TOPSTEEL_API_LOGIN_ENDPOINT || '/api/auth/login',
        { email, password }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Authentication failed'
        );
      }
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await this.apiClient.post<RefreshTokenResponse>(
        process.env.TOPSTEEL_API_REFRESH_ENDPOINT || '/api/auth/refresh',
        { refreshToken }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Token refresh failed'
        );
      }
      throw error;
    }
  }

  /**
   * Logout via TopSteel API
   */
  async logout(sessionId: string): Promise<void> {
    try {
      await this.apiClient.post(
        process.env.TOPSTEEL_API_LOGOUT_ENDPOINT || '/api/auth/logout',
        { sessionId }
      );

      // Invalider cache si activé
      if (this.redis) {
        const keys = await this.redis.keys(`token:*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Valider token avec cache Redis (optionnel)
   */
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    // 1. Vérifier le cache
    if (this.redis) {
      const cacheKey = `token:${token}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        console.log('Token validation from cache');
        return JSON.parse(cached);
      }
    }

    // 2. Appeler TopSteel API
    const response = await this.apiClient.post<ValidateTokenResponse>(
      process.env.TOPSTEEL_API_VALIDATE_TOKEN_ENDPOINT || '/api/auth/validate-token',
      { token }
    );

    // 3. Mettre en cache si valide
    if (this.redis && response.data.valid) {
      const cacheKey = `token:${token}`;
      const ttl = parseInt(process.env.TOKEN_VALIDATION_CACHE_TTL || '300', 10);
      await this.redis.setex(cacheKey, ttl, JSON.stringify(response.data));
    }

    return response.data;
  }
}

// Instance singleton
export const topSteelAuthService = new TopSteelAuthService();
```

#### Étape 2.4: Mise à jour des routes (2h)

**Fichier**: `backend/src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import { topSteelAuthService } from '../services/topsteel-auth.service';
import { authTopSteelMiddleware } from '../middleware/auth-topsteel.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Login via TopSteel API
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

    const result = await topSteelAuthService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const result = await topSteelAuthService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Token refresh failed',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout via TopSteel API
 */
router.post('/logout', authTopSteelMiddleware, async (req, res) => {
  try {
    const sessionId = req.session?.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID not found',
      });
    }

    await topSteelAuthService.logout(sessionId);

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

/**
 * GET /api/auth/me
 * Get current user info (protected)
 */
router.get('/me', authTopSteelMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      permissions: req.permissions,
      session: req.session,
    },
  });
});

export default router;
```

**Mise à jour routes protégées**:

```typescript
// backend/src/routes/pointages.routes.ts
import { authTopSteelMiddleware, requireRole } from '../middleware/auth-topsteel.middleware';

const router = Router();

// Toutes les routes protégées
router.use(authTopSteelMiddleware);

// Route nécessitant rôle admin
router.delete('/:id', requireRole('admin', 'manager'), async (req, res) => {
  // Supprimer pointage
});

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', async (req, res) => {
  // Liste des pointages pour l'utilisateur connecté
  const userId = req.user.id;
  // ...
});
```

#### Étape 2.5: Tests d'intégration auth (3h)

**Fichier**: `backend/src/tests/integration/auth.integration.test.ts`

```typescript
import request from 'supertest';
import app from '../../app';

describe('TopSteel Auth Integration', () => {
  let accessToken: string;
  let refreshToken: string;

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@toptime.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@toptime.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.permissions).toBeDefined();
    });

    it('should fail without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });

  describe('Protected Routes', () => {
    it('should access protected endpoint with valid token', async () => {
      const response = await request(app)
        .get('/api/pointages')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject access without token', async () => {
      const response = await request(app).get('/api/pointages');

      expect(response.status).toBe(401);
    });
  });

  describe('Role-based access', () => {
    it('should allow admin to delete', async () => {
      // Assume test user has admin role
      const response = await request(app)
        .delete('/api/pointages/test-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 403]).toContain(response.status);
    });
  });
});
```

---

### Phase A.3 - Fiabilisation Backend (Durée: 3 jours)

#### Étape 3.1: Tests unitaires services (8h)

**Objectif**: Tester tous les services critiques

**Services prioritaires**:

1. **PointageService** (priorité HAUTE)
2. **OperationsService** (priorité HAUTE)
3. **OrdreFabricationService** (priorité HAUTE)
4. **RebutsService** (priorité MOYENNE)
5. **AnalyticsService** (priorité MOYENNE)

**Template de test**: `backend/src/tests/unit/pointage.service.test.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PointageService } from '../../services/pointage.service';

describe('PointageService', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let service: PointageService;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new PointageService(prisma);
  });

  describe('startPointage', () => {
    it('should start a new pointage', async () => {
      const mockPointage = {
        id: 'test-id',
        userId: 'user-1',
        operationCode: 'OP-001',
        numeroOf: 'OF-001',
        startTime: new Date(),
        endTime: null,
        quantityProduced: 0,
      };

      prisma.pointages.create.mockResolvedValue(mockPointage);

      const result = await service.startPointage({
        userId: 'user-1',
        operationCode: 'OP-001',
        numeroOf: 'OF-001',
      });

      expect(result).toEqual(mockPointage);
      expect(prisma.pointages.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          operationCode: 'OP-001',
          numeroOf: 'OF-001',
        }),
      });
    });

    it('should fail if user already has active pointage', async () => {
      prisma.pointages.findFirst.mockResolvedValue({
        id: 'existing-id',
        userId: 'user-1',
        endTime: null,
      } as any);

      await expect(
        service.startPointage({
          userId: 'user-1',
          operationCode: 'OP-001',
          numeroOf: 'OF-001',
        })
      ).rejects.toThrow('User already has an active pointage');
    });
  });

  describe('stopPointage', () => {
    it('should stop an active pointage', async () => {
      const mockPointage = {
        id: 'test-id',
        userId: 'user-1',
        endTime: null,
      };

      prisma.pointages.findUnique.mockResolvedValue(mockPointage as any);
      prisma.pointages.update.mockResolvedValue({
        ...mockPointage,
        endTime: new Date(),
      } as any);

      const result = await service.stopPointage('test-id', {
        quantityProduced: 50,
      });

      expect(result.endTime).toBeDefined();
      expect(prisma.pointages.update).toHaveBeenCalled();
    });
  });

  // ... plus de tests
});
```

**Objectifs de couverture**:
- PointageService: 80%+
- OperationsService: 70%+
- OrdreFabricationService: 70%+
- Autres services: 60%+

#### Étape 3.2: Documentation API OpenAPI/Swagger (4h)

**Objectif**: Documenter tous les endpoints

**Fichier**: `backend/src/config/swagger.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TopTime API',
      version: '1.0.0',
      description: 'API Backend pour TopTime - Application de pointage d\'atelier',
      contact: {
        name: 'Support TopTime',
        email: 'support@toptime.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.toptime.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from TopSteel Auth',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
```

**Exemple de documentation endpoint**:

```typescript
/**
 * @swagger
 * /api/pointages:
 *   post:
 *     summary: Démarrer un nouveau pointage
 *     tags: [Pointages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operationCode
 *               - numeroOf
 *             properties:
 *               operationCode:
 *                 type: string
 *                 example: OP-001
 *               numeroOf:
 *                 type: string
 *                 example: OF-2025-001
 *     responses:
 *       200:
 *         description: Pointage démarré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Non authentifié
 *       400:
 *         description: Pointage déjà actif
 */
router.post('/', authTopSteelMiddleware, async (req, res) => {
  // ...
});
```

#### Étape 3.3: Monitoring et logging (2h)

**Objectif**: Implémenter logging structuré

**Fichier**: `backend/src/config/logger.ts`

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'toptime-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
```

**Utilisation dans les services**:

```typescript
import logger from '../config/logger';

export class PointageService {
  async startPointage(data: StartPointageDto) {
    try {
      logger.info('Starting pointage', {
        userId: data.userId,
        operationCode: data.operationCode,
      });

      const result = await this.prisma.pointages.create({ data });

      logger.info('Pointage started successfully', {
        pointageId: result.id,
      });

      return result;
    } catch (error) {
      logger.error('Failed to start pointage', {
        error: error.message,
        stack: error.stack,
        userId: data.userId,
      });
      throw error;
    }
  }
}
```

---

## 📅 Plan Détaillé - Phase B : Android TopTime

### Phase B.1 - Adaptation Auth (Durée: 2 jours)

#### Étape 1.1: Service d'authentification (4h)

**Fichier**: `android/app/src/main/java/com/toptime/data/repository/AuthRepository.kt`

```kotlin
interface AuthRepository {
    suspend fun login(email: String, password: String): Result<LoginResponse>
    suspend fun refreshToken(refreshToken: String): Result<TokenResponse>
    suspend fun logout(): Result<Unit>
    suspend fun getCurrentUser(): Result<User>
}

class AuthRepositoryImpl(
    private val authApi: AuthApiService,
    private val tokenManager: TokenManager,
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = authApi.login(LoginRequest(email, password))

            if (response.isSuccessful && response.body() != null) {
                val loginData = response.body()!!

                // Sauvegarder les tokens
                tokenManager.saveAccessToken(loginData.data.accessToken)
                tokenManager.saveRefreshToken(loginData.data.refreshToken)
                tokenManager.saveSessionId(loginData.data.sessionId)

                Result.success(loginData)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun refreshToken(refreshToken: String): Result<TokenResponse> {
        return try {
            val response = authApi.refreshToken(RefreshTokenRequest(refreshToken))

            if (response.isSuccessful && response.body() != null) {
                val tokenData = response.body()!!

                // Mettre à jour les tokens
                tokenManager.saveAccessToken(tokenData.data.accessToken)
                tokenManager.saveRefreshToken(tokenData.data.refreshToken)

                Result.success(tokenData)
            } else {
                Result.failure(Exception("Token refresh failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            val sessionId = tokenManager.getSessionId()
            authApi.logout(LogoutRequest(sessionId))

            // Effacer les tokens
            tokenManager.clearTokens()

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getCurrentUser(): Result<User> {
        return try {
            val response = authApi.getCurrentUser()

            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.data.user)
            } else {
                Result.failure(Exception("Failed to get user"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

#### Étape 1.2: Token Interceptor (2h)

**Fichier**: `android/app/src/main/java/com/toptime/data/network/AuthInterceptor.kt`

```kotlin
class AuthInterceptor(
    private val tokenManager: TokenManager,
    private val authApi: AuthApiService,
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip auth endpoints
        if (originalRequest.url.encodedPath.contains("/auth/")) {
            return chain.proceed(originalRequest)
        }

        // Add access token
        val accessToken = tokenManager.getAccessToken()
        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $accessToken")
            .build()

        val response = chain.proceed(authenticatedRequest)

        // Handle 401 - Token expired
        if (response.code == 401) {
            response.close()

            // Try to refresh token
            val refreshToken = tokenManager.getRefreshToken()
            if (refreshToken != null) {
                val refreshResponse = refreshTokenSync(refreshToken)

                if (refreshResponse != null) {
                    // Retry original request with new token
                    val newRequest = originalRequest.newBuilder()
                        .header("Authorization", "Bearer ${refreshResponse.accessToken}")
                        .build()

                    return chain.proceed(newRequest)
                }
            }

            // Refresh failed - logout user
            tokenManager.clearTokens()
            // TODO: Navigate to login screen
        }

        return response
    }

    private fun refreshTokenSync(refreshToken: String): TokenResponse? {
        return try {
            val response = authApi.refreshToken(RefreshTokenRequest(refreshToken)).execute()

            if (response.isSuccessful && response.body() != null) {
                val tokenData = response.body()!!
                tokenManager.saveAccessToken(tokenData.data.accessToken)
                tokenManager.saveRefreshToken(tokenData.data.refreshToken)
                tokenData.data
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
```

#### Étape 1.3: Stockage sécurisé des tokens (2h)

**Fichier**: `android/app/src/main/java/com/toptime/data/local/TokenManager.kt`

```kotlin
class TokenManager(private val context: Context) {

    private val prefs = context.getSharedPreferences(
        "toptime_auth",
        Context.MODE_PRIVATE
    )

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        "toptime_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveAccessToken(token: String) {
        encryptedPrefs.edit().putString("access_token", token).apply()
    }

    fun getAccessToken(): String? {
        return encryptedPrefs.getString("access_token", null)
    }

    fun saveRefreshToken(token: String) {
        encryptedPrefs.edit().putString("refresh_token", token).apply()
    }

    fun getRefreshToken(): String? {
        return encryptedPrefs.getString("refresh_token", null)
    }

    fun saveSessionId(sessionId: String) {
        encryptedPrefs.edit().putString("session_id", sessionId).apply()
    }

    fun getSessionId(): String? {
        return encryptedPrefs.getString("session_id", null)
    }

    fun clearTokens() {
        encryptedPrefs.edit().clear().apply()
        prefs.edit().clear().apply()
    }

    fun isLoggedIn(): Boolean {
        return getAccessToken() != null
    }
}
```

### Phase B.2 - Fiabilisation Android (Durée: 2 jours)

#### Étape 2.1: Tests unitaires ViewModels (4h)

**Fichier**: `android/app/src/test/java/com/toptime/viewmodel/PointageViewModelTest.kt`

```kotlin
class PointageViewModelTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private lateinit var viewModel: PointageViewModel
    private lateinit var pointageRepository: PointageRepository
    private lateinit var authRepository: AuthRepository

    @Before
    fun setup() {
        pointageRepository = mockk()
        authRepository = mockk()
        viewModel = PointageViewModel(pointageRepository, authRepository)
    }

    @Test
    fun `startPointage should update state to loading then success`() = runTest {
        // Given
        val pointageData = StartPointageData("OP-001", "OF-001")
        coEvery { pointageRepository.startPointage(any()) } returns Result.success(
            Pointage(id = "test-id", startTime = Date())
        )

        // When
        viewModel.startPointage(pointageData)

        // Then
        verify { viewModel.uiState.value is PointageUiState.Loading }
        coVerify { pointageRepository.startPointage(pointageData) }
        verify { viewModel.uiState.value is PointageUiState.Success }
    }

    @Test
    fun `startPointage should handle error`() = runTest {
        // Given
        val pointageData = StartPointageData("OP-001", "OF-001")
        coEvery { pointageRepository.startPointage(any()) } returns Result.failure(
            Exception("Network error")
        )

        // When
        viewModel.startPointage(pointageData)

        // Then
        verify { viewModel.uiState.value is PointageUiState.Error }
    }
}
```

#### Étape 2.2: Tests d'intégration API (3h)

**Fichier**: `android/app/src/androidTest/java/com/toptime/PointageIntegrationTest.kt`

```kotlin
@RunWith(AndroidJUnit4::class)
class PointageIntegrationTest {

    private lateinit var authRepository: AuthRepository
    private lateinit var pointageRepository: PointageRepository
    private var accessToken: String? = null

    @Before
    fun setup() {
        authRepository = // inject real implementation
        pointageRepository = // inject real implementation
    }

    @Test
    fun testFullPointageFlow() = runTest {
        // 1. Login
        val loginResult = authRepository.login("test@toptime.com", "password")
        assertTrue(loginResult.isSuccess)
        accessToken = loginResult.getOrNull()?.data?.accessToken

        // 2. Start pointage
        val startResult = pointageRepository.startPointage(
            StartPointageData("OP-001", "OF-001")
        )
        assertTrue(startResult.isSuccess)
        val pointageId = startResult.getOrNull()?.id

        // 3. Get active pointage
        val activeResult = pointageRepository.getActivePointage()
        assertTrue(activeResult.isSuccess)
        assertEquals(pointageId, activeResult.getOrNull()?.id)

        // 4. Stop pointage
        val stopResult = pointageRepository.stopPointage(
            pointageId!!,
            StopPointageData(quantityProduced = 50)
        )
        assertTrue(stopResult.isSuccess)

        // 5. Verify no active pointage
        val noActiveResult = pointageRepository.getActivePointage()
        assertTrue(noActiveResult.isFailure || noActiveResult.getOrNull() == null)
    }
}
```

---

## 📊 Métriques de Succès

### Phase A - Backend

| Métrique | Objectif | Validation |
|----------|----------|------------|
| **Migration Prisma** | 94 modèles convertis | ✅ 0 erreurs TypeScript |
| **Tests backend** | 80%+ couverture | ✅ npm test |
| **Auth intégration** | Tous endpoints protégés | ✅ Tests d'intégration passent |
| **Documentation API** | Swagger complet | ✅ /api-docs accessible |
| **Performance** | < 100ms réponse moyenne | ✅ Monitoring |

### Phase B - Android

| Métrique | Objectif | Validation |
|----------|----------|------------|
| **Auth Android** | Login via TopSteel | ✅ Tests d'intégration |
| **Token management** | Refresh automatique | ✅ Tests unitaires |
| **Tests ViewModels** | 70%+ couverture | ✅ ./gradlew test |
| **Stabilité app** | 0 crash au démarrage | ✅ Tests manuels |

---

## 🚨 Gestion des Risques

### Risques Critiques

#### 1. Migration Prisma - Relations self-referential

**Risque**: Les relations parent/enfant (ex: familles_article) peuvent casser

**Mitigation**:
- Tests approfondis des relations
- Validation manuelle du schéma
- Backup complet avant migration

#### 2. Auth Integration - TopSteel API indisponible

**Risque**: TopTime ne peut plus authentifier si TopSteel down

**Mitigation**:
- Implémenter retry logic avec exponential backoff
- Cache Redis pour validation de tokens
- Fallback sur mode dégradé (lecture seule)

#### 3. TypeORM Removal - Services cassés

**Risque**: Retirer TypeORM peut casser services non migrés

**Mitigation**:
- Migration incrémentale par service
- Tests complets avant chaque commit
- Feature flags pour activer/désactiver nouveau code

### Plan de Rollback

**Si migration échoue**:

```bash
# Backend
cd C:\GitHub\TopTime
git checkout backup-before-prisma-migration

# Restore DB
psql -U postgres -d toptime < backup_before_migration.sql

# Restore schema
cp backend/prisma/schema.prisma.backup backend/prisma/schema.prisma
npx prisma generate

# Restart
npm run dev
```

---

## 📅 Timeline Globale

### Phase A - Backend (7 jours)

| Étape | Durée | Dépendances |
|-------|-------|-------------|
| A.1 - Migration Prisma | 2-3 jours | Aucune |
| A.2 - Intégration Auth TopSteel | 2 jours | A.1 complétée |
| A.3 - Fiabilisation Backend | 3 jours | A.1, A.2 complétées |

### Phase B - Android (4 jours)

| Étape | Durée | Dépendances |
|-------|-------|-------------|
| B.1 - Adaptation Auth | 2 jours | A.2 complétée |
| B.2 - Fiabilisation Android | 2 jours | B.1 complétée |

**Durée totale estimée**: 11 jours ouvrés (2 semaines et demie)

---

## ✅ Checklist de Validation Finale

### Backend

- [ ] 0 erreurs TypeScript compilation
- [ ] 100% tests backend passent
- [ ] Tous les endpoints documentés dans Swagger
- [ ] Auth TopSteel intégrée et testée
- [ ] TypeORM complètement retiré
- [ ] Logging structuré implémenté
- [ ] Monitoring en place

### Android

- [ ] Login via TopSteel fonctionne
- [ ] Refresh token automatique
- [ ] Tokens stockés de manière sécurisée
- [ ] Tests unitaires ViewModels passent
- [ ] Tests d'intégration API passent
- [ ] 0 crash au démarrage
- [ ] Workflow pointage validé

### Infrastructure

- [ ] Base de données intacte (aucune perte de données)
- [ ] Variables d'environnement configurées
- [ ] Redis configuré (cache tokens)
- [ ] Documentation à jour
- [ ] Guide de déploiement créé

---

## 📚 Documents Créés

### Documentation TopSteel

1. ✅ `PHASE_10_COMPLETION_REPORT.md` - Rapport Phase 10 complétée
2. ✅ `TOPTIME_API_INTEGRATION.md` - Guide d'intégration production-ready
3. ✅ `AUTH_TEST_STRATEGY.md` - Stratégie de tests Auth
4. 🆕 `PLAN_MIGRATION_TOPTIME_INTEGRATION.md` - Ce document

### Documentation TopTime (à créer)

5. 📋 `MIGRATION_PRISMA_COMPLETE.md` - Guide migration Prisma
6. 📋 `AUTH_TOPSTEEL_INTEGRATION.md` - Guide intégration auth
7. 📋 `ANDROID_AUTH_GUIDE.md` - Guide auth Android
8. 📋 `DEPLOYMENT_GUIDE_INTEGRATED.md` - Guide déploiement complet

---

## 🎯 Prochaines Étapes Immédiates

### Semaine 1 - Backend Focus

**Jour 1-2**: Migration Prisma
```bash
cd C:\GitHub\TopTime\backend
npm run migrate:generate-mapping
npm run migrate:convert-schema
npm run migrate:convert-code
npm test
```

**Jour 3-4**: Intégration Auth TopSteel
- Implémenter middleware auth
- Créer service TopSteel auth
- Mettre à jour routes protégées
- Tests d'intégration

**Jour 5**: Tests et validation
- Tests unitaires services
- Tests d'intégration complets
- Validation endpoints

### Semaine 2 - Android + Finalisation

**Jour 6-7**: Android Auth
- Service auth Android
- Token interceptor
- Stockage sécurisé

**Jour 8-9**: Tests Android
- Tests unitaires ViewModels
- Tests d'intégration API
- Validation workflow

**Jour 10-11**: Finalisation
- Documentation complète
- Guide de déploiement
- Validation finale

---

## 💬 Support et Questions

**Pour TopSteel**:
- Documentation: `C:\GitHub\TopSteel\docs\`
- Endpoint auth: `POST /api/auth/validate-token`

**Pour TopTime**:
- Plan migration Prisma: `C:\GitHub\TopTime\PRISMA_MIGRATION_PLAN.md`
- Guide démarrage: `C:\GitHub\TopTime\README.md`

**Contact**:
- Email: support@topsteel.tech
- Slack: #toptime-migration

---

**Créé par**: Claude
**Date**: 2025-11-19
**Version**: 1.0
**Status**: 📋 Prêt pour exécution
