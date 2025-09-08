#!/bin/bash

# 🧹 Script de nettoyage du projet TopSteel
# Usage: ./scripts/clean-project.sh [options]
# Options:
#   --all       Nettoie tout (builds, caches, logs)
#   --builds    Nettoie uniquement les builds
#   --cache     Nettoie uniquement les caches
#   --logs      Nettoie uniquement les logs

echo "🧹 Nettoyage du projet TopSteel..."
echo "================================"

# Variables
CLEAN_ALL=false
CLEAN_BUILDS=false
CLEAN_CACHE=false
CLEAN_LOGS=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --all)
      CLEAN_ALL=true
      shift
      ;;
    --builds)
      CLEAN_BUILDS=true
      shift
      ;;
    --cache)
      CLEAN_CACHE=true
      shift
      ;;
    --logs)
      CLEAN_LOGS=true
      shift
      ;;
    *)
      echo "Option inconnue: $arg"
      echo "Usage: $0 [--all|--builds|--cache|--logs]"
      exit 1
      ;;
  esac
done

# Si aucune option, demander
if [ "$CLEAN_ALL" = false ] && [ "$CLEAN_BUILDS" = false ] && [ "$CLEAN_CACHE" = false ] && [ "$CLEAN_LOGS" = false ]; then
  echo "Que voulez-vous nettoyer?"
  echo "1) Tout"
  echo "2) Builds uniquement"
  echo "3) Caches uniquement"
  echo "4) Logs uniquement"
  read -p "Choix (1-4): " choice
  
  case $choice in
    1) CLEAN_ALL=true ;;
    2) CLEAN_BUILDS=true ;;
    3) CLEAN_CACHE=true ;;
    4) CLEAN_LOGS=true ;;
    *) echo "Choix invalide"; exit 1 ;;
  esac
fi

# Fonction de nettoyage des logs
clean_logs() {
  echo "📝 Nettoyage des logs..."
  find . -name "*.log" -type f -delete 2>/dev/null
  find . -name "npm-debug.log*" -type f -delete 2>/dev/null
  find . -name "yarn-debug.log*" -type f -delete 2>/dev/null
  find . -name "yarn-error.log*" -type f -delete 2>/dev/null
  find . -name "pnpm-debug.log*" -type f -delete 2>/dev/null
  find . -name "lerna-debug.log*" -type f -delete 2>/dev/null
  echo "   ✅ Logs supprimés"
}

# Fonction de nettoyage des caches
clean_cache() {
  echo "💾 Nettoyage des caches..."
  
  # Turbo cache
  if [ -d ".turbo" ]; then
    rm -rf .turbo
    echo "   ✅ Cache Turbo supprimé"
  fi
  
  # Next.js cache
  find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null
  echo "   ✅ Cache Next.js supprimé"
  
  # Node cache
  npm cache clean --force 2>/dev/null
  echo "   ✅ Cache npm nettoyé"
}

# Fonction de nettoyage des builds
clean_builds() {
  echo "🏗️  Nettoyage des builds..."
  
  # Dist directories
  find . -type d -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null
  echo "   ✅ Dossiers dist supprimés"
  
  # Build directories
  find . -type d -name "build" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null
  echo "   ✅ Dossiers build supprimés"
  
  # Coverage
  find . -type d -name "coverage" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null
  echo "   ✅ Dossiers coverage supprimés"
  
  # TypeScript build info
  find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null
  echo "   ✅ Fichiers tsbuildinfo supprimés"
}

# Fonction de nettoyage des fichiers temporaires
clean_temp() {
  echo "🗑️  Nettoyage des fichiers temporaires..."
  find . -name "*.tmp" -type f -delete 2>/dev/null
  find . -name "*.temp" -type f -delete 2>/dev/null
  find . -name "*.bak" -type f -delete 2>/dev/null
  find . -name "*.old" -type f -delete 2>/dev/null
  find . -name "*~" -type f -delete 2>/dev/null
  find . -name ".DS_Store" -type f -delete 2>/dev/null
  find . -name "Thumbs.db" -type f -delete 2>/dev/null
  echo "   ✅ Fichiers temporaires supprimés"
}

# Exécution du nettoyage
if [ "$CLEAN_ALL" = true ]; then
  clean_logs
  clean_cache
  clean_builds
  clean_temp
else
  [ "$CLEAN_LOGS" = true ] && clean_logs
  [ "$CLEAN_CACHE" = true ] && clean_cache
  [ "$CLEAN_BUILDS" = true ] && clean_builds
fi

# Rapport final
echo ""
echo "================================"
echo "✅ Nettoyage terminé!"
echo ""

# Afficher l'espace libéré (approximatif)
if command -v du &> /dev/null; then
  echo "📊 Espace disque actuel du projet:"
  du -sh . 2>/dev/null | cut -f1
fi

echo ""
echo "💡 Conseil: Exécutez 'npm run build' pour reconstruire le projet"
echo "================================"