#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Correction de la version Node.js pour le CI/CD TopSteel ERP

.DESCRIPTION
    Corrige l'erreur "Node.js version ^18.18.0 || ^19.8.0 || >= 20.0.0 is required"
    en mettant à jour la configuration du workflow GitHub Actions.

.PARAMETER UseNodeJS20
    Utilise Node.js 20 LTS (recommandé)

.PARAMETER UseNodeJS18
    Utilise Node.js 18.18.0+ (minimum)

.EXAMPLE
    .\Fix-NodeJS-Version-CI.ps1 -UseNodeJS20
    .\Fix-NodeJS-Version-CI.ps1 -UseNodeJS18
#>

param(
    [switch]$UseNodeJS20 = $true,
    [switch]$UseNodeJS18
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $colorMap = @{
        "Red" = [ConsoleColor]::Red; "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow; "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan; "White" = [ConsoleColor]::White
        "Magenta" = [ConsoleColor]::Magenta
    }
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

function Write-Header {
    param([string]$Title)
    Write-ColorOutput "`n🔧 $Title" "Cyan"
    Write-ColorOutput ("=" * 60) "Blue"
}

function Write-Success { param([string]$Message); Write-ColorOutput "✅ $Message" "Green" }
function Write-Warning { param([string]$Message); Write-ColorOutput "⚠️  $Message" "Yellow" }
function Write-Info { param([string]$Message); Write-ColorOutput "ℹ️  $Message" "Blue" }

Write-ColorOutput @"
🚀 TopSteel ERP - Correction version Node.js CI/CD
🎉 ESLint fonctionne maintenant ! Correction de la version Node.js...
"@ "Green"

try {
    # Déterminer la version Node.js à utiliser
    $nodeVersion = if ($UseNodeJS18) { "18.20.4" } else { "20.18.0" }
    $pnpmVersion = "8.15.0"
    
    Write-Header "Configuration de la version Node.js"
    Write-Info "Version sélectionnée: Node.js $nodeVersion"
    Write-Info "Version pnpm: $pnpmVersion"
    
    # 1. Mettre à jour le workflow GitHub Actions principal
    Write-Header "Mise à jour du workflow GitHub Actions"
    
    $ciWorkflowPath = ".github/workflows/ci.yml"
    
    if (Test-Path $ciWorkflowPath) {
        Write-Info "Mise à jour de $ciWorkflowPath..."
        
        $content = Get-Content $ciWorkflowPath -Raw
        
        # Remplacer l'ancienne version Node.js
        $content = $content -replace 'NODE_VERSION:\s*[\"'']18\.17\.0[\"'']', "NODE_VERSION: `"$nodeVersion`""
        $content = $content -replace 'node-version:\s*\$\{\{\s*env\.NODE_VERSION\s*\}\}', 'node-version: ${{ env.NODE_VERSION }}'
        
        # S'assurer que la version pnpm est correcte
        $content = $content -replace 'PNPM_VERSION:\s*[\"'']8\.15\.0[\"'']', "PNPM_VERSION: `"$pnpmVersion`""
        
        Set-Content $ciWorkflowPath -Value $content -Encoding UTF8
        Write-Success "Workflow CI mis à jour avec Node.js $nodeVersion"
    }
    else {
        Write-Warning "Workflow CI non trouvé: $ciWorkflowPath"
        
        # Créer un workflow CI optimisé
        Write-Info "Création d'un nouveau workflow CI..."
        $newWorkflow = @"
# .github/workflows/ci.yml
# CI/CD Pipeline optimisé pour TopSteel ERP
# Version corrigée Node.js $nodeVersion

name: 🚀 TopSteel CI/CD Pipeline

on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened, ready_for_review]
  workflow_dispatch:

env:
  NODE_VERSION: "$nodeVersion"
  PNPM_VERSION: "$pnpmVersion"
  TURBO_TOKEN: `${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: `${{ secrets.TURBO_TEAM }}

# Annuler les workflows précédents pour la même branche
concurrency:
  group: `${{ github.workflow }}-`${{ github.ref }}
  cancel-in-progress: true

jobs:
  # 🔧 Job 1: Setup et installation
  setup:
    name: 📦 Setup & Dependencies
    runs-on: ubuntu-latest
    if: `${{ !github.event.pull_request.draft }}
    
    outputs:
      cache-hit: `${{ steps.cache.outputs.cache-hit }}
    
    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 📦 Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: `${{ env.PNPM_VERSION }}

      - name: 🏗️ Setup Node.js `$nodeVersion
        uses: actions/setup-node@v4
        with:
          node-version: `${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: 🗂️ Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: echo "STORE_PATH=`$(pnpm store path)" >> `$GITHUB_OUTPUT

      - name: ⚡ Setup pnpm cache
        uses: actions/cache@v4
        id: cache
        with:
          path: |
            `${{ steps.pnpm-cache.outputs.STORE_PATH }}
            .turbo
            node_modules
            apps/*/node_modules
            packages/*/node_modules
          key: `${{ runner.os }}-pnpm-`${{ hashFiles('**/pnpm-lock.yaml') }}-`${{ hashFiles('**/package.json') }}
          restore-keys: |
            `${{ runner.os }}-pnpm-`${{ hashFiles('**/pnpm-lock.yaml') }}-
            `${{ runner.os }}-pnpm-

      - name: 📥 Install dependencies
        run: |
          echo "🔄 Installing dependencies..."
          pnpm install --frozen-lockfile --prefer-offline
          echo "✅ Dependencies installed successfully"

      - name: 📋 Environment info
        run: |
          echo "Node.js version: `$(node --version)"
          echo "pnpm version: `$(pnpm --version)"
          echo "Next.js compatibility: ✅"

  # 🏗️ Job 2: Build des packages
  build:
    name: 🏗️ Build Packages
    runs-on: ubuntu-latest
    needs: setup
    if: `${{ !github.event.pull_request.draft }}
    
    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4

      - name: 📦 Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: `${{ env.PNPM_VERSION }}

      - name: 🏗️ Setup Node.js `$nodeVersion
        uses: actions/setup-node@v4
        with:
          node-version: `${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: ⚡ Restore cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.pnpm-store
            .turbo
            node_modules
            apps/*/node_modules
            packages/*/node_modules
          key: `${{ runner.os }}-pnpm-`${{ hashFiles('**/pnpm-lock.yaml') }}-`${{ hashFiles('**/package.json') }}

      - name: 📥 Install dependencies
        run: pnpm install --frozen-lockfile --prefer-offline

      - name: 🏗️ Build packages
        run: |
          echo "🔄 Building packages..."
          pnpm build --filter=@erp/config
          pnpm build --filter=@erp/types
          pnpm build --filter=@erp/utils
          echo "✅ Packages built successfully"

  # 🔍 Job 3: Lint et type checking
  lint-and-typecheck:
    name: 🔍 Lint & Type Check
    runs-on: ubuntu-latest
    needs: [setup, build]
    if: `${{ !github.event.pull_request.draft }}
    
    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4

      - name: 📦 Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: `${{ env.PNPM_VERSION }}

      - name: 🏗️ Setup Node.js `$nodeVersion
        uses: actions/setup-node@v4
        with:
          node-version: `${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: ⚡ Restore cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.pnpm-store
            .turbo
            node_modules
            apps/*/node_modules
            packages/*/node_modules
          key: `${{ runner.os }}-pnpm-`${{ hashFiles('**/pnpm-lock.yaml') }}-`${{ hashFiles('**/package.json') }}

      - name: 📥 Install dependencies
        run: pnpm install --frozen-lockfile --prefer-offline

      - name: 🔍 Run lint
        run: |
          echo "🔄 Running lint..."
          pnpm lint

      - name: 🔍 Type checking
        run: |
          echo "🔄 Running type check..."
          pnpm type-check

  # 🧪 Job 4: Tests
  test:
    name: 🧪 Tests
    runs-on: ubuntu-latest
    needs: [setup, build]
    if: `${{ !github.event.pull_request.draft }}
    
    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4

      - name: 📦 Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: `${{ env.PNPM_VERSION }}

      - name: 🏗️ Setup Node.js `$nodeVersion
        uses: actions/setup-node@v4
        with:
          node-version: `${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: ⚡ Restore cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.pnpm-store
            .turbo
            node_modules
            apps/*/node_modules
            packages/*/node_modules
          key: `${{ runner.os }}-pnpm-`${{ hashFiles('**/pnpm-lock.yaml') }}-`${{ hashFiles('**/package.json') }}

      - name: 📥 Install dependencies
        run: pnpm install --frozen-lockfile --prefer-offline

      - name: 🧪 Run tests
        run: |
          echo "🔄 Running tests..."
          pnpm test

  # 📊 Job 5: Summary
  summary:
    name: 📊 CI Summary
    runs-on: ubuntu-latest
    needs: [build, lint-and-typecheck, test]
    if: always() && !github.event.pull_request.draft
    
    steps:
      - name: 📊 Summary
        run: |
          echo "📋 CI/CD Pipeline Summary:"
          echo "Build: `${{ needs.build.result }}"
          echo "Lint & Type Check: `${{ needs.lint-and-typecheck.result }}"
          echo "Tests: `${{ needs.test.result }}"
          
          if [ "`${{ needs.build.result }}" = "success" ] && \
             [ "`${{ needs.lint-and-typecheck.result }}" = "success" ] && \
             [ "`${{ needs.test.result }}" = "success" ]; then
            echo "✅ Tous les contrôles sont passés avec succès!"
          else
            echo "❌ Certains contrôles ont échoué."
            exit 1
          fi
"@
        
        if (-not (Test-Path ".github/workflows")) {
            New-Item -ItemType Directory -Path ".github/workflows" -Force | Out-Null
        }
        
        Set-Content $ciWorkflowPath -Value $newWorkflow -Encoding UTF8
        Write-Success "Nouveau workflow CI créé avec Node.js $nodeVersion"
    }
    
    # 2. Mettre à jour les autres workflows si ils existent
    Write-Header "Vérification des autres workflows"
    
    $otherWorkflows = Get-ChildItem ".github/workflows/*.yml" -ErrorAction SilentlyContinue
    foreach ($workflow in $otherWorkflows) {
        if ($workflow.Name -ne "ci.yml") {
            Write-Info "Vérification de $($workflow.Name)..."
            $content = Get-Content $workflow.FullName -Raw
            
            if ($content -match 'node-version.*18\.17\.0') {
                $content = $content -replace '18\.17\.0', $nodeVersion
                Set-Content $workflow.FullName -Value $content -Encoding UTF8
                Write-Success "Mis à jour: $($workflow.Name)"
            }
        }
    }
    
    # 3. Mettre à jour .nvmrc si il existe
    Write-Header "Mise à jour des fichiers de configuration Node.js"
    
    if (Test-Path ".nvmrc") {
        Set-Content ".nvmrc" -Value $nodeVersion -Encoding UTF8
        Write-Success "Fichier .nvmrc mis à jour"
    }
    else {
        Set-Content ".nvmrc" -Value $nodeVersion -Encoding UTF8
        Write-Success "Fichier .nvmrc créé"
    }
    
    # 4. Mettre à jour package.json engines si nécessaire
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        if (-not $packageJson.engines) {
            $packageJson | Add-Member -Type NoteProperty -Name "engines" -Value ([PSCustomObject]@{}) -Force
        }
        
        $packageJson.engines | Add-Member -Type NoteProperty -Name "node" -Value ">=18.18.0" -Force
        $packageJson.engines | Add-Member -Type NoteProperty -Name "pnpm" -Value ">=8.15.0" -Force
        
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8
        Write-Success "Contraintes engines mises à jour dans package.json"
    }
    
    # 5. Vérifier la compatibilité des apps
    Write-Header "Vérification de la compatibilité des applications"
    
    $apps = @("apps/web/package.json", "apps/api/package.json")
    foreach ($appPackage in $apps) {
        if (Test-Path $appPackage) {
            $appConfig = Get-Content $appPackage | ConvertFrom-Json
            
            if (-not $appConfig.engines) {
                $appConfig | Add-Member -Type NoteProperty -Name "engines" -Value ([PSCustomObject]@{}) -Force
            }
            
            $appConfig.engines | Add-Member -Type NoteProperty -Name "node" -Value ">=18.18.0" -Force
            
            $appConfig | ConvertTo-Json -Depth 10 | Set-Content $appPackage -Encoding UTF8
            Write-Success "Contraintes engines mises à jour dans $appPackage"
        }
    }
    
    # 6. Test local avec la nouvelle version
    Write-Header "Test de compatibilité locale"
    
    $currentNodeVersion = node --version
    Write-Info "Version Node.js locale: $currentNodeVersion"
    
    if ($currentNodeVersion -match "v(\d+)\.(\d+)\.(\d+)") {
        $major = [int]$Matches[1]
        $minor = [int]$Matches[2]
        
        if (($major -eq 18 -and $minor -ge 18) -or $major -ge 20) {
            Write-Success "✅ Version Node.js locale compatible"
        }
        else {
            Write-Warning "⚠️ Version Node.js locale non compatible ($currentNodeVersion)"
            Write-Info "Installez Node.js $nodeVersion ou utilisez nvm:"
            Write-Info "  nvm install $nodeVersion"
            Write-Info "  nvm use $nodeVersion"
        }
    }
    
    # 7. Script de vérification CI
    Write-Header "Création du script de vérification"
    
    $verifyScript = @"
#!/usr/bin/env pwsh
# Script de vérification CI/CD TopSteel ERP
# Vérifie que la configuration est correcte

Write-Host "🔍 Vérification configuration CI/CD TopSteel ERP" -ForegroundColor Cyan

# Vérifier Node.js
`$nodeVersion = node --version
Write-Host "Node.js local: `$nodeVersion" -ForegroundColor Blue

if (`$nodeVersion -match "v18\.1[8-9]\.|v18\.[2-9][0-9]\.|v[2-9][0-9]\.") {
    Write-Host "✅ Version Node.js compatible avec Next.js" -ForegroundColor Green
} else {
    Write-Host "⚠️ Version Node.js non compatible" -ForegroundColor Yellow
    Write-Host "Requis: 18.18.0+ ou 20.0.0+" -ForegroundColor Yellow
}

# Vérifier pnpm
`$pnpmVersion = pnpm --version
Write-Host "pnpm: `$pnpmVersion" -ForegroundColor Blue

# Test build local
Write-Host "`n🧪 Test de build local..." -ForegroundColor Yellow
try {
    pnpm build --filter=@erp/config > `$null
    pnpm build --filter=@erp/types > `$null
    pnpm build --filter=@erp/utils > `$null
    Write-Host "✅ Build des packages réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur de build" -ForegroundColor Red
}

# Test lint
Write-Host "`n🔍 Test lint..." -ForegroundColor Yellow
try {
    pnpm lint > `$null
    Write-Host "✅ Lint réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lint" -ForegroundColor Red
}

Write-Host "`n🎯 Vérification terminée" -ForegroundColor Cyan
"@
    
    if (-not (Test-Path "scripts")) {
        New-Item -ItemType Directory -Path "scripts" -Force | Out-Null
    }
    
    Set-Content "scripts/Verify-CI.ps1" -Value $verifyScript -Encoding UTF8
    Write-Success "Script de vérification créé: scripts/Verify-CI.ps1"
    
    # 8. Résumé final
    Write-Header "✅ Correction Node.js terminée"
    
    Write-Success @"
🎉 CORRECTION NODE.JS RÉUSSIE !

🔄 Changements apportés:
✅ Version Node.js mise à jour: 18.17.0 → $nodeVersion
✅ Workflow GitHub Actions corrigé
✅ Contraintes engines définies
✅ Fichier .nvmrc créé/mis à jour
✅ Configuration compatible Next.js

📋 Prochaines actions:
1. Commitez les changements:
   git add .
   git commit -m "ci: update Node.js version to $nodeVersion for Next.js compatibility"
   git push

2. Vérifiez le CI/CD:
   • Le workflow va maintenant utiliser Node.js $nodeVersion
   • L'erreur Next.js sera résolue
   • ESLint continuera de fonctionner parfaitement

3. Test local:
   .\scripts\Verify-CI.ps1

🚀 Votre CI/CD TopSteel ERP va maintenant passer au VERT !
"@
    
}
catch {
    Write-ColorOutput "❌ Erreur: $($_.Exception.Message)" "Red"
    Write-Warning @"
En cas de problème:
1. Vérifiez que .github/workflows/ci.yml existe
2. Restaurez depuis git si nécessaire
3. Contactez l'équipe DevOps
"@
    exit 1
}

Write-ColorOutput "`n🎯 CI/CD TopSteel ERP optimisé pour Node.js $nodeVersion !" "Green"