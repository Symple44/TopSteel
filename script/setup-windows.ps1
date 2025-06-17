# Script de configuration Windows pour ERP TOPSTEEL

Write-Host "🚀 Configuration de l'environnement ERP TOPSTEEL pour Windows..." -ForegroundColor Green
Write-Host ""

# Vérifier si on est dans le bon dossier
$currentPath = Get-Location
Write-Host "📍 Dossier actuel: $currentPath" -ForegroundColor Yellow

# Vérifier si on est à la racine du projet
if (Test-Path "apps\web" -and Test-Path "packages") {
    Write-Host "✅ Vous êtes à la racine du projet" -ForegroundColor Green
} elseif (Test-Path "..\..\apps\web" -and Test-Path "..\..\packages") {
    Write-Host "⚠️  Vous êtes dans apps/web, navigation vers la racine..." -ForegroundColor Yellow
    Set-Location "..\.."
    $currentPath = Get-Location
    Write-Host "📍 Nouveau dossier: $currentPath" -ForegroundColor Green
} else {
    Write-Host "❌ Structure de projet non trouvée. Assurez-vous d'être dans le bon dossier." -ForegroundColor Red
    exit 1
}

# Vérifier Node.js
Write-Host ""
Write-Host "📌 Vérification de Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js n'est pas installé. Installez Node.js 18.17+ depuis https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Installer pnpm si nécessaire
Write-Host ""
Write-Host "📌 Vérification de pnpm..." -ForegroundColor Cyan
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm $pnpmVersion déjà installé" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm non trouvé. Installation en cours..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✅ pnpm installé !" -ForegroundColor Green
}

# Installer les dépendances
Write-Host ""
Write-Host "📦 Installation des dépendances..." -ForegroundColor Cyan
pnpm install

# Créer le fichier .env.local s'il n'existe pas
Write-Host ""
Write-Host "🔧 Configuration des variables d'environnement..." -ForegroundColor Cyan
if (-not (Test-Path "apps\web\.env.local")) {
    Write-Host "📝 Création du fichier .env.local..." -ForegroundColor Yellow
    $envContent = @"
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
"@
    $envContent | Out-File -FilePath "apps\web\.env.local" -Encoding UTF8
    Write-Host "✅ Fichier .env.local créé" -ForegroundColor Green
} else {
    Write-Host "✅ Fichier .env.local existe déjà" -ForegroundColor Green
}

# Construire les packages partagés
Write-Host ""
Write-Host "🔨 Construction des packages partagés..." -ForegroundColor Cyan
pnpm build --filter="!@erp/web"

# Vérification finale
Write-Host ""
Write-Host "🔍 Vérification de l'installation..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules présent" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules manquant" -ForegroundColor Red
}

if (Test-Path "apps\web\node_modules") {
    Write-Host "✅ Dépendances web installées" -ForegroundColor Green
} else {
    Write-Host "❌ Dépendances web manquantes" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Configuration terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Fermez VS Code complètement" -ForegroundColor White
Write-Host "  2. Rouvrez VS Code depuis la RACINE du projet:" -ForegroundColor White
Write-Host "     code ." -ForegroundColor Cyan
Write-Host "  3. Appuyez sur F5 pour lancer avec le debugger" -ForegroundColor White
Write-Host "  4. Ou utilisez la commande:" -ForegroundColor White
Write-Host "     pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 L'application sera accessible sur:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""