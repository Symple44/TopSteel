# Guide de Déploiement TopSteel ERP

## Vue d'ensemble

Ce guide couvre le déploiement complet de TopSteel ERP en production avec Docker, Traefik et SSL automatique.

## Architecture de Production

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │ Port 80/443
┌─────────────────────────────────────────────────────────────┐
│                 SERVEUR PRODUCTION                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  TRAEFIK                                ││
│  │           (Reverse Proxy + SSL Let's Encrypt)           ││
│  └─────┬───────────────────────────────────────────────────┘│
│        │                                                    │
│  ┌─────┴─────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│  │ Web (3005)│ │ API (3002)  │ │Marketplace  │ │PostgreSQL││
│  │  Next.js  │ │  NestJS     │ │API (3004)   │ │  (5432)  ││
│  └───────────┘ └─────────────┘ └─────────────┘ └──────────┘│
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Redis     │ │ElasticSearch│ │  Portainer  │           │
│  │  (6379)     │ │   (9200)    │ │   (9000)    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Prérequis

### Serveur
- **OS**: Ubuntu Server 22.04 LTS ou Debian 12
- **CPU**: 4 vCPUs minimum (8 recommandé)
- **RAM**: 8GB minimum (16GB recommandé)
- **Stockage**: 100GB SSD minimum
- **Réseau**: IP fixe avec accès Internet

### DNS et Domaine
Configurez les enregistrements DNS suivants :
```
A     topsteel.exemple.com              → IP_SERVEUR
A     api.topsteel.exemple.com          → IP_SERVEUR
A     marketplace.topsteel.exemple.com  → IP_SERVEUR
A     portainer.topsteel.exemple.com    → IP_SERVEUR
```

## Installation

### 1. Préparation du serveur

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y \
  curl \
  git \
  htop \
  vim \
  ufw \
  fail2ban \
  software-properties-common

# Configuration firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 2. Installation Docker

```bash
# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajout utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installation Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

### 3. Clonage du projet

```bash
# Création du répertoire
sudo mkdir -p /opt/topsteel
sudo chown $USER:$USER /opt/topsteel
cd /opt/topsteel

# Clone du repository
git clone https://github.com/topsteel/erp-topsteel.git .
```

### 4. Configuration

#### Variables d'environnement

Créez le fichier `.env.production`:

```bash
cp .env.example .env.production
vim .env.production
```

Configuration minimale requise:

```env
# ========================================
# APPLICATION
# ========================================
NODE_ENV=production
APP_NAME=TopSteel ERP
APP_URL=https://topsteel.exemple.com

# ========================================
# PORTS (Docker internal)
# ========================================
API_PORT=3002
WEB_PORT=3005
MARKETPLACE_API_PORT=3004

# ========================================
# BASE DE DONNÉES
# ========================================
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=topsteel_prod
DB_PASSWORD=CHANGEME_strong_password_here
DB_NAME=erp_topsteel_main

AUTH_DB_HOST=postgres
AUTH_DB_PORT=5432
AUTH_DB_USERNAME=topsteel_auth
AUTH_DB_PASSWORD=CHANGEME_strong_auth_password
AUTH_DB_NAME=erp_topsteel_auth

SHARED_DB_HOST=postgres
SHARED_DB_PORT=5432
SHARED_DB_USERNAME=topsteel_shared
SHARED_DB_PASSWORD=CHANGEME_strong_shared_password
SHARED_DB_NAME=erp_topsteel_shared

# ========================================
# REDIS
# ========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGEME_redis_password

# ========================================
# JWT & SÉCURITÉ
# ========================================
JWT_SECRET=CHANGEME_generate_64_char_random_string
JWT_REFRESH_SECRET=CHANGEME_different_64_char_random_string

# ========================================
# URLS PUBLIQUES
# ========================================
NEXT_PUBLIC_API_URL=https://api.topsteel.exemple.com
FRONTEND_URL=https://topsteel.exemple.com
```

### 5. Docker Compose Production

Créez `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: topsteel-postgres
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - topsteel-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: topsteel-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - topsteel-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ElasticSearch (optionnel)
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: topsteel-elasticsearch
    restart: always
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - topsteel-network
    profiles:
      - search

  # API Backend
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    container_name: topsteel-api
    restart: always
    env_file: .env.production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - topsteel-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.topsteel.exemple.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3002"

  # Frontend Web
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    container_name: topsteel-web
    restart: always
    env_file: .env.production
    depends_on:
      - api
    networks:
      - topsteel-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`topsteel.exemple.com`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=3005"

  # Traefik Reverse Proxy
  traefik:
    image: traefik:v3.0
    container_name: topsteel-traefik
    restart: always
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@topsteel.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    networks:
      - topsteel-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.topsteel.exemple.com`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=admin:$$2y$$10$$..."

  # Portainer (optionnel)
  portainer:
    image: portainer/portainer-ce:latest
    container_name: topsteel-portainer
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - topsteel-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.portainer.rule=Host(`portainer.topsteel.exemple.com`)"
      - "traefik.http.routers.portainer.entrypoints=websecure"
      - "traefik.http.routers.portainer.tls.certresolver=letsencrypt"
      - "traefik.http.services.portainer.loadbalancer.server.port=9000"
    profiles:
      - management

networks:
  topsteel-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
  traefik_letsencrypt:
  portainer_data:
```

### 6. Démarrage

```bash
# Build des images
docker-compose -f docker-compose.prod.yml build

# Démarrage des services
docker-compose -f docker-compose.prod.yml up -d

# Vérification des logs
docker-compose -f docker-compose.prod.yml logs -f

# Vérification des services
docker-compose -f docker-compose.prod.yml ps
```

### 7. Initialisation de la base de données

```bash
# Exécution des migrations
docker-compose -f docker-compose.prod.yml exec api npm run migration:run

# Création du super admin
docker-compose -f docker-compose.prod.yml exec api npm run script:create-admin-user

# Seed des données de base (optionnel)
docker-compose -f docker-compose.prod.yml exec api npm run db:seed
```

## Maintenance

### Backup

Script de backup automatique (`/opt/topsteel/scripts/backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/backups/topsteel"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose -f /opt/topsteel/docker-compose.prod.yml exec -T postgres \
  pg_dumpall -U ${DB_USERNAME} | gzip > $BACKUP_DIR/postgres_$TIMESTAMP.sql.gz

# Backup volumes Docker
docker run --rm \
  -v topsteel_postgres_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/volumes_$TIMESTAMP.tar.gz /data

# Rotation des backups (garder 30 jours)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

Ajoutez au crontab:
```bash
# Backup quotidien à 2h du matin
0 2 * * * /opt/topsteel/scripts/backup.sh
```

### Monitoring

#### Health checks

```bash
# Vérifier l'état des services
curl https://api.topsteel.exemple.com/health
curl https://topsteel.exemple.com

# Monitoring des ressources
docker stats

# Logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

#### Prometheus + Grafana (optionnel)

Ajoutez au `docker-compose.prod.yml`:

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: topsteel-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - topsteel-network
    profiles:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: topsteel-grafana
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - topsteel-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`grafana.topsteel.exemple.com`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"
    profiles:
      - monitoring
```

### Mise à jour

```bash
# Arrêt des services
docker-compose -f docker-compose.prod.yml down

# Pull des dernières modifications
git pull origin main

# Rebuild des images
docker-compose -f docker-compose.prod.yml build --no-cache

# Redémarrage
docker-compose -f docker-compose.prod.yml up -d

# Exécution des migrations
docker-compose -f docker-compose.prod.yml exec api npm run migration:run
```

## Sécurité

### SSL/TLS
- Certificats Let's Encrypt automatiques via Traefik
- Renouvellement automatique tous les 90 jours
- Headers de sécurité configurés

### Hardening

```bash
# Fail2ban pour SSH
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Configuration SSH
sudo vim /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes

# Mise à jour automatique de sécurité
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### Audit de sécurité

```bash
# Scanner de vulnérabilités
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image topsteel/api:latest

# Audit des dépendances
docker-compose -f docker-compose.prod.yml exec api npm audit
```

## Troubleshooting

### Problèmes courants

#### Les services ne démarrent pas
```bash
# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs postgres

# Vérifier la configuration
docker-compose -f docker-compose.prod.yml config
```

#### Erreurs de connexion à la base de données
```bash
# Vérifier que PostgreSQL est démarré
docker-compose -f docker-compose.prod.yml ps postgres

# Tester la connexion
docker-compose -f docker-compose.prod.yml exec postgres psql -U ${DB_USERNAME} -d ${DB_NAME}
```

#### Problèmes de certificats SSL
```bash
# Vérifier les logs Traefik
docker logs topsteel-traefik

# Forcer le renouvellement
docker-compose -f docker-compose.prod.yml exec traefik \
  rm /letsencrypt/acme.json
docker-compose -f docker-compose.prod.yml restart traefik
```

### Support

Pour toute assistance:
- Email: support@topsteel.fr
- Documentation: https://docs.topsteel.fr
- Issues: https://github.com/topsteel/erp-topsteel/issues