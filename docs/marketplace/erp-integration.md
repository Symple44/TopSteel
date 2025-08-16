# Marketplace ERP Integration

## Vue d'ensemble

Cette documentation décrit la nouvelle architecture d'intégration entre le marketplace et le système ERP de TopSteel. L'intégration assure une synchronisation bidirectionnelle complète entre les données marketplace et ERP.

## Architecture

### Entités ERP Utilisées

#### Article (`@erp/entities`)
```typescript
// Entité ERP native avec support marketplace intégré
class Article {
  // Champs ERP standards
  reference: string;           // SKU marketplace
  designation: string;         // Nom produit
  description?: string;
  famille?: string;           // Catégorie
  sousFamille?: string;       // Sous-catégorie
  marque?: string;           // Marque
  prixVenteHT?: number;      // Prix de base
  stockPhysique?: number;
  stockDisponible?: number;
  
  // Support marketplace natif
  isMarketplaceEnabled: boolean;
  marketplaceSettings?: {
    basePrice?: number;
    categories?: string[];
    description?: string;
    images?: string[];
    seoTitle?: string;
    seoDescription?: string;
    tags?: string[];
  };
}
```

#### Partner (`domains/partners`)
```typescript
// Partenaire ERP (clients/fournisseurs)
class Partner {
  code: string;              // Code client ERP
  denomination: string;      // Nom/Raison sociale
  email?: string;
  telephone?: string;
  adresse?: string;
  // ... autres champs ERP
}
```

#### Societe (`@erp/entities`)
```typescript
// Configuration tenant avec paramètres marketplace
class Societe {
  configuration: {
    marketplace?: {
      enabled?: boolean;
      storeName?: string;
      // ... configuration complète
    }
  }
}
```

### Adapters de Synchronisation

#### MarketplaceProductAdapter
- Convertit les Articles ERP en vues marketplace
- Gère les filtres et recherches
- Applique les paramètres marketplace

```typescript
// Utilisation
const products = await adapter.getMarketplaceProducts(tenantId, filters, sort, pagination);
const product = await adapter.getMarketplaceProductById(tenantId, productId);
```

#### MarketplaceCustomerAdapter  
- Synchronise les clients marketplace avec les partenaires ERP
- Création automatique de partenaires
- Liaison bidirectionnelle

```typescript
// Création avec synchronisation ERP
const customer = await adapter.createMarketplaceCustomer(tenantId, customerData);

// Synchronisation manuelle
await adapter.syncCustomerToPartner(tenantId, { customerId, createPartner: true });
```

#### MarketplaceOrderAdapter
- Convertit les commandes marketplace en vues ERP
- Prépare les données pour intégration commandes ERP
- Validation des références articles/clients

```typescript
// Vue ERP des commandes
const erpOrders = await adapter.getERPOrdersView(tenantId, filters, pagination);
const erpOrder = await adapter.getERPOrderView(tenantId, orderId);
```

### Service d'Intégration Principale

#### ERPMarketplaceIntegrationService
- Orchestration de la synchronisation
- Statistiques et monitoring
- Vues unifiées ERP + Marketplace

```typescript
// Statistiques d'intégration
const stats = await service.getIntegrationStats(tenantId);

// Vérification de santé
const health = await service.checkIntegrationHealth(tenantId);

// Synchronisation complète
const result = await service.performFullSync(tenantId);

// Vues unifiées
const productView = await service.getUnifiedProductView(tenantId, productId);
const customerView = await service.getUnifiedCustomerView(tenantId, customerId);
```

## Endpoints API

### Intégration ERP
```
GET    /marketplace/erp-integration/stats           # Statistiques
GET    /marketplace/erp-integration/health          # Santé intégration
POST   /marketplace/erp-integration/sync/full       # Sync complète

GET    /marketplace/erp-integration/products        # Produits marketplace
GET    /marketplace/erp-integration/products/:id    # Vue unifiée produit

GET    /marketplace/erp-integration/customers       # Clients marketplace
GET    /marketplace/erp-integration/customers/:id   # Vue unifiée client

GET    /marketplace/erp-integration/orders          # Commandes vue ERP
GET    /marketplace/erp-integration/orders/:id      # Commande vue ERP

GET    /marketplace/erp-integration/categories      # Catégories ERP
GET    /marketplace/erp-integration/brands          # Marques ERP
```

### Migration
```
GET    /marketplace/migration/plan                  # Plan de migration
POST   /marketplace/migration/execute               # Exécuter migration
GET    /marketplace/migration/progress              # Progrès migration
GET    /marketplace/migration/status                # Statut migration
```

