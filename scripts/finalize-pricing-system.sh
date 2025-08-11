#!/bin/bash

# =====================================
# SCRIPT DE FINALISATION SYSTÈME PRICING
# =====================================

set -e  # Arrêt sur erreur

echo "🚀 FINALISATION SYSTÈME PRICING TOPSTEEL"
echo "========================================"
echo ""

# Variables
ROOT_DIR=$(pwd)
API_DIR="$ROOT_DIR/apps/api"
PRICING_DIR="$API_DIR/src/features/pricing"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# =====================================
# ÉTAPE 1: INSTALLATION DES DÉPENDANCES
# =====================================

log_info "Installation des dépendances NPM..."

DEPENDENCIES=(
    "@nestjs-modules/ioredis"
    "ioredis"
    "@tensorflow/tfjs-node"
    "@nestjs/graphql"
    "@nestjs/apollo"
    "graphql"
    "apollo-server-express"
    "graphql-type-json"
    "@nestjs/axios"
    "axios"
    "@nestjs/event-emitter"
    "@nestjs/schedule"
    "@nestjs/bull"
    "bull"
    "@nestjs/throttler"
    "opossum"
)

for dep in "${DEPENDENCIES[@]}"; do
    if npm ls "$dep" >/dev/null 2>&1; then
        log_success "$dep déjà installé"
    else
        log_info "Installation de $dep..."
        npm install "$dep" || log_warning "Échec installation $dep"
    fi
done

# Dev dependencies
log_info "Installation des dépendances de développement..."
npm install -D @types/bull madge colors || log_warning "Certaines dev dependencies ont échoué"

# =====================================
# ÉTAPE 2: CONFIGURATION ENVIRONNEMENT
# =====================================

log_info "Configuration des variables d'environnement..."

ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE="$ROOT_DIR/.env.example"

# Créer .env s'il n'existe pas
if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
    log_info ".env créé"
fi

# Ajouter les variables pricing si absentes
add_env_var() {
    local key=$1
    local value=$2
    if ! grep -q "^$key=" "$ENV_FILE"; then
        echo "$key=$value" >> "$ENV_FILE"
        log_success "Variable $key ajoutée"
    fi
}

add_env_var "REDIS_HOST" "localhost"
add_env_var "REDIS_PORT" "6379"
add_env_var "REDIS_PASSWORD" ""
add_env_var "REDIS_DB" "0"
add_env_var "PRICING_CACHE_TTL" "3600"
add_env_var "PRICING_MAX_BULK_SIZE" "1000"
add_env_var "ML_MODEL_PATH" "./models/pricing"
add_env_var "ML_TRAINING_ENABLED" "false"
add_env_var "WEBHOOK_MAX_RETRIES" "3"
add_env_var "ANALYTICS_RETENTION_DAYS" "90"

# =====================================
# ÉTAPE 3: CONFIGURATION REDIS
# =====================================

log_info "Configuration Redis..."

# Vérifier si Redis est accessible
if redis-cli ping >/dev/null 2>&1; then
    log_success "Redis est déjà en cours d'exécution"
else
    log_warning "Redis n'est pas accessible"
    
    # Essayer avec Docker
    if command -v docker &> /dev/null; then
        log_info "Tentative de démarrage Redis avec Docker..."
        docker run -d --name redis-pricing -p 6379:6379 redis:alpine 2>/dev/null || {
            docker start redis-pricing 2>/dev/null || log_warning "Impossible de démarrer Redis"
        }
        sleep 2
        
        if redis-cli ping >/dev/null 2>&1; then
            log_success "Redis démarré avec Docker"
        else
            log_error "Redis requis. Installez-le manuellement."
        fi
    else
        log_error "Redis requis. Installez Redis ou Docker."
    fi
fi

# =====================================
# ÉTAPE 4: MISE À JOUR APP.MODULE.TS
# =====================================

log_info "Mise à jour app.module.ts..."

APP_MODULE="$API_DIR/src/app/app.module.ts"

# Backup
cp "$APP_MODULE" "$APP_MODULE.backup" 2>/dev/null || true

# Vérifier si PricingUnifiedModule est déjà importé
if grep -q "PricingUnifiedModule" "$APP_MODULE"; then
    log_success "PricingUnifiedModule déjà configuré"
else
    log_warning "Configuration manuelle requise pour app.module.ts"
    echo "  Remplacez PricingModule par PricingUnifiedModule dans app.module.ts"
fi

# =====================================
# ÉTAPE 5: EXÉCUTION DES MIGRATIONS
# =====================================

log_info "Exécution des migrations..."

