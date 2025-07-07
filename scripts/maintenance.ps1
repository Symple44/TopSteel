#!/usr/bin/env pwsh
# TopSteel Maintenance Script

param([switch]$Quick)

Write-Host "🔧 Maintenance TopSteel ERP" -ForegroundColor Cyan

if (-not $Quick) {
    # Vérification complète
    Write-Host "📊 Audit des dépendances..."
    pnpm audit --audit-level moderate
    
    Write-Host "🧹 Nettoyage des caches..."
    pnpm clean:cache
    
    Write-Host "📦 Vérification des packages outdated..."
    pnpm deps:outdated
}

Write-Host "✅ Maintenance terminée" -ForegroundColor Green
