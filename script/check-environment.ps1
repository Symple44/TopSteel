# scripts/check-environment.ps1
# Script de vérification complète de l'environnement ERP TopSteel

param(
    [switch]$Fix,
    [switch]$Verbose
)

# Configuration des couleurs
$colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorText($Text, $Color) {
    Write-Host $Text -ForegroundColor $colors[$Color]
}

function Write-Section($Title) {
    Write-Host "`n" + "="*60 -ForegroundColor $colors.Header
    Write-Host " $Title" -ForegroundColor $colors.Header
    Write-Host "="*60 -ForegroundColor $colors.Header
}

function Test-Command($Command) {
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Test-Port($Port) {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.ConnectAsync("localhost", $Port).Wait(1000)
        $isOpen = $connection.Connected
        $connection.Close()
        return $isOpen
    } catch {
        return $false
    }
}

function Get-PostgreSQLStatus() {
    # Vérifier si PostgreSQL est installé
    $pgInstalled = Test-Command "psql"
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    
    return @{
        Installed = $pgInstalled
        ServiceRunning = $pgService -and ($pgService.Status -eq "Running")
        Port5432Open = Test-Port 5432
    }
}

function Test-DatabaseConnection() {
    try {
        $env:PGPASSWORD = "postgres"
        $result = psql -h localhost -U postgres -d postgres -c "SELECT 1;" 2>$null
        return $result -match "1 row"
    } catch {
        return $false
    } finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Header principal
Clear-Host
Write-ColorText "🔍 VÉRIFICATION COMPLÈTE - ERP TOPSTEEL" "Header"
Write-ColorText "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Info"

# 1. STRUCTURE DU PROJET
Write-Section "📁 STRUCTURE DU PROJET"

$requiredFolders = @(
    "apps/web",
    "apps/api", 
    "apps/api/src/modules",
    "packages/ui",
    "packages/types",
    "packages/utils",
    "scripts"
)

$missingFolders = @()
foreach ($folder in $requiredFolders) {
    if (Test-Path $folder) {
        Write-ColorText "✅ $folder" "Success"
    } else {
        Write-ColorText "❌ $folder" "Error"
        $missingFolders += $folder
    }
}

# 2. FICHIERS CRITIQUES
Write-Section "📄 FICHIERS CRITIQUES"

$criticalFiles = @{
    "package.json" = "Configuration racine"
    "turbo.json" = "Configuration Turbo"
    "pnpm-lock.yaml" = "Lock file pnpm"
    "apps/web/package.json" = "Config app web"
    "apps/api/package.json" = "Config API"
    "apps/api/src/main.ts" = "Point d'entrée API"
    "apps/api/src/app.module.ts" = "Module principal"
    "apps/api/.env.local" = "Variables environnement API"
    "apps/web/.env.local" = "Variables environnement Web"
}

$missingFiles = @()
foreach ($file in $criticalFiles.Keys) {
    if (Test-Path $file) {
        Write-ColorText "✅ $($criticalFiles[$file]): $file" "Success"
    } else {
        Write-ColorText "❌ $($criticalFiles[$file]): $file" "Error"
        $missingFiles += $file
    }
}

# 3. OUTILS DÉVELOPPEMENT
Write-Section "🛠️ OUTILS DE DÉVELOPPEMENT"

$tools = @{
    "node" = "Node.js"
    "pnpm" = "pnpm"
    "git" = "Git"
    "code" = "VS Code"
}

$missingTools = @()
foreach ($tool in $tools.Keys) {
    if (Test-Command $tool) {
        $version = & $tool --version 2>$null
        Write-ColorText "✅ $($tools[$tool]): $version" "Success"
    } else {
        Write-ColorText "❌ $($tools[$tool]): Non installé" "Error"
        $missingTools += $tool
    }
}

# 4. POSTGRESQL
Write-Section "🗄️ POSTGRESQL"

$pgStatus = Get-PostgreSQLStatus

if ($pgStatus.Installed) {
    Write-ColorText "✅ PostgreSQL installé" "Success"
    
    if ($pgStatus.ServiceRunning) {
        Write-ColorText "✅ Service PostgreSQL en cours d'exécution" "Success"
    } else {
        Write-ColorText "⚠️ Service PostgreSQL arrêté" "Warning"
    }
    
    if ($pgStatus.Port5432Open) {
        Write-ColorText "✅ Port 5432 ouvert" "Success"
    } else {
        Write-ColorText "❌ Port 5432 fermé" "Error"
    }
    
    # Test de connexion à la base
    if (Test-DatabaseConnection) {
        Write-ColorText "✅ Connexion base de données OK" "Success"
    } else {
        Write-ColorText "❌ Impossible de se connecter à la base" "Error"
    }
} else {
    Write-ColorText "❌ PostgreSQL non installé" "Error"
}

# 5. DÉPENDANCES NODE
Write-Section "📦 DÉPENDANCES"

if (Test-Path "node_modules") {
    Write-ColorText "✅ node_modules présent" "Success"
    
    # Vérifier les dépendances critiques
    $criticalDeps = @("next", "react", "@nestjs/core", "typescript", "turbo")
    foreach ($dep in $criticalDeps) {
        $depPath = "node_modules/$dep"
        if (Test-Path $depPath) {
            Write-ColorText "✅ $dep installé" "Success"
        } else {
            Write-ColorText "❌ $dep manquant" "Error"
        }
    }
} else {
    Write-ColorText "❌ node_modules manquant" "Error"
}

# 6. PORTS DÉVELOPPEMENT
Write-Section "🌐 PORTS"

$devPorts = @{
    3000 = "Frontend (Next.js)"
    3001 = "API (NestJS)"
    5432 = "PostgreSQL"
    6379 = "Redis (optionnel)"
}

foreach ($port in $devPorts.Keys) {
    if (Test-Port $port) {
        Write-ColorText "⚠️ Port $port ($($devPorts[$port])): Occupé" "Warning"
    } else {
        Write-ColorText "✅ Port $port ($($devPorts[$port])): Libre" "Success"
    }
}

# 7. MODULES NESTJS
Write-Section "🏗️ MODULES NESTJS"

$nestjsModules = @(
    "apps/api/src/modules/users",
    "apps/api/src/modules/auth",
    "apps/api/src/modules/clients",
    "apps/api/src/modules/projets",
    "apps/api/src/common/decorators",
    "apps/api/src/common/guards"
)

foreach ($module in $nestjsModules) {
    if (Test-Path $module) {
        Write-ColorText "✅ $module" "Success"
    } else {
        Write-ColorText "❌ $module" "Error"
    }
}

# 8. RÉSUMÉ ET RECOMMANDATIONS
Write-Section "📊 RÉSUMÉ"

$totalIssues = $missingFolders.Count + $missingFiles.Count + $missingTools.Count

if ($totalIssues -eq 0 -and $pgStatus.Installed) {
    Write-ColorText "🎉 ENVIRONNEMENT PARFAITEMENT CONFIGURÉ !" "Success"
    Write-ColorText "Vous pouvez démarrer le développement avec: pnpm dev" "Info"
} else {
    Write-ColorText "⚠️ $totalIssues problème(s) détecté(s)" "Warning"
    
    Write-ColorText "`n📋 Actions recommandées:" "Info"
    
    if ($missingFolders.Count -gt 0) {
        Write-ColorText "• Créer les dossiers manquants" "Warning"
    }
    
    if ($missingFiles.Count -gt 0) {
        Write-ColorText "• Créer les fichiers manquants" "Warning"
    }
    
    if (-not $pgStatus.Installed) {
        Write-ColorText "• Installer PostgreSQL" "Warning"
    }
    
    if ("node_modules" -notin (Get-ChildItem -Name)) {
        Write-ColorText "• Exécuter: pnpm install" "Warning"
    }
    
    Write-ColorText "`n🚀 SOLUTION RAPIDE:" "Info"
    Write-ColorText "Exécutez la tâche VS Code: 'Setup Complet + PostgreSQL'" "Info"
}

# 9. OPTIONS DE RÉPARATION AUTOMATIQUE
if ($Fix -or $totalIssues -gt 0) {
    Write-Section "🔧 RÉPARATION AUTOMATIQUE"
    
    $response = Read-Host "Voulez-vous lancer la réparation automatique ? [O/n]"
    if ($response -eq "" -or $response -eq "O" -or $response -eq "o") {
        Write-ColorText "🚀 Lancement de la réparation automatique..." "Info"
        & "$PSScriptRoot/full-setup.ps1"
    }
}

Write-ColorText "`n✅ Vérification terminée à $(Get-Date -Format 'HH:mm:ss')" "Success"