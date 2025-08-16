#!/usr/bin/env pwsh
# Script de vérification sécurité TopSteel ERP - Version complète
# Usage: .\Check-Security.ps1 [-DetailedReport] [-ExportResults]
# Compatible avec le système de sécurité continue

param(
    [switch]$DetailedReport = $false,
    [switch]$ExportResults = $false,
    [string]$OutputPath = "security-report-windows.json"
)

# Variables globales
$SecurityIssues = 0
$Warnings = 0
$InfoItems = 0
$Results = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Platform = "Windows"
    Issues = @()
    Warnings = @()
    Success = @()
}

# Fonctions utilitaires
function Write-SecurityInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
    $script:InfoItems++
    if ($DetailedReport) { $Results.Success += $Message }
}

function Write-SecurityWarning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    $script:Warnings++
    $Results.Warnings += $Message
}

function Write-SecurityError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    $script:SecurityIssues++
    $Results.Issues += $Message
}

function Write-SecuritySuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
    if ($DetailedReport) { $Results.Success += $Message }
}

# Header
Write-Host @"

    ================================
      TopSteel Security Check
      Windows PowerShell Edition
    ================================

"@ -ForegroundColor Cyan

Write-SecurityInfo "Démarrage de la vérification sécurité TopSteel ERP"
Write-SecurityInfo "Plateforme: Windows PowerShell $($PSVersionTable.PSVersion)"

# 1. Vérification des permissions de fichiers
Write-Host "`n📁 Vérification des permissions de fichiers..." -ForegroundColor Yellow

$SensitivePatterns = @("*.env*", "*.key", "*.pem", "*.p12", "*.pfx", "*secret*", "*password*")

foreach ($Pattern in $SensitivePatterns) {
    $Files = Get-ChildItem -Recurse -Filter $Pattern -File -ErrorAction SilentlyContinue
    foreach ($File in $Files) {
        Write-SecurityWarning "Fichier sensible détecté: $($File.FullName)"
        
        # Vérifier les permissions (Windows ACL)
        try {
            $Acl = Get-Acl $File.FullName -ErrorAction SilentlyContinue
            $EveryoneAccess = $Acl.Access | Where-Object { $_.IdentityReference -eq "Everyone" }
            if ($EveryoneAccess) {
                Write-SecurityError "Fichier sensible accessible à 'Everyone': $($File.FullName)"
            }
        } catch {
            Write-SecurityWarning "Impossible de vérifier les permissions pour: $($File.FullName)"
        }
    }
}

# 2. Audit des dépendances
Write-Host "`n📦 Audit des dépendances..." -ForegroundColor Yellow

$PackageJsonFiles = Get-ChildItem -Recurse -Name "package.json" | Where-Object { $_ -notmatch "node_modules" }

foreach ($PackageJson in $PackageJsonFiles) {
    $Directory = Split-Path $PackageJson -Parent
    if ($Directory -eq "") { $Directory = "." }
    
    Write-SecurityInfo "Audit de $PackageJson"
    
    try {
        Push-Location $Directory
        
        # Vérifier si pnpm est disponible
        if (Get-Command pnpm -ErrorAction SilentlyContinue) {
            $AuditResult = pnpm audit --json 2>&1 | Out-String
            if ($AuditResult -match "vulnerabilities") {
                $VulnCount = ([regex]::Matches($AuditResult, "high|critical")).Count
                if ($VulnCount -gt 0) {
                    Write-SecurityError "Vulnérabilités trouvées dans $PackageJson ($VulnCount)"
                } else {
                    Write-SecuritySuccess "Aucune vulnérabilité critique dans $PackageJson"
                }
            }
        } elseif (Get-Command npm -ErrorAction SilentlyContinue) {
            npm audit --audit-level moderate --json | Out-String | ForEach-Object {
                if ($_ -match '"vulnerabilities"') {
                    Write-SecurityWarning "Vulnérabilités potentielles dans $PackageJson"
                }
            }
        } else {
            Write-SecurityWarning "npm/pnpm non disponible pour l'audit"
        }
    } catch {
        Write-SecurityWarning "Erreur lors de l'audit de $PackageJson : $_"
    } finally {
        Pop-Location
    }
}

# 3. Vérification des variables d'environnement
Write-Host "`n🔐 Vérification des variables d'environnement..." -ForegroundColor Yellow

$EnvFiles = Get-ChildItem -Recurse -Filter ".env*" -File -ErrorAction SilentlyContinue

