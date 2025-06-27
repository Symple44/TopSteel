#!/bin/bash

# scripts/quick-start.sh
# Script de démarrage rapide pour ERP TOPSTEEL

set -e

echo "🚀 Démarrage rapide ERP TOPSTEEL"
echo "================================"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Vérifier que nous sommes dans la racine du projet
if [ ! -f "package.json" ]; then
    print_error "Vous devez être dans la racine du projet ERP TOPSTEEL"
    exit 1
fi

print_info "Vérification de l'environnement..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js: $NODE_VERSION"

# Vérifier pnpm
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm n'est pas installé. Installation..."
    npm install -g pnpm
    print_success "pnpm installé"
fi

PNPM_VERSION=$(pnpm --version)
print_success "pnpm: v$PNPM_VERSION"

# Installation des dépendances
print_info "Installation des dépendances..."
pnpm install

# Création des fichiers d'environnement
print_info "Configuration des variables d'environnement..."

# Fichier .env pour l'API
if [ ! -f "apps/api/.env.local" ]; then
    print_info "Création de apps/api/.env.local..."
    cp apps/api/.env.example apps/api/.env.local 2>/dev/null || cat > apps/api/.env.local << 'EOF'
# Application
APP_NAME=ERP TOPSTEEL API
APP_VERSION=1.0.0
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=erp_topsteel_dev
DB_SSL=false
DB_MAX_CONNECTIONS=100

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# JWT
JWT_SECRET=development-secret-key-change-in-production-please
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=development-refresh-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=topsteel-erp
JWT_AUDIENCE=topsteel-users

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=info
LOG_FILE=true
EOF
    print_success "Fichier .env.local créé pour l'API"
else
    print_success "Fichier .env.local existe déjà pour l'API"
fi

# Fichier .env pour le web
if [ ! -f "apps/web/.env.local" ]; then
    print_info "Création de apps/web/.env.local..."
    cat > apps/web/.env.local << 'EOF'
# URLs de l'application
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Base de données (pour les scripts de migration depuis le frontend si nécessaire)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_topsteel_dev

# Authentification
NEXTAUTH_SECRET=development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Configuration générale
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=ERP TOPSTEEL
NEXT_PUBLIC_APP_VERSION=1.0.0

# Debug
DEBUG=false
NEXT_PUBLIC_DEBUG=false
EOF
    print_success "Fichier .env.local créé pour le web"
else
    print_success "Fichier .env.local existe déjà pour le web"
fi

# Build des packages partagés
print_info "Construction des packages partagés..."
pnpm build --filter="@erp/types" --filter="@erp/utils" --filter="@erp/config" --filter="@erp/ui"

print_success "Configuration terminée!"

echo ""
print_info "🎯 Commandes disponibles:"
echo "  pnpm dev              - Démarrer web + API en mode développement"
echo "  pnpm dev:web          - Démarrer uniquement le frontend"
echo "  pnpm dev:api          - Démarrer uniquement l'API"
echo "  pnpm build            - Construire pour la production"
echo "  pnpm test             - Lancer les tests"
echo "  pnpm lint             - Vérifier le code"
echo "  pnpm db:migrate       - Lancer les migrations de base de données"

echo ""
print_info "🌐 URLs de développement:"
echo "  Frontend: http://localhost:3000"
echo "  API: http://localhost:3001"
echo "  API Docs: http://localhost:3001/api/docs"
echo "  Health Check: http://localhost:3001/health"

echo ""
print_warning "⚠️ Prérequis pour démarrer:"
echo "  - PostgreSQL en cours d'exécution sur le port 5432"
echo "  - Redis en cours d'exécution sur le port 6379 (optionnel)"
echo "  - Base de données 'erp_topsteel_dev' créée"

echo ""
print_info "Pour démarrer le développement:"
echo "  1. Assurez-vous que PostgreSQL est démarré"
echo "  2. Créez la base de données: createdb erp_topsteel_dev"
echo "  3. Lancez: pnpm dev"

echo ""
print_success "🎉 Configuration terminée avec succès!"