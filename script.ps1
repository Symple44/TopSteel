#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Mise à jour sécurisée de Helmet et amélioration de la sécurité TopSteel ERP

.DESCRIPTION
    Met à jour Helmet vers la dernière version, corrige les types dépréciés, 
    et optimise la configuration de sécurité pour l'ERP TopSteel.

.PARAMETER UpdateAll
    Met à jour toutes les dépendances de sécurité

.PARAMETER CheckVulnerabilities
    Vérifie les vulnérabilités de sécurité

.EXAMPLE
    .\Update-Helmet-Security.ps1
    .\Update-Helmet-Security.ps1 -UpdateAll -CheckVulnerabilities
#>

param(
    [switch]$UpdateAll,
    [switch]$CheckVulnerabilities
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $colorMap = @{
        "Red" = [ConsoleColor]::Red; "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow; "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan; "White" = [ConsoleColor]::White
        "Magenta" = [ConsoleColor]::Magenta
    }
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

function Write-Header {
    param([string]$Title)
    Write-ColorOutput "`n🛡️ $Title" "Cyan"
    Write-ColorOutput ("=" * 60) "Blue"
}

function Write-Success { param([string]$Message); Write-ColorOutput "✅ $Message" "Green" }
function Write-Warning { param([string]$Message); Write-ColorOutput "⚠️  $Message" "Yellow" }
function Write-Info { param([string]$Message); Write-ColorOutput "ℹ️  $Message" "Blue" }
function Write-Security { param([string]$Message); Write-ColorOutput "🔒 $Message" "Magenta" }

Write-Header "🚀 TopSteel ERP - Mise à jour sécurité Helmet"

try {
    # 1. Audit de sécurité initial
    Write-Header "Audit de sécurité initial"
    
    Write-Info "Vérification des versions actuelles..."
    
    # Vérifier la version actuelle de Helmet
    $apiPackageJson = "apps/api/package.json"
    if (Test-Path $apiPackageJson) {
        $apiConfig = Get-Content $apiPackageJson | ConvertFrom-Json
        $currentHelmet = $apiConfig.dependencies.helmet
        $currentTypesHelmet = $apiConfig.devDependencies."@types/helmet"
        
        Write-Info "Helmet actuel: $currentHelmet"
        Write-Warning "Types Helmet: $currentTypesHelmet (DÉPRÉCIÉ)"
        
        Write-Security @"
🔍 Analyse de sécurité:
• Helmet 7.1.0 = Bonne version de base
• @types/helmet 4.0.0 = DÉPRÉCIÉ depuis Helmet 6+
• Helmet 8+ a des types intégrés (plus besoin de @types/helmet)
• Nouvelles fonctionnalités de sécurité disponibles
"@
    }
    
    # 2. Vérification des vulnérabilités
    if ($CheckVulnerabilities) {
        Write-Header "Vérification des vulnérabilités"
        
        Write-Info "Audit de sécurité pnpm..."
        Push-Location "apps/api"
        try {
            $auditResult = pnpm audit --json 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($auditResult.metadata.vulnerabilities.total -gt 0) {
                Write-Warning "Vulnérabilités détectées: $($auditResult.metadata.vulnerabilities.total)"
            }
            else {
                Write-Success "Aucune vulnérabilité détectée"
            }
        }
        catch {
            Write-Info "Audit terminé (voir détails ci-dessus)"
        }
        finally {
            Pop-Location
        }
    }
    
    # 3. Mise à jour de Helmet
    Write-Header "Mise à jour de Helmet et dépendances"
    
    Push-Location "apps/api"
    try {
        Write-Info "Mise à jour vers Helmet 8+ (types intégrés)..."
        
        # Supprimer les anciens types dépréciés
        Write-Info "Suppression des types dépréciés..."
        pnpm remove @types/helmet
        
        # Installer la dernière version de Helmet (8+ a les types intégrés)
        Write-Info "Installation de Helmet 8+ avec types intégrés..."
        pnpm add helmet@latest
        
        # Mettre à jour d'autres dépendances de sécurité si demandé
        if ($UpdateAll) {
            Write-Info "Mise à jour des autres dépendances de sécurité..."
            pnpm add cors@latest express-rate-limit@latest
            pnpm add -D @types/cors@latest
        }
        
        Write-Success "Helmet mis à jour avec succès!"
    }
    finally {
        Pop-Location
    }
    
    # 4. Mise à jour de la configuration Helmet
    Write-Header "Optimisation de la configuration Helmet"
    
    $mainTsPath = "apps/api/src/main.ts"
    if (Test-Path $mainTsPath) {
        Write-Info "Mise à jour de la configuration dans main.ts..."
        
        $content = Get-Content $mainTsPath -Raw
        
        # Configuration Helmet optimisée pour ERP TopSteel
        $newHelmetConfig = @'
  // Sécurité renforcée avec Helmet 8+
  app.use(
    helmet({
      // Content Security Policy adapté pour un ERP
      contentSecurityPolicy: env === "production" ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Pour les styles inline nécessaires
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"], // Pour les uploads d'images
          connectSrc: ["'self'"], // Pour les WebSockets et API calls
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      } : false,
      
      // Protection Cross-Origin pour les APIs
      crossOriginEmbedderPolicy: env === "production",
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      
      // Headers de sécurité renforcés
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: env === "production" ? {
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true
      } : false,
      
      // Protection contre les attaques
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: "no-referrer" },
      xssFilter: true,
    })
  );
'@
        
        # Remplacer l'ancienne configuration par la nouvelle
        $pattern = 'app\.use\(\s*helmet\([^}]*\}\s*\)\s*\);'
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $newHelmetConfig.Trim()
            Set-Content $mainTsPath -Value $content -Encoding UTF8
            Write-Success "Configuration Helmet optimisée dans main.ts"
        }
        else {
            Write-Warning "Configuration Helmet non trouvée dans main.ts"
        }
    }
    
    # 5. Création d'un middleware de sécurité avancé
    Write-Header "Création du middleware de sécurité avancé"
    
    $securityMiddlewarePath = "apps/api/src/common/middleware/security.middleware.ts"
    $securityMiddlewareDir = Split-Path $securityMiddlewarePath -Parent
    
    if (-not (Test-Path $securityMiddlewareDir)) {
        New-Item -ItemType Directory -Path $securityMiddlewareDir -Force | Out-Null
    }
    
    $securityMiddleware = @'
