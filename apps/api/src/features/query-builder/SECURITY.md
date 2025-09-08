# Query Builder - Documentation de Sécurité

## Vue d'ensemble

Ce document décrit les mesures de sécurité complètes implémentées pour le système Query Builder de TopSteel afin de prévenir les injections SQL et autres vulnérabilités de sécurité.

## Architecture de Sécurité

### 1. Services de Sécurité Centralisés

#### QueryBuilderSecurityService
- **Localisation**: `security/query-builder-security.service.ts`
- **Responsabilités**:
  - Gestion des whitelists de tables et colonnes autorisées
  - Validation des opérateurs SQL
  - Configuration de sécurité par table (isolation tenant, limites de lignes)
  - Validation des valeurs selon des patterns regex

#### SqlSanitizationService  
- **Localisation**: `security/sql-sanitization.service.ts`
- **Responsabilités**:
  - Construction sécurisée de requêtes SQL avec paramétrage
  - Validation et sanitisation des identifiants SQL
  - Prévention des injections SQL par construction paramétrique
  - Validation des requêtes SQL brutes

#### QueryBuilderSecurityGuard
- **Localisation**: `security/query-builder-security.guard.ts`
- **Responsabilités**:
  - Contrôle d'accès basé sur les niveaux de sécurité
  - Validation des permissions utilisateur
  - Audit des tentatives d'accès
  - Validation préventive du contenu des requêtes

### 2. Système de Whitelisting

#### Tables Autorisées
```typescript
// Tables métier autorisées avec isolation tenant
'clients' | 'fournisseurs' | 'materiaux' | 'commandes'

// Tables de référence système (sans isolation tenant)  
'categories'
```

