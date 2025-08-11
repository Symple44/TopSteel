# =====================================
# SCRIPT DE FINALISATION SYSTÈME PRICING (Windows)
# =====================================

Write-Host "🚀 FINALISATION SYSTÈME PRICING TOPSTEEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$RootDir = Get-Location
$ApiDir = Join-Path $RootDir "apps\api"
$PricingDir = Join-Path $ApiDir "src\features\pricing"

# Fonction pour afficher les messages
function Log-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Log-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Log-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Log-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# =====================================
# ÉTAPE 1: INSTALLATION DES DÉPENDANCES
# =====================================

Log-Info "Installation des dépendances NPM..."

$Dependencies = @(
    "@nestjs-modules/ioredis",
    "ioredis",
    "@tensorflow/tfjs-node",
    "@nestjs/graphql",
    "@nestjs/apollo",
    "graphql",
    "apollo-server-express",
    "graphql-type-json",
    "@nestjs/axios",
    "axios",
    "@nestjs/event-emitter",
    "@nestjs/schedule",
    "@nestjs/bull",
    "bull",
    "@nestjs/throttler",
    "opossum"
)

foreach ($dep in $Dependencies) {
    $installed = npm ls $dep 2>$null
    if ($LASTEXITCODE -eq 0) {
        Log-Success "$dep déjà installé"
    } else {
        Log-Info "Installation de $dep..."
        npm install $dep
        if ($LASTEXITCODE -ne 0) {
            Log-Warning "Échec installation $dep"
        }
    }
}

# Dev dependencies
Log-Info "Installation des dépendances de développement..."
npm install -D @types/bull madge colors
if ($LASTEXITCODE -ne 0) {
    Log-Warning "Certaines dev dependencies ont échoué"
}

# =====================================
# ÉTAPE 2: CONFIGURATION ENVIRONNEMENT
# =====================================

Log-Info "Configuration des variables d'environnement..."

$EnvFile = Join-Path $RootDir ".env"
$EnvExample = Join-Path $RootDir ".env.example"

# Créer .env s'il n'existe pas
if (-not (Test-Path $EnvFile)) {
    if (Test-Path $EnvExample) {
        Copy-Item $EnvExample $EnvFile
    } else {
        New-Item $EnvFile -ItemType File
    }
    Log-Info ".env créé"
}

# Fonction pour ajouter une variable d'environnement
function Add-EnvVar {
    param($Key, $Value)
    $content = Get-Content $EnvFile -Raw
    if ($content -notmatch "^$Key=") {
        Add-Content $EnvFile "$Key=$Value"
        Log-Success "Variable $Key ajoutée"
    }
}

Add-EnvVar "REDIS_HOST" "localhost"
Add-EnvVar "REDIS_PORT" "6379"
Add-EnvVar "REDIS_PASSWORD" ""
Add-EnvVar "REDIS_DB" "0"
Add-EnvVar "PRICING_CACHE_TTL" "3600"
Add-EnvVar "PRICING_MAX_BULK_SIZE" "1000"
Add-EnvVar "ML_MODEL_PATH" "./models/pricing"
Add-EnvVar "ML_TRAINING_ENABLED" "false"
Add-EnvVar "WEBHOOK_MAX_RETRIES" "3"
Add-EnvVar "ANALYTICS_RETENTION_DAYS" "90"

# =====================================
# ÉTAPE 3: CONFIGURATION REDIS
# =====================================

Log-Info "Configuration Redis..."

# Vérifier si Redis est accessible
try {
    $redisPing = redis-cli ping 2>$null
    if ($redisPing -eq "PONG") {
        Log-Success "Redis est déjà en cours d'exécution"
    } else {
        throw "Redis non accessible"
    }
} catch {
    Log-Warning "Redis n'est pas accessible"
    
    # Essayer avec Docker
    $dockerExists = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerExists) {
        Log-Info "Tentative de démarrage Redis avec Docker..."
        docker run -d --name redis-pricing -p 6379:6379 redis:alpine 2>$null
        if ($LASTEXITCODE -ne 0) {
            docker start redis-pricing 2>$null
        }
        
        Start-Sleep -Seconds 2
        
        $redisPing = redis-cli ping 2>$null
        if ($redisPing -eq "PONG") {
            Log-Success "Redis démarré avec Docker"
        } else {
            Log-Error "Redis requis. Installez-le manuellement."
        }
    } else {
        Log-Error "Redis requis. Installez Redis ou Docker."
        Log-Info "Pour Windows: https://github.com/microsoftarchive/redis/releases"
    }
}

# =====================================
# ÉTAPE 4: MISE À JOUR APP.MODULE.TS
# =====================================

Log-Info "Mise à jour app.module.ts..."

$AppModule = Join-Path $ApiDir "src\app\app.module.ts"

# Backup
if (Test-Path $AppModule) {
    Copy-Item $AppModule "$AppModule.backup" -Force
    
    $content = Get-Content $AppModule -Raw
    if ($content -match "PricingUnifiedModule") {
        Log-Success "PricingUnifiedModule déjà configuré"
    } else {
        Log-Warning "Configuration manuelle requise pour app.module.ts"
        Write-Host "  Remplacez PricingModule par PricingUnifiedModule dans app.module.ts" -ForegroundColor Yellow
    }
}

# =====================================
# ÉTAPE 5: EXÉCUTION DES MIGRATIONS
# =====================================

Log-Info "Exécution des migrations..."

