# Guide de Résolution - Authentification Admin

## Problème
L'authentification avec `admin@topsteel.tech / TopSteel44!` retourne "Invalid credentials".

## Diagnostic Rapide

### 1. Scripts de Diagnostic Disponibles

```bash
# Diagnostic complet de l'utilisateur admin
npm run script:diagnose-admin

# Créer/réinitialiser l'utilisateur admin
npm run script:create-admin-user

# Tester la connexion admin
npm run script:test-admin-login
```

### 2. Vérifications Étape par Étape

#### Étape 1: Vérifier l'État des Seeds
```bash
# Depuis le dossier apps/api
npm run script:diagnose-admin
```
Ce script vérifie :
- Si l'utilisateur admin existe
- Si le mot de passe est correct
- L'état des seeds dans la base
- La structure de la table users

#### Étape 2: Si l'utilisateur n'existe pas
```bash
# Créer l'utilisateur admin
npm run script:create-admin-user
```

#### Étape 3: Si les seeds ne sont pas exécutés
Le service `DatabaseStartupService` exécute automatiquement les seeds au démarrage si :
- `AUTO_RUN_SEEDS=true` dans le .env (déjà configuré)
- `NODE_ENV=development` (déjà configuré)

### 3. Causes Possibles et Solutions

#### A. Utilisateur Admin Inexistant
**Symptôme** : "Invalid credentials" + utilisateur non trouvé dans le diagnostic

**Solution** :
```bash
npm run script:create-admin-user
```

#### B. Mot de Passe Incorrect dans la Base
**Symptôme** : Utilisateur existe mais mot de passe invalide

**Solution** : Le script `create-admin-user` réinitialise automatiquement le mot de passe

#### C. Seeds Non Exécutés
**Symptôme** : Table `seeds_status` vide

**Solution** :
```bash
# Redémarrer l'application (les seeds s'exécutent automatiquement)
npm run dev

# Ou forcer l'exécution via la console Node.js dans l'app
```

#### D. Configuration Base de Données
**Symptôme** : Erreurs de connexion dans les logs

**Vérifications** :
1. PostgreSQL est démarré
2. Base `erp_topsteel_auth` existe
3. Variables d'environnement correctes dans `.env`

### 4. Identifiants de Connexion

#### Méthode 1: Email
- **Email** : `admin@topsteel.tech`
- **Mot de passe** : `TopSteel44!`

#### Méthode 2: Acronyme (recommandé)
- **Acronyme** : `TOP`
- **Mot de passe** : `TopSteel44!`

### 5. Structure Attendue

L'utilisateur admin doit avoir ces propriétés :
```sql
nom: 'Admin'
prenom: 'System'
email: 'admin@topsteel.tech'
role: 'ADMIN'
actif: true
acronyme: 'TOP'
password: (hash de 'TopSteel44!')
```

### 6. Vérification Multi-Tenant

Le système utilise une architecture multi-tenant avec :
- Base AUTH : `erp_topsteel_auth` (utilisateurs, authentification)
- Base SHARED : `erp_topsteel_shared` (données partagées)
- Base TENANT : `erp_topsteel_topsteel` (données métier)

L'utilisateur admin est stocké dans la base AUTH.

### 7. Commandes de Dépannage Avancées

```bash
# Vérifier les bases multi-tenant
npm run db:test:topsteel

# Forcer la recréation des structures
npm run db:migrate

# Reset complet (ATTENTION: perte de données)
npm run db:reset:force
```

### 8. Logs à Surveiller

Au démarrage, cherchez ces messages :
```
🚀 Initialisation automatique de la base de données...
🌱 Vérification des données d'initialisation...
👥 Utilisateur admin créé: admin@topsteel.tech / TopSteel44! (acronyme: TOP)
```

### 9. Si Rien ne Fonctionne

1. **Vérifier les logs de l'application** au démarrage
2. **Vérifier PostgreSQL** : `psql -U postgres -d erp_topsteel_auth -c "\dt"`
3. **Recréer manuellement** :
   ```sql
   -- Se connecter à psql
   \c erp_topsteel_auth
   
   -- Vérifier si l'utilisateur existe
   SELECT * FROM users WHERE email = 'admin@topsteel.tech';
   
   -- Si nécessaire, le créer manuellement
   INSERT INTO users (nom, prenom, email, password, role, actif, acronyme, created_at, updated_at)
   VALUES ('Admin', 'System', 'admin@topsteel.tech', 
           '$2b$10$hash_of_TopSteel44!', 'ADMIN', true, 'TOP', 
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
   ```

### 10. Prévention

Pour éviter ce problème à l'avenir :
- Vérifier que `AUTO_RUN_SEEDS=true` dans le .env
- Ne pas supprimer l'utilisateur admin en production
- Sauvegarder régulièrement la base AUTH

---

## Contact Support

Si le problème persiste après avoir suivi ce guide, fournir :
1. Sortie complète de `npm run script:diagnose-admin`
2. Logs de démarrage de l'application
3. Version de PostgreSQL
4. Contenu du fichier `.env` (sans les mots de passe)