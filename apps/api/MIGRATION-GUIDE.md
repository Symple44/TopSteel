# Guide de Migration Multi-Tenant - TopSteel ERP

## 📋 Vue d'ensemble

Ce guide décrit la procédure complète de migration de l'architecture monolithe vers une architecture multi-tenant avec séparation des bases de données.

### Architecture Cible

- **AUTH Database** : Authentification, utilisateurs, sociétés, permissions
- **SHARED Database** : Données métier partagées (matériaux, processus, standards qualité)  
- **TENANT Databases** : Données spécifiques à chaque société (clients, commandes, stocks)

## 🚀 Prérequis

### Techniques
- PostgreSQL 12+
- Node.js 18+
- TypeScript 4.5+
- TypeORM 0.3+
- NestJS 10+

### Environnement
- Base de données actuelle sauvegardée
- Variables d'environnement configurées
- Accès administrateur PostgreSQL

## 📁 Structure des Fichiers

```
apps/api/src/
├── database/
│   ├── migrations/
│   │   ├── auth/001-CreateAuthTables.ts
│   │   ├── shared/001-CreateSharedTables.ts
│   │   └── tenant/001-CreateTenantTables.ts
│   └── config/multi-tenant-database.config.ts
├── modules/
│   ├── societes/    # Gestion des sociétés
│   ├── shared/      # Données partagées
│   └── database/    # Module multi-tenant
└── scripts/migration/
    ├── backup-current-database.ts
    ├── audit-current-data.ts
    ├── clean-test-data.ts
    ├── migration-service.ts
    ├── dry-run-migration.ts
    └── rollback-migration.ts
```

## ⚙️ Configuration

### Variables d'environnement

Ajoutez au fichier `.env` :

```bash
# Architecture multi-tenant
DB_AUTH_NAME=erp_topsteel_auth
DB_SHARED_NAME=erp_topsteel_shared
DB_TENANT_PREFIX=erp_topsteel
```

### Module principal

Le `DatabaseMultiTenantModule` est configuré dans `app.module.ts` pour gérer les 3 types de bases de données.

## 🔧 Scripts NPM Disponibles

### Préparation
```bash
npm run db:backup               # Sauvegarde complète
npm run db:audit               # Audit des données actuelles
npm run db:clean               # Nettoyage des données de test (dry-run)
npm run db:clean:execute       # Nettoyage effectif
npm run db:migration:dry-run   # Validation pré-migration
```

### Migration
```bash
npm run db:migrate             # Migration complète
```

### Sécurité
```bash
npm run db:rollback:validate   # Valider conditions de rollback
npm run db:rollback           # Rollback d'urgence
```

## 📖 Procédure de Migration

### Phase 1 : Préparation

#### 1.1 Sauvegarde
```bash
npm run db:backup
```
**Résultat** : Fichiers de sauvegarde dans `backups/pre-migration/`

#### 1.2 Audit des données
```bash
npm run db:audit
```
**Résultat** : Rapport JSON avec analyse des données et recommandations

#### 1.3 Nettoyage (optionnel)
```bash
# Simulation
npm run db:clean

# Exécution réelle
npm run db:clean:execute
```

#### 1.4 Validation pré-migration
```bash
npm run db:migration:dry-run
```
**Critères de succès** :
- ✅ Toutes les variables d'environnement présentes
- ✅ Base de données accessible  
- ✅ Fichiers de migration trouvés
- ✅ Utilisateurs à migrer identifiés

### Phase 2 : Migration

#### 2.1 Exécution de la migration
```bash
npm run db:migrate
```

**Le script effectue automatiquement** :
1. ✅ Création des nouvelles bases (AUTH, SHARED, TENANT)
2. ✅ Exécution des migrations de schéma
3. ✅ Migration des utilisateurs vers AUTH
4. ✅ Création de la société par défaut "TopSteel"
5. ✅ Association des utilisateurs à la société
6. ✅ Migration des données métier vers TENANT

