#!/bin/bash

# Script de démarrage rapide pour ERP Métallerie
# Ce script configure l'environnement et lance l'application

echo "🚀 Configuration de l'ERP Métallerie..."
echo ""

# Vérifier Node.js
echo "📌 Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18.17 ou supérieur."
    echo "👉 https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "✅ Node.js v$NODE_VERSION détecté"
echo ""

# Vérifier le gestionnaire de paquets
echo "📌 Détection du gestionnaire de paquets..."
if [ -f "pnpm-lock.yaml" ]; then
    PKG_MANAGER="pnpm"
elif [ -f "yarn.lock" ]; then
    PKG_MANAGER="yarn"
else
    PKG_MANAGER="npm"
fi
echo "✅ Utilisation de $PKG_MANAGER"
echo ""

# Installer les dépendances
echo "📦 Installation des dépendances..."
$PKG_MANAGER install
echo ""

# Créer le fichier .env.local s'il n'existe pas
if [ ! -f ".env.local" ]; then
    echo "🔧 Création du fichier .env.local..."
    cp .env.example .env.local
    echo "✅ Fichier .env.local créé"
    echo "⚠️  N'oubliez pas de configurer vos variables d'environnement dans .env.local"
    echo ""
fi

# Compiler TypeScript pour vérifier les types
echo "🔍 Vérification des types TypeScript..."
$PKG_MANAGER run type-check || echo "⚠️  Quelques erreurs de type détectées (normal au premier lancement)"
echo ""

# Lancer l'application
echo "🎉 Lancement de l'application..."
echo "👉 L'application sera accessible sur http://localhost:3000"
echo ""
echo "📝 Compte de démonstration:"
echo "   Email: demo@metallerie.fr"
echo "   Mot de passe: password"
echo ""

$PKG_MANAGER run dev