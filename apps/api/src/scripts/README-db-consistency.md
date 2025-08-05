# Scripts de Vérification de Cohérence de Base de Données

Ce répertoire contient des scripts TypeScript pour vérifier et maintenir la cohérence entre les entités TypeORM et la structure réelle des bases de données PostgreSQL.

## Scripts Disponibles

### 0. test-db-connections.ts
**Script de test des connexions (recommandé en premier)**

```bash
# Test rapide des connexions
ts-node apps/api/src/scripts/test-db-connections.ts

# Ou via npm script
npm run db:test-connections
```

**Fonctionnalités:**
- 🔌 Test des connexions AUTH et TENANT
- 📊 Affichage des informations de base
- 📋 Liste des tables importantes avec comptages
- 💡 Recommandations et diagnostic

### 1. check-db-consistency.ts
**Script principal de vérification de cohérence**

```bash
# Exécution
ts-node apps/api/src/scripts/check-db-consistency.ts

# Ou via npm script (à ajouter dans package.json)
npm run db:check-consistency
```

**Fonctionnalités:**
- ✅ Connexion aux bases AUTH et TENANT
- 📊 Comparaison tables vs entités TypeORM
- 🔍 Détection des colonnes manquantes/supplémentaires
- ⚠️ Vérification des types de données
- 🔗 Analyse des contraintes et index
- 📋 Rapport détaillé avec recommandations

### 2. db-consistency-report.ts
**Générateur de rapport JSON détaillé**

```bash
# Exécution
ts-node apps/api/src/scripts/db-consistency-report.ts

# Le rapport sera sauvegardé dans: db-consistency-report-YYYY-MM-DD.json
```

**Fonctionnalités:**
- 📄 Rapport JSON structuré et complet
- 📊 Statistiques détaillées par base
- 🔍 Analyse approfondie de chaque table
- 📈 Métadonnées des migrations
- 💾 Sauvegarde automatique avec horodatage

### 3. db-quick-fix.ts
**Script de correction interactive**

```bash
# Exécution (ATTENTION: Modifie la base!)
ts-node apps/api/src/scripts/db-quick-fix.ts
```

**Fonctionnalités:**
- 🔧 Corrections automatiques proposées
- ⚠️ Interface interactive avec confirmations
- 📊 Classification par niveau de risque
- 🔄 Corrections réversibles identifiées
- 💾 Alertes pour sauvegardes nécessaires

## Configuration

### Variables d'Environnement Requises

```env
# Base de données principale
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Base AUTH
DB_AUTH_NAME=erp_topsteel_auth

# Base TENANT (pour les tests)
DB_TENANT_TEST_NAME=erp_topsteel_topsteel
```

### Pré-requis

1. **TypeORM configuré** avec les DataSources appropriées
2. **Accès PostgreSQL** aux bases AUTH et TENANT  
3. **Permissions** de lecture (et écriture pour quick-fix)
4. **Node.js et ts-node** installés

## Utilisation Recommandée

### 0. Test Initial des Connexions

```bash
# PREMIER: Tester les connexions avant tout
npm run db:test-connections
```

### 1. Vérification Régulière (Développement)

```bash
# Vérification rapide pendant le développement
npm run db:check-consistency
```

### 2. Rapport Complet (Pré-déploiement)

```bash
# Génération d'un rapport détaillé avant déploiement
ts-node apps/api/src/scripts/db-consistency-report.ts

# Analyser le fichier JSON généré
cat db-consistency-report-*.json | jq '.summary'
```

### 3. Corrections Automatiques (Avec Précaution)

```bash
# TOUJOURS faire une sauvegarde avant
pg_dump erp_topsteel_auth > backup_auth_$(date +%Y%m%d).sql
pg_dump erp_topsteel_topsteel > backup_tenant_$(date +%Y%m%d).sql

# Puis exécuter les corrections
ts-node apps/api/src/scripts/db-quick-fix.ts
```

## Types de Problèmes Détectés

### 🚨 Critiques (Nécessitent action immédiate)
- **Tables manquantes**: Entités sans table correspondante
- **Colonnes manquantes**: Propriétés d'entité sans colonne
- **Colonnes dupliquées**: `password`/`mot_de_passe`, `actif`/`isActive`
- **Contraintes manquantes**: Foreign keys critiques absentes

