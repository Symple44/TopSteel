#!/usr/bin/env pwsh
# Script de gestion base de données ERP TopSteel (VERSION CORRIGÉE)
param(
    [Parameter(Mandatory)]
    [ValidateSet('status', 'backup', 'restore', 'reset', 'migrate', 'seed')]
    [string]$Action,
    [string]$File = ""
)

$DBParams = @{
    Host     = 'localhost'
    Port     = '5432' 
    User     = 'postgres'
    Password = 'postgres'
    Database = 'erp_topsteel'
}

switch ($Action) {
    'status' {
        Write-Host "État base 'erp_topsteel':" -ForegroundColor Cyan
        $env:PGPASSWORD = $DBParams.Password
        psql -h $DBParams.Host -p $DBParams.Port -U $DBParams.User -d $DBParams.Database -c "\dt"
        $env:PGPASSWORD = $null
    }
    'backup' {
        # Créer le dossier sql/backups s'il n'existe pas
        if (-not (Test-Path "sql/backups")) {
            New-Item -ItemType Directory -Path "sql/backups" -Force | Out-Null
            Write-Host "📁 Dossier sql/backups créé" -ForegroundColor Blue
        }
        
        # Générer le nom de fichier avec chemin complet
        if ($File -eq "") {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $File = "sql/backups/backup_$timestamp.sql"
        }
        else {
            # Si un fichier est spécifié, s'assurer qu'il va dans sql/backups
            if (-not $File.StartsWith("sql/backups/")) {
                $File = "sql/backups/$File"
            }
        }
        
        Write-Host "💾 Sauvegarde vers $File..." -ForegroundColor Yellow
        $env:PGPASSWORD = $DBParams.Password
        pg_dump -h $DBParams.Host -p $DBParams.Port -U $DBParams.User $DBParams.Database > $File
        $env:PGPASSWORD = $null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Sauvegarde terminée avec succès" -ForegroundColor Green
            Write-Host "📄 Fichier: $File" -ForegroundColor Cyan
            
            # Afficher la taille du fichier
            if (Test-Path $File) {
                $fileSize = [math]::Round((Get-Item $File).length / 1KB, 2)
                Write-Host "📊 Taille: $fileSize KB" -ForegroundColor Cyan
            }
        }
        else {
            Write-Host "❌ Erreur lors de la sauvegarde" -ForegroundColor Red
        }
    }
    'restore' {
        if ($File -eq "") {
            Write-Host "❌ Spécifiez un fichier: pwsh scripts/manage-db.ps1 restore -File nom_fichier.sql" -ForegroundColor Red
            
            # Lister les sauvegardes disponibles
            if (Test-Path "sql/backups") {
                $backups = Get-ChildItem "sql/backups/*.sql" | Sort-Object LastWriteTime -Descending
                if ($backups.Count -gt 0) {
                    Write-Host "💡 Sauvegardes disponibles:" -ForegroundColor Blue
                    $backups | ForEach-Object {
                        Write-Host "   - $($_.Name)" -ForegroundColor White
                    }
                }
            }
            return
        }
        
        # Ajouter le chemin sql/backups si nécessaire
        if (-not $File.Contains("/") -and -not $File.Contains("\")) {
            $File = "sql/backups/$File"
        }
        
        Write-Host "📥 Restauration depuis $File..." -ForegroundColor Yellow
        
        # Vérifier que le fichier existe
        if (-not (Test-Path $File)) {
            Write-Host "❌ Fichier '$File' introuvable" -ForegroundColor Red
            return
        }
        
        $env:PGPASSWORD = $DBParams.Password
        # Utiliser -f au lieu de < (corrigé)
        psql -h $DBParams.Host -p $DBParams.Port -U $DBParams.User -d $DBParams.Database -f $File
        $env:PGPASSWORD = $null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Restauration terminée avec succès" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Erreur lors de la restauration" -ForegroundColor Red
        }
    }
    'reset' {
        Write-Host "⚠️ ATTENTION: Remise à zéro complète de la base de données!" -ForegroundColor Red
        Write-Host "Ceci supprimera TOUTES les données existantes." -ForegroundColor Yellow
        $confirm = Read-Host "Tapez 'RESET' pour confirmer (ou Enter pour annuler)"
        
        if ($confirm -eq 'RESET') {
            Write-Host "🔄 Reset de la base de données..." -ForegroundColor Yellow
            
            # Créer une sauvegarde automatique avant reset
            $backupFile = "sql/backups/backup_before_reset_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
            if (-not (Test-Path "sql/backups")) {
                New-Item -ItemType Directory -Path "sql/backups" -Force | Out-Null
            }
            
            Write-Host "💾 Sauvegarde automatique avant reset..." -ForegroundColor Blue
            $env:PGPASSWORD = $DBParams.Password
            pg_dump -h $DBParams.Host -p $DBParams.Port -U $DBParams.User $DBParams.Database > $backupFile
            Write-Host "✅ Sauvegarde: $backupFile" -ForegroundColor Green
            
            # Supprimer et recréer la base
            psql -h $DBParams.Host -p $DBParams.Port -U $DBParams.User -d postgres -c "DROP DATABASE IF EXISTS $($DBParams.Database);"
            psql -h $DBParams.Host -p $DBParams.Port -U $DBParams.User -d postgres -c "CREATE DATABASE $($DBParams.Database);"
            
            $env:PGPASSWORD = $null
            
            Write-Host "✅ Base de données reset terminé" -ForegroundColor Green
            Write-Host "💡 Relancez 'pnpm sql:full-setup && pnpm sql:seed-data' pour recréer le schéma" -ForegroundColor Blue
        }
        else {
            Write-Host "❌ Reset annulé" -ForegroundColor Yellow
        }
    }
    'migrate' {
        Write-Host "🔄 Exécution des migrations..." -ForegroundColor Yellow
        Push-Location "apps/api"
        try {
            npx typeorm migration:run
            Write-Host "✅ Migrations terminées" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Erreur dans les migrations" -ForegroundColor Red
        }
        Pop-Location
    }
    'seed' {
        Write-Host "🌱 Ajout données de test..." -ForegroundColor Yellow
        $env:PGPASSWORD = $DBParams.Password
        
        # Vérifier si le fichier de seed existe
        if (Test-Path "sql/seeds/01-sample-data.sql") {
            psql -h $DBParams.Host -p $DBParams.Port -U $DBParams.User -d $DBParams.Database -f "sql/seeds/01-sample-data.sql"
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Données de test ajoutées" -ForegroundColor Green
            }
            else {
                Write-Host "❌ Erreur lors de l'ajout des données" -ForegroundColor Red
            }
        }
        else {
            Write-Host "⚠️ Fichier sql/seeds/01-sample-data.sql introuvable" -ForegroundColor Yellow
        }
        
        $env:PGPASSWORD = $null
    }
}

# Nettoyer les variables d'environnement
$env:PGPASSWORD = $null