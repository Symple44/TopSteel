#!/bin/bash

# TopSteel Quality Check Script
# Analyse la qualité du code, détecte les problèmes et génère des rapports

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$PROJECT_ROOT/reports"
QUALITY_CONFIG="$PROJECT_ROOT/.quality.json"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Créer le dossier de rapports
create_reports_dir() {
    mkdir -p "$REPORTS_DIR"
    log_info "Reports directory created: $REPORTS_DIR"
}

# Charger la configuration de qualité
load_quality_config() {
    if [[ -f "$QUALITY_CONFIG" ]]; then
        log_info "Loading quality configuration from $QUALITY_CONFIG"
        
        # Lire les seuils depuis le fichier JSON
        COVERAGE_THRESHOLD=$(jq -r '.thresholds.coverage // 80' "$QUALITY_CONFIG")
        COMPLEXITY_THRESHOLD=$(jq -r '.thresholds.complexity // 10' "$QUALITY_CONFIG")
        DUPLICATION_THRESHOLD=$(jq -r '.thresholds.duplication // 5' "$QUALITY_CONFIG")
        BUNDLE_SIZE_THRESHOLD=$(jq -r '.thresholds.bundleSize // "5MB"' "$QUALITY_CONFIG")
    else
        log_warning "Quality configuration file not found, using defaults"
        COVERAGE_THRESHOLD=80
        COMPLEXITY_THRESHOLD=10
        DUPLICATION_THRESHOLD=5
        BUNDLE_SIZE_THRESHOLD="5MB"
    fi
}

