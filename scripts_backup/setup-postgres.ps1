# scripts/setup-postgres.ps1
# Script d'installation et configuration PostgreSQL

param(
    [string]$Password = "postgres",
    [switch]$Force,
    [switch]$SkipInstall
)

Clear-Host
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host " CONFIGURATION POSTGRESQL POUR ERP TOPSTEEL" -ForegroundColor Magenta
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

# Fonction pour tester les droits admin
function Test-AdminRights() {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Rechercher les installations PostgreSQL
function Get-PostgreSQLInstallation() {
    Write-Host "Recherche des installations PostgreSQL..." -ForegroundColor Cyan
    
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin", 
        "C:\Program Files\PostgreSQL\14\bin",
        "C:\Program Files\PostgreSQL\13\bin",
        "C:\Program Files (x86)\PostgreSQL\16\bin",
        "C:\Program Files (x86)\PostgreSQL\15\bin"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path "$path\psql.exe") {
            Write-Host "[OK] PostgreSQL trouve: $path" -ForegroundColor Green
            return @{
                Found = $true
                BinPath = $path
                Version = & "$path\psql.exe" --version 2>$null
            }
        }
    }
    
    # Verifier dans le PATH
    if (Test-Command "psql") {
        $psqlPath = (Get-Command psql).Source
        Write-Host "[OK] PostgreSQL trouve dans PATH: $psqlPath" -ForegroundColor Green
        return @{
            Found = $true
            BinPath = Split-Path $psqlPath
            Version = psql --version 2>$null
        }
    }
    
    Write-Host "[INFO] Aucune installation PostgreSQL detectee" -ForegroundColor Yellow
    return @{ Found = $false }
}

# Installer PostgreSQL sur Windows
function Install-PostgreSQLWindows() {
    Write-Host "Installation de PostgreSQL sur Windows..." -ForegroundColor Cyan
    
    # Verifier les droits admin
    if (-not (Test-AdminRights)) {
        Write-Host "[ERREUR] Droits administrateur requis" -ForegroundColor Red
        Write-Host "Solutions:" -ForegroundColor Yellow
        Write-Host "  1. Relancez VS Code en tant qu'administrateur" -ForegroundColor Gray
        Write-Host "  2. Ou installez manuellement: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
        return $false
    }
    
    # Methode 1: winget
    if (Test-Command "winget") {
        Write-Host "Installation via winget..." -ForegroundColor Yellow
        try {
            winget install --id PostgreSQL.PostgreSQL.15 --silent --accept-package-agreements --accept-source-agreements
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] PostgreSQL installe via winget" -ForegroundColor Green
                Start-Sleep 20
                return $true
            }
        }
        catch {
            Write-Host "[INFO] Winget a echoue" -ForegroundColor Yellow
        }
    }
    
    # Methode 2: Chocolatey (avec timeout)
    if (Test-Command "choco") {
        Write-Host "Installation via Chocolatey (timeout 120s)..." -ForegroundColor Yellow
        try {
            $job = Start-Job -ScriptBlock {
                param($Password)
                choco install postgresql15 --yes --params "/Password:$Password /Port:5432"
                return $LASTEXITCODE
            } -ArgumentList $Password
            
            # Attendre 120 secondes maximum
            $completed = $job | Wait-Job -Timeout 120
            
            if ($completed) {
                $exitCode = Receive-Job $job
                Remove-Job $job
                
                if ($exitCode -eq 0) {
                    Write-Host "[OK] PostgreSQL installe via Chocolatey" -ForegroundColor Green
                    return $true
                }
                else {
                    Write-Host "[INFO] Chocolatey a echoue (code: $exitCode)" -ForegroundColor Yellow
                }
            }
            else {
                Write-Host "[INFO] Chocolatey timeout - trop lent" -ForegroundColor Yellow
                Remove-Job $job -Force
            }
        }
        catch {
            Write-Host "[INFO] Chocolatey a echoue: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # Si tout echoue, guider vers installation manuelle
    Write-Host ""
    Write-Host "[INFO] Installation automatique impossible" -ForegroundColor Yellow
    Write-Host "Installation manuelle recommandee (5 minutes) :" -ForegroundColor Cyan
    Write-Host "  1. Ouvrez: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "  2. Telechargez la version 15.x pour Windows x86-64" -ForegroundColor Gray
    Write-Host "  3. Installez avec :" -ForegroundColor Gray
    Write-Host "     - Port: 5432" -ForegroundColor Gray
    Write-Host "     - Mot de passe: $Password" -ForegroundColor Gray
    Write-Host "     - Utilisateur: postgres" -ForegroundColor Gray
    Write-Host "  4. Relancez ce script apres installation" -ForegroundColor Gray
    Write-Host ""
    
    return $false
}

# Rechercher et demarrer le service PostgreSQL
function Start-PostgreSQLService() {
    $serviceNames = @(
        "postgresql-x64-16",
        "postgresql-x64-15", 
        "postgresql-x64-14",
        "postgresql-x64-13",
        "postgresql",
        "PostgreSQL"
    )
    
    foreach ($serviceName in $serviceNames) {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            Write-Host "[INFO] Service trouve: $serviceName (Status: $($service.Status))" -ForegroundColor Cyan
            
            if ($service.Status -ne "Running") {
                try {
                    Start-Service -Name $serviceName
                    Write-Host "[OK] Service $serviceName demarre" -ForegroundColor Green
                    Start-Sleep 5
                    return $true
                }
                catch {
                    Write-Host "[ERREUR] Impossible de demarrer $serviceName" -ForegroundColor Red
                }
            }
            else {
                Write-Host "[OK] Service $serviceName deja en cours" -ForegroundColor Green
                return $true
            }
        }
    }
    
    Write-Host "[ERREUR] Aucun service PostgreSQL trouve" -ForegroundColor Red
    return $false
}

