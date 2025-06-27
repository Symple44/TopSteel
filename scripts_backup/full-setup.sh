#!/bin/bash
# scripts/full-setup.sh
# Script de setup complet avec installation automatique de PostgreSQL (Linux/macOS)

set -e

# Paramètres
SKIP_POSTGRESQL=false
FORCE=false
POSTGRESQL_PASSWORD="postgres"

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-postgresql)
            SKIP_POSTGRESQL=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --postgres-password)
            POSTGRESQL_PASSWORD="$2"
            shift 2
            ;;
        *)
            echo "Usage: $0 [--skip-postgresql] [--force] [--postgres-password PASSWORD]"
            exit 1
            ;;
    esac
done

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_section() { 
    echo -e "\n${PURPLE}$(printf '=%.0s' {1..60})${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}$(printf '=%.0s' {1..60})${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

install_postgresql_ubuntu() {
    print_info "🐧 Installation de PostgreSQL sur Ubuntu/Debian..."
    
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    
    # Démarrer le service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Configurer le mot de passe
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$POSTGRESQL_PASSWORD';"
    
    print_success "PostgreSQL installé et configuré"
}

install_postgresql_centos() {
    print_info "🔴 Installation de PostgreSQL sur CentOS/RHEL..."
    
    sudo yum install -y postgresql postgresql-server postgresql-contrib
    
    # Initialiser la base
    sudo postgresql-setup initdb
    
    # Démarrer le service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Configurer le mot de passe
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$POSTGRESQL_PASSWORD';"
    
    print_success "PostgreSQL installé et configuré"
}

install_postgresql_macos() {
    print_info "🍎 Installation de PostgreSQL sur macOS..."
    
    if ! command_exists brew; then
        print_info "Installation de Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    brew install postgresql
    
    # Démarrer le service
    brew services start postgresql
    
    # Créer l'utilisateur postgres si nécessaire
    createuser -s postgres 2>/dev/null || true
    
    # Configurer le mot de passe
    psql -U postgres -c "ALTER USER postgres PASSWORD '$POSTGRESQL_PASSWORD';" 2>/dev/null || {
        print_warning "Impossible de configurer le mot de passe automatiquement"
        print_info "Configurez-le manuellement avec: psql -U postgres"
    }
    
    print_success "PostgreSQL installé et configuré"
}

install_postgresql() {
    if command_exists psql; then
        print_success "PostgreSQL déjà installé"
        return 0
    fi
    
    case "$(uname -s)" in
        Linux)
            if command_exists apt; then
                install_postgresql_ubuntu
            elif command_exists yum; then
                install_postgresql_centos
            else
                print_error "Gestionnaire de paquets non supporté"
                print_info "Installez PostgreSQL manuellement"
                return 1
            fi
            ;;
        Darwin)
            install_postgresql_macos
            ;;
        *)
            print_error "Système d'exploitation non supporté"
            return 1
            ;;
    esac
}

setup_database() {
    print_info "🗄️ Configuration de la base de données..."
    
    # Attendre que PostgreSQL soit prêt
    sleep 3
    
    # Variables de connexion
    export PGPASSWORD="$POSTGRESQL_PASSWORD"
    
    # Tester la connexion
    if ! psql -h localhost -U postgres -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
        print_error "Impossible de se connecter à PostgreSQL"
        print_info "Vérifiez que le service est démarré et que le mot de passe est correct"
        return 1
    fi
    
    print_success "Connexion PostgreSQL OK"
    
    # Créer les bases de données
    print_info "📊 Création de la base erp_topsteel_dev..."
    psql -h localhost -U postgres -d postgres -c "CREATE DATABASE erp_topsteel_dev;" 2>/dev/null || true
    
    print_info "📊 Création de la base erp_topsteel_test..."
    psql -h localhost -U postgres -d postgres -c "CREATE DATABASE erp_topsteel_test;" 2>/dev/null || true
    
    unset PGPASSWORD
    
    print_success "Bases de données créées"
}