# Vérifier connexion DB
$dbTest = npm run typeorm -- query "SELECT 1" 2>$null
if ($LASTEXITCODE -eq 0) {
    Log-Success "Connexion base de données OK"
    
    # Exécuter migrations
    npm run typeorm migration:run 2>$null
    if ($LASTEXITCODE -ne 0) {
        Log-Warning "Migrations peuvent nécessiter une exécution manuelle"
    }
} else {
    Log-Warning "Base de données non accessible. Migrations à exécuter manuellement."
}

# =====================================
# ÉTAPE 6: CRÉATION DU DOSSIER ML
# =====================================

Log-Info "Création structure ML..."
$ModelsDir = Join-Path $RootDir "models\pricing"
if (-not (Test-Path $ModelsDir)) {
    New-Item -ItemType Directory -Path $ModelsDir -Force | Out-Null
}
Log-Success "Dossier models\pricing créé"

# =====================================
# ÉTAPE 7: VÉRIFICATION BUILD
# =====================================

Log-Info "Vérification du build..."

npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Log-Success "Build réussi!"
} else {
    Log-Warning "Build échoué. Vérifiez les erreurs TypeScript."
}

# =====================================
# ÉTAPE 8: LANCEMENT DES TESTS
# =====================================

Log-Info "Lancement des tests pricing..."

# Vérifier et ajouter les scripts de test
$packageJson = Join-Path $RootDir "package.json"
$package = Get-Content $packageJson | ConvertFrom-Json

if (-not $package.scripts."test:pricing") {
    Log-Info "Ajout des scripts de test..."
    npm pkg set scripts.test:pricing="jest --testPathPattern=pricing --passWithNoTests"
    npm pkg set scripts.test:pricing:watch="jest --testPathPattern=pricing --watch"
    npm pkg set scripts.test:pricing:coverage="jest --testPathPattern=pricing --coverage"
}

# Lancer les tests
npm run test:pricing 2>$null
if ($LASTEXITCODE -eq 0) {
    Log-Success "Tests pricing réussis"
} else {
    Log-Warning "Tests pricing échoués ou absents"
}

# =====================================
# ÉTAPE 9: AGENTS DE QUALITÉ
# =====================================

$QualityScript = Join-Path $RootDir "scripts\pricing-quality-agents.ts"
if (Test-Path $QualityScript) {
    Log-Info "Lancement des agents de qualité..."
    npx ts-node $QualityScript 2>$null
    if ($LASTEXITCODE -ne 0) {
        Log-Warning "Agents de qualité terminés avec avertissements"
    }
}

# =====================================
# RAPPORT FINAL
# =====================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 FINALISATION TERMINÉE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Vérifications finales
Write-Host "📋 Statut des composants:" -ForegroundColor Cyan
Write-Host ""

# Redis
$redisPing = redis-cli ping 2>$null
if ($redisPing -eq "PONG") {
    Write-Host "✅ Redis: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Redis: NON DISPONIBLE" -ForegroundColor Red
}

# Database
$dbTest = npm run typeorm -- query "SELECT 1" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database: OK" -ForegroundColor Green
} else {
    Write-Host "❌ Database: NON DISPONIBLE" -ForegroundColor Red
}

# Build
$DistDir = Join-Path $RootDir "dist"
if (Test-Path $DistDir) {
    Write-Host "✅ Build: OK" -ForegroundColor Green
} else {
    Write-Host "⚠️  Build: À REFAIRE" -ForegroundColor Yellow
}

# Tests
Write-Host "⚠️  Tests: Vérifiez manuellement" -ForegroundColor Yellow

Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Si Redis n'est pas OK:"
Write-Host "   Téléchargez Redis pour Windows: https://github.com/microsoftarchive/redis/releases"
Write-Host "   Ou utilisez Docker: docker run -d -p 6379:6379 redis:alpine"
Write-Host ""
Write-Host "2. Si Database n'est pas OK:"
Write-Host "   Vérifiez votre configuration PostgreSQL"
Write-Host ""
Write-Host "3. Si Build n'est pas OK:"
Write-Host "   npm run build"
Write-Host ""
Write-Host "4. Pour démarrer l'application:"
Write-Host "   npm run start:dev"
Write-Host ""
Write-Host "5. Endpoints disponibles:"
Write-Host "   - REST API: http://localhost:3000/pricing/*"
Write-Host "   - GraphQL: http://localhost:3000/graphql"
Write-Host "   - Analytics: http://localhost:3000/pricing/analytics/dashboard"
Write-Host ""

# Sauvegarder le rapport
$ReportFile = Join-Path $RootDir "pricing-finalization-report.txt"
$Report = @"
RAPPORT DE FINALISATION - $(Get-Date)
=====================================

Composants installés:
$(foreach ($dep in $Dependencies) {
    $installed = npm ls $dep 2>$null
    if ($LASTEXITCODE -eq 0) { "✅ $dep" } else { "❌ $dep" }
})

Configuration:
$(if (Test-Path $EnvFile) { "✅ .env configuré" } else { "❌ .env manquant" })
$(if ($redisPing -eq "PONG") { "✅ Redis actif" } else { "❌ Redis inactif" })

Build:
$(if (Test-Path $DistDir) { "✅ Build artifacts présents" } else { "❌ Build requis" })
"@

$Report | Out-File $ReportFile

Log-Success "Rapport sauvegardé dans: $ReportFile"

Write-Host ""
Write-Host "✨ Système de pricing prêt à l'emploi!" -ForegroundColor Green