# Ajouter PostgreSQL au PATH
function Add-PostgreSQLToPath() {
    Write-Host "Configuration du PATH..." -ForegroundColor Cyan
    
    $installation = Get-PostgreSQLInstallation
    if (-not $installation.Found) {
        Write-Host "[ERREUR] PostgreSQL non trouve pour PATH" -ForegroundColor Red
        return $false
    }
    
    $binPath = $installation.BinPath
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    
    if ($currentPath -like "*$binPath*") {
        Write-Host "[OK] PostgreSQL deja dans le PATH" -ForegroundColor Green
        return $true
    }
    
    try {
        $newPath = "$currentPath;$binPath"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        $env:PATH += ";$binPath"
        Write-Host "[OK] PostgreSQL ajoute au PATH" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[ERREUR] Impossible d'ajouter au PATH" -ForegroundColor Red
        return $false
    }
}

# Tester la connexion PostgreSQL
function Test-PostgreSQLConnection() {
    Write-Host "Test de connexion a PostgreSQL..." -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Gray
    
    $env:PGPASSWORD = $Password
    
    Write-Host "Parametres de connexion:" -ForegroundColor Yellow
    Write-Host "  Host: localhost" -ForegroundColor Gray
    Write-Host "  Port: 5432" -ForegroundColor Gray
    Write-Host "  User: postgres" -ForegroundColor Gray
    Write-Host "  Password: $Password" -ForegroundColor Gray
    Write-Host ""
    
    # Test 1: Verification que psql est accessible
    Write-Host "Test 1: Verification de psql..." -ForegroundColor Yellow
    if (Test-Command "psql") {
        Write-Host "[OK] psql est accessible" -ForegroundColor Green
    }
    else {
        Write-Host "[ERREUR] psql non trouve dans PATH" -ForegroundColor Red
        return $false
    }
    
    # Test 2: Test de port
    Write-Host "Test 2: Verification du port 5432..." -ForegroundColor Yellow
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", 5432)
        $tcpClient.Close()
        Write-Host "[OK] Port 5432 accessible" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERREUR] Port 5432 non accessible" -ForegroundColor Red
        Write-Host "Causes possibles:" -ForegroundColor Yellow
        Write-Host "  - Service PostgreSQL arrete" -ForegroundColor Gray
        Write-Host "  - Port utilise par un autre processus" -ForegroundColor Gray
        Write-Host "  - Pare-feu bloque le port" -ForegroundColor Gray
        return $false
    }
    
    # Test 3: Connexion reelle a la base
    Write-Host "Test 3: Connexion a la base postgres..." -ForegroundColor Yellow
    try {
        $result = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();" 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Connexion PostgreSQL reussie !" -ForegroundColor Green
            Write-Host "Version PostgreSQL:" -ForegroundColor Cyan
            Write-Host "  $($result | Select-Object -First 1)" -ForegroundColor Gray
            return $true
        }
        else {
            Write-Host "[ERREUR] Echec de connexion (code: $LASTEXITCODE)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "[ERREUR] Exception lors de la connexion: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "DIAGNOSTIC DETAILLE:" -ForegroundColor Yellow
    Write-Host "===================" -ForegroundColor Gray
    
    # Diagnostic des services
    Write-Host "Services PostgreSQL detectes:" -ForegroundColor Yellow
    $serviceNames = @("postgresql-x64-16", "postgresql-x64-15", "postgresql-x64-14", "postgresql")
    $foundServices = $false
    
    foreach ($serviceName in $serviceNames) {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            $foundServices = $true
            $statusColor = if ($service.Status -eq "Running") { "Green" } else { "Red" }
            Write-Host "  - $($service.Name): $($service.Status)" -ForegroundColor $statusColor
        }
    }
    
    if (-not $foundServices) {
        Write-Host "  Aucun service PostgreSQL trouve" -ForegroundColor Red
    }
    
    return $false
}