#### 2.2 Vérification post-migration
- Redémarrer l'application
- Vérifier la connexion des utilisateurs
- Tester les fonctionnalités critiques

### Phase 3 : Validation

#### 3.1 Tests fonctionnels
- [ ] Authentification utilisateur
- [ ] Gestion des sociétés
- [ ] Accès aux données partagées
- [ ] Isolation des données par tenant

#### 3.2 Tests de performance
- [ ] Temps de connexion
- [ ] Requêtes multi-tenant
- [ ] Gestion mémoire

## 🚨 Procédure de Rollback

### En cas de problème critique

#### 1. Validation du rollback
```bash
npm run db:rollback:validate
```

#### 2. Exécution du rollback
```bash
npm run db:rollback
```

**Actions effectuées** :
- ✅ Suppression des nouvelles bases de données
- ✅ Restauration de la base originale depuis le backup
- ✅ Nettoyage de la configuration

#### 3. Actions post-rollback
- Redémarrer l'application
- Désactiver le module multi-tenant dans `app.module.ts`
- Analyser les logs d'erreur

## 🔍 Troubleshooting

### Erreurs courantes

#### "Database already exists"
```bash
# Supprimer manuellement les bases existantes
psql -U postgres -c "DROP DATABASE IF EXISTS erp_topsteel_auth;"
psql -U postgres -c "DROP DATABASE IF EXISTS erp_topsteel_shared;"
```

#### "Connection timeout" 
- Vérifier les variables d'environnement DB_*
- Vérifier que PostgreSQL est accessible
- Augmenter les timeouts si nécessaire

#### "Migration failed"
- Consulter les logs détaillés
- Vérifier l'intégrité des données source
- Exécuter le rollback si nécessaire

### Monitoring

#### Logs importants
```bash
# Logs de migration
tail -f logs/migration.log

# Logs application
tail -f logs/application.log
```

#### Métriques à surveiller
- Nombre de connexions par base
- Temps de réponse des requêtes
- Utilisation mémoire
- Espace disque

## 📊 Validation des Données

### Après migration complète

#### Compteurs de vérification
```sql
-- Base AUTH
SELECT 'users', COUNT(*) FROM users WHERE deleted_at IS NULL;
SELECT 'societes', COUNT(*) FROM societes WHERE deleted_at IS NULL;

-- Base SHARED  
SELECT 'shared_materials', COUNT(*) FROM shared_materials WHERE deleted_at IS NULL;

-- Base TENANT
SELECT 'clients', COUNT(*) FROM clients WHERE deleted_at IS NULL;
SELECT 'commandes', COUNT(*) FROM commandes WHERE deleted_at IS NULL;
```

#### Tests d'intégrité référentielle
```sql
-- Vérifier les relations inter-bases
SELECT COUNT(*) FROM societe_users su 
LEFT JOIN users u ON su.user_id = u.id 
WHERE u.id IS NULL; -- Doit être 0
```

## 🔧 Maintenance Post-Migration

### Optimisations recommandées

#### Index de performance
```sql
-- Ajout d'index optimisés pour multi-tenant
CREATE INDEX CONCURRENTLY idx_tenant_data_societe_id ON tenant_table (societe_id);
```

#### Nettoyage périodique
```sql
-- Nettoyage des sessions expirées
DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '7 days';
```

### Monitoring continu
- Surveiller la croissance des bases tenant
- Optimiser les requêtes cross-database
- Planifier la maintenance des index

## 📞 Support

### En cas de problème
1. Consulter les logs détaillés
2. Exécuter le script de validation
3. Contacter l'équipe technique avec :
   - Logs d'erreur complets
   - État des bases de données
   - Configuration système

### Contacts d'urgence
- **Admin Système** : [contact technique]  
- **DBA** : [contact base de données]
- **Équipe Dev** : [contact développement]

---

**⚠️ Important** : Cette migration est une opération critique. Toujours effectuer une sauvegarde complète et tester en environnement de développement avant la production.