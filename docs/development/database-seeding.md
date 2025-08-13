# Guide de Seeding Automatique des Bases de Données - TopSteel ERP

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système de seed](#architecture-du-système-de-seed)
3. [Seeds automatiques au démarrage](#seeds-automatiques-au-démarrage)
4. [Catalogue métallurgie (550+ articles)](#catalogue-métallurgie-550-articles)
5. [Scripts d'injection SQL](#scripts-dinjection-sql)
6. [Seeds TypeScript](#seeds-typescript)
7. [Gestion des environnements](#gestion-des-environnements)
8. [Commandes et exécution](#commandes-et-exécution)
9. [Personnalisation des seeds](#personnalisation-des-seeds)
10. [Monitoring et validation](#monitoring-et-validation)
11. [Troubleshooting](#troubleshooting)

## Vue d'ensemble

Le système de seeding TopSteel permet l'initialisation automatique et manuelle des bases de données avec :
- **Données système** : Paramètres, configurations, menus
- **Catalogue métallurgie** : 550+ articles de charpente métallique
- **Données de référence** : Matériaux, nuances, dimensions standards
- **Utilisateurs** : Compte admin par défaut
- **Données de test** : Pour développement et QA

### Points clés
- ✅ **Seeds automatiques** au démarrage de l'application
- ✅ **Détection intelligente** pour éviter les doublons
- ✅ **Transaction sécurisée** pour l'intégrité des données
- ✅ **Support multi-environnement** (dev, staging, prod)
- ✅ **Scripts modulaires** pour injection ciblée

## Architecture du système de seed

### Structure des fichiers

```
apps/api/src/
├── core/
│   ├── database/
│   │   └── services/
│   │       └── seeder.service.ts      # Service principal de seeding
│   └── services/
│       └── database-startup.service.ts # Initialisation au démarrage
│
└── scripts/
    ├── inject-metallurgy-data.ts      # Script principal métallurgie
    ├── seed-system-settings.sql       # Paramètres système
    ├── insert_ipe_profiles.sql        # Profilés IPE
    ├── insert_hea_heb_profiles.sql    # Profilés HEA/HEB
    ├── inject-tubes-metalliques.sql   # Tubes métalliques
    ├── insert-fers-plats-ronds.sql    # Fers plats et ronds
    ├── inject-toles-metalliques.sql   # Tôles
    └── insert_bardage_couverture.sql  # Bardage/couverture
```

### Architecture des services

```typescript
// Hiérarchie des services de seeding
SeederService
├── checkSeedsStatus()      // Vérification état
├── runSeeds()              // Exécution automatique
├── seedSystemParameters()  // Paramètres système
├── seedDefaultUsers()      // Utilisateurs par défaut
└── seedMenuConfiguration() // Configuration menus

MetallurgyDataInjector
├── initialize()            // Connexion DB
├── executeScript()        // Exécution SQL
├── injectAllData()       // Injection complète
└── generateStatistics()  // Rapports
```

## Seeds automatiques au démarrage

### Service de seeding automatique

```typescript
// seeder.service.ts
@Injectable()
export class SeederService {
  async runSeeds(): Promise<void> {
    // 1. Vérification du statut
    const seedsStatus = await this.checkSeedsStatus();
    
    if (seedsStatus.completed) {
      this.logger.log('✅ Seeds déjà exécutés');
      return;
    }

    // 2. Exécution dans une transaction
    await this.dataSource.transaction(async (manager) => {
      await this.seedSystemParameters(manager);
      await this.seedDefaultUsers(manager);
      await this.seedMenuConfiguration(manager);
      await this.markSeedsAsCompleted(manager);
    });
  }
}
```

### Table de tracking des seeds

```sql
CREATE TABLE seeds_status (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checksum VARCHAR(64),              -- Hash du script
  records_created INTEGER,
  execution_time_ms INTEGER,
  environment VARCHAR(50),
  metadata JSONB
);

-- Index pour performances
CREATE INDEX idx_seeds_status_name ON seeds_status(name);
CREATE INDEX idx_seeds_status_executed ON seeds_status(executed_at DESC);
```

### Données injectées automatiquement

#### 1. Paramètres système

```typescript
const systemParameters = [
  // Application
  { key: 'app_name', value: 'TopSteel ERP', category: 'general' },
  { key: 'app_version', value: '1.0.0', category: 'general' },
  { key: 'maintenance_mode', value: 'false', category: 'system' },
  
  // Fichiers
  { key: 'max_file_size', value: '10485760', category: 'files' },
  { key: 'allowed_extensions', value: 'pdf,jpg,png,xlsx', category: 'files' },
  
  // Email
  { key: 'smtp_host', value: 'localhost', category: 'email' },
  { key: 'smtp_port', value: '587', category: 'email' },
  
  // Sécurité
  { key: 'password_min_length', value: '8', category: 'security' },
  { key: 'session_timeout', value: '3600', category: 'security' },
  
  // Business
  { key: 'default_currency', value: 'EUR', category: 'business' },
  { key: 'default_tax_rate', value: '20', category: 'business' }
];
```

#### 2. Utilisateur admin par défaut

```typescript
// Création automatique au premier démarrage
{
  email: 'admin@topsteel.tech',
  password: 'TopSteel44!',  // À changer immédiatement
  role: 'SUPER_ADMIN',
  firstName: 'Admin',
  lastName: 'System',
  isActive: true,
  isVerified: true
}
```

#### 3. Configuration des menus

```typescript
const defaultMenus = [
  { 
    key: 'dashboard', 
    title: 'Tableau de bord', 
    icon: 'dashboard',
    path: '/dashboard',
    order: 1 
  },
  { 
    key: 'clients', 
    title: 'Clients', 
    icon: 'users',
    path: '/clients',
    order: 2 
  },
  { 
    key: 'articles', 
    title: 'Articles', 
    icon: 'package',
    path: '/articles',
    order: 3 
  }
  // ... autres menus
];
```

## Catalogue métallurgie (550+ articles)

### Vue d'ensemble du catalogue

| Catégorie | Nombre d'articles | Description |
|-----------|------------------|-------------|
| **Profilés IPE** | 54 | Poutrelles I européennes (80-600mm) |
| **Profilés HEA/HEB** | 36 | Poutrelles H européennes |
| **Tubes métalliques** | 65 | Ronds, carrés, rectangulaires |
| **Fers plats et ronds** | 257 | Toutes dimensions standards |
| **Tôles métalliques** | 120 | Acier, inox, alu, spéciales |
| **Bardage/Couverture** | 15 | Bacs acier, panneaux sandwich |
| **TOTAL** | **547** | Articles complets avec caractéristiques |

### Script d'injection principal

```typescript
// inject-metallurgy-data.ts
class MetallurgyDataInjector {
  private scripts = [
    'seed-system-settings.sql',      // Matériaux et nuances
    'insert_ipe_profiles.sql',       // IPE 80 à 600
    'insert_hea_heb_profiles.sql',   // HEA/HEB 100 à 300
    'inject-tubes-metalliques.sql',  // Tubes divers
    'insert-fers-plats-ronds.sql',   // Fers plats et ronds
    'inject-toles-metalliques.sql',  // Tôles diverses
    'insert_bardage_couverture.sql'  // Bardage et couverture
  ];

  async injectAllData(): Promise<void> {
    console.log('🚀 Injection catalogue métallurgie...');
    
    for (const script of this.scripts) {
      const result = await this.executeScript(script);
      console.log(`✅ ${script}: ${result.articlesCreated} articles`);
    }
    
    const stats = await this.generateStatistics();
    console.log(`📊 Total: ${stats.totalArticles} articles créés`);
  }
}
```

### Structure d'un article

```json
{
  "reference": "IPE-200-S235JR",
  "designation": "Poutrelle IPE 200 S235JR",
  "famille": "PROFILES_ACIER",
  "sousFamille": "IPE",
  "unite": "ML",
  "prixAchat": 15.50,
  "prixVente": 22.40,
  "caracteristiquesTechniques": {
    "hauteur": 200,
    "largeur": 100,
    "epaisseurAme": 5.6,
    "epaisseurAile": 8.5,
    "poids": 22.4,
    "section": 28.5,
    "momentInertieX": 1943,
    "momentInertieY": 142,
    "moduleResistanceX": 194,
    "moduleResistanceY": 28.5,
    "rayonGiration": 8.26,
    "norme": "EN 10025-2"
  },
  "stockMinimum": 10,
  "stockMaximum": 100,
  "delaiAppro": 7,
  "fournisseurPrincipal": "ARCELOR",
  "tags": ["structure", "charpente", "IPE", "acier"]
}
```

## Scripts d'injection SQL

### Matériaux et nuances (seed-system-settings.sql)

```sql
-- Nuances d'acier de construction
INSERT INTO materials (code, designation, type, properties) VALUES
('S235JR', 'Acier standard S235JR', 'STEEL', '{
  "density": 7850,
  "yieldStrength": 235,
  "tensileStrength": 360,
  "elongation": 26,
  "standards": ["EN 10025-2"],
  "weldability": "excellent"
}'::jsonb),

('S275JR', 'Acier S275JR', 'STEEL', '{
  "density": 7850,
  "yieldStrength": 275,
  "tensileStrength": 410,
  "elongation": 23
}'::jsonb),

('S355JR', 'Acier haute résistance S355JR', 'STEEL', '{
  "density": 7850,
  "yieldStrength": 355,
  "tensileStrength": 490,
  "elongation": 22
}'::jsonb);

-- Aciers inoxydables
INSERT INTO materials (code, designation, type, properties) VALUES
('304L', 'Inox 304L', 'STAINLESS', '{
  "density": 8000,
  "composition": {"Cr": 18, "Ni": 8, "C": 0.03},
  "corrosionResistance": "excellent",
  "magnetic": false
}'::jsonb),

('316L', 'Inox 316L marine', 'STAINLESS', '{
  "density": 8000,
  "composition": {"Cr": 16, "Ni": 10, "Mo": 2, "C": 0.03},
  "corrosionResistance": "superior",
  "magnetic": false
}'::jsonb);
```

### Profilés IPE (insert_ipe_profiles.sql)

```sql
-- Génération des profilés IPE avec boucle
DO $$
DECLARE
  heights INTEGER[] := ARRAY[80,100,120,140,160,180,200,220,240,270,300,330,360,400,450,500,550,600];
  grades TEXT[] := ARRAY['S235JR', 'S275JR', 'S355JR'];
  h INTEGER;
  g TEXT;
  weight DECIMAL;
  price DECIMAL;
BEGIN
  FOREACH h IN ARRAY heights LOOP
    FOREACH g IN ARRAY grades LOOP
      -- Calcul du poids théorique (formule simplifiée)
      weight := h * 0.112;
      
      -- Calcul du prix basé sur le poids et la nuance
      price := weight * CASE 
        WHEN g = 'S235JR' THEN 0.85
        WHEN g = 'S275JR' THEN 0.95
        WHEN g = 'S355JR' THEN 1.10
      END;
      
      INSERT INTO articles (
        reference,
        designation,
        famille,
        sous_famille,
        unite,
        prix_achat,
        prix_vente,
        caracteristiques_techniques,
        stock_minimum,
        created_at
      ) VALUES (
        'IPE-' || h || '-' || g,
        'Poutrelle IPE ' || h || ' ' || g,
        'PROFILES_ACIER',
        'IPE',
        'ML',
        price,
        price * 1.45,
        jsonb_build_object(
          'hauteur', h,
          'poids', weight,
          'nuance', g,
          'norme', 'EN 10025-2'
        ),
        5,
        NOW()
      ) ON CONFLICT (reference) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
```

### Tubes métalliques (inject-tubes-metalliques.sql)

```sql
-- Tubes ronds
WITH tube_dimensions AS (
  SELECT * FROM (VALUES
    (20, 2.0), (26.9, 2.3), (33.7, 2.6),
    (42.4, 2.6), (48.3, 2.9), (60.3, 2.9),
    (76.1, 2.9), (88.9, 3.2), (114.3, 3.6)
  ) AS t(diameter, thickness)
)
INSERT INTO articles (reference, designation, famille, caracteristiques_techniques)
SELECT 
  'TUBE-RD-' || diameter || 'x' || thickness || '-S235JR',
  'Tube rond Ø' || diameter || ' ép.' || thickness || 'mm S235JR',
  'TUBES_PROFILES',
  jsonb_build_object(
    'type', 'rond',
    'diametre', diameter,
    'epaisseur', thickness,
    'poids', ROUND((diameter - thickness) * thickness * 0.02466, 2)
  )
FROM tube_dimensions;

-- Tubes carrés
WITH square_dimensions AS (
  SELECT * FROM (VALUES
    (20, 20, 2), (25, 25, 2.5), (30, 30, 3),
    (40, 40, 3), (50, 50, 3), (60, 60, 4),
    (80, 80, 4), (100, 100, 5)
  ) AS t(width, height, thickness)
)
INSERT INTO articles (reference, designation, famille, caracteristiques_techniques)
SELECT 
  'TUBE-CA-' || width || 'x' || height || 'x' || thickness || '-S235JR',
  'Tube carré ' || width || 'x' || height || ' ép.' || thickness || 'mm S235JR',
  'TUBES_PROFILES',
  jsonb_build_object(
    'type', 'carre',
    'largeur', width,
    'hauteur', height,
    'epaisseur', thickness,
    'poids', ROUND(((width + height) * 2 - thickness * 4) * thickness * 0.00785, 2)
  )
FROM square_dimensions;
```

## Seeds TypeScript

### Service d'injection TypeScript

```typescript
// metallurgy-injection-orchestrator.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MetallurgyInjectionService {
  private readonly logger = new Logger(MetallurgyInjectionService.name);

  constructor(
    @InjectDataSource('tenant')
    private readonly dataSource: DataSource
  ) {}

  async injectCatalogue(options: InjectionOptions = {}): Promise<InjectionReport> {
    const report: InjectionReport = {
      startTime: new Date(),
      categories: [],
      totalArticles: 0,
      errors: []
    };

    try {
      // Transaction pour tout ou rien
      await this.dataSource.transaction(async manager => {
        // 1. Injection des matériaux
        await this.injectMaterials(manager, report);
        
        // 2. Injection des profilés
        await this.injectProfiles(manager, report);
        
        // 3. Injection des tubes
        await this.injectTubes(manager, report);
        
        // 4. Injection des tôles
        await this.injectSheets(manager, report);
        
        // 5. Validation finale
        await this.validateInjection(manager, report);
      });

      report.endTime = new Date();
      report.duration = report.endTime - report.startTime;
      report.status = 'success';

    } catch (error) {
      report.status = 'error';
      report.errors.push({
        phase: 'global',
        message: error.message,
        stack: error.stack
      });
    }

    return report;
  }

  private async injectProfiles(
    manager: EntityManager, 
    report: InjectionReport
  ): Promise<void> {
    const profiles = [
      new IPEProfileInjector(manager),
      new HEAProfileInjector(manager),
      new HEBProfileInjector(manager),
      new UPNProfileInjector(manager),
      new IPNProfileInjector(manager)
    ];

    for (const injector of profiles) {
      const result = await injector.inject();
      report.categories.push(result);
      report.totalArticles += result.count;
    }
  }
}
```

### Injector de base abstraite

```typescript
// base-article-injector.ts
export abstract class BaseArticleInjector {
  protected logger = new Logger(this.constructor.name);
  
  constructor(
    protected manager: EntityManager,
    protected options: InjectorOptions = {}
  ) {}

  abstract getArticles(): ArticleData[];
  abstract getCategoryName(): string;

  async inject(): Promise<InjectionResult> {
    const articles = this.getArticles();
    const category = this.getCategoryName();
    
    this.logger.log(`📦 Injection ${category}: ${articles.length} articles`);
    
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        const existing = await this.manager.findOne(Article, {
          where: { reference: article.reference }
        });

        if (existing && !this.options.overwrite) {
          this.logger.debug(`⏭️ Article existe: ${article.reference}`);
          continue;
        }

        if (existing) {
          await this.manager.update(Article, existing.id, article);
          updated++;
        } else {
          await this.manager.save(Article, article);
          created++;
        }

      } catch (error) {
        this.logger.error(`❌ Erreur ${article.reference}: ${error.message}`);
        errors++;
      }
    }

    return {
      category,
      total: articles.length,
      created,
      updated,
      errors
    };
  }

  protected calculatePrice(
    weight: number, 
    material: string, 
    complexity: number = 1
  ): number {
    const basePrices = {
      'S235JR': 0.85,
      'S275JR': 0.95,
      'S355JR': 1.10,
      '304L': 3.50,
      '316L': 4.20
    };

    const basePrice = basePrices[material] || 1.0;
    return Math.round(weight * basePrice * complexity * 100) / 100;
  }
}
```

### Exemple d'injector spécifique

```typescript
// ipe-profiles-injector.ts
export class IPEProfileInjector extends BaseArticleInjector {
  getCategoryName(): string {
    return 'Profilés IPE';
  }

  getArticles(): ArticleData[] {
    const heights = [80, 100, 120, 140, 160, 180, 200, 220, 240, 270, 300, 330, 360, 400, 450, 500, 550, 600];
    const materials = ['S235JR', 'S275JR', 'S355JR'];
    const articles: ArticleData[] = [];

    // Données techniques réelles des IPE
    const ipeData = {
      80: { weight: 6.0, width: 46, webThickness: 3.8, flangeThickness: 5.2 },
      100: { weight: 8.1, width: 55, webThickness: 4.1, flangeThickness: 5.7 },
      120: { weight: 10.4, width: 64, webThickness: 4.4, flangeThickness: 6.3 },
      140: { weight: 12.9, width: 73, webThickness: 4.7, flangeThickness: 6.9 },
      160: { weight: 15.8, width: 82, webThickness: 5.0, flangeThickness: 7.4 },
      180: { weight: 18.8, width: 91, webThickness: 5.3, flangeThickness: 8.0 },
      200: { weight: 22.4, width: 100, webThickness: 5.6, flangeThickness: 8.5 },
      220: { weight: 26.2, width: 110, webThickness: 5.9, flangeThickness: 9.2 },
      240: { weight: 30.7, width: 120, webThickness: 6.2, flangeThickness: 9.8 },
      270: { weight: 36.1, width: 135, webThickness: 6.6, flangeThickness: 10.2 },
      300: { weight: 42.2, width: 150, webThickness: 7.1, flangeThickness: 10.7 },
      330: { weight: 49.1, width: 160, webThickness: 7.5, flangeThickness: 11.5 },
      360: { weight: 57.1, width: 170, webThickness: 8.0, flangeThickness: 12.7 },
      400: { weight: 66.3, width: 180, webThickness: 8.6, flangeThickness: 13.5 },
      450: { weight: 77.6, width: 190, webThickness: 9.4, flangeThickness: 14.6 },
      500: { weight: 90.7, width: 200, webThickness: 10.2, flangeThickness: 16.0 },
      550: { weight: 106.0, width: 210, webThickness: 11.1, flangeThickness: 17.2 },
      600: { weight: 122.0, width: 220, webThickness: 12.0, flangeThickness: 19.0 }
    };

    for (const height of heights) {
      for (const material of materials) {
        const data = ipeData[height];
        const price = this.calculatePrice(data.weight, material, 1.2);

        articles.push({
          reference: `IPE-${height}-${material}`,
          designation: `Poutrelle IPE ${height} ${material}`,
          famille: 'PROFILES_ACIER',
          sousFamille: 'IPE',
          unite: 'ML',
          prixAchat: price,
          prixVente: price * 1.45,
          caracteristiquesTechniques: {
            hauteur: height,
            largeur: data.width,
            epaisseurAme: data.webThickness,
            epaisseurAile: data.flangeThickness,
            poids: data.weight,
            nuance: material,
            norme: 'EN 10025-2'
          },
          stockMinimum: 5,
          stockMaximum: 50,
          delaiAppro: 7
        });
      }
    }

    return articles;
  }
}
```

## Gestion des environnements

### Configuration par environnement

```typescript
// seed.config.ts
export interface SeedConfig {
  environment: 'development' | 'staging' | 'production';
  autoSeed: boolean;
  seedModules: string[];
  options: SeedOptions;
}

export const SEED_CONFIGS: Record<string, SeedConfig> = {
  development: {
    environment: 'development',
    autoSeed: true,
    seedModules: [
      'system-parameters',
      'default-users',
      'menu-configuration',
      'metallurgy-catalogue',
      'test-data'
    ],
    options: {
      overwrite: true,
      verbose: true,
      testData: true
    }
  },
  
  staging: {
    environment: 'staging',
    autoSeed: true,
    seedModules: [
      'system-parameters',
      'default-users',
      'menu-configuration',
      'metallurgy-catalogue'
    ],
    options: {
      overwrite: false,
      verbose: true,
      testData: false
    }
  },
  
  production: {
    environment: 'production',
    autoSeed: false,  // Manuel uniquement
    seedModules: [
      'system-parameters',
      'menu-configuration'
    ],
    options: {
      overwrite: false,
      verbose: false,
      testData: false,
      requireConfirmation: true
    }
  }
};
```

### Variables d'environnement

```env
# Seeding Configuration
SEED_AUTO_RUN=true              # Exécution automatique au démarrage
SEED_MODULES=all                # Modules à seeder (all, system, catalogue, test)
SEED_OVERWRITE=false            # Écraser les données existantes
SEED_VERBOSE=true               # Logs détaillés
SEED_DRY_RUN=false             # Mode simulation

# Catalogue Configuration
CATALOGUE_PRICE_MULTIPLIER=1.0  # Multiplicateur de prix global
CATALOGUE_DEFAULT_SUPPLIER=ARCELOR
CATALOGUE_DEFAULT_CURRENCY=EUR
CATALOGUE_INCLUDE_TEST_DATA=false

# Database Seeds
DB_SEED_TIMEOUT=300000          # Timeout en ms (5 min)
DB_SEED_BATCH_SIZE=100          # Taille des batchs d'insertion
DB_SEED_TRANSACTION=true        # Utiliser une transaction
```

## Commandes et exécution

### Commandes npm

```json
// package.json
{
  "scripts": {
    // Seeds automatiques
    "seed": "ts-node src/scripts/seed-all.ts",
    "seed:dev": "NODE_ENV=development npm run seed",
    "seed:prod": "NODE_ENV=production npm run seed -- --confirm",
    
    // Seeds spécifiques
    "seed:system": "ts-node src/scripts/seed-system-parameters.ts",
    "seed:users": "ts-node src/scripts/seed-default-users.ts",
    "seed:catalogue": "ts-node src/scripts/inject-metallurgy-data.ts",
    "seed:test": "ts-node src/scripts/seed-test-data.ts",
    
    // Maintenance
    "seed:reset": "ts-node src/scripts/reset-seeds.ts",
    "seed:validate": "ts-node src/scripts/validate-seeds.ts",
    "seed:status": "ts-node src/scripts/check-seed-status.ts"
  }
}
```

### CLI personnalisé

```typescript
// seed-cli.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { SeederOrchestrator } from './seeder-orchestrator';

const program = new Command();

program
  .name('topsteel-seed')
  .description('CLI pour gérer les seeds TopSteel')
  .version('1.0.0');

// Commande principale
program
  .command('run [modules...]')
  .description('Exécuter les seeds')
  .option('-e, --env <env>', 'Environnement', 'development')
  .option('-o, --overwrite', 'Écraser les données existantes')
  .option('-d, --dry-run', 'Mode simulation')
  .option('-v, --verbose', 'Logs détaillés')
  .action(async (modules, options) => {
    const seeder = new SeederOrchestrator(options);
    await seeder.run(modules || ['all']);
  });

// Status
program
  .command('status')
  .description('Vérifier le statut des seeds')
  .action(async () => {
    const seeder = new SeederOrchestrator();
    const status = await seeder.getStatus();
    console.table(status);
  });

// Reset
program
  .command('reset [modules...]')
  .description('Reset des seeds')
  .option('-f, --force', 'Forcer sans confirmation')
  .action(async (modules, options) => {
    if (!options.force) {
      const confirm = await promptConfirm('Confirmer le reset?');
      if (!confirm) return;
    }
    
    const seeder = new SeederOrchestrator();
    await seeder.reset(modules);
  });

// Validation
program
  .command('validate')
  .description('Valider les données seedées')
  .action(async () => {
    const seeder = new SeederOrchestrator();
    const validation = await seeder.validate();
    
    if (validation.isValid) {
      console.log('✅ Toutes les seeds sont valides');
    } else {
      console.error('❌ Erreurs de validation:', validation.errors);
      process.exit(1);
    }
  });

program.parse();
```

### Utilisation du CLI

```bash
# Installation globale
npm install -g @topsteel/seed-cli

# Exécution de tous les seeds
topsteel-seed run

# Seeds spécifiques
topsteel-seed run system users catalogue

# Mode dry-run
topsteel-seed run --dry-run --verbose

# Vérifier le statut
topsteel-seed status

# Reset avec confirmation
topsteel-seed reset catalogue

# Validation
topsteel-seed validate
```

## Personnalisation des seeds

### Ajout d'un nouveau seed module

```typescript
// custom-seed.module.ts
import { SeedModule } from './seed-module.interface';

export class CustomSeedModule implements SeedModule {
  name = 'custom-data';
  description = 'Seeds personnalisées pour données métier';
  order = 100;  // Ordre d'exécution
  
  async shouldRun(context: SeedContext): Promise<boolean> {
    // Logique pour déterminer si ce seed doit s'exécuter
    const exists = await context.manager.query(
      'SELECT COUNT(*) FROM custom_table'
    );
    return exists[0].count === 0;
  }
  
  async run(context: SeedContext): Promise<SeedResult> {
    const startTime = Date.now();
    let recordsCreated = 0;
    
    try {
      // Injection des données
      const data = this.generateData();
      
      for (const item of data) {
        await context.manager.save('CustomEntity', item);
        recordsCreated++;
      }
      
      return {
        success: true,
        recordsCreated,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  async validate(context: SeedContext): Promise<ValidationResult> {
    // Validation des données injectées
    const count = await context.manager.count('CustomEntity');
    const expectedCount = 100;
    
    return {
      isValid: count === expectedCount,
      errors: count !== expectedCount 
        ? [`Expected ${expectedCount} records, found ${count}`]
        : []
    };
  }
  
  async rollback(context: SeedContext): Promise<void> {
    // Nettoyage en cas d'erreur
    await context.manager.query('TRUNCATE TABLE custom_table CASCADE');
  }
}
```

### Configuration des prix personnalisés

```typescript
// price-config.ts
export interface PriceConfiguration {
  baseMultiplier: number;
  marginByCategory: Record<string, number>;
  supplierDiscounts: Record<string, number>;
  volumeDiscounts: VolumeDiscount[];
}

export class PriceCalculator {
  constructor(private config: PriceConfiguration) {}
  
  calculatePrice(
    article: ArticleData,
    options: PriceOptions = {}
  ): PriceResult {
    let basePrice = article.weight * this.getMaterialPrice(article.material);
    
    // Appliquer le multiplicateur
    basePrice *= this.config.baseMultiplier;
    
    // Marge par catégorie
    const margin = this.config.marginByCategory[article.famille] || 1.3;
    const sellPrice = basePrice * margin;
    
    // Remises fournisseur
    if (options.supplier) {
      const discount = this.config.supplierDiscounts[options.supplier] || 0;
      basePrice *= (1 - discount);
    }
    
    // Remises volume
    if (options.quantity) {
      const volumeDiscount = this.getVolumeDiscount(options.quantity);
      basePrice *= (1 - volumeDiscount);
    }
    
    return {
      cost: Math.round(basePrice * 100) / 100,
      price: Math.round(sellPrice * 100) / 100,
      margin: (sellPrice - basePrice) / basePrice * 100
    };
  }
  
  private getMaterialPrice(material: string): number {
    const prices = {
      'S235JR': 850,   // €/tonne
      'S275JR': 950,
      'S355JR': 1100,
      '304L': 3500,
      '316L': 4200,
      'ALU-6060': 2200
    };
    
    return (prices[material] || 1000) / 1000; // €/kg
  }
}
```

### Extension du catalogue

```typescript
// catalogue-extension.ts
export class CatalogueExtension {
  async addCustomProducts(): Promise<void> {
    const customProducts = [
      {
        category: 'SPECIAL',
        generator: this.generateSpecialProfiles
      },
      {
        category: 'COMPOSITES',
        generator: this.generateComposites
      },
      {
        category: 'FASTENERS',
        generator: this.generateFasteners
      }
    ];
    
    for (const product of customProducts) {
      const articles = await product.generator();
      await this.injectArticles(articles);
    }
  }
  
  private generateSpecialProfiles(): ArticleData[] {
    // Profilés spéciaux sur mesure
    return [
      {
        reference: 'PROFILE-SPECIAL-001',
        designation: 'Profilé Z 200x100x50x3',
        famille: 'PROFILES_SPECIAUX',
        caracteristiques: {
          type: 'Z',
          dimensions: '200x100x50x3',
          longueurStandard: 6000
        }
      }
      // ... autres profilés
    ];
  }
}
```

## Monitoring et validation

### Service de monitoring

```typescript
// seed-monitor.service.ts
@Injectable()
export class SeedMonitorService {
  private metrics: SeedMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageDuration: 0,
    lastExecution: null
  };

  async monitorExecution(
    seedName: string,
    executor: () => Promise<any>
  ): Promise<SeedExecutionResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      this.logger.log(`🚀 Démarrage seed: ${seedName}`);
      
      const result = await executor();
      
      const duration = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;
      
      this.updateMetrics(seedName, true, duration);
      
      this.logger.log(`✅ Seed terminé: ${seedName} (${duration}ms)`);
      
      return {
        success: true,
        seedName,
        duration,
        memoryUsed,
        result
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.updateMetrics(seedName, false, duration);
      
      this.logger.error(`❌ Seed échoué: ${seedName}`, error);
      
      // Alerting
      await this.sendAlert({
        type: 'SEED_FAILURE',
        seedName,
        error: error.message,
        timestamp: new Date()
      });
      
      throw error;
    }
  }
  
  async validateSeeds(): Promise<ValidationReport> {
    const validators = [
      this.validateSystemParameters,
      this.validateUsers,
      this.validateCatalogue,
      this.validateIntegrity
    ];
    
    const results = await Promise.all(
      validators.map(v => v.call(this))
    );
    
    return {
      timestamp: new Date(),
      validators: results,
      isValid: results.every(r => r.isValid),
      summary: this.generateSummary(results)
    };
  }
  
  private async validateCatalogue(): Promise<ValidationResult> {
    const errors: string[] = [];
    
    // Vérifier le nombre d'articles
    const articleCount = await this.manager.count(Article);
    if (articleCount < 500) {
      errors.push(`Catalogue incomplet: ${articleCount}/550+ articles`);
    }
    
    // Vérifier les familles
    const families = await this.manager.query(`
      SELECT famille, COUNT(*) as count 
      FROM articles 
      GROUP BY famille
    `);
    
    const expectedFamilies = [
      'PROFILES_ACIER',
      'TUBES_PROFILES', 
      'ACIERS_LONGS',
      'TOLES_PLAQUES',
      'COUVERTURE_BARDAGE'
    ];
    
    for (const expected of expectedFamilies) {
      const family = families.find(f => f.famille === expected);
      if (!family || family.count === 0) {
        errors.push(`Famille manquante: ${expected}`);
      }
    }
    
    // Vérifier l'intégrité des prix
    const invalidPrices = await this.manager.query(`
      SELECT reference FROM articles 
      WHERE prix_vente <= 0 OR prix_achat <= 0
    `);
    
    if (invalidPrices.length > 0) {
      errors.push(`Prix invalides: ${invalidPrices.length} articles`);
    }
    
    return {
      name: 'Catalogue Validation',
      isValid: errors.length === 0,
      errors,
      stats: {
        totalArticles: articleCount,
        families: families.length
      }
    };
  }
}
```

### Dashboard de monitoring

```typescript
// seed-dashboard.ts
export class SeedDashboard {
  async generateReport(): Promise<DashboardData> {
    return {
      overview: {
        lastSeedRun: await this.getLastSeedRun(),
        totalSeeds: await this.getTotalSeeds(),
        pendingSeeds: await this.getPendingSeeds(),
        healthScore: await this.calculateHealthScore()
      },
      
      statistics: {
        articlesCount: await this.getArticlesCount(),
        usersCount: await this.getUsersCount(),
        parametersCount: await this.getParametersCount()
      },
      
      performance: {
        averageSeedTime: await this.getAverageSeedTime(),
        slowestSeeds: await this.getSlowestSeeds(),
        memoryUsage: process.memoryUsage()
      },
      
      alerts: await this.getActiveAlerts(),
      
      recommendations: await this.generateRecommendations()
    };
  }
  
  async generateRecommendations(): Promise<string[]> {
    const recommendations = [];
    
    // Vérifier les seeds manquants
    const pendingSeeds = await this.getPendingSeeds();
    if (pendingSeeds.length > 0) {
      recommendations.push(
        `Exécuter les seeds manquants: ${pendingSeeds.join(', ')}`
      );
    }
    
    // Vérifier les performances
    const avgTime = await this.getAverageSeedTime();
    if (avgTime > 5000) {
      recommendations.push(
        'Optimiser les seeds - temps moyen > 5s'
      );
    }
    
    // Vérifier l'intégrité
    const validation = await this.validateIntegrity();
    if (!validation.isValid) {
      recommendations.push(
        'Corriger les problèmes d\'intégrité détectés'
      );
    }
    
    return recommendations;
  }
}
```

## Troubleshooting

### Problèmes courants

#### Seeds non exécutés au démarrage

```typescript
// Diagnostic
async function diagnoseSeedIssue() {
  // 1. Vérifier la configuration
  console.log('SEED_AUTO_RUN:', process.env.SEED_AUTO_RUN);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // 2. Vérifier la table de tracking
  const status = await db.query('SELECT * FROM seeds_status');
  console.table(status);
  
  // 3. Vérifier les logs
  const logs = await db.query(`
    SELECT * FROM application_logs 
    WHERE message LIKE '%seed%' 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  console.table(logs);
  
  // 4. Forcer l'exécution
  const seeder = new SeederService();
  await seeder.resetSeeds();
  await seeder.runSeeds();
}
```

#### Doublons lors de l'injection

```sql
-- Identifier les doublons
SELECT reference, COUNT(*) 
FROM articles 
GROUP BY reference 
HAVING COUNT(*) > 1;

-- Nettoyer les doublons (garder le plus récent)
DELETE FROM articles a1
USING articles a2
WHERE a1.reference = a2.reference
  AND a1.created_at < a2.created_at;

-- Ajouter contrainte unique
ALTER TABLE articles 
ADD CONSTRAINT uk_articles_reference 
UNIQUE (reference);
```

#### Performance lente

```typescript
// Optimisations
class OptimizedSeeder {
  async injectBatch(articles: ArticleData[]): Promise<void> {
    // 1. Désactiver les triggers temporairement
    await this.manager.query('SET session_replication_role = replica');
    
    // 2. Utiliser COPY pour insertion massive
    const stream = this.manager.connection
      .driver
      .postgres
      .copyFrom('COPY articles FROM STDIN CSV');
    
    for (const article of articles) {
      stream.write(this.toCSV(article));
    }
    
    stream.end();
    
    // 3. Réactiver les triggers
    await this.manager.query('SET session_replication_role = DEFAULT');
    
    // 4. Reconstruire les index
    await this.manager.query('REINDEX TABLE articles');
  }
}
```

#### Erreurs de transaction

```typescript
// Gestion robuste des transactions
async function safeTransaction<T>(
  executor: (manager: EntityManager) => Promise<T>
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction('SERIALIZABLE');
  
  try {
    const result = await executor(queryRunner.manager);
    await queryRunner.commitTransaction();
    return result;
    
  } catch (error) {
    await queryRunner.rollbackTransaction();
    
    // Retry logic pour deadlocks
    if (error.code === '40001') { // Serialization failure
      console.log('Retry après deadlock...');
      await new Promise(r => setTimeout(r, 1000));
      return safeTransaction(executor);
    }
    
    throw error;
    
  } finally {
    await queryRunner.release();
  }
}
```

### Commandes de diagnostic

```bash
# Vérifier le statut des seeds
psql -d erp_topsteel -c "
  SELECT 
    name,
    executed_at,
    records_created,
    execution_time_ms
  FROM seeds_status
  ORDER BY executed_at DESC;
"

# Compter les articles par catégorie
psql -d erp_topsteel -c "
  SELECT 
    famille,
    COUNT(*) as count,
    AVG(prix_vente) as avg_price,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
  FROM articles
  GROUP BY famille
  ORDER BY count DESC;
"

# Vérifier l'intégrité référentielle
psql -d erp_topsteel -c "
  SELECT 
    'articles sans matériau' as issue,
    COUNT(*) as count
  FROM articles
  WHERE caracteristiques_techniques->>'nuance' IS NULL
  
  UNION ALL
  
  SELECT 
    'prix invalides' as issue,
    COUNT(*) as count
  FROM articles
  WHERE prix_vente <= 0 OR prix_achat <= 0
  
  UNION ALL
  
  SELECT 
    'références dupliquées' as issue,
    COUNT(*) as count
  FROM (
    SELECT reference
    FROM articles
    GROUP BY reference
    HAVING COUNT(*) > 1
  ) dup;
"

# Analyser les performances
psql -d erp_topsteel -c "
  EXPLAIN ANALYZE
  INSERT INTO articles (reference, designation, famille)
  VALUES ('TEST-001', 'Test Article', 'TEST');
"
```

### Logs et debugging

```typescript
// Configuration des logs pour seeds
export const SEED_LOGGER_CONFIG = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4
  },
  
  transports: [
    // Console
    new winston.transports.Console({
      level: process.env.SEED_LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [SEED] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      )
    }),
    
    // Fichier
    new winston.transports.File({
      filename: 'logs/seeds.log',
      level: 'debug',
      format: winston.format.json()
    }),
    
    // Erreurs
    new winston.transports.File({
      filename: 'logs/seed-errors.log',
      level: 'error',
      format: winston.format.json()
    })
  ]
};

// Utilisation
class SeedLogger {
  private logger = winston.createLogger(SEED_LOGGER_CONFIG);
  
  logSeedStart(seedName: string, options: any) {
    this.logger.info(`Starting seed: ${seedName}`, {
      seedName,
      options,
      timestamp: new Date(),
      memory: process.memoryUsage()
    });
  }
  
  logSeedProgress(seedName: string, progress: number, total: number) {
    this.logger.verbose(`Progress: ${seedName}`, {
      seedName,
      progress,
      total,
      percentage: Math.round((progress / total) * 100)
    });
  }
  
  logSeedComplete(seedName: string, result: any) {
    this.logger.info(`Completed seed: ${seedName}`, {
      seedName,
      result,
      duration: result.duration,
      recordsCreated: result.recordsCreated
    });
  }
  
  logSeedError(seedName: string, error: Error) {
    this.logger.error(`Failed seed: ${seedName}`, {
      seedName,
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
  }
}
```

## Support

Pour toute question sur le système de seeding :
- Documentation : `/docs/development/database-seeding.md`
- Scripts : `/apps/api/src/scripts/`
- Email : database@topsteel.fr
- Slack : #topsteel-database

---

*Système de Seeding TopSteel - 550+ articles prêts à l'emploi*
*Seeds automatiques et manuels pour tous les environnements*
*Version 1.0.0 - Janvier 2025*