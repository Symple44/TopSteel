#!/usr/bin/env pwsh
# Script de maintenance ESLint pour TopSteel ERP
# Utilisation: .\Maintain-ESLint.ps1

Write-Host "🔧 Maintenance ESLint TopSteel ERP" -ForegroundColor Cyan

# Test ESLint
Write-Host "🧪 Test ESLint..." -ForegroundColor Yellow
pnpm lint

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ESLint OK!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Problèmes ESLint détectés" -ForegroundColor Yellow
    
    # Correction automatique
    Write-Host "🔧 Tentative de correction automatique..." -ForegroundColor Blue
    pnpm lint:fix
    
    # Re-test
    pnpm lint
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Problèmes corrigés automatiquement!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Corrections manuelles nécessaires" -ForegroundColor Yellow
    }
}

Write-Host "🎯 Maintenance terminée" -ForegroundColor Cyan
