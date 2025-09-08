# 🔄 Plan d'Harmonisation des Fichiers .env - TopSteel ERP

## 📊 Analyse de la Situation Actuelle

### 📁 Inventaire des Fichiers .env
**Total: 15 fichiers** répartis comme suit:

| Fichier | Variables | Objectif | Statut |
|---------|-----------|----------|--------|
| `.env` | 151 | Config principale dev | ⚠️ Doublons |
| `.env.local` | 202 | Config étendue dev | ⚠️ Secrets exposés |
| `.env.staging` | 48 | Config staging | ⚠️ Incomplet |
| `.env.production` | 83 | Config production | ❌ Ne devrait pas exister |
| `.env.production.example` | 189 | Template production | ⚠️ Redondant |
| `.env.example` | 283 | Template principal | ✅ Bon |
| `.env.security` | 458 | Config sécurité | ✅ Nouveau, complet |
| `.env.security.example` | 59 | Template sécurité | ⚠️ Trop limité |
| `.env.vault.example` | 130 | Template vault | ⚠️ Non utilisé |
| `apps/api/.env.local` | 3 | JWT API | ❌ Secret dupliqué |
| `apps/api/.env.example` | 182 | Template API | ⚠️ Redondant |
| `apps/web/.env.local` | 3 | JWT Web | ❌ Secret dupliqué |
| `apps/marketplace-api/.env.local` | 3 | JWT Marketplace | ❌ Secret dupliqué |

## 🚨 Problèmes Critiques Identifiés

### 1. 🔐 Vulnérabilités de Sécurité

#### JWT Secrets Identiques
```env
# CRITIQUE: Même secret JWT dans 3 services
apps/api/.env.local:         JWT_SECRET="M1ZsKqAeRG08ArNBNrv2X102EC8TPvGr..."
apps/web/.env.local:         JWT_SECRET="M1ZsKqAeRG08ArNBNrv2X102EC8TPvGr..."
apps/marketplace-api/.env:   JWT_SECRET="M1ZsKqAeRG08ArNBNrv2X102EC8TPvGr..."
```
**Impact:** Compromission d'un service = tous compromis

#### Passwords ElasticSearch Exposés
```env
# Dans plusieurs fichiers:
ELASTICSEARCH_PASSWORD=ogAceYjRKTIMmACWwhRA  # ❌ Password réel commité
```

### 2. 🔄 Doublons Majeurs

| Variable | Occurrences | Valeurs Différentes | Impact |
|----------|-------------|---------------------|---------|
| `JWT_SECRET` | 8 fichiers | 4 valeurs | Sécurité critique |
| `DATABASE_URL` | 6 fichiers | 3 formats | Connexion DB |
| `API_PORT` | 5 fichiers | 2 valeurs | Conflits ports |
| `CORS_ORIGIN` | 4 fichiers | 3 formats | CORS cassé |
| `REDIS_HOST` | 4 fichiers | 2 valeurs | Cache incohérent |

### 3. 🏷️ Incohérences de Nommage

| Incohérence | Variantes Trouvées | Standard Proposé |
|-------------|-------------------|------------------|
| Base de données | `DB_HOST`, `DATABASE_HOST`, `DB_AUTH_HOST` | `DATABASE_HOST` |
| CORS | `CORS_ORIGIN`, `CORS_ORIGINS`, `API_CORS_ORIGIN` | `CORS_ORIGINS` |
| SMTP | `SMTP_PASS`, `SMTP_PASSWORD` | `SMTP_PASSWORD` |
| Rate Limit | `THROTTLE_LIMIT`, `RATE_LIMIT_MAX` | `RATE_LIMIT_MAX` |

### 4. ⚡ Conflits de Configuration

#### Ports en Conflit
```env
API_PORT=3002
WS_PORT=3002      # ❌ Conflit avec API_PORT
```

#### URLs Incohérentes
```env
Root:    DATABASE_URL=postgresql://postgres@127.0.0.1:5432/erp_topsteel
Security: DATABASE_URL=postgresql://postgres@localhost:5432/erp_topsteel
```

## 🎯 Plan d'Harmonisation

### Phase 1: Sécurité Immédiate (CRITIQUE) 🔴