foreach ($EnvFile in $EnvFiles) {
    Write-SecurityInfo "Analyse de $($EnvFile.FullName)"
    
    $Content = Get-Content $EnvFile.FullName -ErrorAction SilentlyContinue
    
    foreach ($Line in $Content) {
        # Vérifier les mots de passe faibles
        if ($Line -match "password.*=.*(123|admin|test|password)" -and $Line -notmatch "^#") {
            Write-SecurityError "Mot de passe faible dans $($EnvFile.Name): $($Line.Split('=')[0])"
        }
        
        # Vérifier les clés JWT courtes
        if ($Line -match "JWT_SECRET.*=.*" -and $Line -notmatch "^#") {
            $Secret = ($Line -split "=", 2)[1].Trim().Trim('"').Trim("'")
            if ($Secret.Length -lt 32) {
                Write-SecurityError "Clé JWT trop courte dans $($EnvFile.Name) (< 32 caractères)"
            }
        }
        
        # Vérifier les URLs de base de données avec credentials
        if ($Line -match "DATABASE_URL.*://.*:.*@" -and $Line -notmatch "^#") {
            Write-SecurityWarning "URL de base de données avec credentials dans $($EnvFile.Name)"
        }
    }
}

# 4. Vérification des headers de sécurité
Write-Host "`n🌐 Test des headers de sécurité..." -ForegroundColor Yellow

$TestUrls = @("http://localhost:3000", "http://localhost:3001", "http://localhost:4000")

foreach ($Url in $TestUrls) {
    try {
        Write-SecurityInfo "Test de $Url"
        $Response = Invoke-WebRequest -Uri "$Url/health" -Method HEAD -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        $SecurityHeaders = @{
            "X-Frame-Options" = "Protection contre le clickjacking"
            "X-Content-Type-Options" = "Protection contre le MIME sniffing"
            "Strict-Transport-Security" = "Sécurité de transport HTTP"
            "Content-Security-Policy" = "Politique de sécurité du contenu"
            "Referrer-Policy" = "Politique de référent"
        }
        
        foreach ($Header in $SecurityHeaders.Keys) {
            if ($Response.Headers[$Header]) {
                Write-SecuritySuccess "$Header configuré sur $Url"
            } else {
                Write-SecurityWarning "$Header manquant sur $Url - $($SecurityHeaders[$Header])"
            }
        }
        
        # Vérifier les headers dangereux
        if ($Response.Headers["Server"] -and $Response.Headers["Server"] -notmatch "nginx|cloudflare") {
            Write-SecurityWarning "Header Server exposé sur $Url : $($Response.Headers['Server'])"
        }
        
    } catch {
        Write-SecurityInfo "Serveur $Url non accessible pour les tests"
    }
}

# 5. Vérification des injections SQL potentielles
Write-Host "`n💉 Vérification des injections SQL potentielles..." -ForegroundColor Yellow

$CodeFiles = Get-ChildItem -Recurse -Include "*.ts", "*.js" -Exclude "*.d.ts" | Where-Object { $_.FullName -notmatch "node_modules" } | Select-Object -First 100

foreach ($File in $CodeFiles) {
    $Content = Get-Content $File.FullName -Raw -ErrorAction SilentlyContinue
    
    if ($Content) {
        # Rechercher les concaténations de requêtes SQL
        if ($Content -match 'query.*\+.*\$|SELECT.*\+|INSERT.*\+|UPDATE.*\+|DELETE.*\+') {
            Write-SecurityError "Injection SQL potentielle (concaténation) dans $($File.Name)"
        }
        
        # Rechercher les template literals avec SQL
        if ($Content -match '`.*SELECT.*\$\{|`.*INSERT.*\$\{|`.*UPDATE.*\$\{|`.*DELETE.*\$\{') {
            Write-SecurityWarning "Injection SQL via template literal dans $($File.Name)"
        }
        
        # Rechercher les bonnes pratiques (parameterized queries)
        if ($Content -match '\$[0-9]|\?') {
            Write-SecuritySuccess "Requêtes paramétrées trouvées dans $($File.Name)"
        }
    }
}

# 6. Vérification JWT
Write-Host "`n🎟️ Vérification de la sécurité JWT..." -ForegroundColor Yellow

$JwtFiles = $CodeFiles | Where-Object { (Get-Content $_.FullName -Raw) -match "jwt|JWT" }

