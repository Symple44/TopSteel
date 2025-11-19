# Guide d'Intégration TopTime API

**Version**: 1.0.0
**Date**: 2025-11-18
**Architecture**: Microservices TopSteel (Auth) + TopTime (Business Logic)

---

## 📋 Table des matières

1. [Vue d'ensemble de l'architecture](#architecture)
2. [Configuration](#configuration)
3. [Authentification](#authentification)
4. [Endpoint de validation de token](#endpoint-validation)
5. [Exemples de code](#exemples)
6. [Sécurité](#securite)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture {#architecture}

### Séparation des responsabilités

```
┌─────────────────────────────────────────┐
│         TopTime API (Express)           │
│    Logique métier: Temps, projets,     │
│         tasks, reporting, etc.          │
│                                         │
│  Technologies: Express + Prisma ORM     │
└─────────────┬───────────────────────────┘
              │
              │ Validation des tokens JWT
              │ via HTTP POST
              │
              ▼
┌─────────────────────────────────────────┐
│        TopSteel API (NestJS)            │
│   Infrastructure: Auth, Users, Roles,   │
│        Sessions, Permissions            │
│                                         │
│  Technologies: NestJS + Prisma ORM      │
└─────────────────────────────────────────┘
```

### Principe

- **TopSteel API** : Source unique de vérité pour l'authentification
- **TopTime API** : Valide chaque requête en appelant TopSteel
- **JWT Tokens** : Partagés entre les deux APIs
- **Secrets partagés** : Configuration identique JWT entre services

---

## ⚙️ Configuration {#configuration}

### Variables d'environnement - TopTime API

```env
# TopSteel API Configuration
TOPSTEEL_API_URL=https://api.topsteel.tech
TOPSTEEL_API_VALIDATE_TOKEN_ENDPOINT=/api/auth/validate-token

# JWT Configuration (MUST match TopSteel config)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Cache Configuration (optional)
TOKEN_VALIDATION_CACHE_TTL=300  # 5 minutes
TOKEN_VALIDATION_CACHE_ENABLED=true

# Request Configuration
TOPSTEEL_API_TIMEOUT=5000  # 5 seconds
TOPSTEEL_API_RETRY_ATTEMPTS=2
```

### Variables d'environnement - TopSteel API

```env
# JWT Configuration (MUST match TopTime config)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://toptime.topsteel.tech
```

⚠️ **IMPORTANT**: Le `JWT_SECRET` **DOIT être identique** entre TopSteel et TopTime!

---

## 🔐 Authentification {#authentification}

### Flow complet

```
1. User se connecte via TopTime UI
   │
   ├─→ TopTime envoie credentials à TopSteel
   │   POST https://api.topsteel.tech/api/auth/login
   │   Body: { "email": "user@example.com", "password": "password123" }
   │
2. TopSteel vérifie credentials et crée session
   │
   ├─→ TopSteel retourne JWT tokens
   │   { "accessToken": "eyJhbGc...", "refreshToken": "eyJhbGc...", "sessionId": "uuid" }
   │
3. TopTime stocke tokens (cookies httpOnly ou localStorage)
   │
4. Pour chaque requête TopTime:
   │
   ├─→ TopTime extrait token de la requête
   │
   ├─→ TopTime valide token via TopSteel
   │   POST https://api.topsteel.tech/api/auth/validate-token
   │   Body: { "token": "eyJhbGc..." }
   │
   ├─→ TopSteel valide: JWT, User, Session, Permissions
   │
   └─→ TopSteel retourne résultat
       {
         "valid": true,
         "user": { ... },
         "permissions": { ... },
         "session": { ... }
       }
```

---

## 🎯 Endpoint de Validation de Token {#endpoint-validation}

### POST `/api/auth/validate-token`

**URL complète**: `https://api.topsteel.tech/api/auth/validate-token`

#### Requête

**Headers**:
```http
Content-Type: application/json
```

**Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Réponse Succès (200 OK)

```json
{
  "valid": true,
  "user": {
    "id": "user-123",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true
  },
  "permissions": {
    "roles": ["admin", "manager"],
    "societes": [
      {
        "societeId": "societe-1",
        "roles": ["manager", "user"]
      },
      {
        "societeId": "societe-2",
        "roles": ["viewer"]
      }
    ]
  },
  "session": {
    "sessionId": "session-uuid-123",
    "isActive": true,
    "lastActivity": "2025-11-18T19:30:00.000Z"
  }
}
```

#### Réponse Échec - Token Invalide (200 OK)

```json
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

**Codes d'erreur possibles**:
- `"Invalid or expired token"` - JWT malformé ou expiré
- `"User not found"` - Utilisateur supprimé depuis émission du token
- `"User account is inactive"` - Compte utilisateur désactivé
- `"Session not found or expired"` - Session introuvable
- `"Session has been revoked or is inactive"` - Session révoquée/inactive
- `"Session has been logged out"` - Utilisateur s'est déconnecté
- `"Internal server error during token validation"` - Erreur serveur

#### Réponse Échec - Erreur Requête (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": ["token must be a string", "token should not be empty"],
  "error": "Bad Request"
}
```

---

## 💻 Exemples de Code {#exemples}

### Express Middleware (TypeScript)

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
 * Middleware d'authentification TopTime
 * Valide le JWT via TopSteel API
 */
export async function authMiddleware(
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
      `${process.env.TOPSTEEL_API_URL}/api/auth/validate-token`,
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
```

### Utilisation du Middleware

```typescript
import express from 'express';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

// Routes publiques (sans auth)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes protégées (avec auth)
app.use('/api/projects', authMiddleware);
app.get('/api/projects', (req, res) => {
  // req.user est disponible ici
  res.json({
    success: true,
    user: req.user,
    data: [] // vos projets
  });
});

// Routes avec vérification de rôles
app.post('/api/projects', authMiddleware, requireRole('admin'), (req, res) => {
  // Seuls les admins peuvent créer des projets
  res.json({ success: true });
});
```

### Helper: Vérification de rôle

```typescript
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

### Cache avec Redis (optionnel)

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function validateTokenWithCache(token: string): Promise<ValidateTokenResponse> {
  // 1. Vérifier le cache
  const cacheKey = `token:${token}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    console.log('Token validation from cache');
    return JSON.parse(cached);
  }

  // 2. Appeler TopSteel API
  const response = await axios.post<ValidateTokenResponse>(
    `${process.env.TOPSTEEL_API_URL}/api/auth/validate-token`,
    { token }
  );

  // 3. Mettre en cache si valide (TTL: 5 minutes)
  if (response.data.valid) {
    await redis.setex(
      cacheKey,
      parseInt(process.env.TOKEN_VALIDATION_CACHE_TTL || '300', 10),
      JSON.stringify(response.data)
    );
  }

  return response.data;
}
```

### Axios Interceptor (Pour API clients)

```typescript
import axios, { AxiosInstance } from 'axios';

export function createAuthenticatedClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL });

  // Intercepteur de requête: Ajouter le token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Intercepteur de réponse: Gérer les erreurs auth
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expiré, tenter refresh
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const response = await axios.post(
            `${process.env.TOPSTEEL_API_URL}/api/auth/refresh`,
            { refreshToken }
          );

          localStorage.setItem('accessToken', response.data.accessToken);

          // Réessayer la requête originale
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}
```

---

## 🔒 Sécurité {#securite}

### Bonnes pratiques

#### 1. HTTPS Obligatoire

```typescript
if (process.env.NODE_ENV === 'production' && !process.env.TOPSTEEL_API_URL?.startsWith('https://')) {
  throw new Error('TOPSTEEL_API_URL must use HTTPS in production');
}
```

#### 2. Secrets sécurisés

```bash
# NE PAS commit dans git
.env
.env.production

# Utiliser un gestionnaire de secrets
# - AWS Secrets Manager
# - HashiCorp Vault
# - Kubernetes Secrets
```

#### 3. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requêtes par IP
  message: 'Too many authentication requests, please try again later',
});

app.use('/api/', authLimiter);
```

#### 4. Token Storage

**✅ Recommandé**: Cookies httpOnly + Secure

```typescript
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 3600000, // 1 hour
});
```

**⚠️ Acceptable**: localStorage (XSS risk)

```typescript
localStorage.setItem('accessToken', token);
```

**❌ À éviter**: sessionStorage ou cookies non-httpOnly

#### 5. Validation côté serveur

**Toujours valider via TopSteel**, même si le token semble valide côté client.

#### 6. Logs de sécurité

```typescript
// Logger les tentatives d'auth échouées
if (!response.data.valid) {
  logger.warn('Failed token validation', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    error: response.data.error,
  });
}
```

---

## 🔧 Troubleshooting {#troubleshooting}

### Erreur: "Authentication service unavailable"

**Cause**: TopSteel API est inaccessible

**Solution**:
1. Vérifier que TopSteel API est démarrée
2. Vérifier la variable `TOPSTEEL_API_URL`
3. Vérifier les règles de firewall/network
4. Vérifier les logs TopSteel

```bash
# Vérifier si TopSteel API répond
curl https://api.topsteel.tech/api/health
```

### Erreur: "Invalid or expired token"

**Causes possibles**:
1. Token réellement expiré (> 1h)
2. JWT_SECRET différent entre TopSteel et TopTime
3. Token malformé

**Solution**:
```typescript
// Décoder le token pour voir son contenu (sans vérifier la signature)
const decoded = jwt.decode(token);
console.log('Token expiration:', new Date(decoded.exp * 1000));
console.log('Current time:', new Date());
```

### Erreur: "Session has been revoked"

**Cause**: L'utilisateur ou un admin a révoqué la session

**Solution**: Demander à l'utilisateur de se reconnecter

### Performance: Trop de requêtes vers TopSteel

**Solution**: Implémenter un cache Redis (voir exemple ci-dessus)

### Logs à vérifier (TopSteel)

```bash
# Logs TopSteel API
cd apps/api
tail -f logs/app.log | grep "validate-token"

# Voir les rejets
tail -f logs/app.log | grep "WARN.*validate-token"
```

### Erreur: "Cannot read properties of undefined"

**Cause**: Réponse TopSteel inattendue

**Solution**: Ajouter validation

```typescript
if (!response.data || typeof response.data.valid !== 'boolean') {
  throw new Error('Invalid response format from TopSteel API');
}
```

---

## 📚 Ressources

- [Documentation API TopSteel](https://api.topsteel.tech/api-docs)
- [Stratégie de tests Auth](./AUTH_TEST_STRATEGY.md)
- [JWT.io - Décodeur de tokens](https://jwt.io/)

---

## 📞 Support

Pour toute question:
- **Email**: support@topsteel.tech
- **Slack**: #toptime-integration
- **Issues GitHub**: https://github.com/topsteel/topsteel-api/issues

---

**Version**: 1.0.0
**Dernière mise à jour**: 2025-11-18
**Auteur**: Claude
