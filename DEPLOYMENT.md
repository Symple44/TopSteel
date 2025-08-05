# 🚀 TopSteel ERP - Guide de Déploiement Proxmox

## 📋 Vue d'ensemble

Ce guide vous accompagne dans le déploiement complet de TopSteel ERP sur un serveur Proxmox avec Docker, Traefik, et SSL automatique.

## 🏗️ Architecture de Production

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │ Port 80/443
┌─────────────────────────────────────────────────────────────┐
│                 PROXMOX VM                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  TRAEFIK                                ││
│  │           (Reverse Proxy + SSL)                         ││
│  └─────┬───────────────────────────────────────────────────┘│
│        │                                                    │
│  ┌─────┴─────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │
│  │ Web (3005)│ │ API (3002)  │ │Marketplace  │ │PostgreSQL│ │
│  │  Next.js  │ │  NestJS     │ │   (3004)    │ │ (5432)   │ │
│  └───────────┘ └─────────────┘ └─────────────┘ └──────────┘ │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Redis     │ │  Portainer  │ │   Volumes   │            │
│  │  (6379)     │ │   (9000)    │ │   Docker    │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Prérequis

### 💻 Serveur Proxmox VM
- **OS** : Ubuntu Server 22.04 LTS
- **CPU** : 4 vCPUs minimum 
- **RAM** : 8GB minimum (16GB recommandé)
- **Stockage** : 100GB SSD minimum
- **Réseau** : IP fixe avec accès Internet

### 🌐 DNS et Domaine
- Nom de domaine configuré (ex: `topsteel.exemple.com`)
- Enregistrements DNS pointant vers votre IP :
  ```
  A     topsteel.exemple.com        → IP_SERVEUR
  A     marketplace.topsteel.exemple.com → IP_SERVEUR
  A     portainer.topsteel.exemple.com   → IP_SERVEUR
  A     traefik.topsteel.exemple.com     → IP_SERVEUR
  ```

## 🚀 Installation Rapide

### 1️⃣ Préparation de la VM

```bash
# Créer une VM dans Proxmox avec Ubuntu 22.04
# Connectez-vous en SSH à votre VM

# Mise à jour initiale
sudo apt update && sudo apt upgrade -y
```

### 2️⃣ Configuration Automatique du Serveur

```bash
# Cloner le repository
git clone https://github.com/Symple44/TopSteel.git
cd TopSteel

# Rendre le script exécutable et lancer la configuration
chmod +x scripts/setup-server.sh
sudo ./scripts/setup-server.sh
```

**⚠️ Redémarrez le serveur après cette étape**

### 3️⃣ Configuration de l'Environnement

```bash
# Se connecter avec l'utilisateur topsteel
su - topsteel
cd /home/topsteel/app

# Cloner le projet (si pas déjà fait)
git clone https://github.com/Symple44/TopSteel.git .

# Copier et configurer l'environnement
cp .env.production .env.production.local
nano .env.production.local
```

**📝 Modifier les valeurs suivantes dans `.env.production.local` :**

```env
# OBLIGATOIRE - Remplacer par vos valeurs
DOMAIN=votre-domaine.com
ACME_EMAIL=votre-email@exemple.com

# SÉCURITÉ - Générer des mots de passe forts
DB_PASSWORD=mot_de_passe_postgres_tres_fort
REDIS_PASSWORD=mot_de_passe_redis_fort
JWT_SECRET=cle_jwt_32_caracteres_minimum_production
JWT_REFRESH_SECRET=cle_refresh_jwt_32_chars_production
NEXTAUTH_SECRET=cle_nextauth_32_caracteres_production
ENCRYPTION_KEY=cle_chiffrement_exactement_32_chars

# EMAIL (optionnel)
SMTP_USER=votre-email@gmail.com
SMTP_PASS=mot-de-passe-application
```

### 4️⃣ Déploiement

```bash
# Rendre les scripts exécutables
chmod +x scripts/*.sh

# Lancer le déploiement
./scripts/deploy.sh
```

## 📊 Vérification du Déploiement

### ✅ Tests de Santé

```bash
# Vérifier l'état des services
docker-compose -f docker-compose.prod.yml ps

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f

# Test des URLs
curl -I https://votre-domaine.com
curl -I https://marketplace.votre-domaine.com
```

### 🌐 URLs d'Accès

- **Application principale** : `https://votre-domaine.com`
- **Marketplace** : `https://marketplace.votre-domaine.com`
- **Portainer** : `https://portainer.votre-domaine.com`
- **Traefik Dashboard** : `https://traefik.votre-domaine.com`

