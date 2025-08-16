# TopSteel Quality System Documentation

## Vue d'ensemble

Le système de qualité TopSteel est un ensemble complet d'outils et de processus automatisés conçus pour maintenir la qualité du code, la sécurité et les performances de l'application. Il comprend des contrôles continus, des analyses automatisées et des rapports détaillés.

## Architecture du Système

### 🏗️ Structure des Workflows

```
.github/workflows/
├── quality-continuous.yml      # Contrôles de qualité principaux
├── build-continuous.yml        # Build et compilation
├── security-scan.yml          # Analyses de sécurité
├── performance-monitoring.yml  # Monitoring des performances
└── dependency-update.yml       # Mise à jour des dépendances
```

### 📋 Scripts de Qualité

```
scripts/
├── quality-check.sh           # Script principal (Linux/macOS)
├── quality-check.ps1          # Script principal (Windows)
└── update-quality-config.js   # Mise à jour automatique de la config
```

### ⚙️ Configuration

```
.quality.json                  # Configuration centrale
lighthouserc.js               # Configuration Lighthouse
audit-ci.json                 # Configuration audit sécurité
```

## Workflows GitHub Actions

### 1. Quality Continuous (`quality-continuous.yml`)

**Déclencheurs :**
- Push sur `main` et `develop`
- Pull requests

**Jobs :**
- **Quality Check** : Linting, type checking, tests unitaires et E2E
- **Code Coverage** : Analyse de couverture de code
- **Code Complexity** : Analyse de complexité cyclomatique
- **Bundle Analysis** : Analyse de la taille des bundles
- **Security Audit** : Audit de sécurité des dépendances
- **Quality Report** : Génération du rapport global

**Parallélisation :**
```yaml
strategy:
  matrix:
    check-type: [lint, typecheck, test-unit, test-e2e]
```

### 2. Build Continuous (`build-continuous.yml`)

**Déclencheurs :**
- Push sur `main` et `develop`
- Pull requests

**Jobs :**
- **Build Matrix** : Build pour tous les environnements et applications
- **Docker Build** : Vérification des images Docker
- **TypeScript Compilation** : Vérification de la compilation
- **Monorepo Integrity** : Intégrité du monorepo

**Matrice de Build :**
```yaml
strategy:
  matrix:
    environment: [development, staging, production]
    app: [api, web, marketplace-api, marketplace-storefront]
```

### 3. Security Scan (`security-scan.yml`)

**Déclencheurs :**
- Push sur `main` et `develop`
- Pull requests
- Planification hebdomadaire

**Jobs :**
- **Security Audit** : npm audit et audit-ci
- **Dependency Check** : Vérification des vulnérabilités
- **Code Scanning** : CodeQL pour l'analyse statique
- **Secrets Scan** : Détection de secrets avec TruffleHog
- **Docker Security** : Scan Trivy des images Docker
- **License Check** : Vérification de conformité des licences

### 4. Performance Monitoring (`performance-monitoring.yml`)

**Déclencheurs :**
- Push sur `main` et `develop`
- Pull requests
- Planification quotidienne

**Jobs :**
- **Lighthouse Audit** : Audit de performance web
- **Bundle Analyzer** : Analyse détaillée des bundles
- **Load Testing** : Tests de charge avec k6
- **Memory Profiling** : Profilage mémoire avec clinic.js
- **Database Performance** : Analyse des performances base de données

### 5. Dependency Update (`dependency-update.yml`)

**Déclencheurs :**
- Planification hebdomadaire
- Manuel via workflow_dispatch

**Jobs :**
- **Dependency Check** : Vérification des mises à jour
- **Automated Updates** : Mise à jour automatique des versions mineures
- **Critical Security Updates** : Mise à jour urgente des vulnérabilités critiques

## Scripts de Qualité

### Script Principal (`quality-check.sh` / `quality-check.ps1`)

**Commandes disponibles :**
```bash
# Analyse complète
./scripts/quality-check.sh all

# Analyses spécifiques
./scripts/quality-check.sh complexity
./scripts/quality-check.sh duplication
./scripts/quality-check.sh naming
./scripts/quality-check.sh imports
./scripts/quality-check.sh documentation
./scripts/quality-check.sh bundle-size

# Génération de rapport
./scripts/quality-check.sh report
```

**Fonctionnalités :**
- ✅ Analyse de complexité cyclomatique
- ✅ Détection de code dupliqué
- ✅ Vérification des conventions de nommage
- ✅ Détection d'imports inutilisés
- ✅ Analyse de couverture de documentation
- ✅ Vérification de la taille des bundles
- ✅ Génération de rapports détaillés

### Configuration Updater (`update-quality-config.js`)

**Fonctionnalités :**
- 🔄 Mise à jour automatique des seuils de qualité
- 📊 Analyse de la structure du projet
- ⚙️ Synchronisation avec la configuration Biome
- 🏗️ Adaptation aux spécificités du monorepo
- 📋 Génération de rapport de mise à jour

