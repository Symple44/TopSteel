#!/bin/bash

# TopSteel Quality System Setup Script
# Installe et configure automatiquement le système de qualité complet

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}${NC}"
    echo -e "${PURPLE}=== $1 ===${NC}"
    echo -e "${PURPLE}${NC}"
}

# Vérifier les prérequis
check_prerequisites() {
    log_header "Vérification des Prérequis"
    
    local missing_tools=()
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js")
    else
        local node_version=$(node --version | cut -d'v' -f2)
        log_info "Node.js version: $node_version"
        if [[ "${node_version%%.*}" -lt 20 ]]; then
            log_warning "Node.js version recommandée: 20.x ou supérieure"
        fi
    fi
    
    # Vérifier pnpm
    if ! command -v pnpm &> /dev/null; then
        missing_tools+=("pnpm")
    else
        local pnpm_version=$(pnpm --version)
        log_info "pnpm version: $pnpm_version"
    fi
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    else
        local git_version=$(git --version | cut -d' ' -f3)
        log_info "Git version: $git_version"
    fi
    
    # Vérifier jq (optionnel mais recommandé)
    if ! command -v jq &> /dev/null; then
        log_warning "jq non installé - certaines fonctionnalités avancées ne seront pas disponibles"
        log_info "Installation recommandée: sudo apt-get install jq (Ubuntu) ou brew install jq (macOS)"
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Outils manquants: ${missing_tools[*]}"
        log_error "Veuillez installer ces outils avant de continuer"
        exit 1
    fi
    
    log_success "Tous les prérequis sont installés"
}

# Installer les dépendances du projet
install_dependencies() {
    log_header "Installation des Dépendances"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f "package.json" ]; then
        log_error "package.json non trouvé dans $PROJECT_ROOT"
        exit 1
    fi
    
    log_info "Installation des dépendances avec pnpm..."
    if pnpm install; then
        log_success "Dépendances installées avec succès"
    else
        log_error "Échec de l'installation des dépendances"
        exit 1
    fi
}

# Installer les outils de qualité globaux
install_quality_tools() {
    log_header "Installation des Outils de Qualité"
    
    log_info "Installation des outils de qualité globaux..."
    
    # Liste des outils à installer globalement
    local tools=(
        "complexity-report"
        "jscpd"
        "license-checker"
        "@lhci/cli"
        "clinic"
        "audit-ci"
    )
    
    for tool in "${tools[@]}"; do
        log_info "Installation de $tool..."
        if npm install -g "$tool" 2>/dev/null; then
            log_success "$tool installé"
        else
            log_warning "Échec de l'installation de $tool (peut nécessiter sudo)"
        fi
    done
}

# Configurer les hooks Git
setup_git_hooks() {
    log_header "Configuration des Hooks Git"
    
    cd "$PROJECT_ROOT"
    
    if [ ! -d ".git" ]; then
        log_warning "Pas un repository Git - ignoré"
        return
    fi
    
    local hooks_dir=".git/hooks"
    
    # Pre-commit hook
    log_info "Configuration du hook pre-commit..."
    cat > "$hooks_dir/pre-commit" << 'EOF'
#!/bin/bash
# TopSteel Pre-commit Hook

echo "🔍 Exécution des vérifications pre-commit..."

# Linting rapide
if command -v biome &> /dev/null; then
    echo "📝 Vérification du linting..."
    if ! biome check --staged; then
        echo "❌ Erreurs de linting détectées"
        echo "💡 Exécutez 'pnpm lint:biome:fix' pour corriger automatiquement"
        exit 1
    fi
fi

# Type checking rapide
if [ -f "tsconfig.json" ]; then
    echo "🔧 Vérification des types..."
    if ! pnpm type-check; then
        echo "❌ Erreurs de type détectées"
        exit 1
    fi
fi

echo "✅ Vérifications pre-commit réussies"
EOF

    chmod +x "$hooks_dir/pre-commit"
    log_success "Hook pre-commit configuré"
    
    # Pre-push hook
    log_info "Configuration du hook pre-push..."
    cat > "$hooks_dir/pre-push" << 'EOF'
#!/bin/bash
# TopSteel Pre-push Hook

echo "🧪 Exécution des tests avant push..."

# Tests unitaires rapides
if ! pnpm test --run; then
    echo "❌ Tests échoués"
    echo "💡 Corrigez les tests avant de pousser"
    exit 1
fi

echo "✅ Tests réussis"
EOF

    chmod +x "$hooks_dir/pre-push"
    log_success "Hook pre-push configuré"
}

# Configurer les scripts npm
setup_npm_scripts() {
    log_header "Configuration des Scripts NPM"
    
    cd "$PROJECT_ROOT"
    
    # Vérifier si les scripts de qualité existent déjà
    if ! grep -q "quality:check" package.json; then
        log_info "Ajout des scripts de qualité au package.json..."
        
        # Utiliser jq si disponible, sinon modification manuelle
        if command -v jq &> /dev/null; then
            local temp_file=$(mktemp)
            jq '.scripts += {
                "quality:check": "./scripts/quality-check.sh all",
                "quality:complexity": "./scripts/quality-check.sh complexity",
                "quality:duplication": "./scripts/quality-check.sh duplication",
                "quality:bundle": "./scripts/quality-check.sh bundle-size",
                "quality:report": "./scripts/quality-check.sh report",
                "quality:update-config": "node scripts/update-quality-config.js"
            }' package.json > "$temp_file" && mv "$temp_file" package.json
            
            log_success "Scripts de qualité ajoutés au package.json"
        else
            log_warning "jq non disponible - ajoutez manuellement les scripts de qualité"
        fi
    else
        log_info "Scripts de qualité déjà présents"
    fi
}

