#!/bin/bash
# scripts/check-environment.sh
# Script de vérification complète de l'environnement ERP TopSteel (Linux/macOS)

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

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

port_is_open() {
    if command_exists nc; then
        nc -z localhost "$1" 2>/dev/null
    elif command_exists lsof; then
        lsof -i ":$1" >/dev/null 2>&1
    else
        false
    fi
}

test_postgres_connection() {
    if command_exists psql; then
        PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -c "SELECT 1;" >/dev/null 2>&1
    else
        false
    fi
}

# Header principal
clear
print_info "🔍 VÉRIFICATION COMPLÈTE - ERP TOPSTEEL"
print_info "Date: $(date '+%Y-%m-%d %H:%M:%S')"

# 1. STRUCTURE DU PROJET
print_section "📁 STRUCTURE DU PROJET"

required_folders=(
    "apps/web"
    "apps/api" 
    "apps/api/src/modules"
    "packages/ui"
    "packages/types"
    "packages/utils"
    "scripts"
)

missing_folders=()
for folder in "${required_folders[@]}"; do
    if [ -d "$folder" ]; then
        print_success "$folder"
    else
        print_error "$folder"
        missing_folders+=("$folder")
    fi
done

# 2. FICHIERS CRITIQUES
print_section "📄 FICHIERS CRITIQUES"

declare -A critical_files=(
    ["package.json"]="Configuration racine"
    ["turbo.json"]="Configuration Turbo"
    ["pnpm-lock.yaml"]="Lock file pnpm"
    ["apps/web/package.json"]="Config app web"
    ["apps/api/package.json"]="Config API"
    ["apps/api/src/main.ts"]="Point d'entrée API"
    ["apps/api/src/app.module.ts"]="Module principal"
    ["apps/api/.env.local"]="Variables environnement API"
    ["apps/web/.env.local"]="Variables environnement Web"
)

missing_files=()
for file in "${!critical_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "${critical_files[$file]}: $file"
    else
        print_error "${critical_files[$file]}: $file"
        missing_files+=("$file")
    fi
done

# 3. OUTILS DÉVELOPPEMENT
print_section "🛠️ OUTILS DE DÉVELOPPEMENT"

declare -A tools=(
    ["node"]="Node.js"
    ["pnpm"]="pnpm"
    ["git"]="Git"
    ["code"]="VS Code"
)

missing_tools=()
for tool in "${!tools[@]}"; do
    if command_exists "$tool"; then
        version=$($tool --version 2>/dev/null | head -n1)
        print_success "${tools[$tool]}: $version"
    else
        print_error "${tools[$tool]}: Non installé"
        missing_tools+=("$tool")
    fi
done

# 4. POSTGRESQL
print_section "🗄️ POSTGRESQL"

postgres_installed=false
postgres_running=false
postgres_connectable=false

if command_exists psql; then
    postgres_installed=true
    print_success "PostgreSQL installé"
    
    # Vérifier si le service tourne
    if port_is_open 5432; then
        postgres_running=true
        print_success "Port 5432 ouvert"
        
        # Test de connexion
        if test_postgres_connection; then
            postgres_connectable=true
            print_success "Connexion base de données OK"
        else
            print_error "Impossible de se connecter à la base"
        fi
    else
        print_error "Port 5432 fermé"
    fi
else
    print_error "PostgreSQL non installé"
fi

# 5. DÉPENDANCES NODE
print_section "📦 DÉPENDANCES"

if [ -d "node_modules" ]; then
    print_success "node_modules présent"
    
    # Vérifier les dépendances critiques
    critical_deps=("next" "react" "@nestjs/core" "typescript" "turbo")
    for dep in "${critical_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            print_success "$dep installé"
        else
            print_error "$dep manquant"
        fi
    done
else
    print_error "node_modules manquant"
fi

# 6. PORTS DÉVELOPPEMENT
print_section "🌐 PORTS"

declare -A dev_ports=(
    [3000]="Frontend (Next.js)"
    [3001]="API (NestJS)"
    [5432]="PostgreSQL"
    [6379]="Redis (optionnel)"
)

