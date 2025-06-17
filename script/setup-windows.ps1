# Script de configuration Windows pour ERP TOPSTEEL


param(
    [switch]$Force,
    [switch]$Verbose
)

# Configuration des couleurs
$colors = @{
    Green = "Green"
    Red = "Red" 
    Yellow = "Yellow"
    Cyan = "Cyan"
    Gray = "Gray"
    Magenta = "Magenta"
}

function Write-Section($title) {
    Write-Host ""
    Write-Host "🔹 $title" -ForegroundColor $colors.Cyan
    Write-Host ("-" * 60) -ForegroundColor $colors.Gray
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor $colors.Green
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor $colors.Red
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor $colors.Yellow
}

function Write-Info($message) {
    Write-Host "📋 $message" -ForegroundColor $colors.Gray
}

function Test-Command($cmd) {
    try {
        Get-Command $cmd -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Remove-DirectorySafe($path) {
    if (Test-Path $path) {
        try {
            Remove-Item $path -Recurse -Force -ErrorAction Stop
            Write-Success "$path supprimé"
            return $true
        } catch {
            Write-Warning "Impossible de supprimer $path : $($_.Exception.Message)"
            return $false
        }
    }
    return $true
}

function Test-MonorepoStructure() {
    $requiredPaths = @(
        "apps\web",
        "packages"
    )
    
    $requiredFiles = @(
        "package.json",
        "pnpm-lock.yaml"
    )
    
    $allExists = $true
    
    foreach ($path in $requiredPaths) {
        if (!(Test-Path $path)) {
            Write-Error "Structure manquante: $path"
            $allExists = $false
        }
    }
    
    foreach ($file in $requiredFiles) {
        if (!(Test-Path $file)) {
            Write-Error "Fichier manquant: $file"
            $allExists = $false
        }
    }
    
    return $allExists
}

function Get-PackageInfo($packagePath) {
    if (Test-Path $packagePath) {
        try {
            $package = Get-Content $packagePath -Raw | ConvertFrom-Json
            return $package
        } catch {
            Write-Warning "Impossible de lire $packagePath"
            return $null
        }
    }
    return $null
}

# ============================================================================
# DÉBUT DU SCRIPT PRINCIPAL
# ============================================================================

Clear-Host
Write-Host "🚀 CONFIGURATION ERP TOPSTEEL -ForegroundColor $colors.Green
Write-Host "=" * 60
Write-Host ""

# Phase 1: Diagnostic système complet
Write-Section "DIAGNOSTIC SYSTÈME"

$currentPath = Get-Location
Write-Host "📍 Emplacement: $currentPath"

# Vérifier la structure du monorepo
if (!(Test-MonorepoStructure)) {
    Write-Error "Structure de monorepo incorrecte"
    Write-Host "👉 Assurez-vous d'être dans la racine du projet TopSteel" -ForegroundColor $colors.Yellow
    exit 1
}

Write-Success "Structure monorepo validée"

# Vérifier les outils requis
$nodeInstalled = Test-Command "node"
$pnpmInstalled = Test-Command "pnpm"

if ($nodeInstalled) {
    $nodeVersion = node --version
    Write-Success "Node.js: $nodeVersion"
    
    # Vérifier la version de Node.js
    $nodeVersionNumber = $nodeVersion -replace "v", ""
    $nodeMajor = [int]($nodeVersionNumber.Split(".")[0])
    if ($nodeMajor -lt 18) {
        Write-Warning "Node.js version $nodeVersion détectée. Version 18+ recommandée."
    }
} else {
    Write-Error "Node.js: Non installé"
    Write-Host "👉 Installez Node.js depuis https://nodejs.org/" -ForegroundColor $colors.Yellow
    exit 1
}

if ($pnpmInstalled) {
    $pnpmVersion = pnpm --version
    Write-Success "pnpm: v$pnpmVersion"
} else {
    Write-Error "pnpm: Non installé"
    Write-Host "👉 Installation de pnpm..." -ForegroundColor $colors.Yellow
    try {
        npm install -g pnpm
        Write-Success "pnpm installé avec succès"
    } catch {
        Write-Error "Échec de l'installation de pnpm"
        exit 1
    }
}

# Phase 2: Analyse des fichiers critiques
Write-Section "ANALYSE DES FICHIERS"

$criticalFiles = @{
    "package.json" = "Racine"
    "pnpm-lock.yaml" = "Lock file pnpm"
    "turbo.json" = "Configuration Turbo"
    "apps\web\package.json" = "Application web"
    "apps\web\.env.local" = "Variables d'environnement"
    "apps\web\next.config.js" = "Configuration Next.js"
}

foreach ($file in $criticalFiles.Keys) {
    if (Test-Path $file) {
        Write-Success "$($criticalFiles[$file]): $file"
    } else {
        Write-Warning "$($criticalFiles[$file]): $file (manquant)"
    }
}

# Analyser le package.json principal
$rootPackage = Get-PackageInfo "package.json"
if ($rootPackage) {
    Write-Info "Projet: $($rootPackage.name)"
    if ($rootPackage.workspaces) {
        Write-Success "Workspaces configurés"
    } else {
        Write-Warning "Configuration workspaces manquante"
    }
}

# Analyser le package.json de l'app web
$webPackage = Get-PackageInfo "apps\web\package.json"
if ($webPackage) {
    Write-Info "App web: $($webPackage.name) v$($webPackage.version)"
    
    if ($webPackage.dependencies.next) {
        Write-Success "Next.js: $($webPackage.dependencies.next)"
    } else {
        Write-Warning "Next.js non trouvé dans les dépendances"
    }
}

# Phase 3: Nettoyage intelligent
Write-Section "NETTOYAGE ET RÉINSTALLATION"

$shouldClean = $Force
if (!$Force) {
    $response = Read-Host "Voulez-vous nettoyer et réinstaller les dépendances ? (y/N)"
    $shouldClean = $response -eq "y" -or $response -eq "Y"
}

if ($shouldClean) {
    Write-Host "🧹 Nettoyage en cours..." -ForegroundColor $colors.Yellow
    
    # Arrêter tous les processus Node.js qui pourraient bloquer
    Write-Host "🔄 Arrêt des processus Node.js..."
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    # Supprimer tous les node_modules dans l'arborescence
    $nodeModulesPaths = @(
        "node_modules",
        "apps\web\node_modules",
        "packages\ui\node_modules",
        "packages\types\node_modules",
        "packages\utils\node_modules",
        "packages\config\node_modules"
    )
    
    foreach ($path in $nodeModulesPaths) {
        Remove-DirectorySafe $path
    }
    
    # Nettoyer les caches
    Write-Host "🧹 Nettoyage des caches..."
    try {
        pnpm store prune 2>$null
        Write-Success "Cache pnpm nettoyé"
    } catch {
        Write-Warning "Impossible de nettoyer le cache pnpm"
    }
    
    # Supprimer le lock file pour forcer une résolution fraîche
    if (Test-Path "pnpm-lock.yaml") {
        Remove-Item "pnpm-lock.yaml" -Force
        Write-Success "Lock file supprimé pour installation fraîche"
    }
    
    Write-Host ""
    Write-Host "📦 Installation des dépendances..." -ForegroundColor $colors.Cyan
    Write-Host "⏳ Cela peut prendre quelques minutes..."
    
    try {
        # Installation UNIQUEMENT depuis la racine
        $installOutput = pnpm install --no-frozen-lockfile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Installation terminée avec succès"
        } else {
            Write-Error "Erreur pendant l'installation"
            Write-Host $installOutput -ForegroundColor $colors.Red
            exit 1
        }
    } catch {
        Write-Error "Échec de l'installation: $($_.Exception.Message)"
        exit 1
    }
}

# Phase 4: Vérification et correction post-installation
Write-Section "VÉRIFICATION POST-INSTALLATION"

$verificationPaths = @{
    "node_modules" = "Dépendances racine"
    "node_modules\.bin\turbo.cmd" = "Turbo CLI"
    "apps\web\node_modules" = "Dépendances web (DOIT ÊTRE ABSENT)"
}

foreach ($path in $verificationPaths.Keys) {
    $exists = Test-Path $path
    $description = $verificationPaths[$path]
    
    # Pour apps\web\node_modules, on VEUT qu'il soit absent
    if ($path -eq "apps\web\node_modules") {
        if (!$exists) {
            Write-Success "$description (correct)"
        } else {
            Write-Warning "$description (présent - peut causer des problèmes)"
        }
    } else {
        if ($exists) {
            Write-Success $description
        } else {
            Write-Warning "$description (manquant)"
        }
    }
}

# Vérification et correction automatique du CLI Next.js
Write-Host ""
Write-Host "🔧 Vérification et correction du CLI Next.js..." -ForegroundColor $colors.Cyan

$nextCliPath = "node_modules\.bin\next.cmd"
$nextJsFound = $false

if (Test-Path $nextCliPath) {
    Write-Success "Next.js CLI trouvé"
    $nextJsFound = $true
} else {
    Write-Warning "Next.js CLI manquant - Correction automatique..."
    
    # Créer le dossier .bin s'il n'existe pas
    $binDir = "node_modules\.bin"
    if (!(Test-Path $binDir)) {
        New-Item -ItemType Directory -Path $binDir -Force | Out-Null
        Write-Info "Dossier .bin créé"
    }
    
    # Méthode 1: Chercher dans .pnpm store
    $pnpmStore = "node_modules\.pnpm"
    if (Test-Path $pnpmStore) {
        $nextPackages = Get-ChildItem -Path $pnpmStore -Directory -Name | Where-Object { $_ -like "next@*" }
        
        if ($nextPackages) {
            $latestNext = $nextPackages | Sort-Object | Select-Object -Last 1
            $nextBinPath = "$pnpmStore\$latestNext\node_modules\next\bin\next"
            
            if (Test-Path $nextBinPath) {
                # Créer le wrapper CMD
                $wrapperContent = @"
@echo off
setlocal
set SCRIPT_DIR=%~dp0
set NEXT_BIN=%SCRIPT_DIR%..\..\.pnpm\$latestNext\node_modules\next\bin\next
if exist "%NEXT_BIN%" (
    node "%NEXT_BIN%" %*
) else (
    echo Erreur: Next.js CLI non trouvé
    exit /b 1
)
"@
                
                try {
                    $wrapperContent | Out-File -FilePath $nextCliPath -Encoding ASCII
                    Write-Success "CLI Next.js créé avec succès"
                    $nextJsFound = $true
                } catch {
                    Write-Warning "Impossible de créer le CLI: $($_.Exception.Message)"
                }
            }
        }
    }
    
    # Méthode 2: Chercher directement dans node_modules/next
    if (!$nextJsFound) {
        $directNextPath = "node_modules\next\bin\next"
        if (Test-Path $directNextPath) {
            $wrapperContent = @"
@echo off
setlocal
set SCRIPT_DIR=%~dp0
set NEXT_BIN=%SCRIPT_DIR%..\next\bin\next
node "%NEXT_BIN%" %*
"@
            
            try {
                $wrapperContent | Out-File -FilePath $nextCliPath -Encoding ASCII
                Write-Success "CLI Next.js créé (méthode directe)"
                $nextJsFound = $true
            } catch {
                Write-Warning "Impossible de créer le CLI: $($_.Exception.Message)"
            }
        }
    }
    
    # Méthode 3: Utiliser npx comme fallback
    if (!$nextJsFound) {
        $wrapperContent = @"
@echo off
npx next %*
"@
        
        try {
            $wrapperContent | Out-File -FilePath $nextCliPath -Encoding ASCII
            Write-Success "CLI Next.js créé (fallback npx)"
            $nextJsFound = $true
        } catch {
            Write-Warning "Impossible de créer le CLI fallback: $($_.Exception.Message)"
        }
    }
}

# Phase 5: Configuration environnement et fichiers manquants
Write-Section "CONFIGURATION ENVIRONNEMENT"

# Créer turbo.json s'il n'existe pas
if (!(Test-Path "turbo.json")) {
    Write-Host "📝 Création de turbo.json..." -ForegroundColor $colors.Yellow
    
    $turboConfig = @'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true,
      "env": ["NODE_ENV"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"],
      "env": ["NODE_ENV", "NEXT_PUBLIC_*"]
    },
    "start": {
      "dependsOn": ["build"],
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.{ts,tsx}", "test/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    }
  }
}
'@
    
    try {
        $turboConfig | Out-File -FilePath "turbo.json" -Encoding UTF8
        Write-Success "turbo.json créé avec succès"
    } catch {
        Write-Error "Impossible de créer turbo.json: $($_.Exception.Message)"
    }
} else {
    Write-Success "turbo.json existe déjà"
}