# Creer les bases de donnees
function Create-Databases() {
    Write-Host "Creation des bases de donnees..." -ForegroundColor Cyan
    
    $env:PGPASSWORD = $Password
    $databases = @("erp_topsteel_dev", "erp_topsteel_test")
    
    foreach ($db in $databases) {
        try {
            # Verifier si la base existe
            $exists = psql -h localhost -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db';"
            
            if ($exists -eq "1") {
                Write-Host "[OK] Base de donnees '$db' existe deja" -ForegroundColor Green
            }
            else {
                # Creer la base de donnees
                psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE $db;"
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[OK] Base de donnees '$db' creee" -ForegroundColor Green
                }
                else {
                    Write-Host "[ERREUR] Echec de creation de '$db'" -ForegroundColor Red
                }
            }
        }
        catch {
            Write-Host "[ERREUR] Erreur lors de la creation de '$db'" -ForegroundColor Red
        }
    }
}

# Mettre a jour le fichier .env
function Update-EnvFile() {
    Write-Host "Mise a jour du fichier .env..." -ForegroundColor Cyan
    
    $envPath = "apps\api\.env.local"
    
    if (-not (Test-Path $envPath)) {
        if (Test-Path "apps\api\.env.example") {
            Copy-Item "apps\api\.env.example" $envPath
            Write-Host "[OK] Fichier .env.local cree depuis .env.example" -ForegroundColor Green
        }
        else {
            Write-Host "[INFO] Aucun fichier .env.example trouve" -ForegroundColor Yellow
            return
        }
    }
    
    # Mettre a jour les variables PostgreSQL
    $content = Get-Content $envPath
    $content = $content -replace "^DB_PASSWORD=.*", "DB_PASSWORD=$Password"
    $content = $content -replace "^DB_HOST=.*", "DB_HOST=localhost"
    $content = $content -replace "^DB_PORT=.*", "DB_PORT=5432"
    $content = $content -replace "^DB_USERNAME=.*", "DB_USERNAME=postgres"
    $content = $content -replace "^DB_NAME=.*", "DB_NAME=erp_topsteel_dev"
    
    Set-Content $envPath $content
    Write-Host "[OK] Fichier .env.local mis a jour" -ForegroundColor Green
}

# ================================
# SCRIPT PRINCIPAL
# ================================

