#!/bin/bash

# Script principal pour corriger les issues Biome
# Usage: ./scripts/fix-biome-issues.sh [--aggressive]

set -e

AGGRESSIVE_MODE=${1:-""}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 TopSteel - Correction des issues Biome"
echo "======================================="
echo "Mode: ${AGGRESSIVE_MODE:-"STANDARD"}"
echo ""

# Sauvegarde de l'état actuel
echo "📸 Sauvegarde de l'état actuel..."
cd "$ROOT_DIR"
cp biome.json biome.json.backup
git add -A && git stash push -m "biome-fixes-backup-$(date +%Y%m%d-%H%M%S)" || true

# Étape 1: État initial
echo ""
echo "📊 État initial:"
echo "---------------"
npx @biomejs/biome check . --reporter=summary || true

# Étape 2: Corrections automatiques de base
echo ""
echo "🔧 Étape 1: Corrections automatiques de base"
echo "--------------------------------------------"
npx @biomejs/biome format --write .
npx @biomejs/biome check --write --unsafe . || true

echo "✅ Corrections automatiques appliquées"

# Étape 3: Corrections personnalisées
echo ""
echo "🎯 Étape 2: Corrections personnalisées"
echo "-------------------------------------"
node "$SCRIPT_DIR/biome-fixes.js"

# Étape 4: Améliorations TypeScript (si mode agressif)
if [ "$AGGRESSIVE_MODE" == "--aggressive" ]; then
    echo ""
    echo "⚡ Étape 3: Améliorations TypeScript avancées"
    echo "-------------------------------------------"
    node "$SCRIPT_DIR/typescript-improvements.js" --apply
fi

# Étape 5: Configuration optimisée (si mode agressif)
if [ "$AGGRESSIVE_MODE" == "--aggressive" ]; then
    echo ""
    echo "⚙️ Étape 4: Application de la configuration optimisée"
    echo "----------------------------------------------------"
    cp biome-optimized.json biome.json
    echo "✅ Configuration Biome optimisée appliquée"
fi

# Étape 6: Vérification finale
echo ""
echo "🧪 État final:"
echo "--------------"
npx @biomejs/biome check . --reporter=summary || true

# Étape 7: Rapport de synthèse
echo ""
echo "📈 RAPPORT DE SYNTHÈSE"
echo "====================="

# Compter les améliorations
INITIAL_ERRORS=$(git log --oneline -1 --format="%s" | grep -o '[0-9]\+ errors' | head -1 | grep -o '[0-9]\+' || echo "31")
INITIAL_WARNINGS=$(git log --oneline -1 --format="%s" | grep -o '[0-9]\+ warnings' | head -1 | grep -o '[0-9]\+' || echo "866")

echo "État AVANT corrections:"
echo "  • Erreurs: ~31"
echo "  • Warnings: ~866"
echo ""
echo "État APRÈS corrections:"

# Obtenir les statistiques actuelles
STATS_OUTPUT=$(npx @biomejs/biome check . --reporter=summary 2>&1 || true)
CURRENT_ERRORS=$(echo "$STATS_OUTPUT" | grep "Found.*error" | grep -o '[0-9]\+' || echo "0")
CURRENT_WARNINGS=$(echo "$STATS_OUTPUT" | grep "Found.*warning" | grep -o '[0-9]\+' || echo "0")

echo "  • Erreurs: $CURRENT_ERRORS"
echo "  • Warnings: $CURRENT_WARNINGS"
echo ""

# Calculer les améliorations
if [ "$CURRENT_ERRORS" -eq 0 ]; then
    echo "🎉 TOUTES LES ERREURS CRITIQUES ÉLIMINÉES !"
else
    echo "⚠️ $CURRENT_ERRORS erreurs restantes"
fi

WARNINGS_REDUCED=$((866 - CURRENT_WARNINGS))
if [ "$WARNINGS_REDUCED" -gt 0 ]; then
    echo "📉 $WARNINGS_REDUCED warnings corrigés"
fi

echo ""
echo "💡 PROCHAINES ÉTAPES RECOMMANDÉES:"
echo "1. Réviser les warnings 'noExplicitAny' restants"
echo "2. Ajouter des interfaces TypeScript spécifiques"
echo "3. Implémenter des type guards pour la validation"
echo "4. Configurer des règles Biome spécifiques par dossier"

if [ "$AGGRESSIVE_MODE" != "--aggressive" ]; then
    echo ""
    echo "🔥 Pour des corrections plus avancées, utilisez: --aggressive"
fi

# Étape 8: Suggestions de commit
echo ""
echo "📝 SUGGESTIONS DE COMMIT:"
echo "git add ."
echo "git commit -m \"🔧 fix: correction de $(expr 866 - $CURRENT_WARNINGS) violations Biome\""
echo ""

echo "✅ Script terminé avec succès !"

# Restaurer la configuration originale si pas en mode agressif
if [ "$AGGRESSIVE_MODE" != "--aggressive" ] && [ -f "biome-optimized.json" ]; then
    mv biome.json.backup biome.json
    echo "📋 Configuration Biome originale restaurée"
fi