# Système de Recherche Globale TopSteel

## 🚀 Vue d'ensemble

Ce système de recherche globale permet aux utilisateurs de TopSteel de rechercher rapidement dans toutes les entités de l'application (clients, fournisseurs, articles, matériaux, projets, etc.) avec une interface unifiée et performante.

### Fonctionnalités principales

- **Recherche unifiée** : Un point d'entrée unique pour toutes les données
- **Recherche intelligente** : Scoring de pertinence et suggestions
- **Multi-moteurs** : ElasticSearch (haute performance) avec fallback PostgreSQL
- **Sécurité** : Respect des permissions et isolation multi-tenant
- **Interface moderne** : Command Palette avec navigation clavier
- **Performance** : Recherche en temps réel avec debouncing

## 🏗️ Architecture

### Backend (NestJS)

```
apps/api/src/features/search/
├── controllers/
│   └── search.controller.ts       # Points d'entrée API
├── services/
│   ├── global-search.service.ts   # Service principal avec stratégies
│   └── search-indexing.service.ts # Indexation ElasticSearch
├── config/
│   └── searchable-entities.config.ts # Configuration des entités
└── search.module.ts              # Module NestJS
```

### Frontend (Next.js)

```
apps/web/src/
├── hooks/
│   └── use-global-search.ts      # Hook React avec logique métier
└── components/search/
    └── command-palette.tsx       # Interface utilisateur
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# ElasticSearch (optionnel)
ELASTICSEARCH_HOST=localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_ENABLED=true

# PostgreSQL (requis pour fallback)
DATABASE_URL=postgresql://user:password@localhost:5432/topsteel
TENANT_DATABASE_URL=postgresql://user:password@localhost:5432/topsteel_tenant
```

### Configuration des entités recherchables

Le fichier `searchable-entities.config.ts` définit quelles entités sont recherchables :

```typescript
{
  type: 'client',
  tableName: 'partners',
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
  icon: 'users',
  urlPattern: '/partners/clients/{id}',
  database: 'tenant',
  priority: 9,
  enabled: true,
  requiresPermission: 'clients.read' // Optionnel
}
```

## 🚦 Installation et démarrage

### 1. Backend

```bash
cd apps/api
pnpm install
pnpm build
pnpm start
```

### 2. Frontend

```bash
cd apps/web
pnpm install
pnpm build
pnpm dev
```

### 3. ElasticSearch (optionnel mais recommandé)

#### Avec Docker

```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "ES_JAVA_OPTS=-Xms1g -Xmx1g" \
  elasticsearch:8.8.0
```

#### Configuration sécurisée

```bash
# Générer un mot de passe
docker exec -it elasticsearch /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic

# Variables d'environnement
ELASTICSEARCH_HOST=https://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=generated_password
```

## 📖 Utilisation

### Interface utilisateur

1. **Raccourci clavier** : `Ctrl+K` (ou `Cmd+K` sur Mac)
2. **Saisie** : Tapez au moins 2 caractères
3. **Navigation** : Utilisez les flèches ↑↓
4. **Sélection** : Appuyez sur `Entrée`
5. **Fermeture** : `Échap`

### API REST

#### Recherche globale
```http
GET /api/search/global?q=terme&types=client,article&limit=20
Authorization: Bearer <token>
```

#### Recherche par type
```http
GET /api/search/type/client?q=terme&limit=10
Authorization: Bearer <token>
```

#### Suggestions
```http
GET /api/search/suggestions?q=ter
Authorization: Bearer <token>
```

#### Statut du moteur
```http
GET /api/search/status
Authorization: Bearer <token>
```

#### Réindexation (Admin)
```http
POST /api/search/reindex
Authorization: Bearer <admin_token>
```

### Hook React

```typescript
import { useGlobalSearch } from '@/hooks/use-global-search'

function SearchComponent() {
  const {
    query,
    results,
    loading,
    setQuery,
    clearSearch
  } = useGlobalSearch({
    limit: 20,
    types: ['client', 'article'],
    debounceMs: 300
  })

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher..."
      />
      {loading && <div>Chargement...</div>}
      {results.map(result => (
        <div key={`${result.type}-${result.id}`}>
          {result.title} - {result.description}
        </div>
      ))}
    </div>
  )
}
```

## 🔒 Sécurité

### Protection contre l'injection SQL

- **Requêtes paramétrées** : Utilisation de paramètres liés
- **Validation d'entrée** : Longueur minimale, caractères autorisés
- **Échappement** : Échappement automatique des caractères spéciaux

```typescript
// ✅ Sécurisé
searchConditions.push(`${field.name} ILIKE $${params.length + 1}`)
params.push(searchPattern)

// ❌ Vulnérable (non utilisé)
query += `WHERE name LIKE '%${userInput}%'`
```

### Gestion des permissions

