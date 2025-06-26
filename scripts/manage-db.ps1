#!/usr/bin/env pwsh
# Script de gestion base de données ERP TopSteel
param(
    [Parameter(Mandatory)]
    [ValidateSet('status', 'backup', 'restore', 'reset', 'migrate', 'seed')]
    [string]$Action,
    [string]$File = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
)

$DBParams = @{
    Host = 'localhost'
    Port = '5432' 
    User = 'postgres'
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
        Write-Host "Sauvegarde vers $File..." -ForegroundColor Yellow
        $env:PGPASSWORD = $DBParams.Password
        pg_dump -h $DBParams.Host -p $DBParams.Port -U $DBParams.User $DBParams.Database > $File
        $env:PGPASSWORD = $null
        Write-Host "Sauvegarde terminée" -ForegroundColor Green
    }
    'restore' {
        Write-Host "Restauration depuis $File..." -ForegroundColor Yellow
        $env:PGPASSWORD = $DBParams.Password
        psql -h $DBParams.Host -p $DBParams.Port -U $DBParams.User -d $DBParams.Database < $File
        $env:PGPASSWORD = $null
        Write-Host "Restauration terminée" -ForegroundColor Green
    }
    'reset' {
        Write-Host "Remise à zéro..." -ForegroundColor Red
        $confirm = Read-Host "Confirmez avec 'RESET'"
        if ($confirm -eq 'RESET') {
            .\setup-erp.ps1 -Force -DBPassword $DBParams.Password
        }
    }
    'seed' {
        Write-Host "Ajout données de test..." -ForegroundColor Yellow
        # Logique pour ajouter des données de test
    }
}
