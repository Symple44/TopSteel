# Entités Marketplace Obsolètes

⚠️ **ATTENTION** : Ces entités sont obsolètes depuis l'intégration ERP et peuvent être supprimées après migration complète.

## Entités à Supprimer

### ❌ `marketplace-product.entity.ts`
**Remplacé par** : `Article` ERP avec `isMarketplaceEnabled` et `marketplaceSettings`
**Raison** : Duplication des données avec l'ERP

### ❌ `marketplace-customer.entity.ts` (partiellement)
**Remplacé par** : Liaison avec `Partner` ERP via `erpPartnerId`
**Raison** : Les clients marketplace doivent être des partenaires ERP
**Note** : Garder temporairement pour la liaison, mais les données client doivent être dans Partner

## Services à Mettre à Jour

### 🔄 `product-catalog.service.ts`
**Status** : ✅ Mis à jour pour utiliser les adapters ERP
**Changements** : Utilise `MarketplaceProductAdapter` au lieu de `MarketplaceProduct`

### 🔄 Services utilisant `MarketplaceProduct`
- Mettre à jour tous les services pour utiliser `MarketplaceProductAdapter`
- Remplacer les références directes à `MarketplaceProduct` par `Article` ERP

## Plan de Suppression (Post-Migration)

### Phase 1 : Validation
1. ✅ Migrer toutes les données vers ERP
2. ✅ Tester tous les endpoints avec nouvelle architecture
3. ✅ Valider que tous les services utilisent les adapters

### Phase 2 : Suppression Progressive
1. Marquer les entités comme `@deprecated`
2. Supprimer les imports dans les modules
3. Supprimer les fichiers entités
4. Nettoyer les migrations TypeORM

### Phase 3 : Nettoyage Final
1. Supprimer les tables `marketplace_products` (après sauvegarde)
2. Mettre à jour la documentation
3. Audit final des références

## Commandes de Nettoyage

```bash
# Après migration validée, supprimer les entités obsolètes
rm apps/api/src/features/marketplace/entities/marketplace-product.entity.ts

# Nettoyer les imports dans les modules
# Vérifier qu'aucun service n'importe encore MarketplaceProduct

# Supprimer les tables (après sauvegarde)
# DROP TABLE marketplace_products;
```

## Validation Pré-Suppression

✅ **Checklist avant suppression** :
- [ ] Migration complète exécutée
- [ ] Tous les tests passent avec nouvelle architecture  
- [ ] Aucun service n'importe `MarketplaceProduct`
- [ ] Sauvegarde des données effectuée
- [ ] Validation en environnement de test

---
**Date de création** : 2025-01-14
**Créé par** : Refactoring ERP Integration