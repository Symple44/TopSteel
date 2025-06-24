# scripts/full-setup.ps1
# Script de setup complet pour ERP TOPSTEEL

param(
    [switch]$SkipPostgreSQL,
    [string]$PostgreSQLPassword = "postgres"
)

Clear-Host
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host " SETUP COMPLET ERP TOPSTEEL" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""

# Fonction pour tester les commandes
function Test-Command($cmd) {
    try {
        Get-Command $cmd -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Variables
$hasErrors = $false

# 1. VERIFICATION NODE.JS
Write-Host "Verification de Node.js..." -ForegroundColor Cyan
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "[ERREUR] Node.js non installe - Telechargez depuis https://nodejs.org/" -ForegroundColor Red
    $hasErrors = $true
}

# 2. VERIFICATION/INSTALLATION PNPM
Write-Host "Verification de pnpm..." -ForegroundColor Cyan
if (Test-Command "pnpm") {
    $pnpmVersion = pnpm --version
    Write-Host "[OK] pnpm: v$pnpmVersion" -ForegroundColor Green
}
else {
    Write-Host "[INFO] Installation de pnpm..." -ForegroundColor Yellow
    try {
        npm install -g pnpm
        Write-Host "[OK] pnpm installe" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERREUR] Impossible d'installer pnpm" -ForegroundColor Red
        $hasErrors = $true
    }
}

# 3. VERIFICATION STRUCTURE PROJET
Write-Host "Verification de la structure du projet..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    Write-Host "[OK] Structure du projet detectee" -ForegroundColor Green
}
else {
    Write-Host "[ERREUR] Pas dans la racine du projet" -ForegroundColor Red
    $hasErrors = $true
}

# Arret si erreurs critiques
if ($hasErrors) {
    Write-Host ""
    Write-Host "[ERREUR] Erreurs critiques detectees - arret du script" -ForegroundColor Red
    exit 1
}

# 4. INSTALLATION DEPENDANCES
Write-Host ""
Write-Host "Installation des dependances..." -ForegroundColor Cyan
pnpm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Dependances installees" -ForegroundColor Green
}
else {
    Write-Host "[ERREUR] Erreur installation dependances" -ForegroundColor Red
    exit 1
}

# 5. CREATION FICHIERS ENV - API
Write-Host ""
Write-Host "Configuration fichiers environnement..." -ForegroundColor Cyan

$apiEnvPath = "apps\api\.env.local"
$apiEnvExample = "apps\api\.env.example"

if (-not (Test-Path $apiEnvPath)) {
    if (Test-Path $apiEnvExample) {
        Copy-Item $apiEnvExample $apiEnvPath
        Write-Host "[OK] .env.local API cree depuis exemple" -ForegroundColor Green
    }
    else {
        # Creer fichier basique
        $envContent = @"
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$PostgreSQLPassword
DB_NAME=erp_topsteel_dev
JWT_SECRET=development-secret-key
"@
        $envContent | Out-File -FilePath $apiEnvPath -Encoding UTF8
        Write-Host "[OK] .env.local API cree par defaut" -ForegroundColor Green
    }
}
else {
    Write-Host "[OK] .env.local API existe deja" -ForegroundColor Green
}

# 6. CREATION FICHIERS ENV - WEB
$webEnvPath = "apps\web\.env.local"
$webEnvExample = "apps\web\.env.example"

if (-not (Test-Path $webEnvPath)) {
    if (Test-Path $webEnvExample) {
        Copy-Item $webEnvExample $webEnvPath
        Write-Host "[OK] .env.local Web cree depuis exemple" -ForegroundColor Green
    }
    else {
        $webEnvContent = "NEXT_PUBLIC_API_URL=http://localhost:3001"
        $webEnvContent | Out-File -FilePath $webEnvPath -Encoding UTF8
        Write-Host "[OK] .env.local Web cree par defaut" -ForegroundColor Green
    }
}
else {
    Write-Host "[OK] .env.local Web existe deja" -ForegroundColor Green
}