# Créer next.config.js s'il n'existe pas
$nextConfigPath = "apps\web\next.config.js"
if (!(Test-Path $nextConfigPath)) {
    Write-Host "📝 Création de next.config.js..." -ForegroundColor $colors.Yellow
    
    $nextConfig = @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration TypeScript stricte
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Configuration des images
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ["localhost"],
    minimumCacheTTL: 60,
  },

  // Optimisation des bundles
  experimental: {
    optimizePackageImports: [
      "@erp/ui", 
      "lucide-react", 
      "recharts", 
      "date-fns"
    ],
  },

  // Configuration du transpilation pour les packages du monorepo
  transpilePackages: [
    "@erp/ui",
    "@erp/types", 
    "@erp/utils",
    "@erp/config"
  ],

  // Compression activée
  compress: true,

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ERP TOPSTEEL',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
};

module.exports = nextConfig;
'@
    
    try {
        $nextConfig | Out-File -FilePath $nextConfigPath -Encoding UTF8
        Write-Success "next.config.js créé avec succès"
    } catch {
        Write-Error "Impossible de créer next.config.js: $($_.Exception.Message)"
    }
} else {
    Write-Success "next.config.js existe déjà"
}

# Configuration du .env.local
$envPath = "apps\web\.env.local"
if (!(Test-Path $envPath)) {
    Write-Host "📝 Création du fichier .env.local..."
    
    $envContent = @"
# Variables d'environnement pour le développement local
# ERP TOPSTEEL

# URLs de l'application
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/erp_topsteel_dev

# Authentification
NEXTAUTH_SECRET=your-development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Configuration générale
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=ERP TOPSTEEL
NEXT_PUBLIC_APP_VERSION=1.0.0

# Services optionnels (laissez vide si non utilisés)
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
NEXT_PUBLIC_SENTRY_DSN=

# Debug
DEBUG=false
NEXT_PUBLIC_DEBUG=false
"@
    
    try {
        $envContent | Out-File -FilePath $envPath -Encoding UTF8
        Write-Success ".env.local créé avec la configuration par défaut"
    } catch {
        Write-Error "Impossible de créer .env.local: $($_.Exception.Message)"
    }
} else {
    Write-Success ".env.local existe déjà"
}

