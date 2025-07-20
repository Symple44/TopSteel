# Module Email - Service Backend

Service backend complet pour l'envoi d'emails avec support OAuth2 pour Google et Microsoft, compatible avec TopSteel ERP.

## 🚀 Fonctionnalités

### 📧 Envoi d'emails
- **Envoi simple** : Emails individuels avec support des attachments
- **Envoi en masse** : Traitement par batch avec rate limiting
- **Templates Handlebars** : Système de templates avec variables dynamiques
- **Queue asynchrone** : Traitement en arrière-plan avec Bull/Redis
- **Programmation** : Emails différés et récurrents

### 🔐 Providers supportés
- **Google Gmail** : Via OAuth2 et Gmail API
- **Microsoft Outlook/Office365** : Via OAuth2 et Microsoft Graph API
- **SMTP générique** : Support des principaux fournisseurs SMTP

### 📊 Monitoring et logs
- **Historique complet** : Logs détaillés de tous les envois
- **Statistiques** : Taux de succès, performance par provider
- **Queue management** : Monitoring des jobs en cours et échoués
- **Retry automatique** : Gestion intelligente des échecs

## 🏗️ Architecture

```
email/
├── controllers/
│   ├── email.controller.ts          # API REST pour envoi d'emails
│   └── oauth-callback.controller.ts # Gestion OAuth2 Google/Microsoft
├── services/
│   ├── email.service.ts             # Service principal
│   ├── email-template.service.ts    # Gestion des templates
│   └── email-queue.service.ts       # Queue et traitement asynchrone
├── providers/
│   ├── google-email.provider.ts     # Provider Google Gmail
│   ├── microsoft-email.provider.ts  # Provider Microsoft Graph
│   └── smtp-email.provider.ts       # Provider SMTP générique
├── entities/
│   ├── email-log.entity.ts          # Logs des envois
│   ├── email-template.entity.ts     # Templates d'emails
│   └── email-configuration.entity.ts # Configurations providers
├── interfaces/
│   └── email-provider.interface.ts  # Interfaces communes
└── email.module.ts                  # Module NestJS
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# Configuration générale
DEFAULT_FROM_EMAIL=noreply@topsteel.com
DEFAULT_FROM_NAME=TopSteel ERP
APP_URL=https://your-domain.com

# Redis pour la queue
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/email/oauth/google/callback

# Microsoft OAuth2
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=https://your-domain.com/api/email/oauth/microsoft/callback
AZURE_TENANT_ID=your_tenant_id  # optionnel, défaut: "common"

# Provider par défaut
EMAIL_DEFAULT_PROVIDER=smtp
```

### Base de données

Les entités sont automatiquement créées par TypeORM. Assurez-vous que les tables suivantes sont présentes :

- `email_configurations` : Configurations des providers
- `email_templates` : Templates d'emails
- `email_logs` : Historique des envois

## 🔧 Configuration OAuth2

### Google Gmail

1. **Google Cloud Console** (console.cloud.google.com)
   - Créer un projet ou sélectionner un projet existant
   - Activer **Gmail API** dans "APIs & Services"
   - Créer des credentials **OAuth 2.0**

2. **Configuration OAuth2**
   - Type d'application : Application Web
   - URIs de redirection autorisées :
     ```
     https://your-domain.com/api/email/oauth/google/callback
     ```
   - Scopes requis :
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/userinfo.email`

3. **Autorisation**
   ```bash
   GET /api/email/oauth/google/authorize
   # Suivre l'URL retournée pour autoriser l'accès
   ```

### Microsoft Outlook/Office365

1. **Azure Portal** (portal.azure.com)
   - Naviguer vers "Azure Active Directory" > "App registrations"
   - Créer une nouvelle application
   - Type : Application Web

2. **Permissions API**
   - Microsoft Graph :
     - `Mail.Send` (Application + Delegated)
     - `Mail.ReadWrite` (Application + Delegated)
     - `User.Read` (Delegated)

3. **Configuration**
   - URIs de redirection :
     ```
     https://your-domain.com/api/email/oauth/microsoft/callback
     ```
   - Générer un client secret dans "Certificates & secrets"

4. **Autorisation**
   ```bash
   GET /api/email/oauth/microsoft/authorize
   # Suivre l'URL retournée pour autoriser l'accès
   ```

## 📝 Utilisation

### Envoi d'email simple

```typescript
POST /api/email/send
{
  "to": "user@example.com",
  "subject": "Bienvenue !",
  "html": "<h1>Bonjour</h1><p>Merci de vous être inscrit.</p>",
  "text": "Bonjour, merci de vous être inscrit."
}
```

### Avec template

```typescript
POST /api/email/send
{
  "to": "user@example.com",
  "templateName": "welcome",
  "templateData": {
    "name": "Jean Dupont",
    "company": "TopSteel ERP"
  }
}
```

### Envoi en masse

```typescript
POST /api/email/send-bulk
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Newsletter #1",
      "templateName": "newsletter",
      "templateData": { "name": "Jean" }
    },
    {
      "to": "user2@example.com", 
      "subject": "Newsletter #1",
      "templateName": "newsletter",
      "templateData": { "name": "Marie" }
    }
  ],
  "batchSize": 10,
  "delayBetweenBatches": 1000
}
```

### Email programmé

```typescript
POST /api/email/schedule
{
  "email": {
    "to": "user@example.com",
    "subject": "Rappel de rendez-vous",
    "templateName": "reminder"
  },
  "sendAt": "2024-01-15T10:00:00Z"
}
```

## 🎨 Templates

### Créer un template

```typescript
POST /api/email/templates
{
  "name": "welcome",
  "subject": "Bienvenue {{name}} !",
  "htmlContent": "<h1>Bonjour {{name}}</h1><p>Bienvenue chez {{company}}.</p>",
  "textContent": "Bonjour {{name}}, bienvenue chez {{company}}.",
  "variables": ["name", "company"],
  "category": "onboarding"
}
```

### Helpers Handlebars disponibles

```handlebars
<!-- Formatage de dates -->
{{formatDate date "short"}}        <!-- 15/01/2024 -->
{{formatDate date "long"}}         <!-- lundi 15 janvier 2024 -->
{{formatDate date "time"}}         <!-- 14:30:00 -->

