#!/usr/bin/env pwsh
# Script de vérification sécurité TopSteel ERP
# Usage: .\Check-Security.ps1

Write-Host "🛡️ Vérification sécurité TopSteel ERP" -ForegroundColor Cyan

# 1. Vérifier les dépendances
Write-Host "`n📦 Audit des dépendances..." -ForegroundColor Yellow
cd apps/api
pnpm audit

# 2. Vérifier les headers de sécurité (si le serveur tourne)
Write-Host "`n🔍 Test des headers de sécurité..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method HEAD -ErrorAction SilentlyContinue
    if ($response.Headers["X-Frame-Options"]) {
        Write-Host "✅ X-Frame-Options configuré" -ForegroundColor Green
    }
    if ($response.Headers["Content-Security-Policy"]) {
        Write-Host "✅ CSP configuré" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Serveur non accessible pour les tests" -ForegroundColor Yellow
}

# 3. Vérifier les certificats SSL (en production)
if ($env:NODE_ENV -eq "production") {
    Write-Host "`n🔐 Vérification SSL..." -ForegroundColor Yellow
    if (Test-Path "/etc/ssl/certs/topsteel") {
        Write-Host "✅ Certificats SSL trouvés" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Certificats SSL manquants" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Vérification terminée" -ForegroundColor Green