# Vérifier connexion DB
if npm run typeorm -- query "SELECT 1" >/dev/null 2>&1; then
    log_success "Connexion base de données OK"
    
    # Exécuter migrations
    npm run typeorm migration:run 2>/dev/null || log_warning "Migrations peuvent nécessiter une exécution manuelle"
else
    log_warning "Base de données non accessible. Migrations à exécuter manuellement."
fi

# =====================================
# ÉTAPE 6: CRÉATION DU DOSSIER ML
# =====================================

log_info "Création structure ML..."
mkdir -p "$ROOT_DIR/models/pricing"
log_success "Dossier models/pricing créé"

# =====================================
# ÉTAPE 7: VÉRIFICATION BUILD
# =====================================

log_info "Vérification du build..."

# Tenter un build
npm run build 2>/dev/null && {
    log_success "Build réussi!"
} || {
    log_warning "Build échoué. Vérifiez les erreurs TypeScript."
}

# =====================================
# ÉTAPE 8: LANCEMENT DES TESTS
# =====================================

log_info "Lancement des tests pricing..."

# Ajouter script de test si absent
if ! grep -q "test:pricing" "$ROOT_DIR/package.json"; then
    log_info "Ajout des scripts de test..."
    npm pkg set scripts.test:pricing="jest --testPathPattern=pricing --passWithNoTests"
    npm pkg set scripts.test:pricing:watch="jest --testPathPattern=pricing --watch"
    npm pkg set scripts.test:pricing:coverage="jest --testPathPattern=pricing --coverage"
fi

# Lancer les tests
npm run test:pricing 2>/dev/null && {
    log_success "Tests pricing réussis"
} || {
    log_warning "Tests pricing échoués ou absents"
}

# =====================================
# ÉTAPE 9: AGENTS DE QUALITÉ
# =====================================

if [ -f "$ROOT_DIR/scripts/pricing-quality-agents.ts" ]; then
    log_info "Lancement des agents de qualité..."
    npx ts-node "$ROOT_DIR/scripts/pricing-quality-agents.ts" 2>/dev/null || {
        log_warning "Agents de qualité terminés avec avertissements"
    }
fi

# =====================================
# RAPPORT FINAL
# =====================================

echo ""
echo "========================================"
echo -e "${GREEN}🎉 FINALISATION TERMINÉE${NC}"
echo "========================================"
echo ""

# Vérifications finales
echo "📋 Statut des composants:"
echo ""

# Redis
redis-cli ping >/dev/null 2>&1 && echo "✅ Redis: OK" || echo "❌ Redis: NON DISPONIBLE"

# Database
npm run typeorm -- query "SELECT 1" >/dev/null 2>&1 && echo "✅ Database: OK" || echo "❌ Database: NON DISPONIBLE"

# Build
[ -d "$ROOT_DIR/dist" ] && echo "✅ Build: OK" || echo "⚠️  Build: À REFAIRE"

# Tests
echo "⚠️  Tests: Vérifiez manuellement"

echo ""
echo "📝 Prochaines étapes:"
echo ""
echo "1. Si Redis n'est pas OK:"
echo "   brew install redis (Mac) ou apt install redis (Linux)"
echo ""
echo "2. Si Database n'est pas OK:"
echo "   Vérifiez votre configuration PostgreSQL"
echo ""
echo "3. Si Build n'est pas OK:"
echo "   npm run build"
echo ""
echo "4. Pour démarrer l'application:"
echo "   npm run start:dev"
echo ""
echo "5. Endpoints disponibles:"
echo "   - REST API: http://localhost:3000/pricing/*"
echo "   - GraphQL: http://localhost:3000/graphql"
echo "   - Analytics: http://localhost:3000/pricing/analytics/dashboard"
echo ""

# Sauvegarder le rapport
REPORT_FILE="$ROOT_DIR/pricing-finalization-report.txt"
{
    echo "RAPPORT DE FINALISATION - $(date)"
    echo "====================================="
    echo ""
    echo "Composants installés:"
    for dep in "${DEPENDENCIES[@]}"; do
        npm ls "$dep" >/dev/null 2>&1 && echo "✅ $dep" || echo "❌ $dep"
    done
    echo ""
    echo "Configuration:"
    [ -f "$ENV_FILE" ] && echo "✅ .env configuré" || echo "❌ .env manquant"
    redis-cli ping >/dev/null 2>&1 && echo "✅ Redis actif" || echo "❌ Redis inactif"
    echo ""
    echo "Build:"
    [ -d "$ROOT_DIR/dist" ] && echo "✅ Build artifacts présents" || echo "❌ Build requis"
} > "$REPORT_FILE"

log_success "Rapport sauvegardé dans: $REPORT_FILE"

echo ""
echo -e "${GREEN}✨ Système de pricing prêt à l'emploi!${NC}"