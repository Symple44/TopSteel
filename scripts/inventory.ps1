#!/usr/bin/env pwsh
# =========================================================================
# ERP TOPSTEEL - INVENTAIRE COMPLET DU PROJET
# =========================================================================

Clear-Host
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "                    INVENTAIRE COMPLET ERP TOPSTEEL" -ForegroundColor Cyan
Write-Host "                        $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

# SCRIPTS PACKAGE.JSON
Write-Host "`n🔧 SCRIPTS DISPONIBLES (pnpm run [script]):" -ForegroundColor Yellow
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    $scripts = $pkg.scripts.PSObject.Properties | Sort-Object Name
    
    $categories = @{
        "🚀 Développement" = @("dev*", "start*")
        "🏗️ Build & Test" = @("build", "lint*", "test*", "type-check", "format")
        "🗄️ Base de données" = @("db:*", "sql:*", "migration:*", "seed:*")
        "🧹 Maintenance" = @("clean*", "reset", "audit", "deps:*", "security:*")
        "⚙️ Setup & Tools" = @("setup*", "tools:*", "env:*")
    }
    
    foreach ($category in $categories.GetEnumerator()) {
        Write-Host "`n  $($category.Key):" -ForegroundColor Cyan
        foreach ($script in $scripts) {
            foreach ($pattern in $category.Value) {
                if ($script.Name -like $pattern -or $script.Name -eq $pattern.TrimEnd('*')) {
                    Write-Host "    pnpm $($script.Name)" -ForegroundColor White
                    break
                }
            }
        }
    }
}

# TÂCHES VS CODE
Write-Host "`n🎯 TÂCHES VS CODE (Ctrl+Shift+P > Tasks):" -ForegroundColor Yellow
if (Test-Path ".vscode/tasks.json") {
    $tasks = Get-Content ".vscode/tasks.json" | ConvertFrom-Json
    $tasksByCategory = @{}
    
    foreach ($task in $tasks.tasks) {
        $icon = if ($task.label -match "^([🔧🚀🏗️🗄️💾🔄📊🧹📋])") { $Matches[1] } else { "⚙️" }
        if (-not $tasksByCategory[$icon]) { $tasksByCategory[$icon] = @() }
        $tasksByCategory[$icon] += $task.label
    }
    
    foreach ($category in $tasksByCategory.GetEnumerator()) {
        Write-Host "`n  $($category.Key) Catégorie:" -ForegroundColor Cyan
        foreach ($taskName in $category.Value) {
            Write-Host "    $taskName" -ForegroundColor White
        }
    }
    
    Write-Host "`n  📊 Total: $($tasks.tasks.Count) tâches disponibles" -ForegroundColor Green
} else {
    Write-Host "  ❌ Aucune tâche VS Code configurée" -ForegroundColor Red
}

# STRUCTURE SQL
Write-Host "`n🗄️ STRUCTURE SQL CENTRALISÉE:" -ForegroundColor Yellow
if (Test-Path "sql") {
    $sqlDirs = Get-ChildItem "sql" -Directory | Sort-Object Name
    foreach ($dir in $sqlDirs) {
        Write-Host "  📁 sql/$($dir.Name)/" -ForegroundColor Cyan
        $files = Get-ChildItem $dir.FullName -Filter "*.sql" | Sort-Object Name
        foreach ($file in $files) {
            Write-Host "    • $($file.Name)" -ForegroundColor White
        }
    }
    
    Write-Host "`n  💡 Utilisation:" -ForegroundColor Blue
    Write-Host "    pnpm sql:full-with-data  # Setup complet avec données" -ForegroundColor White
    Write-Host "    pnpm sql:schema          # Schéma uniquement" -ForegroundColor White
    Write-Host "    pnpm sql:backup          # Sauvegarde" -ForegroundColor White
} else {
    Write-Host "  ❌ Structure SQL non créée" -ForegroundColor Red
}

# OUTILS ET DÉPENDANCES
Write-Host "`n🛠️ OUTILS SYSTÈME:" -ForegroundColor Yellow
$tools = @{
    "node" = "Node.js"
    "pnpm" = "Package Manager"
    "git" = "Version Control"
    "psql" = "PostgreSQL Client"
    "code" = "VS Code"
}

foreach ($tool in $tools.GetEnumerator()) {
    try {
        $version = & $tool.Key --version 2>$null | Select-Object -First 1
        Write-Host "  ✅ $($tool.Value): $version" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $($tool.Value): Non trouvé" -ForegroundColor Red
    }
}

# STATUT BASE DE DONNÉES
Write-Host "`n🗄️ STATUT BASE DE DONNÉES:" -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"
try {
    $dbStatus = psql -h localhost -U postgres -d erp_topsteel -c "\dt" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Base 'erp_topsteel' accessible" -ForegroundColor Green
        $tableCount = psql -h localhost -U postgres -d erp_topsteel -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
        Write-Host "  📊 Tables: $($tableCount.Trim())" -ForegroundColor Cyan
    } else {
        Write-Host "  ❌ Base 'erp_topsteel' inaccessible" -ForegroundColor Red
        Write-Host "    💡 Lancez: pnpm sql:full-with-data" -ForegroundColor Blue
    }
} catch {
    Write-Host "  ❌ PostgreSQL non accessible" -ForegroundColor Red
    Write-Host "    💡 Vérifiez que PostgreSQL est démarré" -ForegroundColor Blue
}
$env:PGPASSWORD = $null

# AIDE RAPIDE
Write-Host "`n🆘 AIDE RAPIDE:" -ForegroundColor Yellow
Write-Host "  📖 Documentation complète:" -ForegroundColor Cyan
Write-Host "    README.md, docs/" -ForegroundColor White
Write-Host "`n  🚀 Démarrage rapide:" -ForegroundColor Cyan
Write-Host "    pnpm dev                 # Démarre les serveurs" -ForegroundColor White
Write-Host "    pnpm sql:status          # État de la DB" -ForegroundColor White
Write-Host "    pnpm tools:inventory     # Cet inventaire" -ForegroundColor White
Write-Host "`n  🎯 VS Code:" -ForegroundColor Cyan
Write-Host "    Ctrl+Shift+P > Tasks     # Liste des tâches" -ForegroundColor White
Write-Host "    F1 > Tasks: Run Build    # Tâche par défaut" -ForegroundColor White

Write-Host "`n===============================================================================" -ForegroundColor Cyan
Write-Host "                    FIN DE L'INVENTAIRE" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