## Configuration de Qualité (`.quality.json`)

### Structure de Configuration

```json
{
  "thresholds": {
    "coverage": { "minimum": 80, "target": 90 },
    "complexity": { "cyclomatic": 10, "cognitive": 15 },
    "duplication": { "percentage": 5 },
    "bundleSize": { "web": "5MB", "api": "50MB" }
  },
  "linting": {
    "rules": { /* règles de linting */ },
    "customRules": { /* règles personnalisées */ }
  },
  "metrics": { /* métriques de qualité */ },
  "standards": { /* standards de code */ },
  "tools": { /* configuration des outils */ }
}
```

### Seuils de Qualité

| Métrique | Minimum | Cible | Description |
|----------|---------|-------|-------------|
| Couverture de code | 80% | 90% | Pourcentage de code testé |
| Complexité cyclomatique | 10 | 8 | Complexité par fonction |
| Duplication | 5% | 2% | Pourcentage de code dupliqué |
| Taille des bundles | 5MB | 3MB | Taille maximale des bundles web |

## Rapports et Métriques

### Types de Rapports

1. **Rapport de Qualité Global** (`quality-report.md`)
   - Vue d'ensemble des métriques
   - Résultats des analyses
   - Recommandations d'amélioration

2. **Rapports Spécialisés** (dans `reports/`)
   - `complexity-report.json` : Analyse de complexité
   - `duplication-report.json` : Détection de duplication
   - `bundle-size.txt` : Taille des bundles
   - `documentation-coverage.txt` : Couverture documentation

3. **Rapports de Performance**
   - Lighthouse reports
   - Bundle analysis
   - Load testing results
   - Memory profiling

### Métriques Collectées

- **Qualité du Code :**
  - Complexité cyclomatique
  - Duplication de code
  - Couverture de tests
  - Respect des conventions

- **Performance :**
  - Temps de build
  - Taille des bundles
  - Métriques Web Vitals
  - Temps de réponse API

- **Sécurité :**
  - Vulnérabilités dépendances
  - Audit de sécurité
  - Détection de secrets
  - Conformité licences

## Intégrations

### GitHub Actions

- ✅ Commentaires automatiques sur les PR
- ✅ Status checks obligatoires
- ✅ Upload d'artifacts
- ✅ Notifications en cas d'échec

### Outils Externes

- **Codecov** : Visualisation de la couverture
- **Lighthouse CI** : Audit de performance
- **CodeQL** : Analyse de sécurité statique
- **TruffleHog** : Détection de secrets

## Configuration des Environnements

### Environnement de Développement

```json
{
  "strictMode": false,
  "allowConsole": true,
  "allowDebugger": true,
  "performanceChecks": false
}
```

### Environnement de Production

```json
{
  "strictMode": true,
  "allowConsole": false,
  "allowDebugger": false,
  "performanceChecks": true,
  "securityChecks": true,
  "bundleOptimization": true
}
```

## Utilisation

### Installation et Configuration

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd TopSteel
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Configurer les outils de qualité**
   ```bash
   # Linux/macOS
   chmod +x scripts/quality-check.sh
   
   # Windows
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Exécution Locale

```bash
# Analyse complète
npm run check:all

# Tests de qualité spécifiques
./scripts/quality-check.sh complexity
./scripts/quality-check.sh bundle-size

# Mise à jour de la configuration
node scripts/update-quality-config.js
```

### Intégration CI/CD

Les workflows sont automatiquement exécutés sur :
- Chaque push vers `main` ou `develop`
- Chaque pull request
- Planifications automatiques (sécurité, dépendances)

## Dépannage

### Problèmes Courants

1. **Échec des tests de qualité**
   - Vérifier les seuils dans `.quality.json`
   - Corriger les violations de linting
   - Améliorer la couverture de tests

2. **Problèmes de build**
   - Vérifier les erreurs TypeScript
   - S'assurer que toutes les dépendances sont installées
   - Nettoyer le cache : `pnpm clean`

3. **Échecs de sécurité**
   - Mettre à jour les dépendances vulnérables
   - Utiliser `pnpm audit fix`
   - Vérifier les secrets exposés

### Logs et Debugging

- **GitHub Actions** : Consultez les logs dans l'onglet Actions
- **Local** : Utilisez les flags de debug dans les scripts
- **Rapports** : Vérifiez les fichiers générés dans `reports/`

## Roadmap et Améliorations

### Prochaines Fonctionnalités

- 🔄 Intégration SonarQube
- 📊 Dashboard de métriques en temps réel
- 🤖 IA pour l'analyse de code
- 🔗 Intégration Slack/Teams pour notifications
- 📈 Métriques de tendance historique

### Contributions

Pour contribuer au système de qualité :
1. Créer une issue pour discuter des changements
2. Forker le repository
3. Créer une branche feature
4. Soumettre une pull request

---

**Dernière mise à jour :** $(date)
**Version :** 1.0.0
**Mainteneur :** Équipe TopSteel