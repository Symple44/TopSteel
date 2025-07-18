# Architecture de Base de Données - TopSteel ERP

## 🏗️ Architecture Robuste et Évolutive

Cette architecture remplace le système précédent par une solution production-ready basée sur les meilleures pratiques TypeORM et PostgreSQL.

## 📁 Structure

```
src/database/
├── controllers/
│   └── database.controller.ts    # API d'administration
├── services/
│   ├── migration.service.ts      # Gestion des migrations
│   ├── seeder.service.ts         # Données d'initialisation
│   ├── health.service.ts         # Monitoring de santé
│   └── startup.service.ts        # Initialisation au démarrage
├── migrations/                   # Migrations TypeORM
├── seeds/                        # Scripts de données initiales
├── database.config.ts            # Configuration par environnement
├── database-production.module.ts # Module principal
└── README.md                     # Cette documentation
```

## 🚀 Fonctionnalités Principales

### ✅ Gestion des Migrations
- **Standard TypeORM** : Utilisation des migrations natives
- **Transactionnel** : Chaque migration dans sa propre transaction
- **Rollback sécurisé** : Annulation des migrations en développement
- **Protection production** : Contrôle d'accès strict

### ✅ Système de Seeds
- **Transactionnel** : Toutes les données d'initialisation en une transaction
- **Idempotent** : Peut être exécuté plusieurs fois sans problème
- **Trackable** : Suivi des seeds exécutés
- **Environnement-aware** : Différents seeds selon l'environnement

### ✅ Monitoring de Santé
- **Health checks** : Vérification complète de la santé
- **Métriques** : Temps de réponse, connexions, performance
- **Alertes** : Détection des problèmes automatique
- **Statistiques** : Analyse détaillée des performances

### ✅ Configuration Avancée
- **Par environnement** : Configuration spécifique dev/prod
- **Pool de connexions** : Optimisation des ressources
- **Cache Redis** : Amélioration des performances
- **SSL/TLS** : Sécurité en production

## 🔧 Configuration

### Variables d'Environnement

```bash
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=erp_topsteel

# Comportement
NODE_ENV=development|production
AUTO_RUN_MIGRATIONS=true|false
AUTO_RUN_SEEDS=true|false
ALLOW_PRODUCTION_MIGRATIONS=true|false

# Performance
DB_POOL_SIZE=10
DB_MAX_CONNECTIONS=10
DB_CONNECTION_TIMEOUT=30000
DB_LOGGING=true|false

# Cache (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Environnements

#### 🔧 Développement
```typescript
{
  synchronize: false,          // Toujours false, on utilise les migrations
  migrationsRun: true,        // Auto-exécution des migrations
  logging: true,              // Logs détaillés
  dropSchema: false,          // Jamais de drop automatique
  autoRunSeeds: true          // Données d'initialisation automatiques
}
```

#### 🏭 Production
```typescript
{
  synchronize: false,          // OBLIGATOIRE false
  migrationsRun: false,       // Contrôle manuel des migrations
  logging: ['error', 'warn'], // Logs minimaux
  dropSchema: false,          // OBLIGATOIRE false
  ssl: true,                  // Connexion sécurisée
  cache: true                 // Cache Redis activé
}
```

## 🛠️ Utilisation

### Démarrage Automatique

Le service `DatabaseStartupService` s'exécute automatiquement au démarrage de l'application :

1. **Vérification de santé** : Connexion et état de la base
2. **Migrations** : Exécution si autorisé
3. **Seeds** : Données d'initialisation si nécessaire
4. **Vérification finale** : Contrôle de cohérence

### API d'Administration

#### Santé de la Base
```bash
GET /api/admin/database/health
GET /api/admin/database/health/simple
GET /api/admin/database/stats
```

#### Migrations
```bash
GET /api/admin/database/migrations/status
POST /api/admin/database/migrations/run
POST /api/admin/database/migrations/revert  # Développement uniquement
```

#### Seeds
```bash
POST /api/admin/database/seeds/run
POST /api/admin/database/seeds/reset        # Développement uniquement
```

#### Développement
```bash
POST /api/admin/database/development/reset  # Reset complet
```

### Commandes CLI

```bash
# Générer une migration
npm run migration:generate -- --name=AddUserTable

# Exécuter les migrations
npm run migration:run

# Annuler la dernière migration
npm run migration:revert

# Exécuter les seeds
npm run seed:run

