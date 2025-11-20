# Scripts d'Injection et Utilitaires TopSteel

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Scripts d'injection de données](#scripts-dinjection-de-données)
3. [Scripts de maintenance](#scripts-de-maintenance)
4. [Scripts de test](#scripts-de-test)
5. [Scripts de migration](#scripts-de-migration)
6. [Scripts d'administration](#scripts-dadministration)
7. [Installation et exécution](#installation-et-exécution)
8. [Catalogue métallurgie](#catalogue-métallurgie)
9. [Personnalisation](#personnalisation)
10. [Troubleshooting](#troubleshooting)

## Vue d'ensemble

Les scripts TopSteel permettent l'injection de données, la maintenance, les tests et l'administration du système ERP. Ils sont essentiels pour initialiser le catalogue produits et maintenir le système.

### Localisation
```
apps/api/src/scripts/
├── injection/           # Scripts d'injection de données
├── maintenance/         # Scripts de maintenance
├── test/               # Scripts de test
├── migration/          # Scripts de migration
└── admin/              # Scripts d'administration
```

## Scripts d'injection de données

### Catalogue métallurgie complet

Le système inclut **550+ articles** de charpente métallique prêts à l'emploi.

#### Scripts principaux

| Script | Description | Articles | Durée |
|--------|-------------|----------|-------|
| `seed-system-settings.sql` | Paramètres système (matériaux, nuances) | - | 30s |
| `insert_ipe_profiles.sql` | Profilés IPE (80-600mm) | 54 | 1min |
| `insert_hea_heb_profiles.sql` | Profilés HEA/HEB | 36 | 45s |
| `inject-tubes-metalliques.sql` | Tubes métalliques | 65 | 1min |
| `insert-fers-plats-ronds.sql` | Fers plats et ronds | 257 | 2min |
| `inject-toles-metalliques.sql` | Tôles diverses | 120 | 1.5min |
| `insert_bardage_couverture.sql` | Bardage/couverture | 15 | 30s |

#### Script maître

```sql
-- master_inject_all_articles.sql
-- Exécute tous les scripts dans l'ordre correct

\echo '🚀 Injection complète du catalogue métallurgie TopSteel'
\echo '======================================================'

\i seed-system-settings.sql
\i insert_ipe_profiles.sql
\i insert_hea_heb_profiles.sql
\i inject-tubes-metalliques.sql
\i insert-fers-plats-ronds.sql
\i inject-toles-metalliques.sql
\i insert_bardage_couverture.sql

\echo '✅ Injection terminée avec succès!'
```

### Script TypeScript automatisé

```typescript
// inject-metallurgy-data.ts
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class MetallurgyDataInjector {
  private scripts = [
    'seed-system-settings.sql',
    'insert_ipe_profiles.sql',
    'insert_hea_heb_profiles.sql',
    'inject-tubes-metalliques.sql',
    'insert-fers-plats-ronds.sql',
    'inject-toles-metalliques.sql',
    'insert_bardage_couverture.sql'
  ];

  async inject(dataSource: DataSource): Promise<void> {
    console.log('🚀 Début injection catalogue métallurgie...');
    
    for (const script of this.scripts) {
      console.log(`📦 Exécution: ${script}`);
      const sql = fs.readFileSync(
        path.join(__dirname, script), 
        'utf8'
      );
      
      await dataSource.query(sql);
      console.log(`✅ ${script} exécuté avec succès`);
    }
    
    // Statistiques
    const stats = await this.getStatistics(dataSource);
    console.log('\n📊 Statistiques d\'injection:');
    console.log(`- Total articles: ${stats.totalArticles}`);
    console.log(`- Familles: ${stats.families.join(', ')}`);
    console.log(`- Prix moyen: ${stats.avgPrice}€`);
  }
}

// Utilisation
const injector = new MetallurgyDataInjector();
await injector.inject(dataSource);
```

## Scripts de maintenance

### Nettoyage et optimisation

```typescript
// cleanup-database.ts
export class DatabaseCleanup {
  async cleanupOrphanedRecords(): Promise<void> {
    // Suppression des enregistrements orphelins
    await this.dataSource.query(`
      DELETE FROM price_history 
      WHERE article_id NOT IN (SELECT id FROM articles)
    `);
    
    // Nettoyage des sessions expirées
    await this.dataSource.query(`
      DELETE FROM user_sessions 
      WHERE expires_at < NOW()
    `);
    
    // Optimisation des tables
    await this.dataSource.query(`
      VACUUM ANALYZE articles;
      VACUUM ANALYZE partners;
      VACUUM ANALYZE documents;
    `);
  }
  
  async rebuildIndexes(): Promise<void> {
    const indexes = [
      'idx_articles_reference',
      'idx_partners_code',
      'idx_documents_numero'
    ];
    
    for (const index of indexes) {
      await this.dataSource.query(`REINDEX INDEX ${index}`);
    }
  }
}
```

### Vérification d'intégrité

```typescript
// check-integrity.ts
interface IntegrityReport {
  table: string;
  issues: string[];
  recommendations: string[];
}

export class IntegrityChecker {
  async checkAll(): Promise<IntegrityReport[]> {
    const reports: IntegrityReport[] = [];
    
    // Vérifier les références manquantes
    reports.push(await this.checkReferences());
    
    // Vérifier les contraintes
    reports.push(await this.checkConstraints());
    
    // Vérifier les permissions
    reports.push(await this.checkPermissions());
    
    return reports;
  }
  
  async checkReferences(): Promise<IntegrityReport> {
    const issues = [];
    
    // Articles sans famille
    const orphanedArticles = await this.dataSource.query(`
      SELECT COUNT(*) as count 
      FROM articles 
      WHERE famille_id IS NULL
    `);
    
    if (orphanedArticles[0].count > 0) {
      issues.push(`${orphanedArticles[0].count} articles sans famille`);
    }
    
    return {
      table: 'articles',
      issues,
      recommendations: issues.length > 0 
        ? ['Exécuter le script fix-orphaned-articles.ts']
        : []
    };
  }
}
```

## Scripts de test

### Test d'authentification

```typescript
// test-auth-flow.ts
export class AuthFlowTester {
  async testCompleteFlow(): Promise<TestReport> {
    const tests = [
      this.testLogin(),
      this.testTokenRefresh(),
      this.testSocieteSelection(),
      this.testLogout()
    ];
    
    const results = await Promise.allSettled(tests);
    
    return {
      total: tests.length,
      passed: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      details: results
    };
  }
  
  private async testLogin(): Promise<void> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@topsteel.fr',
        password: 'Test123!'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.accessToken) {
      throw new Error('No access token received');
    }
  }
}
```

### Test de recherche

```typescript
// test-search-system.ts
export class SearchSystemTester {
  async runBenchmark(): Promise<BenchmarkResults> {
    const queries = [
      'acier',
      'IPE 200',
      'dupont',
      'facture 2024'
    ];
    
    const results = [];
    
    for (const query of queries) {
      const start = Date.now();
      
      const response = await fetch(`/api/search/global?q=${query}`);
      const data = await response.json();
      
      const duration = Date.now() - start;
      
      results.push({
        query,
        duration,
        resultCount: data.results.length,
        engine: data.engine
      });
    }
    
    return {
      queries: results,
      average: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      slowest: Math.max(...results.map(r => r.duration)),
      fastest: Math.min(...results.map(r => r.duration))
    };
  }
}
```

### Test de performance

```typescript
// benchmark-api.ts
export class APIBenchmark {
  async stressTest(endpoint: string, concurrency: number = 10): Promise<void> {
    const promises = [];
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.makeRequest(endpoint));
    }
    
    const start = Date.now();
    const results = await Promise.allSettled(promises);
    const duration = Date.now() - start;
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`📊 Stress Test Results:`);
    console.log(`- Endpoint: ${endpoint}`);
    console.log(`- Concurrency: ${concurrency}`);
    console.log(`- Duration: ${duration}ms`);
    console.log(`- Success rate: ${(successful/concurrency*100).toFixed(2)}%`);
    console.log(`- Avg response time: ${(duration/concurrency).toFixed(2)}ms`);
  }
}
```

## Scripts de migration

### Migration de base de données

```typescript
// run-migrations.ts
export class MigrationRunner {
  async runPending(): Promise<void> {
    const migrations = await this.dataSource.migrations;
    const executed = await this.dataSource.query(
      'SELECT name FROM migrations'
    );
    
    const pending = migrations.filter(m => 
      !executed.find(e => e.name === m.name)
    );
    
    console.log(`📦 ${pending.length} migrations en attente`);
    
    for (const migration of pending) {
      console.log(`▶️  Exécution: ${migration.name}`);
      
      try {
        await migration.up(this.dataSource.queryRunner);
        
        await this.dataSource.query(
          'INSERT INTO migrations (name, timestamp) VALUES ($1, $2)',
          [migration.name, new Date()]
        );
        
        console.log(`✅ ${migration.name} appliquée`);
      } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
        throw error;
      }
    }
  }
  
  async rollback(steps: number = 1): Promise<void> {
    const executed = await this.dataSource.query(
      'SELECT name FROM migrations ORDER BY timestamp DESC LIMIT $1',
      [steps]
    );
    
    for (const migration of executed) {
      const migrationClass = this.dataSource.migrations.find(
        m => m.name === migration.name
      );
      
      if (migrationClass?.down) {
        await migrationClass.down(this.dataSource.queryRunner);
        
        await this.dataSource.query(
          'DELETE FROM migrations WHERE name = $1',
          [migration.name]
        );
        
        console.log(`↩️  Rollback: ${migration.name}`);
      }
    }
  }
}
```

### Migration de données

```typescript
// migrate-legacy-data.ts
export class LegacyDataMigrator {
  async migrate(): Promise<MigrationReport> {
    const report: MigrationReport = {
      startTime: new Date(),
      tables: [],
      errors: []
    };
    
    try {
      // 1. Migration des clients
      await this.migrateClients(report);
      
      // 2. Migration des articles
      await this.migrateArticles(report);
      
      // 3. Migration des documents
      await this.migrateDocuments(report);
      
      // 4. Vérification d'intégrité
      await this.verifyIntegrity(report);
      
    } catch (error) {
      report.errors.push({
        phase: 'global',
        message: error.message
      });
    }
    
    report.endTime = new Date();
    report.duration = report.endTime - report.startTime;
    
    return report;
  }
  
  private async migrateClients(report: MigrationReport): Promise<void> {
    const oldClients = await this.legacyDb.query('SELECT * FROM customers');
    
    for (const old of oldClients) {
      const newClient = {
        code: old.customer_code,
        denomination: old.company_name,
        email: old.email,
        // Mapping des champs
      };
      
      await this.newDb.getRepository('Partner').save(newClient);
    }
    
    report.tables.push({
      name: 'clients',
      oldCount: oldClients.length,
      newCount: oldClients.length,
      status: 'success'
    });
  }
}
```

## Scripts d'administration

### Création d'utilisateur admin

```typescript
// create-admin-user.ts
import * as bcrypt from 'bcrypt';

export class AdminUserCreator {
  async createSuperAdmin(
    email: string,
    password: string
  ): Promise<void> {
    // Vérifier l'unicité
    const existing = await this.userRepository.findOne({
      where: { email }
    });
    
    if (existing) {
      throw new Error('Utilisateur déjà existant');
    }
    
    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    
    // Créer l'utilisateur
    const user = await this.userRepository.save({
      email,
      password_hash: hash,
      first_name: 'Super',
      last_name: 'Admin',
      roles: ['SUPER_ADMIN'],
      is_active: true,
      is_verified: true,
      email_verified_at: new Date()
    });
    
    // Attribuer toutes les permissions
    await this.assignAllPermissions(user.id);
    
    // Créer une société par défaut
    await this.createDefaultSociete(user.id);
    
    console.log(`✅ Super admin créé: ${email}`);
  }
}

// Utilisation
const creator = new AdminUserCreator();
await creator.createSuperAdmin('admin@topsteel.fr', 'admin123');
```

### Reset de mot de passe

```typescript
// reset-password.ts
export class PasswordResetter {
  async resetUserPassword(
    email: string,
    newPassword?: string
  ): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { email }
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Générer un mot de passe si non fourni
    const password = newPassword || this.generateSecurePassword();
    
    // Hasher
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);
    
    // Mettre à jour
    await this.userRepository.update(user.id, {
      password_hash: hash,
      password_changed_at: new Date(),
      failed_login_attempts: 0,
      locked_until: null
    });
    
    // Invalider les sessions
    await this.sessionService.invalidateAllUserSessions(user.id);
    
    console.log(`✅ Mot de passe réinitialisé pour: ${email}`);
    console.log(`📝 Nouveau mot de passe: ${password}`);
    
    return password;
  }
  
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < 16; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return password;
  }
}
```

### Monitoring système

```typescript
// system-health-check.ts
export class SystemHealthChecker {
  async checkAll(): Promise<HealthReport> {
    const checks = [
      this.checkDatabase(),
      this.checkRedis(),
      this.checkElasticsearch(),
      this.checkDiskSpace(),
      this.checkMemory(),
      this.checkAPIEndpoints()
    ];
    
    const results = await Promise.allSettled(checks);
    
    return {
      timestamp: new Date(),
      status: results.every(r => r.status === 'fulfilled') ? 'healthy' : 'degraded',
      services: {
        database: results[0],
        redis: results[1],
        elasticsearch: results[2],
        disk: results[3],
        memory: results[4],
        api: results[5]
      }
    };
  }
  
  private async checkDatabase(): Promise<ServiceHealth> {
    try {
      await this.dataSource.query('SELECT 1');
      
      const stats = await this.dataSource.query(`
        SELECT 
          pg_database_size(current_database()) as size,
          COUNT(*) as connections
        FROM pg_stat_activity
      `);
      
      return {
        status: 'healthy',
        latency: 5,
        details: {
          size: stats[0].size,
          connections: stats[0].connections
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}
```

## Installation et exécution

### Prérequis

```bash
# Base de données PostgreSQL
psql --version  # >= 13.0

# Node.js et npm
node --version  # >= 18.0
npm --version   # >= 8.0

# TypeScript
npm install -g typescript ts-node

# Variables d'environnement (.env)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=erp_topsteel
```

### Méthodes d'exécution

#### 1. Exécution TypeScript (Recommandée)

```bash
# Depuis apps/api
cd apps/api

# Script unique
npx ts-node src/scripts/inject-metallurgy-data.ts

# Avec paramètres
npx ts-node src/scripts/inject-metallurgy-data.ts --clean --verbose

# Via npm scripts
npm run scripts:inject-data
npm run scripts:maintenance
npm run scripts:test
```

#### 2. Exécution SQL directe

```bash
# Connexion PostgreSQL
psql -U postgres -d erp_topsteel

# Exécution script par script
\i /path/to/scripts/seed-system-settings.sql
\i /path/to/scripts/insert_ipe_profiles.sql

# Ou script maître
\i /path/to/scripts/master_inject_all_articles.sql
```

#### 3. Via Docker

```dockerfile
# Dockerfile pour scripts
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY scripts/ ./scripts/
COPY .env ./

CMD ["npm", "run", "scripts:inject-all"]
```

```bash
# Build et exécution
docker build -t topsteel-scripts .
docker run --network=host topsteel-scripts
```

## Catalogue métallurgie

### Données injectées

#### Matériaux et nuances

**Aciers de construction**
```sql
-- S235JR : Acier standard
-- S275JR : Résistance améliorée  
-- S355JR : Haute résistance
-- S460JR : Très haute résistance

-- Propriétés mécaniques complètes
- Limite élastique (Re)
- Résistance traction (Rm)
- Allongement (A%)
- Résilience (KV)
```

**Aciers inoxydables**
```sql
-- 304/304L : Austénitique standard
-- 316/316L : Résistance milieu marin
-- 430 : Ferritique

-- Composition chimique
- Chrome (Cr)
- Nickel (Ni)
- Molybdène (Mo)
```

**Aluminium**
```sql
-- 1050 : Pur commercial
-- 5754 : Marine
-- 6060 : Construction
-- 6082 : Haute résistance
```

#### Profilés métalliques (90 références)

**IPE (54 articles)**
```
Tailles : 80, 100, 120, 140, 160, 180, 200, 220, 240, 270, 300, 330, 360, 400, 450, 500, 550, 600
Nuances : S235JR, S275JR, S355JR
```

**HEA/HEB (36 articles)**
```
HEA : 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300
HEB : 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300
```

#### Tubes métalliques (65 références)

**Tubes ronds**
```
Diamètres : 20, 26.9, 33.7, 42.4, 48.3, 60.3, 76.1, 88.9, 114.3 mm
Épaisseurs : 2.0 à 5.0 mm
```

**Tubes carrés**
```
Sections : 20x20, 25x25, 30x30, 40x40, 50x50, 60x60, 80x80, 100x100 mm
Épaisseurs : 2.0 à 5.0 mm
```

**Tubes rectangulaires**
```
Sections : 40x20, 50x30, 60x40, 80x40, 100x50, 120x60, 150x100, 200x100 mm
```

#### Structure des références

```typescript
// Format des codes références
interface ReferenceFormat {
  profiles: `${TYPE}-${HEIGHT}-${GRADE}`,  // IPE-200-S235JR
  tubes: `TUBE-${SHAPE}-${DIM}-${GRADE}`,  // TUBE-RD-48.3x3-S235JR
  flats: `FER-${TYPE}-${DIM}-${GRADE}`,    // FER-PL-50x8-S275JR
  sheets: `TOLE-${GRADE}-${THICK}-${DIM}`  // TOLE-S235JR-3-2000x3000
}
```

## Personnalisation

### Ajout de nouveaux matériaux

```sql
-- Dans seed-system-settings.sql
INSERT INTO materials (code, designation, type, properties)
VALUES (
  'S690QL',
  'Acier haute limite élastique trempé',
  'ACIER',
  '{
    "Re": 690,
    "Rm": "770-940",
    "A": 14,
    "norme": "EN 10025-6"
  }'::jsonb
);
```

### Modification des prix

```typescript
// price-updater.ts
export class PriceUpdater {
  async updatePrices(
    famille: string,
    adjustment: number  // Pourcentage
  ): Promise<void> {
    await this.dataSource.query(`
      UPDATE articles
      SET 
        prix_vente_ht = prix_vente_ht * (1 + $1/100),
        updated_at = NOW()
      WHERE famille = $2
    `, [adjustment, famille]);
    
    console.log(`✅ Prix mis à jour pour ${famille} (+${adjustment}%)`);
  }
}
```

### Ajout de dimensions personnalisées

```typescript
// custom-dimensions.ts
export class CustomDimensionInjector {
  async addCustomIPE(height: number, nuance: string): Promise<void> {
    const reference = `IPE-${height}-${nuance}`;
    
    // Calculer les propriétés (formules empiriques)
    const properties = this.calculateIPEProperties(height);
    
    await this.articleRepository.save({
      reference,
      designation: `Poutrelle IPE ${height} ${nuance}`,
      famille: 'PROFILES_ACIER',
      sousFamille: 'IPE',
      caracteristiquesTechniques: properties,
      prix_achat_standard: this.calculatePrice(properties.poids),
      prix_vente_ht: this.calculatePrice(properties.poids) * 1.3
    });
  }
}
```

## Troubleshooting

### Problèmes courants

#### Base de données non trouvée
```bash
# Créer la base
createdb erp_topsteel

# Vérifier la connexion
psql -U postgres -d erp_topsteel -c "SELECT version();"
```

#### Société non trouvée
```sql
-- Créer une société par défaut
INSERT INTO societes (id, code, raison_sociale, status)
VALUES (
  gen_random_uuid(),
  'TOPSTEEL',
  'TopSteel SA',
  'ACTIVE'
);
```

#### Contrainte unique violée
```sql
-- Nettoyer avant injection
TRUNCATE articles CASCADE;

-- Ou mise à jour si existe
INSERT INTO articles (...) 
VALUES (...)
ON CONFLICT (reference) 
DO UPDATE SET ...;
```

#### Performance lente
```sql
-- Optimiser les insertions
BEGIN;
SET synchronous_commit = OFF;
-- Insertions...
COMMIT;

-- Créer les index après insertion
CREATE INDEX CONCURRENTLY idx_articles_famille 
ON articles(famille);
```

### Commandes de diagnostic

```bash
# Vérifier le nombre d'articles
psql -d erp_topsteel -c "
  SELECT famille, COUNT(*) 
  FROM articles 
  GROUP BY famille
  ORDER BY COUNT(*) DESC;
"

# Analyser les temps d'exécution
psql -d erp_topsteel -c "
  EXPLAIN ANALYZE 
  INSERT INTO articles ...;
"

# Monitorer les locks
psql -d erp_topsteel -c "
  SELECT * FROM pg_locks 
  WHERE NOT granted;
"

# Taille des tables
psql -d erp_topsteel -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Logs et debugging

```typescript
// Configuration des logs
export const SCRIPT_CONFIG = {
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: 'scripts.log',
    console: true
  },
  debug: process.env.DEBUG === 'true',
  dryRun: process.env.DRY_RUN === 'true'
};

// Logger personnalisé
class ScriptLogger {
  log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    if (SCRIPT_CONFIG.logging.console) {
      console.log(`[${timestamp}] ${level}: ${message}`);
    }
    
    if (SCRIPT_CONFIG.logging.file) {
      fs.appendFileSync(
        SCRIPT_CONFIG.logging.file,
        JSON.stringify(logEntry) + '\n'
      );
    }
  }
}
```

## Support

Pour toute question sur les scripts :
- Documentation : `/docs/development/scripts.md`
- Email : dev@topsteel.fr
- Slack : #topsteel-scripts

---

*Scripts TopSteel - Injection et maintenance*
*550+ articles de métallurgie prêts à l'emploi*
*Version 1.0.0 - Janvier 2025*