<!-- Formatage de montants -->
{{formatMoney 1234.56}}            <!-- 1 234,56 € -->
{{formatMoney 1234.56 "USD"}}      <!-- $1,234.56 -->

<!-- Conditions -->
{{#if (eq status "active")}}Actif{{/if}}
{{#if (gt amount 100)}}Premium{{/if}}

<!-- URLs -->
{{url "/dashboard"}}               <!-- https://domain.com/dashboard -->
```

## 📊 Monitoring

### Statistiques

```typescript
GET /api/email/stats?startDate=2024-01-01&endDate=2024-01-31
```

```json
{
  "total": 1250,
  "sent": 1198,
  "failed": 52,
  "successRate": 95.84,
  "providerStats": [
    {
      "provider": "Google Gmail",
      "total": 800,
      "sent": 785,
      "failed": 15
    },
    {
      "provider": "Microsoft Outlook/Office365", 
      "total": 450,
      "sent": 413,
      "failed": 37
    }
  ]
}
```

### Queue

```typescript
# Statistiques de la queue
GET /api/email/queue/stats

# Jobs actifs
GET /api/email/queue/jobs/active

# Jobs échoués
GET /api/email/queue/jobs/failed

# Relancer un job
POST /api/email/queue/jobs/:id/retry

# Pauser la queue
POST /api/email/queue/pause
```

## 🔒 Sécurité

### Authentification
- Routes protégées par JWT
- Contrôle des rôles : `admin`, `user`, `marketing`
- Logs d'audit pour toutes les actions

### Bonnes pratiques
- Tokens OAuth2 chiffrés en base
- Rate limiting par provider
- Validation des templates
- Sanitization des données

## 🚧 Rate Limiting

### Limites par défaut

| Provider | Emails/minute | Emails/jour |
|----------|---------------|-------------|
| Google Gmail | 100 | 1,000,000,000 |
| Microsoft Graph | 30 | 10,000 |
| SMTP Generic | 60 | Selon provider |

### Configuration custom

```typescript
POST /api/email/providers/configure
{
  "provider": "google",
  "rateLimitConfig": {
    "maxPerMinute": 50,
    "maxPerHour": 2000,
    "maxPerDay": 100000
  }
}
```

## 🛠️ Dépendances

```json
{
  "@nestjs/bull": "^10.0.1",
  "@nestjs/typeorm": "^10.0.0",
  "bull": "^4.12.2",
  "handlebars": "^4.7.8",
  "nodemailer": "^6.9.7",
  "googleapis": "^128.0.0",
  "@microsoft/microsoft-graph-client": "^3.0.7",
  "@azure/identity": "^4.0.1"
}
```

## 📦 Installation

1. **Installer les dépendances**
   ```bash
   npm install @nestjs/bull bull handlebars nodemailer googleapis @microsoft/microsoft-graph-client @azure/identity
   ```

2. **Configurer Redis**
   ```bash
   # Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Ou via package manager
   sudo apt-get install redis-server
   ```

3. **Variables d'environnement**
   - Copier les variables ci-dessus dans votre `.env`
   - Configurer OAuth2 selon les guides Google/Microsoft

4. **Importer le module**
   ```typescript
   import { EmailModule } from './modules/email/email.module'
   
   @Module({
     imports: [EmailModule],
   })
   export class AppModule {}
   ```

## 🤝 Contribution

Le module est conçu pour être extensible :

1. **Nouveau provider** : Implémenter `EmailProvider` interface
2. **Nouveau template helper** : Ajouter dans `EmailTemplateService.registerHelpers()`
3. **Webhook support** : Étendre `EmailController.handleWebhook()`

## 📄 Licence

Ce module fait partie de TopSteel ERP et suit la même licence que le projet principal.