# Vérifier si on est admin et se relancer si nécessaire
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host " ELEVATION EN ADMINISTRATEUR REQUISE" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Le script va se relancer avec les droits administrateur..." -ForegroundColor Cyan
    Write-Host "Cliquez sur 'Oui' dans la popup UAC." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $scriptPath = $MyInvocation.MyCommand.Path
        $arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`""
        if ($Password -ne "postgres") { $arguments += " -Password `"$Password`"" }
        if ($Force) { $arguments += " -Force" }
        if ($SkipInstall) { $arguments += " -SkipInstall" }
        
        Start-Process PowerShell -ArgumentList $arguments -Verb RunAs -Wait
        Write-Host "[OK] Installation PostgreSQL terminee !" -ForegroundColor Green
        exit 0
    }
    catch {
        Write-Host "[ERREUR] Impossible de relancer en admin: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Veuillez lancer PowerShell en tant qu'administrateur manuellement." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Script demarre a $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
Write-Host "[INFO] Execution en mode administrateur" -ForegroundColor Green

# Phase 1: Verification de l'installation existante
Write-Host ""
Write-Host "VERIFICATION" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Gray

$installation = Get-PostgreSQLInstallation

if ($installation.Found) {
    Write-Host "[OK] PostgreSQL detecte: $($installation.Version)" -ForegroundColor Green
    
    if (-not $SkipInstall) {
        # Verifier si le service fonctionne
        if (Start-PostgreSQLService) {
            Add-PostgreSQLToPath
            
            if (Test-PostgreSQLConnection) {
                Write-Host "[INFO] PostgreSQL est deja configure et fonctionnel !" -ForegroundColor Green
                Create-Databases
                Update-EnvFile
                
                Write-Host ""
                Write-Host "CONFIGURATION TERMINEE" -ForegroundColor Green
                Write-Host "======================" -ForegroundColor Gray
                Write-Host "[OK] PostgreSQL est pret pour le developpement !" -ForegroundColor Green
                Write-Host ""
                Write-Host "Informations de connexion :" -ForegroundColor Cyan
                Write-Host "  Host: localhost" -ForegroundColor Gray
                Write-Host "  Port: 5432" -ForegroundColor Gray
                Write-Host "  User: postgres" -ForegroundColor Gray
                Write-Host "  Password: $Password" -ForegroundColor Gray
                Write-Host "  Databases: erp_topsteel_dev, erp_topsteel_test" -ForegroundColor Gray
                exit 0
            }
        }
    }
}
else {
    Write-Host "[INFO] PostgreSQL non installe" -ForegroundColor Yellow
}

# Phase 2: Installation si necessaire
if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "INSTALLATION" -ForegroundColor Cyan
    Write-Host "============" -ForegroundColor Gray
    
    $installSuccess = Install-PostgreSQLWindows
    
    if (-not $installSuccess) {
        Write-Host "[ERREUR] Echec de l'installation automatique" -ForegroundColor Red
        Write-Host "Installation manuelle requise :" -ForegroundColor Yellow
        Write-Host "  1. Telechargez PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
        Write-Host "  2. Utilisez le mot de passe: $Password" -ForegroundColor Gray
        Write-Host "  3. Relancez ce script avec -SkipInstall apres l'installation" -ForegroundColor Gray
        exit 1
    }
    
    # Attendre que l'installation soit complete
    Start-Sleep 10
}

# Phase 3: Configuration post-installation
Write-Host ""
Write-Host "CONFIGURATION" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Gray

# Actualiser la detection apres installation
$installation = Get-PostgreSQLInstallation

if (-not $installation.Found) {
    Write-Host "[ERREUR] PostgreSQL toujours non detecte apres installation" -ForegroundColor Red
    Write-Host "Verifications manuelles requises" -ForegroundColor Yellow
    exit 1
}

Add-PostgreSQLToPath
$serviceStarted = Start-PostgreSQLService

if ($serviceStarted -and (Test-PostgreSQLConnection)) {
    Create-Databases
    Update-EnvFile
    
    Write-Host ""
    Write-Host "SUCCES" -ForegroundColor Green
    Write-Host "======" -ForegroundColor Gray
    Write-Host "[OK] PostgreSQL installe et configure avec succes !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informations de connexion :" -ForegroundColor Cyan
    Write-Host "  Host: localhost" -ForegroundColor Gray
    Write-Host "  Port: 5432" -ForegroundColor Gray
    Write-Host "  User: postgres" -ForegroundColor Gray
    Write-Host "  Password: $Password" -ForegroundColor Gray
    Write-Host "  Databases: erp_topsteel_dev, erp_topsteel_test" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Prochaines etapes :" -ForegroundColor Cyan
    Write-Host "  1. Demarrez l'API : pnpm dev:api" -ForegroundColor Gray
    Write-Host "  2. Testez la connexion DB dans votre application" -ForegroundColor Gray
    Write-Host "  3. Creez vos premieres migrations : pnpm db:migrate:generate" -ForegroundColor Gray
}
else {
    Write-Host ""
    Write-Host "PROBLEME" -ForegroundColor Yellow
    Write-Host "========" -ForegroundColor Gray
    Write-Host "[ERREUR] PostgreSQL installe mais probleme de connexion" -ForegroundColor Red
    Write-Host "Verifications a faire :" -ForegroundColor Yellow
    Write-Host "  1. Service PostgreSQL demarre" -ForegroundColor Gray
    Write-Host "  2. Port 5432 disponible" -ForegroundColor Gray
    Write-Host "  3. Mot de passe correct: $Password" -ForegroundColor Gray
    Write-Host "  4. Pare-feu Windows autorise PostgreSQL" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Script termine a $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green