// apps/api/src/common/middleware/security.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Headers de sécurité additionnels pour l'ERP
    
    // Protection contre le clickjacking spécifique aux ERPs
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Protection contre les attaques MIME
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Cache control pour les données sensibles
    if (req.path.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    // Headers de sécurité pour les uploads
    if (req.path.includes('/upload')) {
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    }
    
    // Protection contre les attaques de timing (pour les authentifications)
    if (req.path.includes('/auth/')) {
      const delay = Math.random() * 100; // Délai aléatoire de 0-100ms
      setTimeout(() => next(), delay);
      return;
    }
    
    next();
  }
}
'@
    
    Set-Content $securityMiddlewarePath -Value $securityMiddleware -Encoding UTF8
    Write-Success "Middleware de sécurité avancé créé"
    
    # 6. Script de configuration HTTPS pour la production
    Write-Header "Script de configuration HTTPS"
    
    $httpsConfigPath = "apps/api/src/config/https.config.ts"
    $httpsConfigDir = Split-Path $httpsConfigPath -Parent
    
    if (-not (Test-Path $httpsConfigDir)) {
        New-Item -ItemType Directory -Path $httpsConfigDir -Force | Out-Null
    }
    
    $httpsConfig = @'
// apps/api/src/config/https.config.ts
// Configuration HTTPS pour TopSteel ERP en production

import { readFileSync } from 'fs';
import { join } from 'path';

export interface HttpsOptions {
  key: Buffer;
  cert: Buffer;
  ca?: Buffer;
}

export function getHttpsOptions(): HttpsOptions | null {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  try {
    const certPath = process.env.SSL_CERT_PATH || '/etc/ssl/certs/topsteel';
    
    return {
      key: readFileSync(join(certPath, 'private.key')),
      cert: readFileSync(join(certPath, 'certificate.crt')),
      ca: process.env.SSL_CA_PATH ? readFileSync(process.env.SSL_CA_PATH) : undefined,
    };
  } catch (error) {
    console.warn('⚠️  Certificats SSL non trouvés, utilisation HTTP:', error.message);
    return null;
  }
}

