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
        
        Write-Host ""
        Write-Host "DIAGNOSTIC COMPLET POSTGRESQL" -ForegroundColor Cyan
        Write-Host "=============================" -ForegroundColor Gray
        
        # Test 1: Recherche des installations
        Write-Host "Test 1: Recherche des installations PostgreSQL..." -ForegroundColor Yellow
        $foundInstallations = @()
        $possiblePaths = @(
            "C:\Program Files\PostgreSQL\16\bin",
            "C:\Program Files\PostgreSQL\15\bin", 
            "C:\Program Files\PostgreSQL\14\bin",
            "C:\Program Files (x86)\PostgreSQL\16\bin",
            "C:\Program Files (x86)\PostgreSQL\15\bin"
        )
        
        foreach ($path in $possiblePaths) {
            if (Test-Path "$path\psql.exe") {
                $foundInstallations += $path
                Write-Host "[OK] Installation trouvee: $path" -ForegroundColor Green
            }
        }
        
        if ($foundInstallations.Count -eq 0) {
            Write-Host "[INFO] Aucune installation dans les chemins standards" -ForegroundColor Yellow
        }
        
        # Test 2: Verification des services
        Write-Host ""
        Write-Host "Test 2: Verification des services Windows..." -ForegroundColor Yellow
        $serviceNames = @("postgresql-x64-16", "postgresql-x64-15", "postgresql-x64-14", "postgresql-x64-13", "postgresql", "PostgreSQL")
        $foundServices = @()
        
        foreach ($serviceName in $serviceNames) {
            $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
            if ($service) {
                $foundServices += $service
                $statusColor = if ($service.Status -eq "Running") { "Green" } else { "Yellow" }
                Write-Host "[INFO] Service: $($service.Name) - Status: $($service.Status)" -ForegroundColor $statusColor
                
                # Tenter de demarrer le service s'il est arrete
                if ($service.Status -ne "Running") {
                    Write-Host "  Tentative de demarrage du service..." -ForegroundColor Gray
                    try {
                        Start-Service -Name $serviceName
                        Start-Sleep 3
                        $service = Get-Service -Name $serviceName
                        if ($service.Status -eq "Running") {
                            Write-Host "  [OK] Service demarre avec succes" -ForegroundColor Green
                        }
                    }
                    catch {
                        Write-Host "  [ERREUR] Impossible de demarrer: $($_.Exception.Message)" -ForegroundColor Red
                    }
                }
            }
        }
        
        if ($foundServices.Count -eq 0) {
            Write-Host "[ERREUR] Aucun service PostgreSQL trouve" -ForegroundColor Red
        }
        
        # Test 3: Verification du PATH
        Write-Host ""
        Write-Host "Test 3: Verification de psql dans PATH..." -ForegroundColor Yellow
        if (Test-Command "psql") {
            $psqlPath = (Get-Command psql).Source
            Write-Host "[OK] psql accessible: $psqlPath" -ForegroundColor Green
            
            try {
                $psqlVersion = psql --version
                Write-Host "[OK] Version: $psqlVersion" -ForegroundColor Green
            }
            catch {
                Write-Host "[ERREUR] psql trouve mais non fonctionnel" -ForegroundColor Red
            }
        }
        else {
            Write-Host "[ERREUR] psql non trouve dans PATH" -ForegroundColor Red
            
            # Tenter d'ajouter au PATH si installation trouvee
            if ($foundInstallations.Count -gt 0) {
                $binPath = $foundInstallations[0]
                Write-Host "  Tentative d'ajout au PATH: $binPath" -ForegroundColor Gray
                $env:PATH += ";$binPath"
                
                if (Test-Command "psql") {
                    Write-Host "  [OK] psql maintenant accessible" -ForegroundColor Green
                }
                else {
                    Write-Host "  [ERREUR] Echec ajout au PATH" -ForegroundColor Red
                }
            }
        }
        
        # Test 4: Test de port
        Write-Host ""
        Write-Host "Test 4: Test du port 5432..." -ForegroundColor Yellow
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.ReceiveTimeout = 3000
            $tcpClient.SendTimeout = 3000
            $tcpClient.Connect("localhost", 5432)
            $tcpClient.Close()
            Write-Host "[OK] Port 5432 accessible" -ForegroundColor Green
        }
        catch {
            Write-Host "[ERREUR] Port 5432 non accessible" -ForegroundColor Red
            Write-Host "  Causes possibles:" -ForegroundColor Gray
            Write-Host "  - Service PostgreSQL arrete" -ForegroundColor Gray
            Write-Host "  - Installation incomplete" -ForegroundColor Gray
            Write-Host "  - Pare-feu bloque le port" -ForegroundColor Gray
        }
        
        # Test 5: Test de connexion detaille
        Write-Host ""
        Write-Host "Test 5: Test de connexion PostgreSQL..." -ForegroundColor Yellow
        if (Test-Command "psql") {
            $env:PGPASSWORD = $PostgreSQLPassword
            
            try {
                Write-Host "  Tentative de connexion..." -ForegroundColor Gray
                $connectionTest = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 'Connection OK' as status;" -t 2>$null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] Connexion PostgreSQL reussie !" -ForegroundColor Green
                    Write-Host "  Reponse: $($connectionTest.Trim())" -ForegroundColor Gray
                    
                    # Test des bases de donnees
                    Write-Host ""
                    Write-Host "Test 6: Verification/Creation des bases..." -ForegroundColor Yellow
                    $databases = @("erp_topsteel_dev", "erp_topsteel_test")
                    $allDbsOK = $true
                    
                    foreach ($db in $databases) {
                        Write-Host "  Verification de '$db'..." -ForegroundColor Gray
                        $dbExists = psql -h localhost -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db';" 2>$null
                        
                        if ($dbExists -eq "1") {
                            Write-Host "  [OK] Base '$db' existe" -ForegroundColor Green
                        }
                        else {
                            Write-Host "  [INFO] Creation de '$db'..." -ForegroundColor Yellow
                            $createResult = psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE $db;" 2>$null
                            
                            if ($LASTEXITCODE -eq 0) {
                                Write-Host "  [OK] Base '$db' creee avec succes" -ForegroundColor Green
                            }
                            else {
                                Write-Host "  [ERREUR] Impossible de creer '$db'" -ForegroundColor Red
                                $allDbsOK = $false
                            }
                        }
                    }
                    
                    # Resume final PostgreSQL
                    Write-Host ""
                    if ($allDbsOK) {
                        Write-Host "POSTGRESQL PRET A L'EMPLOI !" -ForegroundColor Green
                        Write-Host "============================" -ForegroundColor Gray
                        Write-Host "  Host: localhost" -ForegroundColor Gray
                        Write-Host "  Port: 5432" -ForegroundColor Gray
                        Write-Host "  User: postgres" -ForegroundColor Gray
                        Write-Host "  Password: $PostgreSQLPassword" -ForegroundColor Gray
                        Write-Host "  Bases: erp_topsteel_dev, erp_topsteel_test" -ForegroundColor Gray
                        Write-Host ""
                        Write-Host "  Vous pouvez maintenant lancer: pnpm dev:api" -ForegroundColor Green
                    }
                    else {
                        Write-Host "POSTGRESQL PARTIELLEMENT CONFIGURE" -ForegroundColor Yellow
                        Write-Host "==================================" -ForegroundColor Gray
                        Write-Host "PostgreSQL fonctionne mais problemes avec les bases" -ForegroundColor Yellow
                    }
                }
                else {
                    Write-Host "[ERREUR] Connexion echouee (code: $LASTEXITCODE)" -ForegroundColor Red
                    
                    # Diagnostic supplementaire
                    Write-Host ""
                    Write-Host "DIAGNOSTIC SUPPLEMENTAIRE:" -ForegroundColor Yellow
                    Write-Host "=========================" -ForegroundColor Gray
                    
                    # Verifier si c'est un probleme d'authentification
                    Write-Host "Test avec differents mots de passe..." -ForegroundColor Gray
                    $testPasswords = @("postgres", "", "admin", "password")
                    
                    foreach ($testPwd in $testPasswords) {
                        $env:PGPASSWORD = $testPwd
                        $authTest = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1;" 2>$null
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "[INFO] Mot de passe correct: '$testPwd'" -ForegroundColor Cyan
                            break
                        }
                    }
                    
                    # Remettre le mot de passe original
                    $env:PGPASSWORD = $PostgreSQLPassword
                }
            }
            catch {
                Write-Host "[ERREUR] Exception lors du test: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Nettoyer
            Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
        }
        else {
            Write-Host "[ERREUR] psql non disponible - impossible de tester" -ForegroundColor Red
        }
        
        # Resume des actions recommandees
        Write-Host ""
        Write-Host "ACTIONS RECOMMANDEES:" -ForegroundColor Cyan
        Write-Host "====================" -ForegroundColor Gray
        
        if ($foundServices.Count -eq 0) {
            Write-Host "1. PostgreSQL ne semble pas installe correctement" -ForegroundColor Yellow
            Write-Host "   Installez manuellement depuis: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
        }
        elseif (-not (Test-Command "psql")) {
            Write-Host "1. PostgreSQL installe mais psql non accessible" -ForegroundColor Yellow
            Write-Host "   Redemarrez l'ordinateur pour actualiser le PATH" -ForegroundColor Gray
        }
        else {
            Write-Host "1. PostgreSQL semble installe" -ForegroundColor Green
            Write-Host "   Si problemes persistent, redemarrez l'ordinateur" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "2. En cas de probleme persistant:" -ForegroundColor Gray
        Write-Host "   - Ouvrez le Gestionnaire de services Windows" -ForegroundColor Gray
        Write-Host "   - Cherchez les services 'postgresql'" -ForegroundColor Gray
        Write-Host "   - Demarrez-les manuellement" -ForegroundColor Gray
        Write-Host ""
        
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