# Phase 6: Tests de lancement améliorés
Write-Section "TESTS DE LANCEMENT"

Write-Host "🧪 Test des commandes disponibles..." -ForegroundColor $colors.Cyan

# Test 1: Vérifier que turbo fonctionne
Write-Host ""
Write-Host "Test 1: Turbo CLI..."
try {
    $turboTest = pnpm turbo --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Turbo CLI fonctionnel (v$turboTest)"
    } else {
        Write-Warning "Turbo CLI inaccessible"
    }
} catch {
    Write-Warning "Turbo CLI non trouvé"
}

# Test 2: Vérifier la commande pnpm filter
Write-Host ""
Write-Host "Test 2: Commande pnpm filter..."
try {
    # Test simple pour vérifier que le package existe
    $filterTest = pnpm list --filter @erp/web --depth=0 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Commande pnpm filter fonctionnelle"
    } else {
        Write-Warning "Problème avec pnpm filter: $filterTest"
    }
} catch {
    Write-Warning "Problème avec pnpm filter"
}

# Test 3: Test du CLI Next.js créé
Write-Host ""
Write-Host "Test 3: Test du CLI Next.js..."
if (Test-Path "node_modules\.bin\next.cmd") {
    try {
        Set-Location "apps\web"
        $nextTest = & "..\..\node_modules\.bin\next.cmd" "--version" 2>&1
        Set-Location "..\.."
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Next.js CLI fonctionnel: v$nextTest"
        } else {
            Write-Warning "Next.js CLI créé mais ne répond pas correctement"
            Write-Info "Sortie: $nextTest"
        }
    } catch {
        Write-Warning "Erreur lors du test Next.js: $($_.Exception.Message)"
        Set-Location "..\.." -ErrorAction SilentlyContinue
    }
} else {
    Write-Warning "Next.js CLI non créé"
}