foreach ($File in $JwtFiles) {
    $Content = Get-Content $File.FullName -Raw
    
    # Vérifier l'algorithme JWT
    if ($Content -match 'algorithm.*HS256') {
        Write-SecurityInfo "Algorithme HS256 utilisé dans $($File.Name) (considérer RS256 pour la production)"
    }
    
    if ($Content -match 'algorithm.*none') {
        Write-SecurityError "Algorithme 'none' dangereux dans $($File.Name)"
    }
    
    # Vérifier l'expiration
    if ($Content -match 'jwt\.sign' -and $Content -notmatch 'expiresIn|exp:') {
        Write-SecurityWarning "JWT sans expiration dans $($File.Name)"
    }
    
    # Vérifier les secrets hardcodés
    if ($Content -match 'jwt.*secret.*[\'"][^\'"]{8,}[\'"]]') {
        Write-SecurityError "Secret JWT hardcodé dans $($File.Name)"
    }
}

# 7. Vérification de la configuration de sécurité
Write-Host "`n⚙️ Vérification de la configuration de sécurité..." -ForegroundColor Yellow

if (Test-Path "security.config.json") {
    Write-SecuritySuccess "Fichier security.config.json trouvé"
    
    try {
        $SecurityConfig = Get-Content "security.config.json" | ConvertFrom-Json -ErrorAction Stop
        Write-SecuritySuccess "Configuration de sécurité JSON valide"
        
        # Vérifier les sections requises
        $RequiredSections = @("cors", "headers", "rateLimit", "validation", "auth")
        foreach ($Section in $RequiredSections) {
            if ($SecurityConfig.$Section) {
                Write-SecuritySuccess "Section de configuration trouvée: $Section"
            } else {
                Write-SecurityWarning "Section de configuration manquante: $Section"
            }
        }
    } catch {
        Write-SecurityError "JSON invalide dans security.config.json: $_"
    }
} else {
    Write-SecurityWarning "Fichier security.config.json non trouvé"
}

# 8. Vérification spécifique Windows
Write-Host "`n🪟 Vérifications spécifiques Windows..." -ForegroundColor Yellow

# Vérifier les exécutables dans des répertoires suspects
$SuspiciousDirs = @("temp", "tmp", "uploads", "public")
foreach ($Dir in $SuspiciousDirs) {
    if (Test-Path $Dir) {
        $Executables = Get-ChildItem -Path $Dir -Recurse -Include "*.exe", "*.bat", "*.cmd", "*.ps1" -File -ErrorAction SilentlyContinue
        foreach ($Exe in $Executables) {
            Write-SecurityWarning "Exécutable dans répertoire suspect: $($Exe.FullName)"
        }
    }
}

# Vérifier les services Windows suspects (si administrateur)
try {
    $IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    if ($IsAdmin) {
        Write-SecurityInfo "Vérification des services Windows (privilèges administrateur détectés)"
        # Cette vérification pourrait être étendue selon les besoins
    }
} catch {
    # Ignorer si pas d'accès administrateur
}

# 9. Génération du rapport final
Write-Host "`n📊 Rapport de sécurité..." -ForegroundColor Yellow

Write-Host @"

    ================================
        Rapport de Sécurité
    ================================
    
    Problèmes de sécurité: $SecurityIssues
    Avertissements: $Warnings  
    Informations: $InfoItems
    
"@ -ForegroundColor $(if ($SecurityIssues -gt 0) { "Red" } elseif ($Warnings -gt 0) { "Yellow" } else { "Green" })

if ($SecurityIssues -eq 0 -and $Warnings -eq 0) {
    Write-SecuritySuccess "Aucun problème de sécurité critique détecté!"
} elseif ($SecurityIssues -gt 0) {
    Write-Host "CRITIQUE: Veuillez corriger les problèmes de sécurité avant le déploiement." -ForegroundColor Red
} elseif ($Warnings -gt 0) {
    Write-Host "RECOMMANDÉ: Examinez et corrigez les avertissements ci-dessus." -ForegroundColor Yellow
}

# 10. Export des résultats
if ($ExportResults) {
    Write-Host "`n💾 Export des résultats..." -ForegroundColor Yellow
    
    $Results.Summary = @{
        SecurityIssues = $SecurityIssues
        Warnings = $Warnings
        InfoItems = $InfoItems
        Status = if ($SecurityIssues -gt 0) { "CRITICAL" } elseif ($Warnings -gt 0) { "WARNING" } else { "PASSED" }
    }
    
    try {
        $Results | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-SecuritySuccess "Résultats exportés vers $OutputPath"
    } catch {
        Write-SecurityError "Erreur lors de l'export: $_"
    }
}

Write-Host "`n✅ Vérification terminée" -ForegroundColor Green
Write-Host "Horodatage: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Code de sortie
if ($SecurityIssues -gt 0) {
    exit 1
} else {
    exit 0
}