Chaque entité peut définir :
- **Permissions requises** : `requiresPermission: 'users.read'`
- **Rôles requis** : `requiresRole: ['admin', 'super_admin']`

```typescript
// Filtrage automatique selon les permissions
export function getAccessibleEntities(
  permissions: string[] = [],
  roles: string[] = []
): SearchableEntity[] {
  return SEARCHABLE_ENTITIES.filter(entity => {
    if (entity.requiresPermission && !permissions.includes(entity.requiresPermission)) {
      return false
    }
    if (entity.requiresRole?.some(role => !roles.includes(role))) {
      return false
    }
    return true
  })
}
```

### Isolation multi-tenant

- **Filtrage automatique** : `tenant_id` ajouté aux requêtes
- **Bases de données séparées** : Auth, Shared, Tenant
- **Validation** : Vérification de l'appartenance tenant

```typescript
// Ajout automatique du filtre tenant
if (entity.database === 'tenant' && tenantId) {
  query += ` AND tenant_id = $${params.length + 1}`
  params.push(tenantId)
}
```

## 📊 Surveillance et métriques

### Logs

```typescript
// Recherches loggées avec détails
this.logger.debug(`User ${user?.email} searching for: "${query}"`)
this.logger.log(`✅ Using ElasticSearch for global search`)
this.logger.warn(`⚠️ ElasticSearch not available, falling back to PostgreSQL`)
```

### Métriques

- **Temps de réponse** : Mesuré et retourné (`took` en ms)
- **Nombre de résultats** : Comptage précis
- **Moteur utilisé** : ElasticSearch ou PostgreSQL
- **Erreurs** : Logging complet des exceptions

## 🔧 Maintenance

### Réindexation ElasticSearch

```bash
# Via API (Admin requis)
curl -X POST https://api.topsteel.com/search/reindex \
  -H "Authorization: Bearer <admin_token>"

# Ou via script
cd apps/api
npx ts-node src/scripts/reindex-search.ts
```

### Nettoyage des index

```bash
# Supprimer l'index
curl -X DELETE "localhost:9200/topsteel_global_search"

# Recréer l'index (redémarrer l'application)
```

### Optimisation PostgreSQL

```sql
-- Index pour améliorer les performances
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_search 
ON partners USING gin((
  setweight(to_tsvector('french', coalesce(denomination, '')), 'A') ||
  setweight(to_tsvector('french', coalesce(code, '')), 'B') ||
  setweight(to_tsvector('french', coalesce(email, '')), 'C')
));

-- Statistiques
ANALYZE partners;
```

## 🚀 Performances

### ElasticSearch vs PostgreSQL

| Critère | ElasticSearch | PostgreSQL |
|---------|---------------|------------|
| **Vitesse** | 50-200ms | 100-500ms |
| **Suggestions** | Natives | Calculées |
| **Highlight** | Natif | Manuel |
| **Facettes** | Natives | Calculées |
| **Complexité** | Élevée | Faible |
| **Maintenance** | Élevée | Faible |

### Optimisations appliquées

- **Debouncing** : 300ms par défaut
- **Limitation** : 20 résultats par défaut
- **Cache** : Historique en localStorage
- **Pagination** : Support offset/limit
- **Abort Controller** : Annulation des requêtes

## 🐛 Dépannage

### ElasticSearch non disponible

```
⚠️ ElasticSearch not available, falling back to PostgreSQL
```

**Solution** :
1. Vérifier que ElasticSearch est démarré
2. Vérifier les variables d'environnement
3. Vérifier la connectivité réseau

### Permissions insuffisantes

```
403 Forbidden - Permission denied
```

**Solution** :
1. Vérifier les rôles de l'utilisateur
2. Vérifier la configuration des entités
3. Vérifier la session JWT

### Performance dégradée

```
Search took 2000ms (> 500ms threshold)
```

**Solutions** :
- Activer ElasticSearch
- Ajouter des index PostgreSQL
- Réduire la limite de résultats
- Optimiser les requêtes SQL

## 📋 TODO et améliorations

### Court terme
- [ ] Tests unitaires complets
- [ ] Documentation OpenAPI
- [ ] Métriques Prometheus

### Moyen terme  
- [ ] Recherche vocale
- [ ] IA pour suggestions intelligentes
- [ ] Cache Redis pour PostgreSQL
- [ ] Recherche floue avancée

### Long terme
- [ ] ML pour ranking personnalisé
- [ ] Analyse de logs de recherche
- [ ] A/B testing sur l'interface
- [ ] API GraphQL

## 📞 Support

Pour toute question ou problème :

1. **Documentation** : Ce README
2. **Issues** : GitHub Issues du projet
3. **Logs** : Consultez les logs de l'application
4. **Équipe** : Contactez l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : 11 Août 2025  
**Auteur** : Équipe TopSteel  