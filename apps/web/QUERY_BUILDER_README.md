# Query Builder - Guide Complet

## 🎯 Vue d'ensemble

Le Query Builder est un système complet permettant de créer des requêtes SQL complexes de manière visuelle et interactive pour l'application TopSteel ERP.

## ✅ Fonctionnalités Implémentées

### Backend (NestJS)
- ✅ Entités TypeORM complètes (5 tables)
- ✅ Services CRUD avec authentification JWT
- ✅ Exécution de requêtes en temps réel
- ✅ Introspection de schéma de base de données
- ✅ Gestion des permissions granulaires
- ✅ Tables de test avec données d'exemple

### Frontend (Next.js)
- ✅ Interface utilisateur complète avec 4 onglets
- ✅ Sélecteur de tables avec jointures (INNER, LEFT, RIGHT, FULL)
- ✅ Drag & drop des colonnes
- ✅ Éditeur de champs calculés avec expressions
- ✅ Prévisualisation SQL automatique
- ✅ Composant DataTable pour l'affichage des résultats
- ✅ Configuration des paramètres et permissions

### Intégration
- ✅ Menu "Query Builder" dans le dashboard
- ✅ Routes API Next.js configurées
- ✅ Migrations de base de données exécutées
- ✅ Composants UI créés (Input, Label, Select, etc.)

## 🚀 Comment utiliser

### 1. Accès au Query Builder
Naviguez vers le menu "Query Builder" dans le dashboard principal.

### 2. Créer un Query Builder de test
Visitez `/query-builder/test` pour créer un exemple pré-configuré avec les données de test.

### 3. Interface principale
- **Onglet Design** : Sélection des tables et colonnes
- **Onglet Calculated Fields** : Création de champs calculés
- **Onglet Preview** : Prévisualisation SQL et exécution
- **Onglet Settings** : Configuration des paramètres

### 4. Workflow typique
1. Sélectionner la table principale
2. Ajouter des jointures si nécessaire
3. Glisser-déposer les colonnes souhaitées
4. Créer des champs calculés (optionnel)
5. Configurer les paramètres (permissions, limites)
6. Exécuter et tester la requête
7. Sauvegarder le Query Builder

## 📊 Tables de Test Disponibles

### test_categories
- 5 catégories : Électronique, Vêtements, Alimentation, Maison, Sport

### test_products
- Environ 80 produits avec :
  - SKU unique
  - Nom et description
  - Prix et coût
  - Stock et stock minimum
  - Poids
  - Lien vers catégorie

### test_orders & test_order_items
- Système de commandes complet
- Lignes de commande avec quantités et prix

## 🔧 Exemples de Champs Calculés

### Marge bénéficiaire
```
[price] - [cost]
```

### Pourcentage de marge
```
(([price] - [cost]) / [price]) * 100
```

### Total avec remise
```
[quantity] * [unit_price] * (1 - [discount] / 100)
```

### Statut de stock
```
CASE WHEN [stockQuantity] > [minimumStock] THEN 'OK' ELSE 'LOW' END
```

## 🔐 Sécurité et Permissions

### Types de permissions
- **View** : Voir le Query Builder
- **Edit** : Modifier le Query Builder
- **Delete** : Supprimer le Query Builder  
- **Execute** : Exécuter la requête

### Configuration de sécurité
- Query Builders publics/privés
- Limite du nombre de lignes (protection contre les surcharges)
- Permissions par utilisateur ou par rôle
- Authentification JWT obligatoire

## 📁 Structure des Fichiers

### Backend
```
apps/api/src/modules/query-builder/
├── entities/                  # Entités TypeORM
├── services/                  # Services métier
├── controllers/              # Contrôleurs REST
└── dto/                      # Data Transfer Objects
```

### Frontend
```
apps/web/src/
├── app/(dashboard)/query-builder/     # Pages
├── components/query-builder/          # Composants spécialisés
├── components/ui/                     # Composants UI génériques
└── app/api/query-builder/            # Routes API Next.js
```

## 🌐 URLs Importantes

- `/query-builder` - Interface principale
- `/query-builder/test` - Créer un Query Builder de test
- `/query-builder/docs` - Documentation d'utilisation
- `/query-builder/[id]` - Éditer un Query Builder existant

## 🔄 API Endpoints

### Frontend (Next.js API Routes)
- `GET /api/query-builder` - Liste des Query Builders
- `POST /api/query-builder` - Créer un Query Builder
- `GET /api/query-builder/[id]` - Détails d'un Query Builder
- `PATCH /api/query-builder/[id]` - Modifier un Query Builder
- `DELETE /api/query-builder/[id]` - Supprimer un Query Builder
- `POST /api/query-builder/[id]/execute` - Exécuter une requête

### Backend (NestJS)
- Mêmes endpoints exposés sur le port API (3002)
- Plus endpoints pour introspection de schéma

## 💡 Prochaines Étapes Possibles

1. **Intégration avancée**
   - Intégrer les Query Builders dans d'autres pages ERP
   - Créer des widgets dashboard basés sur les Query Builders

2. **Fonctionnalités avancées**
   - Support des sous-requêtes
   - Fonctions d'agrégation avancées (GROUP BY, HAVING)
   - Filtres dynamiques côté utilisateur

3. **Performance**
   - Cache des résultats de requêtes
   - Optimisation des requêtes SQL générées

4. **Export avancé**
   - Templates d'export personnalisés
   - Planification d'exports automatiques

## 🐛 Dépannage

### Erreurs communes

1. **"Module not found"** : Vérifiez que tous les composants UI sont créés
2. **Erreurs de base de données** : Vérifiez que les migrations sont exécutées
3. **Erreurs d'authentification** : Vérifiez que l'utilisateur est connecté

### Logs utiles
- Logs du serveur API pour les erreurs backend
- Console du navigateur pour les erreurs frontend
- Onglet Réseau pour les erreurs d'API

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation `/query-builder/docs`
2. Testez avec l'exemple `/query-builder/test`
3. Vérifiez les logs d'erreur dans la console

---

**Status : ✅ COMPLET ET FONCTIONNEL**

Le Query Builder est maintenant entièrement opérationnel et prêt pour la production !