### ⚠️ Avertissements (À planifier)
- **Types incohérents**: Différences entity ↔ base
- **Colonnes orphelines**: Colonnes sans propriété d'entité
- **Index manquants**: Performance et intégrité
- **Nomenclature**: Incohérences français/anglais

### ℹ️ Informations (Optimisations)
- **Tables orphelines**: Tables sans entité correspondante
- **Métadonnées**: Informations sur les migrations
- **Statistiques**: Comptages et résumés

## Problèmes Spécifiques Identifiés

### Base AUTH - Table `users`

**Colonnes dupliquées détectées:**
- `password` vs `mot_de_passe` → Garder `password`
- `actif` vs `isActive` → Garder `actif` (selon entité)

**Correction suggérée:**
```sql
-- Supprimer les doublons (APRÈS sauvegarde!)
ALTER TABLE users DROP COLUMN IF EXISTS mot_de_passe;
ALTER TABLE users DROP COLUMN IF EXISTS "isActive";
```

### Base AUTH - Table `roles`

**Incohérence nomenclature:**
- Colonne `nom` au lieu de `name`

**Correction suggérée:**
```sql
-- Renommer pour cohérence
ALTER TABLE roles RENAME COLUMN nom TO name;
```

### Relations Foreign Keys

**Vérifications critiques:**
- `user_sessions.userId` → `users.id`
- `user_roles.user_id` → `users.id`
- `role_permissions.role_id` → `roles.id`

## Intégration CI/CD

### Script de Validation Pré-déploiement

```bash
#!/bin/bash
# ci/check-database-consistency.sh

echo "🔍 Vérification de la cohérence de la base de données..."

# Générer le rapport
ts-node apps/api/src/scripts/db-consistency-report.ts

# Extraire le nombre d'erreurs critiques
CRITICAL_ISSUES=$(cat db-consistency-report-*.json | jq '.summary.criticalIssues')

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
  echo "❌ $CRITICAL_ISSUES erreur(s) critique(s) détectée(s)!"
  echo "📋 Voir le rapport détaillé: db-consistency-report-*.json"
  exit 1
else
  echo "✅ Base de données cohérente - déploiement autorisé"
  exit 0
fi
```

### GitHub Actions

```yaml
# .github/workflows/database-consistency.yml
name: Database Consistency Check

on:
  pull_request:
    paths:
      - 'apps/api/src/**/*.entity.ts'
      - 'apps/api/src/core/database/migrations/**'

jobs:
  check-consistency:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        run: npm run migration:run
        
      - name: Check database consistency
        run: |
          ts-node apps/api/src/scripts/db-consistency-report.ts
          
      - name: Upload consistency report
        uses: actions/upload-artifact@v3
        with:
          name: db-consistency-report
          path: db-consistency-report-*.json
```

## Bonnes Pratiques

### 1. Avant Modifications de Schema
```bash
# Toujours vérifier avant changements
ts-node apps/api/src/scripts/check-db-consistency.ts
```

### 2. Après Nouvelles Migrations
```bash
# Vérifier après exécution des migrations
npm run migration:run
ts-node apps/api/src/scripts/check-db-consistency.ts
```

### 3. Sauvegarde Avant Corrections
```bash
# Sauvegarde complète avant corrections automatiques
pg_dump -h localhost -U postgres erp_topsteel_auth > backup_auth.sql
pg_dump -h localhost -U postgres erp_topsteel_topsteel > backup_tenant.sql
```

### 4. Tests d'Intégrité
```bash
# Après corrections, valider l'intégrité
npm run test:integration
npm run test:e2e
```

## Dépannage

### Erreur de Connexion
```
Vérifier les variables d'environnement DB_*
Vérifier que PostgreSQL est démarré
Vérifier les permissions utilisateur
```

### Erreurs de Permissions
```
Accorder les permissions appropriées à l'utilisateur PostgreSQL:
GRANT CONNECT ON DATABASE erp_topsteel_auth TO your_user;
GRANT USAGE ON SCHEMA public TO your_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_user;
```

### Migrations Manquantes
```
Exécuter les migrations avant vérification:
npm run migration:run
```

## Support

Pour toute question ou problème:
1. Vérifier les logs détaillés dans la console
2. Examiner le rapport JSON généré
3. Consulter la documentation TypeORM
4. Contacter l'équipe DevOps si nécessaire

---

*Ces scripts sont conçus pour maintenir la cohérence et l'intégrité des bases de données. Utilisez-les régulièrement dans votre workflow de développement.*