## Migration des Données Existantes

### Service de Migration

Le `MarketplaceToERPMigrationService` gère la migration des données existantes :

1. **Analyse** : Création d'un plan de migration
2. **Produits** : Migration `MarketplaceProduct` → `Article` ERP
3. **Clients** : Création `Partner` pour `MarketplaceCustomer`
4. **Commandes** : Mise à jour des références vers les entités ERP
5. **Nettoyage** : Conservation des données originales pour sécurité

### Plan de Migration
```typescript
interface MigrationPlan {
  productsToMigrate: number;
  customersToMigrate: number;
  ordersToUpdate: number;
  estimatedDuration: number;
  warnings: string[];
  prerequisites: string[];
}
```

### Étapes de Migration

1. **Préparation**
   ```bash
   GET /marketplace/migration/plan
   ```

2. **Exécution**
   ```bash
   POST /marketplace/migration/execute
   ```

3. **Suivi**
   ```bash
   GET /marketplace/migration/progress
   ```

## Avantages de la Nouvelle Architecture

### ✅ Synchronisation Native
- Plus de duplication de données
- Cohérence garantie ERP ↔ Marketplace
- Mise à jour temps réel

### ✅ Gestion Unified des Stocks
- Stock ERP = Stock marketplace
- Réservations automatiques
- Seuils et alertes centralisés

### ✅ Client Unique
- Un client = un partenaire ERP
- Historique unifié
- Conditions commerciales centralisées

### ✅ Traçabilité Complète
- Commandes liées aux articles ERP
- Suivi des mouvements de stock
- Intégration comptable future

### ✅ Performance
- Requêtes optimisées sur entités ERP
- Cache intelligent
- Pagination native

## Configuration

### Module d'Intégration
```typescript
// apps/api/src/features/marketplace/marketplace.module.ts
import { ERPIntegrationModule } from './integration/erp-integration.module';

@Module({
  imports: [
    ERPIntegrationModule,
    // ... autres modules
  ],
})
export class MarketplaceModule {}
```

### Variables d'Environnement
```env
# Configuration marketplace-ERP
MARKETPLACE_ERP_SYNC_ENABLED=true
MARKETPLACE_AUTO_CREATE_PARTNERS=true
MARKETPLACE_STOCK_SYNC_INTERVAL=300
```

## Monitoring et Observabilité

### Métriques
- Nombre de produits synchronisés
- Clients avec/sans partenaire ERP
- Commandes en attente de synchronisation
- Temps de réponse des adapters

### Alertes
- Produits marketplace sans article ERP
- Clients sans partenaire ERP
- Écarts de stock
- Erreurs de synchronisation

### Logs
```typescript
// Exemples de logs
[MarketplaceProductAdapter] Product ART001 synchronized
[ERPIntegrationService] Full sync completed: 150 items, 0 errors
[MigrationService] Migration progress: 75% (productos)
```

## Roadmap

### Phase 1 ✅ (Actuelle)
- Architecture d'intégration
- Adapters produits/clients
- Service de migration
- API d'intégration

### Phase 2 🔄 (En cours)
- Module commandes ERP
- Synchronisation bidirectionnelle commandes
- Workflow validation/expédition

### Phase 3 📋 (Planifiée)
- Intégration comptable
- Reporting unifié
- Dashboard intégration
- API webhooks

## Support et Maintenance

### Commandes Utiles
```bash
# Vérifier l'état de l'intégration
curl GET /marketplace/erp-integration/health

# Synchronisation manuelle
curl -X POST /marketplace/erp-integration/sync/full

# Migration des données
curl -X POST /marketplace/migration/execute
```

### Dépannage

**Problème** : Produits marketplace non visibles
```bash
# Vérifier si les articles ERP ont isMarketplaceEnabled=true
SELECT reference, designation, is_marketplace_enabled 
FROM articles WHERE tenant_id = 'xxx'
```

**Problème** : Clients sans commandes ERP
```bash
# Vérifier la liaison des partenaires
SELECT c.email, c.erp_partner_id, p.code 
FROM marketplace_customers c 
LEFT JOIN partners p ON c.erp_partner_id = p.id
WHERE c.tenant_id = 'xxx'
```

---

**Note** : Cette architecture garantit une intégration native et bidirectionnelle entre le marketplace et l'ERP, éliminant la duplication de données et assurant la cohérence des informations.