#### Colonnes Autorisées par Table
Chaque colonne est configurée avec :
- **Permissions d'opération** : `allowSelect`, `allowFilter`, `allowSort`, `allowJoin`
- **Statut de sensibilité** : `isSensitive` (ex: `company_id` n'est jamais exposé)
- **Opérateurs autorisés** : Liste restreinte par colonne
- **Patterns de validation** : Regex pour validation des valeurs

### 3. Prévention des Injections SQL

#### Requêtes Paramétriques
Toutes les requêtes utilisent des paramètres liés pour éviter l'injection :
```sql
-- ✅ Sécurisé
SELECT clients.nom FROM clients WHERE company_id = $1 AND clients.nom = $2

-- ❌ Vulnérable (ancien code)  
SELECT clients.nom FROM clients WHERE company_id = ${companyId} AND clients.nom = '${nom}'
```

#### Validation Stricte des Identifiants
```typescript
// Seuls les caractères alphanumériques et underscores autorisés
/^[a-z0-9_]+$/
```

#### Blacklist des Patterns Dangereux
- Tables système : `information_schema`, `pg_catalog`, `mysql.*`
- Tables sensibles : `users`, `passwords`, `admin_*`
- Opérations dangereuses : `DROP`, `DELETE`, `UPDATE`, `INSERT`, `EXEC`
- Commentaires SQL : `--`, `/**/`, `#`
- Fonctions système : `LOAD_FILE`, `INTO OUTFILE`, `UNION SELECT`

### 4. Isolation Multi-tenant

#### Isolation Automatique
Les requêtes sur les tables tenant sont automatiquement filtrées :
```sql
-- Ajout automatique du filtre tenant
WHERE company_id = $1 AND [autres_conditions]
```

#### Configuration par Table
```typescript
{
  requiresTenantIsolation: true,
  tenantColumn: 'company_id' // Colonne de filtrage
}
```

### 5. Contrôle d'Accès

#### Niveaux de Sécurité
- **READ** : Consultation des requêtes whitelistées
- **WRITE** : Création/modification de requêtes
- **ADMIN** : Exécution SQL brut (développement uniquement)

#### Permissions Granulaires
- Permissions par query builder individuel
- Permissions héritées des rôles utilisateur
- Permissions additionnelles et restrictions

### 6. Validation des DTOs

#### DTOs Sécurisés
Tous les DTOs utilisent `class-validator` avec validation stricte :
- Patterns regex pour identifiants
- Énumérations pour opérateurs
- Validation de longueur et format
- Transformation sécurisée des données

#### Exemple de Validation
```typescript
@IsString()
@Length(1, 100)
@Matches(/^[a-zA-Z0-9_]+$/)
tableName: string
```

### 7. Sécurité des Expressions Calculées

#### Évaluation Sécurisée
- Scope limité à des fonctions mathématiques de base
- Validation des patterns d'expression
- Protection contre les injections de code
- Gestion sécurisée des erreurs

#### Fonctions Autorisées
```typescript
{
  abs: Math.abs,
  min: Math.min, 
  max: Math.max,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sqrt: Math.sqrt
  // pow retiré pour éviter les attaques DoS
}
```

### 8. Limites et Quotas

#### Limites par Table
- Nombre maximum de lignes retournées
- Taille maximum des pages
- Complexité maximum des expressions

#### Limites Globales
```typescript
// Limites système
MAX_PAGE_SIZE = 1000
MAX_EXPRESSION_LENGTH = 1000  
MAX_NESTED_OPERATIONS = 20
```

## Tests de Sécurité

### 1. Tests Unitaires
- **Localisation** : `security/__tests__/`
- **Couverture** : Validation, sanitisation, whitelisting

### 2. Tests d'Intégration  
- **Localisation** : `security/__tests__/query-builder-security.integration.spec.ts`
- **Scenarios** : Injections SQL, isolation tenant, permissions

### 3. Tests de Sécurité Spécifiques
- Tentatives d'injection SQL diverses
- Attaques XSS dans les valeurs
- Injection de commandes système
- Attaques par débordement de tampon
- Contournement d'authentification

## Utilisation Sécurisée

### 1. Nouvelles Requêtes Structurées (Recommandé)
```typescript
const secureQuery = {
  selectColumns: [
    { tableName: 'clients', columnName: 'nom' }
  ],
  fromTable: 'clients',
  filters: [
    { 
      tableName: 'clients', 
      columnName: 'nom', 
      operator: 'LIKE', 
      value: 'test%' 
    }
  ],
  sorts: [
    { 
      tableName: 'clients', 
      columnName: 'nom', 
      direction: 'ASC' 
    }
  ]
}

await executorService.executeStructuredQuery(secureQuery, userId)
```

### 2. SQL Brut (Développement Uniquement)
```typescript
// Nécessite le guard ADMIN et NODE_ENV=development
await executorService.executeRawSql(
  'SELECT nom FROM clients WHERE statut = $1', 
  100, 
  userId, 
  companyId
)
```

### 3. Ajout de Nouvelles Tables

Pour autoriser une nouvelle table :

1. **Ajouter à la whitelist** dans `QueryBuilderSecurityService` :
```typescript
['nouvelle_table', {
  name: 'nouvelle_table',
  description: 'Description de la table',
  requiresTenantIsolation: true,
  allowFiltering: true,
  allowSorting: true, 
  allowJoins: true,
  allowedJoinTables: ['table_liee'],
  maxRows: 1000,
  columns: [
    {
      name: 'id',
      dataType: 'uuid',
      allowSelect: true,
      allowFilter: true,
      allowSort: true,
      allowJoin: true,
      isSensitive: false,
      allowedOperators: [QueryOperator.EQUALS],
    }
    // ... autres colonnes
  ]
}]
```

2. **Ajouter des tests** dans `__tests__/`
3. **Valider la sécurité** avec les tests d'intégration

## Monitoring et Audit

### 1. Logs de Sécurité
Tous les événements de sécurité sont loggés :
- Tentatives d'accès aux tables non autorisées
- Requêtes SQL rejetées
- Erreurs de validation
- Accès admin aux requêtes brutes

### 2. Métriques de Sécurité
```typescript
const stats = securityService.getSecurityStatistics()
// Retourne : allowedTablesCount, sensitiveColumnsCount, etc.
```

### 3. Alertes
- Tentatives répétées d'injection SQL
- Accès anormaux aux données sensibles
- Patterns d'attaque détectés

## Bonnes Pratiques de Maintenance

### 1. Mise à Jour des Whitelists
- Révision trimestrielle des tables/colonnes autorisées
- Validation des nouveaux besoins métier
- Test de régression sur les modifications

### 2. Audit de Sécurité
- Revue de code pour toute modification
- Tests de pénétration réguliers
- Mise à jour des patterns d'attaque

### 3. Formation Équipe
- Sensibilisation aux injections SQL
- Formation sur l'utilisation des DTOs sécurisés
- Procédures d'escalade de sécurité

## Conformité et Standards

### 1. Standards Respectés
- OWASP Top 10 (prévention injection SQL)
- ISO 27001 (gestion des accès)
- RGPD (protection des données personnelles)

### 2. Certifications
- Tests de sécurité automatisés dans le pipeline CI/CD
- Validation par scan de vulnérabilités
- Audit de code par outils statiques

## Support et Contact

Pour toute question de sécurité ou incident :
- **Équipe Sécurité** : security@topsteel.com
- **Issues GitHub** : Repository TopSteel/security
- **Documentation** : Wiki interne sécurité

---

**⚠️ ATTENTION** : Ce document contient des informations sensibles sur la sécurité du système. Accès restreint aux membres autorisés de l'équipe de développement.

**📅 Dernière mise à jour** : 2025-08-25  
**👤 Responsable** : Claude Code Assistant  
**🔍 Prochaine révision** : 2025-11-25