# 7. CONFIGURATION POSTGRESQL
if (-not $SkipPostgreSQL) {
    Write-Host ""
    Write-Host "CONFIGURATION POSTGRESQL" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Gray
    
    $postgresScript = "scripts\setup-postgres.ps1"
    if (Test-Path $postgresScript) {
        Write-Host "Lancement du script PostgreSQL..." -ForegroundColor Yellow
        Write-Host "Une fenetre va s'ouvrir - laissez-la se terminer" -ForegroundColor Yellow
        Write-Host ""
        
        try {
            & $postgresScript -Password $PostgreSQLPassword
            $postgresExitCode = $LASTEXITCODE
        }
        catch {
            Write-Host "[ERREUR] Probleme lors du script PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
            $postgresExitCode = 1
        }
        
        Write-Host ""
        Write-Host "VERIFICATION POST-INSTALLATION POSTGRESQL" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Gray
        
        # Test si PostgreSQL est accessible
        Write-Host "Test de connexion PostgreSQL..." -ForegroundColor Yellow
        $env:PGPASSWORD = $PostgreSQLPassword
        
        try {
            $testResult = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1;" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] PostgreSQL fonctionne et est accessible !" -ForegroundColor Green
                
                # Verifier les bases de donnees
                Write-Host "Verification des bases de donnees..." -ForegroundColor Yellow
                $databases = @("erp_topsteel_dev", "erp_topsteel_test")
                $allDbsOK = $true
                
                foreach ($db in $databases) {
                    $dbExists = psql -h localhost -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db';" 2>$null
                    if ($dbExists -eq "1") {
                        Write-Host "[OK] Base '$db' existe" -ForegroundColor Green
                    }
                    else {
                        Write-Host "[INFO] Creation de la base '$db'..." -ForegroundColor Yellow
                        psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE $db;" 2>$null
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "[OK] Base '$db' creee" -ForegroundColor Green
                        }
                        else {
                            Write-Host "[ERREUR] Impossible de creer '$db'" -ForegroundColor Red
                            $allDbsOK = $false
                        }
                    }
                }
                
                if ($allDbsOK) {
                    Write-Host ""
                    Write-Host "POSTGRESQL PRET !" -ForegroundColor Green
                    Write-Host "Connexion: postgres@localhost:5432" -ForegroundColor Gray
                    Write-Host "Mot de passe: $PostgreSQLPassword" -ForegroundColor Gray
                    Write-Host "Bases: erp_topsteel_dev, erp_topsteel_test" -ForegroundColor Gray
                }
            }
            else {
                Write-Host "[ERREUR] PostgreSQL installe mais connexion echoue" -ForegroundColor Red
                Write-Host "Code de sortie: $LASTEXITCODE" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "[ERREUR] Impossible de tester PostgreSQL" -ForegroundColor Red
            Write-Host "Verifiez que PostgreSQL est bien installe" -ForegroundColor Yellow
        }
        
        # Nettoyer la variable d'environnement
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
        
    }
    else {
        Write-Host "[INFO] Script setup-postgres.ps1 non trouve" -ForegroundColor Yellow
        Write-Host "Installation manuelle requise:" -ForegroundColor Yellow
        Write-Host "   1. Installez PostgreSQL depuis https://www.postgresql.org/download/windows/" -ForegroundColor Gray
        Write-Host "   2. Creez les bases: erp_topsteel_dev et erp_topsteel_test" -ForegroundColor Gray
        Write-Host "   3. Utilisez le mot de passe: $PostgreSQLPassword" -ForegroundColor Gray
    }
}
else {
    Write-Host ""
    Write-Host "[INFO] Installation PostgreSQL ignoree" -ForegroundColor Yellow
}

# 8. BUILD PACKAGES
Write-Host ""
Write-Host "Construction des packages..." -ForegroundColor Cyan
pnpm build --filter="!@erp/web" --filter="!@erp/api"

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Packages construits" -ForegroundColor Green
}
else {
    Write-Host "[INFO] Quelques packages ont echoue (normal)" -ForegroundColor Yellow
}

# 9. VERIFICATION FINALE
Write-Host ""
Write-Host "Verification finale..." -ForegroundColor Cyan

$finalOK = $true

if (Test-Path "node_modules") {
    Write-Host "[OK] Node modules installes" -ForegroundColor Green
}
else {
    Write-Host "[ERREUR] Node modules manquants" -ForegroundColor Red
    $finalOK = $false
}

if (Test-Path "apps\api\.env.local") {
    Write-Host "[OK] Configuration API prete" -ForegroundColor Green
}
else {
    Write-Host "[ERREUR] Configuration API manquante" -ForegroundColor Red
    $finalOK = $false
}

if (Test-Path "apps\web\.env.local") {
    Write-Host "[OK] Configuration Web prete" -ForegroundColor Green
}
else {
    Write-Host "[INFO] Configuration Web manquante" -ForegroundColor Yellow
}

# 10. RESULTAT FINAL
Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta

if ($finalOK) {
    Write-Host "CONFIGURATION TERMINEE AVEC SUCCES !" -ForegroundColor Green
}
else {
    Write-Host "CONFIGURATION TERMINEE AVEC AVERTISSEMENTS" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "COMMANDES DISPONIBLES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  pnpm dev         (Tout demarrer)" -ForegroundColor Green
Write-Host "  pnpm dev:web     (Frontend seulement)" -ForegroundColor Green  
Write-Host "  pnpm dev:api     (API seulement)" -ForegroundColor Green
Write-Host ""

if (-not $SkipPostgreSQL) {
    Write-Host "  pnpm db:migrate:run    (Migrations DB)" -ForegroundColor Green
    Write-Host ""
}

Write-Host "URLS DE DEVELOPPEMENT:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Gray
Write-Host "  API:      http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "Script termine a $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Magenta