create_missing_directories() {
    print_info "📁 Création des dossiers manquants..."
    
    directories=(
        "apps/api/src/modules/clients/dto"
        "apps/api/src/modules/clients/entities"
        "apps/api/src/modules/devis/dto"
        "apps/api/src/modules/devis/entities"
        "apps/api/src/modules/documents/dto"
        "apps/api/src/modules/documents/entities"
        "apps/api/src/modules/facturation/dto"
        "apps/api/src/modules/facturation/entities"
        "apps/api/src/modules/notifications/dto"
        "apps/api/src/modules/notifications/entities"
        "apps/api/src/modules/production/dto"
        "apps/api/src/modules/production/entities"
        "apps/api/src/modules/stocks/dto"
        "apps/api/src/modules/stocks/entities"
        "apps/api/src/common/decorators"
        "apps/api/src/common/guards"
        "apps/api/src/common/middleware"
        "apps/api/src/common/filters"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Créé: $dir"
        fi
    done
}

create_missing_files() {
    print_info "📄 Création des fichiers manquants..."
    
    # Créer les DTOs de base
    dto_files=(
        "apps/api/src/modules/fournisseurs/dto/create-fournisseur.dto.ts"
        "apps/api/src/modules/fournisseurs/dto/update-fournisseur.dto.ts"
        "apps/api/src/modules/projets/dto/create-projet.dto.ts"
        "apps/api/src/modules/projets/dto/update-projet.dto.ts"
        "apps/api/src/modules/projets/dto/projet-query.dto.ts"
    )
    
    for file in "${dto_files[@]}"; do
        if [ ! -f "$file" ]; then
            # Extraire le nom de classe du nom de fichier
            class_name=$(basename "$file" .ts | sed 's/-\([a-z]\)/\U\1/g' | sed 's/^\([a-z]\)/\U\1/')
            
            cat > "$file" << EOF
import { IsOptional, IsString } from 'class-validator';

export class ${class_name^} {
  @IsString()
  @IsOptional()
  placeholder?: string;
}
EOF
            print_success "Créé: $file"
        fi
    done
    
    # Créer les services manquants
    missing_services=(
        "apps/api/src/modules/clients/clients.service.ts"
        "apps/api/src/modules/users/users.service.ts"
    )
    
    for service_file in "${missing_services[@]}"; do
        if [ ! -f "$service_file" ]; then
            service_name=$(basename "$service_file" .ts | sed 's/\b\w/\U&/g')
            
            cat > "$service_file" << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${service_name} {
  // TODO: Implémenter les méthodes du service
}
EOF
            print_success "Créé: $service_file"
        fi
    done
}

update_env_files() {
    print_info "⚙️ Mise à jour des fichiers d'environnement..."
    
    # Fichier .env pour l'API
    cat > "apps/api/.env.local" << EOF
# Application
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$POSTGRESQL_PASSWORD
DB_NAME=erp_topsteel_dev
DB_SSL=false
DB_MAX_CONNECTIONS=100

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# JWT
JWT_SECRET=development-secret-key-change-in-production-$(date +%s)
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=development-refresh-secret-$(date +%s)
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=topsteel-erp
JWT_AUDIENCE=topsteel-users

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=debug
LOG_FILE=true
EOF
    
    print_success "Fichier .env.local créé pour l'API"
    
    # Fichier .env pour le web
    if [ ! -f "apps/web/.env.local" ]; then
        cat > "apps/web/.env.local" << EOF
# Base URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
NEXTAUTH_SECRET=nextauth-secret-$(date +%s)
NEXTAUTH_URL=http://localhost:3000

# Optional services
NEXT_PUBLIC_SENTRY_DSN=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
EOF
        print_success "Fichier .env.local créé pour le Web"
    fi
}

# SCRIPT PRINCIPAL
clear
print_info "🚀 SETUP COMPLET ERP TOPSTEEL"
print_info "Date: $(date '+%Y-%m-%d %H:%M:%S')"

# Vérifier la structure du projet
if [ ! -f "package.json" ]; then
    print_error "Vous devez être dans la racine du projet ERP TOPSTEEL"
    exit 1
fi

print_success "Structure du projet validée"

# Phase 1: PostgreSQL
if [ "$SKIP_POSTGRESQL" = false ]; then
    print_section "🗄️ CONFIGURATION POSTGRESQL"
    
    if install_postgresql; then
        setup_database
    else
        print_warning "Installation PostgreSQL échouée, continuons sans..."
    fi
fi

# Phase 2: Structure du projet
print_section "🏗️ STRUCTURE DU PROJET"
create_missing_directories
create_missing_files

# Phase 3: Fichiers d'environnement
print_section "⚙️ CONFIGURATION"
update_env_files

# Phase 4: Dépendances
print_section "📦 DÉPENDANCES"

print_info "📦 Installation des dépendances..."
if pnpm install; then
    print_success "Dépendances installées"
else
    print_error "Erreur lors de l'installation des dépendances"
fi

# Phase 5: Construction
print_section "🔨 CONSTRUCTION"

print_info "🔨 Construction des packages partagés..."
if pnpm build --filter="!@erp/web" --filter="!@erp/api"; then
    print_success "Packages construits"
else
    print_warning "Certains packages n'ont pas pu être construits"
fi

# Phase 6: Vérification finale
print_section "✅ VÉRIFICATION FINALE"

bash "$PWD/scripts/check-environment.sh"

# Résumé final
print_section "🎉 SETUP TERMINÉ"

print_success "🚀 Votre environnement ERP TopSteel est maintenant configuré !"
echo ""
print_info "📋 Prochaines étapes :"
print_info "  1. 🔍 Vérifiez la configuration PostgreSQL"
print_info "  2. 🚀 Démarrez l'API : pnpm dev:api"
print_info "  3. 🌐 Démarrez le web : pnpm dev:web"
print_info "  4. 📚 Accédez à la doc API : http://localhost:3001/api/docs"
echo ""
print_info "🔧 Commandes utiles :"
print_info "  • pnpm dev          - Démarre tout"
print_info "  • pnpm test         - Lance les tests"
print_info "  • pnpm lint         - Vérifie le code"

echo -e "\n${PURPLE}✨ Happy coding ! ✨${NC}"