# Analyser la complexité du code
analyze_complexity() {
    log_info "Analyzing code complexity..."
    
    local complexity_report="$REPORTS_DIR/complexity-report.json"
    local complexity_summary="$REPORTS_DIR/complexity-summary.txt"
    
    # Analyser la complexité avec complexity-report
    find "$PROJECT_ROOT" -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.next/*" | \
        head -100 | \
        xargs cr --format json > "$complexity_report" 2>/dev/null || {
            log_warning "Complexity analysis tool not found, installing..."
            npm install -g complexity-report 2>/dev/null || log_warning "Failed to install complexity-report"
        }
    
    # Générer un résumé
    if [[ -f "$complexity_report" ]]; then
        echo "Code Complexity Analysis Report" > "$complexity_summary"
        echo "================================" >> "$complexity_summary"
        echo "Generated at: $(date)" >> "$complexity_summary"
        echo "" >> "$complexity_summary"
        
        # Extraire les métriques principales
        local high_complexity_files=$(jq -r '.reports[] | select(.complexity.cyclomatic > '$COMPLEXITY_THRESHOLD') | .filepath' "$complexity_report" 2>/dev/null | wc -l)
        
        echo "Files with high complexity (>$COMPLEXITY_THRESHOLD): $high_complexity_files" >> "$complexity_summary"
        
        if [[ $high_complexity_files -gt 0 ]]; then
            log_warning "Found $high_complexity_files files with high complexity"
            echo "" >> "$complexity_summary"
            echo "High complexity files:" >> "$complexity_summary"
            jq -r '.reports[] | select(.complexity.cyclomatic > '$COMPLEXITY_THRESHOLD') | "\(.filepath): \(.complexity.cyclomatic)"' "$complexity_report" 2>/dev/null >> "$complexity_summary"
        else
            log_success "All files have acceptable complexity"
        fi
    fi
}

# Détecter le code dupliqué
detect_duplication() {
    log_info "Detecting code duplication..."
    
    local duplication_report="$REPORTS_DIR/duplication-report.json"
    local duplication_summary="$REPORTS_DIR/duplication-summary.txt"
    
    # Installer jscpd si nécessaire
    if ! command -v jscpd &> /dev/null; then
        log_warning "jscpd not found, installing..."
        npm install -g jscpd 2>/dev/null || log_warning "Failed to install jscpd"
    fi
    
    # Analyser la duplication
    jscpd --threshold "$DUPLICATION_THRESHOLD" --min-lines 10 --min-tokens 50 \
          --format json --output "$duplication_report" \
          --ignore "**/node_modules/**,**/dist/**,**/.next/**" \
          "$PROJECT_ROOT" 2>/dev/null || log_warning "Duplication analysis failed"
    
    # Générer un résumé
    if [[ -f "$duplication_report" ]]; then
        echo "Code Duplication Analysis Report" > "$duplication_summary"
        echo "================================" >> "$duplication_summary"
        echo "Generated at: $(date)" >> "$duplication_summary"
        echo "" >> "$duplication_summary"
        
        local duplicates_count=$(jq '.duplicates | length' "$duplication_report" 2>/dev/null || echo "0")
        echo "Total duplicates found: $duplicates_count" >> "$duplication_summary"
        
        if [[ $duplicates_count -gt 0 ]]; then
            log_warning "Found $duplicates_count code duplications"
        else
            log_success "No significant code duplication found"
        fi
    fi
}

# Vérifier les conventions de nommage
check_naming_conventions() {
    log_info "Checking naming conventions..."
    
    local naming_report="$REPORTS_DIR/naming-conventions.txt"
    
    echo "Naming Conventions Report" > "$naming_report"
    echo "========================" >> "$naming_report"
    echo "Generated at: $(date)" >> "$naming_report"
    echo "" >> "$naming_report"
    
    # Vérifier les fichiers avec des noms non conformes
    log_info "Checking file naming conventions..."
    
    # Fichiers avec des espaces (non recommandé)
    local files_with_spaces=$(find "$PROJECT_ROOT" -name "* *" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.next/*" | wc -l)
    echo "Files with spaces in name: $files_with_spaces" >> "$naming_report"
    
    # Fichiers TypeScript/JavaScript avec camelCase incorrect
    local non_camel_case_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
        grep -v node_modules | grep -v dist | grep -v .next | \
        grep -E '[A-Z][a-z]*[A-Z]' | wc -l)
    echo "Non-camelCase TS/JS files: $non_camel_case_files" >> "$naming_report"
    
    # Composants React sans PascalCase
    local non_pascal_components=$(find "$PROJECT_ROOT" -name "*.tsx" | \
        grep -v node_modules | grep -v dist | grep -v .next | \
        grep -v -E '^[A-Z][a-zA-Z]*\.tsx$' | wc -l)
    echo "Non-PascalCase React components: $non_pascal_components" >> "$naming_report"
    
    if [[ $files_with_spaces -eq 0 && $non_camel_case_files -eq 0 && $non_pascal_components -eq 0 ]]; then
        log_success "All files follow naming conventions"
    else
        log_warning "Some files don't follow naming conventions"
    fi
}

# Analyser les imports inutilisés
check_unused_imports() {
    log_info "Checking for unused imports..."
    
    local unused_imports_report="$REPORTS_DIR/unused-imports.txt"
    
    echo "Unused Imports Report" > "$unused_imports_report"
    echo "====================" >> "$unused_imports_report"
    echo "Generated at: $(date)" >> "$unused_imports_report"
    echo "" >> "$unused_imports_report"
    
    # Utiliser Biome pour détecter les imports inutilisés
    if command -v biome &> /dev/null; then
        biome check --reporter=json . 2>/dev/null | \
            jq -r '.diagnostics[] | select(.category == "lint/correctness/noUnusedImports") | .location.path' 2>/dev/null | \
            sort | uniq -c > "$unused_imports_report.tmp" 2>/dev/null || true
        
        if [[ -f "$unused_imports_report.tmp" ]]; then
            local unused_count=$(wc -l < "$unused_imports_report.tmp")
            echo "Files with unused imports: $unused_count" >> "$unused_imports_report"
            cat "$unused_imports_report.tmp" >> "$unused_imports_report"
            rm "$unused_imports_report.tmp"
            
            if [[ $unused_count -gt 0 ]]; then
                log_warning "Found unused imports in $unused_count files"
            else
                log_success "No unused imports found"
            fi
        fi
    else
        echo "Biome not available for unused imports check" >> "$unused_imports_report"
        log_warning "Biome not available for unused imports analysis"
    fi
}

# Vérifier la documentation
check_documentation() {
    log_info "Checking documentation coverage..."
    
    local doc_report="$REPORTS_DIR/documentation-coverage.txt"
    
    echo "Documentation Coverage Report" > "$doc_report"
    echo "============================" >> "$doc_report"
    echo "Generated at: $(date)" >> "$doc_report"
    echo "" >> "$doc_report"
    
    # Compter les fichiers TypeScript
    local ts_files=$(find "$PROJECT_ROOT" -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.next/*" | wc -l)
    
    # Compter les fichiers avec des commentaires JSDoc
    local documented_files=$(find "$PROJECT_ROOT" -name "*.ts" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.next/*" -exec grep -l "\/\*\*" {} \; | wc -l)
    
    local doc_coverage=0
    if [[ $ts_files -gt 0 ]]; then
        doc_coverage=$((documented_files * 100 / ts_files))
    fi
    
    echo "Total TypeScript files: $ts_files" >> "$doc_report"
    echo "Files with JSDoc comments: $documented_files" >> "$doc_report"
    echo "Documentation coverage: $doc_coverage%" >> "$doc_report"
    
    if [[ $doc_coverage -ge 70 ]]; then
        log_success "Good documentation coverage: $doc_coverage%"
    elif [[ $doc_coverage -ge 50 ]]; then
        log_warning "Moderate documentation coverage: $doc_coverage%"
    else
        log_warning "Low documentation coverage: $doc_coverage%"
    fi
}

# Vérifier la taille des bundles
check_bundle_size() {
    log_info "Checking bundle sizes..."
    
    local bundle_report="$REPORTS_DIR/bundle-size.txt"
    
    echo "Bundle Size Report" > "$bundle_report"
    echo "==================" >> "$bundle_report"
    echo "Generated at: $(date)" >> "$bundle_report"
    echo "" >> "$bundle_report"
    
    # Vérifier les builds existants
    local issues_found=0
    
    # Web app
    if [[ -d "$PROJECT_ROOT/apps/web/.next" ]]; then
        local web_size=$(du -sh "$PROJECT_ROOT/apps/web/.next" | cut -f1)
        echo "Web app bundle size: $web_size" >> "$bundle_report"
        
        # Convertir en bytes pour comparaison (approximatif)
        local web_size_mb=$(echo "$web_size" | sed 's/M.*//' | sed 's/G.*/*1024/' | bc 2>/dev/null || echo "0")
        if [[ ${web_size_mb%.*} -gt 10 ]]; then
            log_warning "Web app bundle is large: $web_size"
            issues_found=1
        fi
    else
        echo "Web app bundle: Not built" >> "$bundle_report"
    fi
    
    # Marketplace storefront
    if [[ -d "$PROJECT_ROOT/apps/marketplace-storefront/.next" ]]; then
        local marketplace_size=$(du -sh "$PROJECT_ROOT/apps/marketplace-storefront/.next" | cut -f1)
        echo "Marketplace storefront bundle size: $marketplace_size" >> "$bundle_report"
    else
        echo "Marketplace storefront bundle: Not built" >> "$bundle_report"
    fi
    
    if [[ $issues_found -eq 0 ]]; then
        log_success "Bundle sizes are acceptable"
    fi
}

# Générer un rapport de qualité global
generate_quality_report() {
    log_info "Generating global quality report..."
    
    local global_report="$PROJECT_ROOT/quality-report.md"
    
    cat > "$global_report" << EOF
# TopSteel Quality Report

**Generated at:** $(date)
**Git Commit:** ${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}
**Branch:** ${GITHUB_REF_NAME:-$(git branch --show-current 2>/dev/null || echo "unknown")}

## Summary

This report provides an overview of the code quality metrics for the TopSteel project.

## Configuration Thresholds

- **Coverage Threshold:** ${COVERAGE_THRESHOLD}%
- **Complexity Threshold:** ${COMPLEXITY_THRESHOLD}
- **Duplication Threshold:** ${DUPLICATION_THRESHOLD}%
- **Bundle Size Threshold:** ${BUNDLE_SIZE_THRESHOLD}

## Reports Generated

EOF

    # Ajouter les liens vers les rapports générés
    for report in "$REPORTS_DIR"/*.txt "$REPORTS_DIR"/*.json; do
        if [[ -f "$report" ]]; then
            local basename=$(basename "$report")
            echo "- [$basename](./reports/$basename)" >> "$global_report"
        fi
    done
    
    cat >> "$global_report" << EOF

## Quality Metrics

### Code Complexity
EOF

    if [[ -f "$REPORTS_DIR/complexity-summary.txt" ]]; then
        echo '```' >> "$global_report"
        cat "$REPORTS_DIR/complexity-summary.txt" >> "$global_report"
        echo '```' >> "$global_report"
    else
        echo "Complexity analysis not available." >> "$global_report"
    fi

    cat >> "$global_report" << EOF

### Code Duplication
EOF

    if [[ -f "$REPORTS_DIR/duplication-summary.txt" ]]; then
        echo '```' >> "$global_report"
        cat "$REPORTS_DIR/duplication-summary.txt" >> "$global_report"
        echo '```' >> "$global_report"
    else
        echo "Duplication analysis not available." >> "$global_report"
    fi

    cat >> "$global_report" << EOF

### Bundle Sizes
EOF

    if [[ -f "$REPORTS_DIR/bundle-size.txt" ]]; then
        echo '```' >> "$global_report"
        cat "$REPORTS_DIR/bundle-size.txt" >> "$global_report"
        echo '```' >> "$global_report"
    else
        echo "Bundle size analysis not available." >> "$global_report"
    fi

    cat >> "$global_report" << EOF

---

*This report was generated automatically by the TopSteel quality check system.*
EOF

    log_success "Global quality report generated: $global_report"
}

# Fonction principale
main() {
    local command="${1:-all}"
    
    log_info "Starting TopSteel Quality Check..."
    log_info "Command: $command"
    
    create_reports_dir
    load_quality_config
    
    case "$command" in
        "complexity")
            analyze_complexity
            ;;
        "duplication")
            detect_duplication
            ;;
        "naming")
            check_naming_conventions
            ;;
        "imports")
            check_unused_imports
            ;;
        "documentation")
            check_documentation
            ;;
        "bundle-size")
            check_bundle_size
            ;;
        "report")
            generate_quality_report
            ;;
        "all")
            analyze_complexity
            detect_duplication
            check_naming_conventions
            check_unused_imports
            check_documentation
            check_bundle_size
            generate_quality_report
            ;;
        *)
            log_error "Unknown command: $command"
            echo "Usage: $0 [complexity|duplication|naming|imports|documentation|bundle-size|report|all]"
            exit 1
            ;;
    esac
    
    log_success "Quality check completed!"
}

# Vérifier les dépendances
check_dependencies() {
    local missing_deps=()
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if ! command -v bc &> /dev/null; then
        missing_deps+=("bc")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_warning "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install them with your package manager"
        log_info "Ubuntu/Debian: sudo apt-get install ${missing_deps[*]}"
        log_info "macOS: brew install ${missing_deps[*]}"
    fi
}

# Vérifier les dépendances avant de commencer
check_dependencies

# Exécuter la fonction principale
main "$@"