#### Actions à faire MAINTENANT:

1. **Supprimer les secrets exposés**
```bash
# Script de nettoyage
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch apps/*/.env.local" \
  --prune-empty --tag-name-filter cat -- --all
```

2. **Générer des JWT uniques par service**
```bash
# Script de génération
echo "API_JWT_SECRET=$(openssl rand -base64 64)" >> .env.local
echo "WEB_JWT_SECRET=$(openssl rand -base64 64)" >> .env.local
echo "MARKETPLACE_JWT_SECRET=$(openssl rand -base64 64)" >> .env.local
```

3. **Remplacer les mots de passe ElasticSearch**
```bash
# Retirer les vrais passwords
sed -i 's/ogAceYjRKTIMmACWwhRA/CHANGE_THIS_PASSWORD/g' .env*
```

### Phase 2: Restructuration des Fichiers 📁

#### Structure Cible Proposée:

```
TopSteel/
├── .env.defaults           # ✅ Valeurs par défaut (committé)
├── .env.example           # ✅ Template complet (committé)
├── .env.local             # 🔒 Secrets locaux (ignoré)
├── .env.test              # 🧪 Config tests (ignoré)
├── apps/
│   ├── api/
│   │   └── .env.example   # ✅ Spécifique API (committé)
│   ├── web/
│   │   └── .env.example   # ✅ Spécifique Web (committé)
│   └── marketplace-api/
│       └── .env.example   # ✅ Spécifique Marketplace (committé)
└── docker/
    └── .env.docker        # 🐳 Config Docker (ignoré)
```

#### Suppression Planifiée:
- ❌ `.env.production` (ne jamais committer)
- ❌ `.env.staging` (fusionner avec .env.example)
- ❌ `.env.vault.example` (non utilisé)
- ❌ `apps/*/.env.local` (secrets exposés)

### Phase 3: Standardisation des Variables 📝

#### Nouveau Standard de Nommage:

```env
# ============================================================================
# CONVENTION DE NOMMAGE UNIFIÉE
# ============================================================================

# Format: CATEGORIE_SOUSCATEGORIE_NOM
# Exemples:
DATABASE_HOST           # ✅ Correct
DB_HOST                # ❌ Éviter l'abréviation

SERVICE_API_PORT       # ✅ Correct (avec préfixe SERVICE)
API_PORT              # ⚠️ Acceptable mais moins clair

AUTH_JWT_SECRET       # ✅ Correct (catégorie + sous-catégorie)
JWT_SECRET           # ⚠️ Acceptable mais moins précis
```

#### Mapping de Migration:

| Ancien | Nouveau | Catégorie |
|--------|---------|-----------|
| `DB_HOST` | `DATABASE_HOST` | Database |
| `DB_PORT` | `DATABASE_PORT` | Database |
| `JWT_SECRET` | `AUTH_JWT_SECRET` | Auth |
| `JWT_REFRESH_SECRET` | `AUTH_JWT_REFRESH_SECRET` | Auth |
| `API_PORT` | `SERVICE_API_PORT` | Service |
| `WEB_PORT` | `SERVICE_WEB_PORT` | Service |
| `WS_PORT` | `SERVICE_WEBSOCKET_PORT` | Service |
| `CORS_ORIGIN` | `SECURITY_CORS_ORIGINS` | Security |
| `THROTTLE_LIMIT` | `SECURITY_RATE_LIMIT_MAX` | Security |

### Phase 4: Fichier Unifié .env.defaults 🎯

