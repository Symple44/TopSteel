# 📋 Guide Complet des Credentials - TopSteel ERP

## ✅ Fichier .env.security Créé avec Succès

### 📊 Résumé
- **457 lignes** de configuration complète
- **150+ variables d'environnement** documentées
- **Tous les services** configurés
- **Sécurisé** : Automatiquement ignoré par Git

## 🚀 Instructions d'Utilisation

### 1. Activation Immédiate (Développement)

```bash
# Copier les variables dans votre environnement
cp .env.security .env.local

# Ou utiliser directement
node -r dotenv/config -e "require('dotenv').config({path:'.env.security'})"
```

### 2. Vérification de la Configuration

```bash
# Tester que les variables sont chargées
node -e "require('dotenv').config({path:'.env.security'}); console.log('Config OK:', !!process.env.JWT_SECRET)"
```

## 📁 Structure du Fichier .env.security

### 🔐 **Section Sécurité (Lignes 1-40)**
- JWT tokens (SECRET, REFRESH)
- Session management
- NextAuth configuration
- Password hashing
- Encryption keys

### 🗄️ **Section Base de Données (Lignes 41-95)**
- PostgreSQL principal
- Base Auth séparée
- Base Marketplace
- Configuration des pools

### 🔴 **Section Redis (Lignes 96-105)**
- Cache configuration
- Session storage

### 🔍 **Section ElasticSearch (Lignes 106-120)**
- Search engine
- Kibana access
- APM monitoring

### 🌐 **Section Application (Lignes 121-160)**
- Ports et URLs
- CORS configuration
- Rate limiting

### 📧 **Section Communications (Lignes 161-210)**
- SMTP/Email
- SMS (Twilio/Vonage)
- Notifications

### 💳 **Section Services Externes (Lignes 211-250)**
- Stripe payments
- AWS services
- Google Maps
- OpenAI

### 📊 **Section Monitoring (Lignes 251-290)**
- Sentry
- DataDog
- New Relic

### 🔧 **Section Features & Dev (Lignes 291-457)**
- Feature flags
- Development tools
- Testing credentials

## ⚠️ Points d'Attention Critiques

### 🔴 À Changer OBLIGATOIREMENT en Production

1. **Tous les secrets avec préfixe "dev_"**
   ```env
   JWT_SECRET=dev_jwt_secret... → REMPLACER
   ```

2. **Mots de passe par défaut**
   ```env
   INITIAL_ADMIN_PASSWORD=Admin@TopSteel2025! → CHANGER
   DB_PASSWORD=postgres → SÉCURISER
   ```

3. **Clés de test Stripe**
   ```env
   STRIPE_SECRET_KEY=sk_test... → Utiliser clés LIVE
   ```

## 🛠️ Commandes de Génération de Secrets

### Générer des Secrets Sécurisés

```bash
# JWT Secret (32+ caractères)
openssl rand -base64 32

# Session Secret
openssl rand -hex 32

# Password Fort
openssl rand -base64 16 | tr -d "=+/" | cut -c1-16

# Encryption Key
openssl rand -base64 32
```

### Script de Génération Automatique

```bash
#!/bin/bash
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -hex 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
```

## 📋 Checklist de Validation

### ✅ Développement
- [x] Fichier .env.security créé
- [x] Toutes les variables documentées
- [x] Valeurs par défaut fonctionnelles
- [x] Git ignore configuré

### ⚠️ Staging
- [ ] Remplacer les secrets "dev_"
- [ ] Configurer vraie base de données
- [ ] Activer Redis/ElasticSearch si nécessaire
- [ ] Configurer monitoring (Sentry)

### 🔴 Production
- [ ] TOUS les secrets régénérés
- [ ] SSL activé (DB_SSL=true)
- [ ] NODE_ENV=production
- [ ] Monitoring complet activé
- [ ] Backup configuré
- [ ] Rate limiting ajusté
- [ ] CORS restreint aux domaines réels

## 🔄 Workflow de Déploiement

### 1. Local → Development
```bash
cp .env.security .env.local
npm run dev
```

### 2. Development → Staging
```bash
# Générer nouveaux secrets
./generate-secrets.sh > .env.staging

# Déployer
docker-compose -f docker-compose.staging.yml up
```

### 3. Staging → Production
```bash
# Utiliser un gestionnaire de secrets
aws secretsmanager create-secret --name topsteel-prod
heroku config:set JWT_SECRET=...
```

## 🚨 Sécurité Renforcée

### Règles d'Or
1. **JAMAIS** commiter .env.security
2. **TOUJOURS** régénérer en production
3. **ROTATION** tous les 90 jours
4. **MONITORING** des accès aux secrets
5. **CHIFFREMENT** des backups

### Validation Automatique

```javascript
// Script de validation
const required = ['JWT_SECRET', 'DB_PASSWORD', 'SESSION_SECRET'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Variables manquantes:', missing);
  process.exit(1);
}
```

## 📞 Support & Aide

### Problèmes Fréquents

1. **Variables non chargées**
   ```bash
   # Vérifier le chemin
   ls -la .env.security
   ```

2. **Erreur de connexion DB**
   ```bash
   # Tester la connexion
   psql -h localhost -U postgres -d erp_topsteel
   ```

3. **JWT invalide**
   ```bash
   # Vérifier la longueur
   echo $JWT_SECRET | wc -c  # Doit être >= 32
   ```

## ✅ Conclusion

Le fichier `.env.security` contient **TOUTES** les variables nécessaires pour faire fonctionner TopSteel ERP. Il est:

- **Complet**: 150+ variables couvrant tous les services
- **Documenté**: Chaque section expliquée
- **Sécurisé**: Ignoré par Git automatiquement
- **Prêt**: Utilisable immédiatement en développement

**Action suivante**: Lancez votre application avec:
```bash
npm run dev
```

---

*Guide généré le: 2025-01-09*
*Variables configurées: 150+*
*Services couverts: 100%*