# Vérifier la santé
npm run db:health
```

## 🏗️ Création de Migrations

### 1. Générer une Migration

```bash
npm run migration:generate -- --name=AddUserPreferences
```

### 2. Modifier le Fichier Généré

```typescript
// src/database/migrations/1640000000000-AddUserPreferences.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserPreferences1640000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        theme VARCHAR(20) DEFAULT 'auto',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE user_preferences`)
  }
}
```

### 3. Exécuter la Migration

```bash
npm run migration:run
```

## 🌱 Création de Seeds

### 1. Ajouter au SeederService

```typescript
// src/database/services/seeder.service.ts
private async seedUserPreferences(manager: any): Promise<void> {
  const preferences = [
    { userId: 'admin-id', theme: 'dark' },
    { userId: 'user-id', theme: 'light' }
  ]
  
  for (const pref of preferences) {
    await manager.query(`
      INSERT INTO user_preferences (user_id, theme)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO NOTHING
    `, [pref.userId, pref.theme])
  }
}
```

### 2. Ajouter à la Méthode Principale

```typescript
await this.dataSource.transaction(async (manager) => {
  await this.seedSystemParameters(manager)
  await this.seedDefaultUsers(manager)
  await this.seedUserPreferences(manager)  // Nouveau seed
  await this.seedMenuConfiguration(manager)
  await this.markSeedsAsCompleted(manager)
})
```

## 🔒 Sécurité

### Protection Production

- **Migrations** : Contrôle d'accès avec `ALLOW_PRODUCTION_MIGRATIONS`
- **Seeds** : Pas d'auto-exécution en production
- **Reset** : Opérations destructives interdites
- **API** : Endpoints sécurisés avec authentification admin

### Bonnes Pratiques

1. **Jamais de `synchronize: true`** en production
2. **Toujours des migrations** pour les changements de schéma
3. **Backup automatique** avant migrations importantes
4. **Monitoring continu** de la santé de la base
5. **Logs d'audit** pour toutes les opérations

## 🔄 Migration depuis l'Ancienne Architecture

### 1. Remplacer le Module

```typescript
// app.module.ts
- import { DatabaseModule } from './database/database.module'
+ import { DatabaseProductionModule } from './database/database-production.module'

@Module({
  imports: [
-   DatabaseModule,
+   DatabaseProductionModule,
  ],
})
```

### 2. Supprimer les Anciens Services

```bash
# Supprimer les fichiers obsolètes
rm src/database/database-sync.service.ts
rm src/database/database-pre-sync.service.ts
rm src/database/database-cleanup.service.ts
rm src/services/database-init.service.ts
```

### 3. Créer la Migration Initiale

```bash
npm run migration:generate -- --name=InitialSchema
```

### 4. Configurer les Variables d'Environnement

```bash
# .env.local
AUTO_RUN_MIGRATIONS=true
AUTO_RUN_SEEDS=true
```

## 📊 Monitoring et Métriques

### Health Check Response

```json
{
  "status": "healthy",
  "checks": {
    "connection": true,
    "migrations": true,
    "queries": true,
    "performance": true
  },
  "metrics": {
    "connectionCount": 5,
    "responseTime": 45,
    "lastMigration": "AddUserPreferences",
    "diskUsage": 1048576000
  },
  "warnings": [],
  "errors": []
}
```

### Métriques Disponibles

- **Temps de réponse** : Performance des requêtes
- **Connexions actives** : Utilisation du pool
- **Statut des migrations** : Cohérence du schéma
- **Utilisation disque** : Espace de stockage
- **Statistiques par table** : Analyse détaillée

## 🆘 Dépannage

### Problèmes Courants

#### Migration Bloquée
```bash
# Vérifier le statut
GET /api/admin/database/migrations/status

# Forcer l'exécution
POST /api/admin/database/migrations/run
```

#### Base de Données Lente
```bash
# Vérifier les statistiques
GET /api/admin/database/stats

# Analyser les requêtes lentes
# Logs automatiques pour requêtes > 1s
```

#### Problème de Connexion
```bash
# Vérifier la santé
GET /api/admin/database/health

# Vérifier les métriques
GET /api/admin/database/health/simple
```

## 🔮 Roadmap

### Phase 1 - Stabilisation ✅
- [x] Architecture robuste
- [x] Système de migrations
- [x] Monitoring de santé
- [x] Protection production

### Phase 2 - Optimisation
- [ ] Réplication read/write
- [ ] Partitioning des grandes tables
- [ ] Optimisation des requêtes
- [ ] Cache intelligent

### Phase 3 - Évolution
- [ ] Multi-tenant
- [ ] Audit trail complet
- [ ] Backup automatique
- [ ] Disaster recovery

---

**Cette architecture est production-ready et respecte les meilleures pratiques de l'industrie.**