for port in "${!dev_ports[@]}"; do
    if port_is_open "$port"; then
        print_warning "Port $port (${dev_ports[$port]}): Occupé"
    else
        print_success "Port $port (${dev_ports[$port]}): Libre"
    fi
done

# 7. MODULES NESTJS
print_section "🏗️ MODULES NESTJS"

nestjs_modules=(
    "apps/api/src/modules/users"
    "apps/api/src/modules/auth"
    "apps/api/src/modules/clients"
    "apps/api/src/modules/projets"
    "apps/api/src/common/decorators"
    "apps/api/src/common/guards"
)

for module in "${nestjs_modules[@]}"; do
    if [ -d "$module" ]; then
        print_success "$module"
    else
        print_error "$module"
    fi
done

# 8. DÉTECTION OS ET GESTIONNAIRE DE PAQUETS
print_section "💻 SYSTÈME"

os_name=$(uname -s)
case "$os_name" in
    Linux)
        print_info "Système: Linux"
        if command_exists apt; then
            print_success "Gestionnaire de paquets: apt (Ubuntu/Debian)"
        elif command_exists yum; then
            print_success "Gestionnaire de paquets: yum (RedHat/CentOS)"
        elif command_exists pacman; then
            print_success "Gestionnaire de paquets: pacman (Arch)"
        else
            print_warning "Gestionnaire de paquets non reconnu"
        fi
        ;;
    Darwin)
        print_info "Système: macOS"
        if command_exists brew; then
            print_success "Gestionnaire de paquets: Homebrew"
        else
            print_warning "Homebrew non installé"
        fi
        ;;
    *)
        print_warning "Système non reconnu: $os_name"
        ;;
esac

# 9. RÉSUMÉ ET RECOMMANDATIONS
print_section "📊 RÉSUMÉ"

total_issues=$((${#missing_folders[@]} + ${#missing_files[@]} + ${#missing_tools[@]}))

if [ $total_issues -eq 0 ] && [ "$postgres_installed" = true ]; then
    print_success "🎉 ENVIRONNEMENT PARFAITEMENT CONFIGURÉ !"
    print_info "Vous pouvez démarrer le développement avec: pnpm dev"
else
    print_warning "$total_issues problème(s) détecté(s)"
    
    print_info ""
    print_info "📋 Actions recommandées:"
    
    if [ ${#missing_folders[@]} -gt 0 ]; then
        print_warning "• Créer les dossiers manquants"
    fi
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        print_warning "• Créer les fichiers manquants"
    fi
    
    if [ "$postgres_installed" = false ]; then
        print_warning "• Installer PostgreSQL"
        case "$os_name" in
            Linux)
                if command_exists apt; then
                    print_info "  sudo apt install postgresql postgresql-contrib"
                elif command_exists yum; then
                    print_info "  sudo yum install postgresql postgresql-server"
                fi
                ;;
            Darwin)
                if command_exists brew; then
                    print_info "  brew install postgresql"
                else
                    print_info "  Installez d'abord Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                fi
                ;;
        esac
    fi
    
    if [ ! -d "node_modules" ]; then
        print_warning "• Exécuter: pnpm install"
    fi
    
    print_info ""
    print_info "🚀 SOLUTION RAPIDE:"
    print_info "Exécutez: ./scripts/full-setup.sh"
fi

# 10. PROPOSITION DE RÉPARATION AUTOMATIQUE
if [ $total_issues -gt 0 ]; then
    print_section "🔧 RÉPARATION AUTOMATIQUE"
    
    echo -n "Voulez-vous lancer la réparation automatique ? [O/n]: "
    read -r response
    if [[ "$response" =~ ^([oO]|[oO][uU][iI]|"")$ ]]; then
        print_info "🚀 Lancement de la réparation automatique..."
        bash "$PWD/scripts/full-setup.sh"
    fi
fi

print_success "✅ Vérification terminée à $(date '+%H:%M:%S')"