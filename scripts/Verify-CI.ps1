#!/usr/bin/env pwsh
# Script de vérification CI/CD TopSteel ERP
# Vérifie que la configuration est correcte

Write-Host "🔍 Vérification configuration CI/CD TopSteel ERP" -ForegroundColor Cyan

# Vérifier Node.js
$nodeVersion = node --version
Write-Host "Node.js local: $nodeVersion" -ForegroundColor Blue

if ($nodeVersion -match "v18\.1[8-9]\.|v18\.[2-9][0-9]\.|v[2-9][0-9]\.") {
    Write-Host "✅ Version Node.js compatible avec Next.js" -ForegroundColor Green
} else {
    Write-Host "⚠️ Version Node.js non compatible" -ForegroundColor Yellow
    Write-Host "Requis: 18.18.0+ ou 20.0.0+" -ForegroundColor Yellow
}

# Vérifier pnpm
$pnpmVersion = pnpm --version
Write-Host "pnpm: $pnpmVersion" -ForegroundColor Blue

# Test build local
Write-Host "
🧪 Test de build local..." -ForegroundColor Yellow
try {
    pnpm build --filter=@erp/config > $null
    pnpm build --filter=@erp/types > $null
    pnpm build --filter=@erp/utils > $null
    Write-Host "✅ Build des packages réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur de build" -ForegroundColor Red
}

# Test lint
Write-Host "
🔍 Test lint..." -ForegroundColor Yellow
try {
    pnpm lint > $null
    Write-Host "✅ Lint réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lint" -ForegroundColor Red
}

Write-Host "
🎯 Vérification terminée" -ForegroundColor Cyan
