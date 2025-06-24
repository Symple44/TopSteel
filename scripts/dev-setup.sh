#!/bin/bash
echo "🚀 Configuration de l'environnement de développement..."

# Vérifier que pnpm est installé
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm n'est pas installé. Installation..."
    npm install -g pnpm
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
pnpm install

# Créer les fichiers d'environnement s'ils n'existent pas
if [ ! -f "apps/web/.env.local" ]; then
    echo "📝 Création du fichier .env.local..."
    cp apps/web/.env.example apps/web/.env.local 2>/dev/null || cat > apps/web/.env.local << EOF
# Base URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/erp_dev

# Auth
NEXTAUTH_SECRET=your-development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Optional services
NEXT_PUBLIC_SENTRY_DSN=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
EOF
fi

# Construire les packages partagés
echo "🔨 Construction des packages partagés..."
pnpm build --filter="!@erp/web"

echo "✅ Configuration terminée !"
echo ""
echo "🎯 Commandes utiles :"
echo "  pnpm dev          - Démarrer le serveur de développement"
echo "  pnpm build        - Construire pour la production"
echo "  pnpm test         - Lancer les tests"
echo "  pnpm lint         - Vérifier le code"
echo ""
echo "🔧 VS Code :"
echo "  F5                - Démarrer avec le debugger"
echo "  Ctrl+Shift+D      - Tâche de développement"
echo "  Ctrl+Shift+T      - Lancer les tests"