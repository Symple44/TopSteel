#!/usr/bin/env pwsh
# Script de restauration des backups

Write-Host "🔄 Restauration des fichiers originaux..." -ForegroundColor Yellow

if (Test-Path "packages/utils/src/index.ts.backup") {
    Copy-Item "packages/utils/src/index.ts.backup" "packages/utils/src/index.ts" -Force
    Write-Host "✅ @erp/utils restauré" -ForegroundColor Green
}

if (Test-Path "packages/types/src/index.ts.backup") {
    Copy-Item "packages/types/src/index.ts.backup" "packages/types/src/index.ts" -Force  
    Write-Host "✅ @erp/types restauré" -ForegroundColor Green
}

Write-Host "🎯 Restauration terminée" -ForegroundColor Cyan
