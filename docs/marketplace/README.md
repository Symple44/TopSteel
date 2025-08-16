# 📚 Documentation Marketplace

## Vue d'ensemble

Le module Marketplace est une extension e-commerce multi-tenant complète pour l'ERP TopSteel. Il permet de transformer l'ERP en plateforme de vente en ligne B2B/B2C.

## 📖 Guides disponibles

### Pour les administrateurs
- [Guide Administrateur](./ADMIN_GUIDE.md) - Configuration et gestion du marketplace
- [FAQ](./FAQ.md) - Questions fréquentes et résolution de problèmes

### Pour les développeurs
- [Guide Développeur](./DEVELOPER_GUIDE.md) - Architecture et développement
- [Intégration ERP](./erp-integration.md) - Synchronisation avec les entités ERP
- [Entités Obsolètes](./deprecated-entities.md) - Documentation des migrations effectuées

## 🏗️ Architecture

### Principe d'intégration

```
┌─────────────────────────────┐
│     MARKETPLACE FRONTEND    │
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│    MARKETPLACE ADAPTERS     │
│  • ProductAdapter           │
│  • CustomerAdapter          │
│  • OrderAdapter             │
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│      ENTITÉS ERP (BDD)      │
│  • Article                  │
│  • Partner                  │
│  • Commandes                │
└─────────────────────────────┘
```

### Points clés

1. **Pas de duplication** : Le marketplace utilise directement les entités ERP
2. **Adapters** : Couche d'abstraction pour la compatibilité
3. **Synchronisation** : Temps réel via événements
4. **Multi-tenant** : Isolation complète par tenant

## 🔑 Fonctionnalités principales

### Gestion des produits
- Activation sélective des articles pour le marketplace
- Gestion des prix et promotions
- Stock temps réel synchronisé avec l'ERP
- Images et descriptions enrichies

### Gestion des clients
- Synchronisation automatique avec les Partners ERP
- Comptes clients avec historique
- Paniers persistants
- Listes de favoris

### Gestion des commandes
- Conversion automatique en documents ERP
- Workflow de validation configurable
- Statuts synchronisés
- Notifications automatiques

### Administration
- Dashboard centralisé
- Analytics et rapports
- Configuration par tenant
- Modération du contenu

## 🚀 Quick Start

### Configuration minimale

```typescript
// .env
MARKETPLACE_ENABLED=true
MARKETPLACE_URL=https://shop.topsteel.fr
MARKETPLACE_SYNC_INTERVAL=300000  // 5 minutes
```

### Activation d'un article

```typescript
// Active un article pour le marketplace
await articleRepository.update(articleId, {
  isMarketplaceEnabled: true,
  marketplaceSettings: {
    visibility: 'PUBLIC',
    featured: false,
    categories: ['acier', 'poutrelles'],
    tags: ['HEA', 'construction']
  }
});
```

### Synchronisation manuelle

```bash
# Synchroniser tous les articles
curl -X POST http://localhost:3000/api/marketplace/sync/products

# Synchroniser les commandes
curl -X POST http://localhost:3000/api/marketplace/sync/orders
```

## 📊 Métriques et monitoring

Le module intègre Prometheus pour le monitoring :

- Nombre de produits actifs
- Taux de conversion
- Valeur moyenne des commandes
- Performance des APIs
- Erreurs de synchronisation

## 🔧 Maintenance

### Commandes utiles

```bash
# Vérifier la cohérence des données
npm run marketplace:check-consistency

# Nettoyer les caches
npm run marketplace:clear-cache

# Exporter les métriques
npm run marketplace:export-metrics
```

## 📞 Support

- Documentation technique : [Guide Développeur](./DEVELOPER_GUIDE.md)
- Administration : [Guide Admin](./ADMIN_GUIDE.md)
- Problèmes courants : [FAQ](./FAQ.md)

---

*Module Marketplace v2.0 - Documentation mise à jour le 14/01/2025*