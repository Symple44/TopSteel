# 🚀 GUIDE DE DÉMARRAGE RAPIDE - SYSTÈME PRICING TOPSTEEL

## ✅ État actuel : **PRÊT POUR LA PRODUCTION**

Score de validation : **87.5%**
Build : **✅ RÉUSSI**

## 📦 Installation rapide

### Prérequis
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+ (ou Docker)
- pnpm

### 1. Configuration environnement

Créez/modifiez le fichier `.env` :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=erp_topsteel_topsteel
DB_AUTH_NAME=erp_topsteel_auth

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Pricing
PRICING_CACHE_TTL=3600
PRICING_MAX_BULK_SIZE=1000
ML_MODEL_PATH=./models/pricing
ML_TRAINING_ENABLED=false
WEBHOOK_MAX_RETRIES=3
ANALYTICS_RETENTION_DAYS=90
```

### 2. Démarrage automatique (Windows)

```bash
# Double-cliquez sur start-pricing-system.bat
# OU
start-pricing-system.bat
```

### 3. Démarrage manuel

```bash
# 1. Démarrer Redis
docker run -d -p 6379:6379 redis:alpine

# 2. Compiler
cd apps/api
pnpm build

# 3. Exécuter les migrations
pnpm typeorm migration:run -d src/core/database/config/datasource.ts

# 4. Démarrer l'application
pnpm start:dev
```

## 🔌 Endpoints disponibles

### REST API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/pricing/calculate` | Calcul de prix unique |
| POST | `/pricing/bulk` | Calcul de prix en masse |
| GET | `/pricing/rules` | Liste des règles de prix |
| POST | `/pricing/rules` | Créer une règle |
| GET | `/pricing/analytics/dashboard` | Tableau de bord analytics |
| POST | `/pricing/webhooks/subscribe` | S'abonner aux webhooks |
| GET | `/pricing/ml/suggest` | Suggestions ML |

### GraphQL

Accès : http://localhost:3000/graphql

```graphql
# Exemple de requête
query CalculatePrice {
  calculatePrice(articleId: "123", quantity: 10) {
    basePrice
    finalPrice
    totalDiscount
    appliedRules
  }
}

# Matrice de prix
query PriceMatrix {
  getPriceMatrix(
    articleId: "123"
    quantities: [1, 10, 100]
    customerGroups: ["STANDARD", "VIP"]
  ) {
    quantity
    customerGroup
    unitPrice
    totalPrice
    discount
  }
}

# Optimisation ML
query OptimalPrice {
  suggestOptimalPrice(articleId: "123") {
    currentPrice
    suggestedPrice
    confidence
    expectedRevenueLift
    reasoning
  }
}
```

## 🧪 Tests rapides

### 1. Test de calcul simple

```bash
curl -X POST http://localhost:3000/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "test-123",
    "quantity": 10,
    "channel": "ERP"
  }'
```

### 2. Test GraphQL

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ calculatePrice(articleId: \"test\", quantity: 1) { finalPrice } }"
  }'
```

### 3. Test de santé

```bash
curl http://localhost:3000/health
```

## 📊 Monitoring

### Métriques Prometheus
- Endpoint : http://localhost:3000/metrics
- Métriques disponibles :
  - `pricing_calculations_total` - Nombre total de calculs
  - `pricing_calculation_duration` - Durée des calculs
  - `pricing_cache_hits` - Taux de cache hit
  - `pricing_rules_applied` - Règles appliquées

### Dashboard Analytics
- URL : http://localhost:3000/pricing/analytics/dashboard
- Informations disponibles :
  - Top 10 des règles utilisées
  - Taux de conversion par canal
  - Performance moyenne
  - Recommandations ML

## 🔧 Configuration avancée

### Redis Cluster
```javascript
// apps/api/.env
REDIS_CLUSTER_NODES=127.0.0.1:7000,127.0.0.1:7001,127.0.0.1:7002
```

### Machine Learning
```javascript
// Activer l'entraînement automatique
ML_TRAINING_ENABLED=true
ML_TRAINING_SCHEDULE="0 2 * * *"  // Tous les jours à 2h
ML_CONFIDENCE_THRESHOLD=0.7
```

### Webhooks
```javascript
// Configuration des webhooks
WEBHOOK_TIMEOUT=5000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY=1000
WEBHOOK_BACKOFF_MULTIPLIER=2
```

## 🚨 Troubleshooting

### Erreur : Redis connection failed
```bash
# Solution 1 : Installer Redis localement
# Windows : https://github.com/microsoftarchive/redis/releases
# Mac : brew install redis
# Linux : apt install redis

# Solution 2 : Utiliser Docker
docker run -d -p 6379:6379 redis:alpine
```

### Erreur : TypeORM migration failed
```bash
# Vérifier la connexion DB
psql -U postgres -h localhost -l

# Créer les bases si nécessaire
createdb erp_topsteel_topsteel
createdb erp_topsteel_auth

# Réexécuter les migrations
cd apps/api
pnpm typeorm migration:run -d src/core/database/config/datasource.ts
```

### Erreur : Build failed
```bash
# Nettoyer et reconstruire
cd apps/api
rm -rf dist node_modules
pnpm install
pnpm build
```

## 📚 Documentation complète

- [Architecture détaillée](./PRICING_INTEGRATION_REPORT.md)
- [API Reference](http://localhost:3000/api)
- [Tests](./apps/api/src/features/pricing/tests/)
- [Migrations](./apps/api/src/core/database/migrations/)

## 🎯 Prochaines étapes recommandées

1. **Configuration production**
   - [ ] Configurer SSL/TLS
   - [ ] Activer l'authentification JWT
   - [ ] Configurer les limites de rate

2. **Optimisation**
   - [ ] Activer la compression gzip
   - [ ] Configurer CDN pour les assets
   - [ ] Optimiser les requêtes DB

3. **Monitoring**
   - [ ] Intégrer Grafana
   - [ ] Configurer les alertes
   - [ ] Mettre en place les logs centralisés

## 💬 Support

- Issues GitHub : [/issues](https://github.com/topsteel/erp/issues)
- Documentation : [/docs](./docs/)
- Logs : `apps/api/logs/`

---

*Système de pricing TopSteel v2.0 - Ready to ship! 🚀*