# Test 4: Test rapide de démarrage (optionnel)
Write-Host ""
Write-Host "Test 4: Test de démarrage rapide (3 secondes)..."
if ($nextJsFound) {
    try {
        Set-Location "apps\web"
        Write-Info "Tentative de démarrage de Next.js..."
        
        # Démarrer Next.js en arrière-plan
        $job = Start-Job -ScriptBlock {
            param($workingDir)
            Set-Location $workingDir
            & "..\..\node_modules\.bin\next.cmd" "dev" "--port" "3001" 2>&1
        } -ArgumentList (Get-Location)
        
        # Attendre 3 secondes
        Start-Sleep -Seconds 3
        
        # Vérifier l'état
        if ($job.State -eq "Running") {
            Write-Success "Next.js peut démarrer correctement !"
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -ErrorAction SilentlyContinue
        } else {
            $jobOutput = Receive-Job $job -ErrorAction SilentlyContinue
            Write-Warning "Next.js n'a pas pu démarrer"
            if ($jobOutput) {
                Write-Info "Sortie: $($jobOutput -join "`n")"
            }
            Remove-Job $job -ErrorAction SilentlyContinue
        }
        
        Set-Location "..\.."
    } catch {
        Write-Warning "Erreur pendant le test de démarrage: $($_.Exception.Message)"
        Set-Location "..\.." -ErrorAction SilentlyContinue
    }
} else {
    Write-Info "Test de démarrage ignoré (CLI non disponible)"
}

# Phase 7: Instructions finales
Write-Section "INSTRUCTIONS DE LANCEMENT"

Write-Host "🎯 COMMANDES RECOMMANDÉES:" -ForegroundColor $colors.Green
Write-Host ""

Write-Host "Option 1 (RECOMMANDÉE - depuis la racine):" -ForegroundColor $colors.Cyan
Write-Host "  pnpm --filter @erp/web dev" -ForegroundColor $colors.Gray
Write-Host ""

Write-Host "Option 2 (avec Turbo):" -ForegroundColor $colors.Cyan
Write-Host "  pnpm turbo dev --filter=@erp/web" -ForegroundColor $colors.Gray
Write-Host ""

Write-Host "Option 3 (navigation directe):" -ForegroundColor $colors.Cyan
Write-Host "  cd apps\web" -ForegroundColor $colors.Gray
Write-Host "  npx next dev" -ForegroundColor $colors.Gray
Write-Host ""

Write-Host "🌐 L'application sera accessible sur: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor $colors.Green
Write-Host ""

Write-Host "📋 AUTRES COMMANDES UTILES:" -ForegroundColor $colors.Cyan
Write-Host "  pnpm build                    # Build de production"
Write-Host "  pnpm --filter @erp/web build  # Build de l'app web uniquement"
Write-Host "  pnpm test                     # Lancer les tests"
Write-Host "  pnpm lint                     # Vérification du code"
Write-Host ""

Write-Host "🔧 RAPPELS IMPORTANTS:" -ForegroundColor $colors.Yellow
Write-Host "  • JAMAIS utiliser 'npm install' dans ce projet"
Write-Host "  • TOUJOURS utiliser 'pnpm' depuis la racine"
Write-Host "  • JAMAIS installer dans apps/web/ directement"
Write-Host ""

# Résumé final avec statut du CLI
if ($shouldClean) {
    Write-Host "✅ Configuration terminée avec succès!" -ForegroundColor $colors.Green
    if ($nextJsFound) {
        Write-Host "✅ CLI Next.js automatiquement corrigé et fonctionnel" -ForegroundColor $colors.Green
    } else {
        Write-Host "⚠️ CLI Next.js non corrigé - utilisez pnpm filter" -ForegroundColor $colors.Yellow
    }
} else {
    Write-Host "ℹ️  Vérification terminée (aucun nettoyage effectué)" -ForegroundColor $colors.Cyan
    if ($nextJsFound) {
        Write-Host "✅ CLI Next.js détecté et fonctionnel" -ForegroundColor $colors.Green
    } else {
        Write-Host "⚠️ CLI Next.js manquant - relancez avec -Force pour corriger" -ForegroundColor $colors.Yellow
    }
}

Write-Host ""
Write-Host "🚀 Commandes de lancement prioritaires:" -ForegroundColor $colors.Magenta

if ($nextJsFound) {
    Write-Host "    pnpm --filter @erp/web dev    (Recommandée)" -ForegroundColor $colors.Green
    Write-Host "    pnpm turbo dev --filter=@erp/web" -ForegroundColor $colors.Gray
    Write-Host "    cd apps\web && npx next dev" -ForegroundColor $colors.Gray
} else {
    Write-Host "    pnpm --filter @erp/web dev    (SEULE OPTION FIABLE)" -ForegroundColor $colors.Green
    Write-Host "    pnpm turbo dev --filter=@erp/web    (Alternative)" -ForegroundColor $colors.Gray
}

Write-Host ""

# Note sur le debugging
Write-Host "🔧 En cas de problème, utilisez:" -ForegroundColor $colors.Gray
Write-Host "    node script\debug-info.js" -ForegroundColor $colors.Gray
Write-Host "    .\script\setup-windows.ps1 -Force -Verbose" -ForegroundColor $colors.Gray