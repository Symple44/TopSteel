# Module de Recherche Globale TopSteel

Ce module fournit un système de recherche globale performant pour l'application TopSteel, avec support ElasticSearch et fallback PostgreSQL.

## 🚀 Fonctionnalités

- **Recherche globale** : Recherche unifiée dans toutes les entités métier
- **Multi-moteur** : ElasticSearch (performance) + PostgreSQL (fallback)
- **Sécurité intégrée** : Filtrage par permissions et rôles
- **Multi-tenant** : Support natif de la séparation des données
- **Indexation automatique** : Mise à jour temps réel via événements
- **Suggestions intelligentes** : Auto-complétion et corrections
- **Recherche typée** : Filtrage par type d'entité

## 📡 API Endpoints

### Recherche globale
```
GET /api/search/global?q=terme&types=client,article&limit=10
```

### Suggestions
```
GET /api/search/suggestions?q=terme
```

### Recherche par type
```
GET /api/search/type/client?q=dupont
```

### Recherche dans les menus
```
GET /api/search/menus?q=facture
```

### Administration (Admin uniquement)
```
POST /api/search/reindex
GET /api/search/stats
GET /api/search/status
```

## 🏗️ Architecture

### Services

- **`GlobalSearchService`** : Service principal avec stratégie adaptative
- **`SearchIndexingService`** : Indexation automatique via événements
- **`ElasticsearchStrategy`** : Moteur haute performance
- **`PostgreSQLStrategy`** : Moteur de fallback

### Configuration

Les entités recherchables sont configurées dans `config/searchable-entities.config.ts` :

```typescript
{
  type: 'client',
  tableName: 'partners',
  entityName: 'Partner',
  displayName: 'Client',
  searchableFields: {
    primary: [
      { name: 'code', weight: 10, type: 'keyword' },
      { name: 'denomination', weight: 9, type: 'text' }
    ],
    secondary: [
      { name: 'email', weight: 7, type: 'keyword' }
    ],
    metadata: [
      { name: 'ville', weight: 4, type: 'text' }
    ]
  },
  database: 'tenant',
  requiresPermission: 'clients.read'
}
```

## 🔧 Configuration

### Variables d'environnement

```bash
# ElasticSearch (optionnel)
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=password

# Recherche
SEARCH_MAX_RESULTS=100
SEARCH_MIN_QUERY_LENGTH=2
```

### Ajout d'une nouvelle entité

1. **Ajouter la configuration** dans `searchable-entities.config.ts`
2. **Créer l'événement** dans le service métier :
   ```typescript
   this.eventEmitter.emit('article.created', { id, data })
   ```
3. **Ajouter le handler** dans `SearchIndexingService`

## 🔍 Entités supportées

- **Menus** : Navigation et fonctionnalités
- **Partners** : Clients et fournisseurs
- **Articles** : Produits et références
- **Materials** : Matériaux et nuances
- **Projets** : Dossiers et affaires
- **Documents** : Devis, factures, commandes
- **Utilisateurs** : Équipe et contacts (Admin)
- **Sociétés** : Entreprises clientes (Admin)
- **Pricing** : Règles tarifaires
- **Notifications** : Alertes système
- **Requêtes** : Query Builder

## 🔐 Sécurité

### Permissions
- `users.read` : Recherche utilisateurs
- `pricing.read` : Recherche règles tarifaires
- `query_builder.read` : Recherche requêtes

### Rôles
- `admin`, `super_admin` : Accès aux entités sensibles

### Filtrage automatique
- **Multi-tenant** : Isolation des données par société
- **Permissions** : Vérification automatique des droits
- **Rôles** : Contrôle d'accès granulaire

## 📊 Monitoring

### Métriques disponibles
```
GET /api/search/stats
```

### Statut du moteur
```
GET /api/search/status
```

### Réindexation
```
POST /api/search/reindex  # Admin uniquement
```

## 🛠️ Développement

### Tests
```bash
cd apps/api
pnpm test search
```

### Validation
```bash
ts-node src/scripts/validate-search-module.ts
```

### Debug ElasticSearch
```bash
curl -X GET "localhost:9200/topsteel_global_search/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d'{"query": {"match_all": {}}}'
```

## 🔄 Migration

Pour migrer depuis l'ancien système :
1. Configurer les entités dans `searchable-entities.config.ts`
2. Lancer la réindexation : `POST /api/search/reindex`
3. Tester les endpoints avec votre authentification
4. Mettre à jour le frontend pour utiliser les nouvelles routes

## 🐛 Dépannage

### ElasticSearch indisponible
Le système bascule automatiquement sur PostgreSQL.

### Résultats manquants
Vérifier les permissions et lancer une réindexation.

### Performance lente
Optimiser les index PostgreSQL ou activer ElasticSearch.

---

*Développé pour TopSteel ERP - Système de recherche globale v1.0*