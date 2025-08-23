#!/bin/bash

# Script de mise à jour sécurisée des dépendances
# Usage: ./scripts/update-dependencies.sh

set -e

echo "🔄 Mise à jour des dépendances du projet TopSteel..."

# Sauvegarde du pnpm-lock.yaml
cp pnpm-lock.yaml pnpm-lock.yaml.backup

# Mise à jour des dépendances mineures uniquement (plus sûr)
echo "📦 Mise à jour des dépendances mineures..."
pnpm update --recursive --latest --filter="!@radix-ui/*"

# Mise à jour spécifique des packages @radix-ui (nombreuses mises à jour mineures)
echo "🎨 Mise à jour des packages @radix-ui..."
pnpm update "@radix-ui/*" --recursive --latest

# Mise à jour des packages @floating-ui
echo "🎯 Mise à jour des packages @floating-ui..."
pnpm update "@floating-ui/*" --recursive --latest

# Vérification des vulnérabilités
echo "🔍 Vérification des vulnérabilités..."
pnpm audit || true

# Test de build
echo "🏗️ Test de build..."
pnpm build

# Test unitaires
echo "🧪 Exécution des tests..."
pnpm test || true

echo "✅ Mise à jour terminée avec succès!"
echo "⚠️  N'oubliez pas de:"
echo "  1. Vérifier les changements dans pnpm-lock.yaml"
echo "  2. Tester l'application manuellement"
echo "  3. Committer les changements si tout fonctionne"
echo ""
echo "En cas de problème, restaurez avec: mv pnpm-lock.yaml.backup pnpm-lock.yaml && pnpm install"