## 🔧 Gestion et Maintenance

### 📋 Commandes Utiles

```bash
# Arrêter tous les services
docker-compose -f docker-compose.prod.yml down

# Redémarrer un service spécifique
docker-compose -f docker-compose.prod.yml restart api

# Voir les logs d'un service
docker-compose -f docker-compose.prod.yml logs -f web

# Mise à jour du code
git pull origin main
./scripts/deploy.sh

# Sauvegarde manuelle
docker-compose -f docker-compose.prod.yml exec postgres pg_dumpall -U topsteel_prod > backup_$(date +%Y%m%d).sql
```

### 🔄 Mise à Jour

```bash
cd /home/topsteel/app

# Sauvegarde avant mise à jour
./scripts/deploy.sh  # Sauvegarde automatique incluse

# Ou mise à jour du code uniquement
git pull origin main
docker-compose -f docker-compose.prod.yml build --parallel
docker-compose -f docker-compose.prod.yml up -d
```

### 💾 Sauvegarde Automatique

Ajouter au crontab de l'utilisateur `topsteel` :

```bash
crontab -e

# Sauvegarde quotidienne à 2h du matin
0 2 * * * cd /home/topsteel/app && docker-compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U topsteel_prod > /home/topsteel/backups/daily_$(date +\%Y\%m\%d).sql

# Nettoyage des sauvegardes > 30 jours
0 3 * * * find /home/topsteel/backups -name "daily_*.sql" -mtime +30 -delete
```

## 🚨 Déploiement Automatique via GitHub

### 1️⃣ Configuration des Secrets GitHub

Dans votre repository GitHub, ajoutez les secrets suivants :

**Production :**
- `PRODUCTION_HOST` : IP de votre serveur
- `PRODUCTION_USER` : `topsteel`
- `PRODUCTION_SSH_PRIVATE_KEY` : Clé SSH privée
- `PRODUCTION_DOMAIN` : `votre-domaine.com`

**Staging (optionnel) :**
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_DOMAIN`

### 2️⃣ Configuration SSH

```bash
# Sur votre serveur, générer une paire de clés
ssh-keygen -t ed25519 -C "github-actions@topsteel"

# Ajouter la clé publique aux clés autorisées
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Copier la clé privée et l'ajouter aux secrets GitHub
cat ~/.ssh/id_ed25519
```

### 3️⃣ Déploiement Automatique

Le déploiement se fait automatiquement :
- **Staging** : Push sur la branche `develop`
- **Production** : Push sur la branche `main`

## 🔐 Sécurité

### 🛡️ Recommandations

1. **Firewall** : Le script configure UFW automatiquement
2. **SSL** : Certificats Let's Encrypt automatiques via Traefik
3. **Mots de passe** : Utilisez des mots de passe forts (32+ caractères)
4. **SSH** : Désactivez l'authentification par mot de passe
5. **Mise à jour** : Maintenez le système à jour

### 🔒 Durcissement SSH

```bash
# Éditer la configuration SSH
sudo nano /etc/ssh/sshd_config

# Recommandations :
PasswordAuthentication no
PermitRootLogin no
Port 22  # Ou changer pour un port non-standard
MaxAuthTries 3

# Redémarrer SSH
sudo systemctl restart ssh
```

## ❗ Dépannage

### 🔍 Problèmes Courants

**1. Services qui ne démarrent pas :**
```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs service_name

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h
```

**2. Problèmes SSL :**
```bash
# Vérifier les logs Traefik
docker-compose -f docker-compose.prod.yml logs traefik

# Forcer le renouvellement SSL
docker-compose -f docker-compose.prod.yml restart traefik
```

**3. Base de données :**
```bash
# Se connecter à PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U topsteel_prod -d erp_topsteel

# Vérifier l'état
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U topsteel_prod
```

### 📞 Support

- 📧 **Email** : support@topsteel.com
- 🐛 **Issues** : [GitHub Issues](https://github.com/Symple44/TopSteel/issues)
- 📖 **Documentation** : [Wiki du projet](https://github.com/Symple44/TopSteel/wiki)

## 🎉 Félicitations !

Votre ERP TopSteel est maintenant déployé et opérationnel sur Proxmox ! 🚀

**N'oubliez pas de :**
- ✅ Configurer vos premiers utilisateurs
- ✅ Importer vos données initiales  
- ✅ Configurer les sauvegardes automatiques
- ✅ Tester toutes les fonctionnalités

---

*Guide rédigé pour TopSteel ERP v1.0.0*