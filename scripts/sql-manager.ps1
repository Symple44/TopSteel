#!/usr/bin/env pwsh
# =========================================================================
# ERP TOPSTEEL - GESTIONNAIRE SQL CENTRALISÉ
# =========================================================================

param(
    [Parameter(Mandatory)]
    [ValidateSet('status', 'schema', 'indexes', 'triggers', 'views', 'seed', 'backup', 'restore', 'reset', 'full', 'maintenance')]
    [string]$Action,
    [string]$File = "",
    [string]$DBHost = "localhost",
    [string]$DBUser = "postgres", 
    [string]$DBName = "erp_topsteel",
    [string]$DBPassword = "postgres"
)

$env:PGPASSWORD = $DBPassword

function Execute-SQL {
    param([string]$SqlFile, [string]$Description)
    
    if (-not (Test-Path $SqlFile)) {
        Write-Host "❌ Fichier introuvable: $SqlFile" -ForegroundColor Red
        return $false
    }
    
    Write-Host "🔄 Exécution: $Description..." -ForegroundColor Yellow
    $result = psql -h $DBHost -U $DBUser -d $DBName -f $SqlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $Description terminé" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Erreur dans $Description" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        return $false
    }
}

switch ($Action) {
    'status' {
        Write-Host "📊 État de la base '$DBName':" -ForegroundColor Cyan
        psql -h $DBHost -U $DBUser -d $DBName -c "\dt"
        psql -h $DBHost -U $DBUser -d $DBName -c "SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname = 'public';"
    }
    'schema' {
        Execute-SQL "sql/schemas/01-main-schema.sql" "Création du schéma"
    }
    'indexes' {
        Execute-SQL "sql/indexes/01-performance-indexes.sql" "Création des index"
    }
    'triggers' {
        Execute-SQL "sql/triggers/01-audit-triggers.sql" "Création des triggers"
    }
    'views' {
        Execute-SQL "sql/views/01-business-views.sql" "Création des vues"
    }
    'seed' {
        Execute-SQL "sql/seeds/01-sample-data.sql" "Chargement des données de test"
    }
    'full' {
        Write-Host "🚀 Setup complet de la base de données..." -ForegroundColor Cyan
        $success = $true
        $success = $success -and (Execute-SQL "sql/schemas/01-main-schema.sql" "Schéma principal")
        $success = $success -and (Execute-SQL "sql/indexes/01-performance-indexes.sql" "Index de performance")
        $success = $success -and (Execute-SQL "sql/triggers/01-audit-triggers.sql" "Triggers d'audit")
        $success = $success -and (Execute-SQL "sql/views/01-business-views.sql" "Vues métier")
        $success = $success -and (Execute-SQL "sql/seeds/01-sample-data.sql" "Données de test")
        
        if ($success) {
            Write-Host "🎉 Setup complet terminé avec succès!" -ForegroundColor Green
        }
    }
    'backup' {
        $backupFile = if ($File) { $File } else { "sql/backups/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql" }
        Write-Host "💾 Sauvegarde vers $backupFile..." -ForegroundColor Yellow
        
        if (-not (Test-Path "sql/backups")) {
            New-Item -ItemType Directory -Path "sql/backups" -Force | Out-Null
        }
        
        pg_dump -h $DBHost -U $DBUser $DBName > $backupFile
        Write-Host "✅ Sauvegarde terminée" -ForegroundColor Green
    }
    'restore' {
        if (-not $File) {
            Write-Host "❌ Spécifiez un fichier: -File backup.sql" -ForegroundColor Red
            exit 1
        }
        Write-Host "📥 Restauration depuis $File..." -ForegroundColor Yellow
        psql -h $DBHost -U $DBUser -d $DBName < $File
        Write-Host "✅ Restauration terminée" -ForegroundColor Green
    }
    'reset' {
        Write-Host "⚠️ ATTENTION: Ceci va supprimer toutes les données!" -ForegroundColor Red
        $confirm = Read-Host "Tapez 'RESET' pour confirmer"
        if ($confirm -eq 'RESET') {
            Write-Host "🔄 Reset de la base de données..." -ForegroundColor Yellow
            psql -h $DBHost -U $DBUser -d postgres -c "DROP DATABASE IF EXISTS $DBName; CREATE DATABASE $DBName;"
            
            # Re-setup complet
            & $PSCommandPath -Action full -DBHost $DBHost -DBUser $DBUser -DBName $DBName -DBPassword $DBPassword
        }
    }
    'maintenance' {
        Execute-SQL "sql/maintenance/01-cleanup-scripts.sql" "Scripts de maintenance"
    }
}

$env:PGPASSWORD = $null
