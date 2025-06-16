# scripts/deploy.sh
#!/bin/bash

set -e

echo "🚀 Déploiement ERP TOPSTEEL"

# Variables
ENVIRONMENT=${1:-staging}
BRANCH=${2:-develop}

if [ "$ENVIRONMENT" = "production" ]; then
    BRANCH="main"
fi

echo "📋 Environnement: $ENVIRONMENT"
echo "📋 Branche: $BRANCH"

# Vérification de la branche
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Tests
echo "🧪 Exécution des tests..."
pnpm test

# Build
echo "🔨 Build de l'application..."
pnpm build

# Déploiement selon l'environnement
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌐 Déploiement en production..."
    vercel --prod --confirm
else
    echo "🔧 Déploiement en staging..."
    vercel --confirm
fi

echo "✅ Déploiement terminé!"

# Notification (optionnel)
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Déploiement $ENVIRONMENT terminé avec succès\"}" \
        $SLACK_WEBHOOK
fi