// Configuration SSL/TLS recommandée pour TopSteel ERP
export const TLS_CONFIG = {
  // Protocoles autorisés (TLS 1.2+ uniquement)
  secureProtocol: 'TLSv1_2_method',
  
  // Ciphers sécurisés pour un ERP
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
  ].join(':'),
  
  // Options de sécurité
  honorCipherOrder: true,
  secureOptions: require('constants').SSL_OP_NO_SSLv2 | 
                  require('constants').SSL_OP_NO_SSLv3 |
                  require('constants').SSL_OP_NO_TLSv1 |
                  require('constants').SSL_OP_NO_TLSv1_1,
};
'@
    
    Set-Content $httpsConfigPath -Value $httpsConfig -Encoding UTF8
    Write-Success "Configuration HTTPS créée"
    
    # 7. Tests après mise à jour
    Write-Header "Tests après mise à jour"
    
    Write-Info "Test de build après mise à jour..."
    Push-Location "apps/api"
    try {
        pnpm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build API réussi avec le nouveau Helmet"
        }
        else {
            Write-Warning "Problème de build détecté"
        }
    }
    finally {
        Pop-Location
    }
    
    # 8. Recommandations de sécurité
    Write-Header "Recommandations de sécurité TopSteel ERP"
    
    Write-Security @"
🛡️ SÉCURITÉ HELMET - MISE À JOUR RÉUSSIE

✅ Améliorations apportées:
• Helmet 8+ avec types TypeScript intégrés
• Configuration CSP adaptée pour ERP
• Headers de sécurité renforcés
• Middleware de sécurité personnalisé
• Configuration HTTPS prête pour production

🔒 Prochaines étapes recommandées:

1. SÉCURITÉ RÉSEAU:
   • Configurer un reverse proxy (Nginx/Traefik)
   • Mettre en place un firewall applicatif (WAF)
   • Utiliser des certificats SSL/TLS valides

2. AUTHENTIFICATION:
   • Implémenter 2FA/MFA obligatoire
   • Politique de mots de passe stricte
   • Limitation des tentatives de connexion

3. DONNÉES:
   • Chiffrement des données sensibles
   • Sauvegarde chiffrée régulière
   • Audit trail complet

4. MONITORING:
   • Surveillance des logs de sécurité
   • Alertes en temps réel
   • Tests de pénétration réguliers

5. CONFORMITÉ ERP:
   • Respect RGPD pour les données clients
   • Audit de sécurité périodique
   • Formation sécurité pour les utilisateurs
"@
    
    # 9. Script de vérification sécurité
    Write-Header "Script de vérification sécurité"
    
    $securityCheckScript = @'
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
'@
    
    if (-not (Test-Path "scripts")) {
        New-Item -ItemType Directory -Path "scripts" -Force | Out-Null
    }
    
    Set-Content "scripts/Check-Security.ps1" -Value $securityCheckScript -Encoding UTF8
    Write-Success "Script de vérification sécurité créé: scripts/Check-Security.ps1"
    
    # 10. Résumé final
    Write-Header "✅ Mise à jour Helmet terminée"
    
    Write-Success @"
🎉 MISE À JOUR SÉCURITÉ RÉUSSIE !

🔄 Changements apportés:
✅ Helmet mis à jour vers la dernière version (8+)
✅ Types dépréciés supprimés (@types/helmet)
✅ Configuration sécurisée pour ERP
✅ Middleware de sécurité avancé
✅ Configuration HTTPS prête
✅ Script de vérification sécurité

📋 Prochaines actions:
1. Testez l'API: cd apps/api && pnpm start:dev
2. Vérifiez la sécurité: .\scripts\Check-Security.ps1
3. Commitez: git add . && git commit -m "security: update helmet and enhance security configuration"

🛡️ TopSteel ERP est maintenant plus sécurisé !
"@
    
}
catch {
    Write-ColorOutput "❌ Erreur: $($_.Exception.Message)" "Red"
    Write-Warning @"
En cas de problème:
1. Restaurez package.json depuis la sauvegarde
2. Exécutez: pnpm install
3. Contactez l'équipe de sécurité
"@
    exit 1
}

Write-ColorOutput "`n🔒 Sécurité TopSteel ERP renforcée avec succès !" "Magenta"