```env
# ============================================================================
# TOPSTEEL ERP - CONFIGURATION PAR DÉFAUT
# ============================================================================
# Ce fichier contient TOUTES les variables avec leurs valeurs par défaut
# Peut être committé car ne contient AUCUN secret
# ============================================================================

# ==== ENVIRONNEMENT ====
NODE_ENV=development
APP_NAME=TopSteel ERP
APP_VERSION=1.0.0
LOG_LEVEL=info

# ==== SERVICES (Ports Uniques) ====
SERVICE_API_PORT=3002
SERVICE_WEB_PORT=3005
SERVICE_WEBSOCKET_PORT=3006
SERVICE_AUTH_PORT=3003
SERVICE_NOTIFICATION_PORT=3004
SERVICE_MARKETPLACE_API_PORT=3007
SERVICE_MARKETPLACE_WEB_PORT=3008

# ==== DATABASE (Sans Passwords) ====
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_NAME=erp_topsteel
DATABASE_AUTH_NAME=erp_topsteel_auth
DATABASE_MARKETPLACE_NAME=erp_topsteel_marketplace
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_SSL=false

# ==== REDIS ====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_TTL=3600

# ==== ELASTICSEARCH ====
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_INDEX_PREFIX=topsteel_

# ==== SÉCURITÉ (Templates uniquement) ====
AUTH_JWT_EXPIRES_IN=15m
AUTH_JWT_REFRESH_EXPIRES_IN=7d
AUTH_BCRYPT_ROUNDS=12
SECURITY_CORS_CREDENTIALS=true
SECURITY_RATE_LIMIT_WINDOW_MS=900000
SECURITY_RATE_LIMIT_MAX=100

# ==== FEATURES FLAGS ====
FEATURE_ELASTICSEARCH_ENABLED=false
FEATURE_REDIS_CACHE_ENABLED=true
FEATURE_SMS_ENABLED=false
FEATURE_EMAIL_ENABLED=true
FEATURE_MONITORING_ENABLED=false
FEATURE_2FA_ENABLED=true
```

### Phase 5: Script de Migration Automatique 🤖

```bash
#!/bin/bash
# migrate-env.sh - Script d'harmonisation automatique

echo "🔄 Début de l'harmonisation des fichiers .env"

# 1. Backup des fichiers existants
echo "📦 Sauvegarde des fichiers existants..."
mkdir -p .env-backup-$(date +%Y%m%d)
cp .env* .env-backup-$(date +%Y%m%d)/

# 2. Création du nouveau .env.defaults
echo "✨ Création de .env.defaults..."
cat > .env.defaults << 'EOF'
# Configuration par défaut (voir Phase 4)
EOF

# 3. Migration des variables
echo "🔄 Migration des variables..."
node scripts/migrate-env-variables.js

# 4. Génération des secrets uniques
echo "🔐 Génération des secrets..."
./scripts/generate-unique-secrets.sh

# 5. Validation
echo "✅ Validation de la configuration..."
node scripts/validate-env.js

echo "✨ Harmonisation terminée!"
```

## 📋 Checklist d'Implémentation

### ⚡ Immédiat (Sécurité)
- [ ] Supprimer tous les `.env.local` des apps
- [ ] Régénérer tous les JWT secrets
- [ ] Remplacer les passwords ElasticSearch
- [ ] Mettre à jour .gitignore

### 📁 Court Terme (Structure)
- [ ] Créer `.env.defaults`
- [ ] Fusionner les doublons
- [ ] Supprimer les fichiers redondants
- [ ] Documenter la nouvelle structure

### 📝 Moyen Terme (Standards)
- [ ] Appliquer le nouveau nommage
- [ ] Migrer toutes les applications
- [ ] Créer les scripts de validation
- [ ] Former l'équipe

## 🎯 Résultat Attendu

### Avant: 15 fichiers, 1000+ variables, doublons partout
### Après: 5 fichiers, ~200 variables uniques, zéro doublon

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Fichiers .env | 15 | 5 | -67% |
| Variables totales | 1000+ | 200 | -80% |
| Doublons | 150+ | 0 | -100% |
| Secrets exposés | 10+ | 0 | -100% |
| Conflits de ports | 3 | 0 | -100% |

## 🚀 Prochaines Étapes

1. **Aujourd'hui:** Supprimer les secrets exposés
2. **Cette semaine:** Implémenter la nouvelle structure
3. **Ce mois:** Migrer toutes les applications
4. **Continu:** Maintenir et auditer régulièrement

## 📞 Support

Pour toute question sur ce plan d'harmonisation:
- Documentation: `/docs/env-configuration.md`
- Scripts: `/scripts/env-tools/`
- Issues: GitHub Issues avec tag `env-config`

---

*Plan généré le: 2025-01-09*
*Fichiers analysés: 15*
*Variables analysées: 1000+*
*Priorité: CRITIQUE pour la sécurité*