# Script de configuration Windows pour ERP TOPSTEEL

param(
    [switch]$Force,
    [switch]$Verbose
)

function Write-Section($title) {
    Write-Host ""
    Write-Host "🔹 $title" -ForegroundColor Cyan
    Write-Host ("-" * 50) -ForegroundColor Gray
}

function Test-Command($cmd) {
    try {
        Get-Command $cmd -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

Write-Host "🚀 SCRIPT DE CONFIGURATION ERP TOPSTEEL" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""

# Phase 1: Diagnostic complet
Write-Section "DIAGNOSTIC SYSTÈME"

# Vérifier l'emplacement
$currentPath = Get-Location
Write-Host "📍 Emplacement: $currentPath"

if ((Test-Path "apps\web") -and (Test-Path "packages")) {
    Write-Host "✅ Structure monorepo détectée" -ForegroundColor Green
} else {
    Write-Host "❌ Structure incorrecte - Naviguez vers la racine du projet" -ForegroundColor Red
    exit 1
}

# Vérifier les outils
Write-Host "🛠️  Node.js: $(if (Test-Command "node") { "✅ $(node --version)" } else { "❌ Non installé" })"
Write-Host "🛠️  pnpm: $(if (Test-Command "pnpm") { "✅ v$(pnpm --version)" } else { "❌ Non installé" })"

# Phase 2: Analyse des fichiers critiques
Write-Section "ANALYSE DES FICHIERS"

$criticalFiles = @{
    "package.json" = "Racine"
    "turbo.json" = "Turbo config"
    "apps\web\package.json" = "Web app"
    "apps\web\.env.local" = "Environment"
}

foreach ($file in $criticalFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "✅ $($criticalFiles[$file]): $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $($criticalFiles[$file]): $file" -ForegroundColor Red
    }
}

# Lire le package.json de l'app web
if (Test-Path "apps\web\package.json") {
    try {
        $webPackage = Get-Content "apps\web\package.json" -Raw | ConvertFrom-Json
        Write-Host "📋 App name: $($webPackage.name)"
        Write-Host "📋 Version: $($webPackage.version)"
        
        if ($webPackage.dependencies.next) {
            Write-Host "✅ Next.js dans dependencies: $($webPackage.dependencies.next)" -ForegroundColor Green
        } else {
            Write-Host "❌ Next.js non trouvé dans dependencies" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erreur lecture package.json" -ForegroundColor Red
    }
}

# Phase 3: Nettoyage et réinstallation forcée
Write-Section "NETTOYAGE ET RÉINSTALLATION"

if ($Force -or (Read-Host "Voulez-vous nettoyer et réinstaller ? (y/N)") -eq "y") {
    
    Write-Host "🧹 Nettoyage des node_modules..."
    
    # Supprimer les node_modules existants
    if (Test-Path "node_modules") {
        Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ node_modules racine supprimé"
    }
    
    if (Test-Path "apps\web\node_modules") {
        Remove-Item "apps\web\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ apps\web\node_modules supprimé"
    }

    # Nettoyer les caches
    Write-Host "🧹 Nettoyage des caches..."
    pnpm store prune | Out-Null
    
    # Installation fraîche
    Write-Host "📦 Installation fraîche des dépendances..."
    pnpm install --no-frozen-lockfile
    
    # Installation spécifique dans apps/web
    Write-Host "📦 Installation spécifique web..."
    Set-Location "apps\web"
    pnpm install --no-frozen-lockfile
    Set-Location "..\.."
}

# Phase 4: Vérification post-installation
Write-Section "VÉRIFICATION POST-INSTALLATION"

$paths = @(
    "node_modules",
    "apps\web\node_modules",
    "node_modules\.bin\next.cmd",
    "apps\web\node_modules\.bin\next.cmd",
    "node_modules\.bin\turbo.cmd"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "✅ $path" -ForegroundColor Green
    } else {
        Write-Host "❌ $path" -ForegroundColor Red
    }
}

# Phase 5: Création du fichier .env.local si manquant
Write-Section "CONFIGURATION ENVIRONNEMENT"

if (-not (Test-Path "apps\web\.env.local")) {
    Write-Host "📝 Création de .env.local..."
    $envContent = @"
# Variables d'environnement pour le développement local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/erp_dev
NEXTAUTH_SECRET=your-development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=ERP TOPSTEEL
NEXT_PUBLIC_APP_VERSION=1.0.0
"@
    $envContent | Out-File -FilePath "apps\web\.env.local" -Encoding UTF8
    Write-Host "✅ .env.local créé" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local existe" -ForegroundColor Green
}

# Phase 6: Test de lancement
Write-Section "TEST DE LANCEMENT"

Write-Host "🧪 Test 1: Commande directe Next.js..."
Set-Location "apps\web"
if (Test-Path "node_modules\.bin\next.cmd") {
    Write-Host "✅ Next.js trouvé - Lancement test (3 secondes)..." -ForegroundColor Green
    
    # Lancer Next.js en arrière-plan pour tester
    $job = Start-Job -ScriptBlock {
        Set-Location $args[0]
        & ".\node_modules\.bin\next.cmd" "dev" "--port" "3000"
    } -ArgumentList (Get-Location)
    
    Start-Sleep -Seconds 3
    
    if ($job.State -eq "Running") {
        Write-Host "✅ Next.js démarre correctement !" -ForegroundColor Green
        Stop-Job $job
        Remove-Job $job
    } else {
        Write-Host "❌ Problème de démarrage Next.js" -ForegroundColor Red
        Receive-Job $job
        Remove-Job $job
    }
} else {
    Write-Host "❌ Next.js non trouvé" -ForegroundColor Red
}

Set-Location "..\.."

Write-Host ""
Write-Host "🧪 Test 2: Commande pnpm..."
try {
    $testOutput = pnpm --filter "@erp/web" exec next --version 2>&1
    if ($testOutput -match "\d+\.\d+\.\d+") {
        Write-Host "✅ pnpm peut exécuter Next.js: $testOutput" -ForegroundColor Green
    } else {
        Write-Host "❌ pnpm ne trouve pas Next.js" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur avec pnpm: $_" -ForegroundColor Red
}

# Phase 7: Instructions finales
Write-Section "INSTRUCTIONS FINALES"

Write-Host "🎯 COMMANDES DE LANCEMENT:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 (Recommandée):" -ForegroundColor White
Write-Host "  cd apps\web" -ForegroundColor Cyan
Write-Host "  npx next dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 2:" -ForegroundColor White
Write-Host "  pnpm --filter @erp/web dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 3 (VS Code):" -ForegroundColor White
Write-Host "  1. Fermez VS Code" -ForegroundColor Gray
Write-Host "  2. code ." -ForegroundColor Cyan
Write-Host "  3. Appuyez sur F5" -ForegroundColor Cyan
Write-Host ""

Write-Host "🌐 L'application sera sur: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Si problème persiste, contactez le support avec cette sortie." -ForegroundColor Yellow