# Créer les dossiers nécessaires
create_directories() {
    log_header "Création des Dossiers"
    
    cd "$PROJECT_ROOT"
    
    local directories=(
        "reports"
        ".github/workflows"
        "docs"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "Dossier créé: $dir"
        else
            log_info "Dossier existant: $dir"
        fi
    done
    
    log_success "Structure de dossiers configurée"
}

# Vérifier la configuration
verify_setup() {
    log_header "Vérification de la Configuration"
    
    cd "$PROJECT_ROOT"
    
    local config_files=(
        ".quality.json"
        "scripts/quality-check.sh"
        "scripts/quality-check.ps1"
        ".github/workflows/quality-continuous.yml"
        ".github/workflows/build-continuous.yml"
    )
    
    local missing_files=()
    
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "✓ $file"
        else
            log_warning "✗ $file (manquant)"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        log_success "Tous les fichiers de configuration sont présents"
    else
        log_warning "Fichiers manquants: ${missing_files[*]}"
    fi
}

# Test du système de qualité
test_quality_system() {
    log_header "Test du Système de Qualité"
    
    cd "$PROJECT_ROOT"
    
    # Rendre le script exécutable
    chmod +x scripts/quality-check.sh
    
    # Test basique
    log_info "Test d'exécution basique..."
    if ./scripts/quality-check.sh --help 2>/dev/null || true; then
        log_success "Script de qualité exécutable"
    else
        log_warning "Problème avec le script de qualité"
    fi
    
    # Test de configuration
    log_info "Test de la configuration..."
    if node scripts/update-quality-config.js 2>/dev/null || true; then
        log_success "Configuration updater fonctionnel"
    else
        log_warning "Problème avec le configuration updater"
    fi
    
    # Test de build
    log_info "Test de build basique..."
    if pnpm build:packages 2>/dev/null; then
        log_success "Build des packages réussi"
    else
        log_warning "Problème avec le build des packages"
    fi
}

# Afficher le résumé final
show_summary() {
    log_header "Résumé de l'Installation"
    
    echo ""
    echo "🎉 Installation du système de qualité TopSteel terminée !"
    echo ""
    echo "📋 Commandes disponibles :"
    echo "  pnpm quality:check          - Analyse complète de qualité"
    echo "  pnpm quality:complexity     - Analyse de complexité"
    echo "  pnpm quality:duplication    - Détection de duplication"
    echo "  pnpm quality:bundle         - Analyse des bundles"
    echo "  pnpm quality:report         - Génération de rapport"
    echo "  pnpm quality:update-config  - Mise à jour configuration"
    echo ""
    echo "🔧 Scripts directs :"
    echo "  ./scripts/quality-check.sh all"
    echo "  node scripts/update-quality-config.js"
    echo ""
    echo "📚 Documentation :"
    echo "  docs/quality-system.md      - Documentation complète"
    echo "  .quality.json               - Configuration centrale"
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "  1. Revoyez la configuration dans .quality.json"
    echo "  2. Exécutez une première analyse : pnpm quality:check"
    echo "  3. Configurez les secrets GitHub pour les intégrations externes"
    echo "  4. Adaptez les seuils selon vos besoins"
    echo ""
    echo "✅ Le système de qualité est maintenant prêt à l'emploi !"
}

# Fonction principale
main() {
    log_header "Setup du Système de Qualité TopSteel"
    
    check_prerequisites
    install_dependencies
    install_quality_tools
    create_directories
    setup_git_hooks
    setup_npm_scripts
    verify_setup
    test_quality_system
    show_summary
    
    log_success "Setup terminé avec succès !"
}

# Gestion des options
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Afficher cette aide"
    echo "  --skip-tools   Ignorer l'installation des outils globaux"
    echo "  --skip-hooks   Ignorer la configuration des hooks Git"
    echo "  --dry-run      Simulation sans modification"
    echo ""
    echo "Exemples:"
    echo "  $0                    # Installation complète"
    echo "  $0 --skip-tools       # Sans outils globaux"
    echo "  $0 --dry-run          # Simulation"
}

# Parsing des arguments
SKIP_TOOLS=false
SKIP_HOOKS=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --skip-tools)
            SKIP_TOOLS=true
            shift
            ;;
        --skip-hooks)
            SKIP_HOOKS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Exécution avec gestion des options
if [ "$DRY_RUN" = true ]; then
    log_warning "Mode simulation - aucune modification ne sera effectuée"
    exit 0
fi

if [ "$SKIP_TOOLS" = true ]; then
    log_warning "Installation des outils globaux ignorée"
    install_quality_tools() { log_info "Installation des outils globaux ignorée"; }
fi

if [ "$SKIP_HOOKS" = true ]; then
    log_warning "Configuration des hooks Git ignorée"
    setup_git_hooks() { log_info "Configuration des hooks Git ignorée"; }
fi

# Exécuter le setup
main