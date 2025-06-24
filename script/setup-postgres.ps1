# scripts/setup-postgres.ps1
# Script dédié à l'installation et configuration de PostgreSQL

param(
    [string]$Password = "postgres",
    [switch]$Force,
    [switch]$Verbose
)

# Configuration des couleurs
$colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorText($Text, $Color) {
    Write-Host $Text -ForegroundColor $colors[$Color]
}

function Write-Section($Title) {
    Write-Host "`n" + "="*50 -ForegroundColor $colors.Header
    Write-Host " $Title" -ForegroundColor $colors.Header
    Write-Host "="*50 -ForegroundColor $colors.Header
}

function Test-Command($Command) {
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Test-AdminRights() {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-PostgreSQLWindows() {
    Write-ColorText "🗄️ Installation de PostgreSQL sur Windows..." "Info"
    
    # Vérifier les droits admin
    if (-not (Test-AdminRights)) {
        Write-ColorText "⚠️ Droits administrateur requis pour installer PostgreSQL" "Warning"
        Write-ColorText "Solutions:" "Info"
        Write-ColorText "  1. Relancez VS Code en tant qu'administrateur" "Info"
        Write-ColorText "  2. Ou installez PostgreSQL manuellement depuis: https://www.postgresql.org/download/windows/" "Info"
        return $false
    }
    
    # Méthode 1: winget (Windows 10/11)
    if (Test-Command "winget") {
        Write-ColorText "📦 Tentative d'installation via winget..." "Info"
        try {
            $result = winget install --id PostgreSQL.PostgreSQL --silent --accept-package-agreements --accept-source-agreements
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "✅ PostgreSQL installé via winget" "Success"
                Start-Sleep 15  # Attendre la fin de l'installation
                return $true
            }
        } catch {
            Write-ColorText "⚠️ Échec installation via winget: $($_.Exception.Message)" "Warning"
        }
    }
    
    # Méthode 2: Chocolatey
    if (Test-Command "choco") {
        Write-ColorText "📦 Tentative d'installation via Chocolatey..." "Info"
        try {
            choco install postgresql --yes --params "/Password:$Password"
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "✅ PostgreSQL installé via Chocolatey" "Success"
                return $true
            }
        } catch {
            Write-ColorText "⚠️ Échec installation via Chocolatey: $($_.Exception.Message)" "Warning"
        }
    }
    
    # Méthode 3: Téléchargement direct
    Write-ColorText "📥 Téléchargement et installation manuelle..." "Info"
    $downloadUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe"
    $installerPath = "$env:TEMP\postgresql-installer.exe"
    
    try {
        Write-ColorText "⬇️ Téléchargement de PostgreSQL..." "Info"
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
        
        Write-ColorText "🚀 Installation silencieuse en cours..." "Info"
        $installArgs = @(
            "--mode", "unattended",
            "--unattendedmodeui", "none",
            "--superpassword", $Password,
            "--servicename", "postgresql-x64-15",
            "--servicepassword", $Password,
            "--serverport", "5432"
        )
        
        Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -NoNewWindow
        
        # Nettoyer le fichier temporaire
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
        
        Write-ColorText "✅ PostgreSQL installé avec succès" "Success"
        return $true
        
    } catch {
        Write-ColorText "❌ Erreur lors de l'installation: $($_.Exception.Message)" "Error"
        Write-ColorText "📝 Veuillez installer PostgreSQL manuellement depuis: https://www.postgresql.org/download/windows/" "Info"
        return $false
    }
}

function Start-PostgreSQLService() {
    Write-ColorText "🔄 Démarrage du service PostgreSQL..." "Info"
    
    # Noms de services possibles
    $serviceNames = @("postgresql-x64-15", "postgresql-x64-14", "postgresql-x64-13", "postgresql", "PostgreSQL")
    
    foreach ($serviceName in $serviceNames) {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            Write-ColorText "📍 Service trouvé: $serviceName" "Info"
            
            if ($service.Status -ne "Running") {
                try {
                    Start-Service -Name $serviceName
                    Write-ColorText "✅ Service PostgreSQL démarré: $serviceName" "Success"
                    return $true
                } catch {
                    Write-ColorText "⚠️ Impossible de démarrer le service $serviceName : $($_.Exception.Message)" "Warning"
                }
            } else {
                Write-ColorText "✅ Service PostgreSQL déjà en cours: $serviceName" "Success"
                return $true
            }
        }
    }
    
    Write-ColorText "❌ Aucun service PostgreSQL trouvé" "Error"
    Write-ColorText "📝 Services disponibles:" "Info"
    Get-Service | Where-Object { $_.Name -like "*postgres*" } | ForEach-Object {
        Write-ColorText "  - $($_.Name): $($_.Status)" "Info"
    }
    
    return $false
}

function Add-PostgreSQLToPath() {
    Write-ColorText "🛤️ Ajout de PostgreSQL au PATH..." "Info"
    
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin",
        "C:\Program Files\PostgreSQL\13\bin",
        "C:\PostgreSQL\15\bin",
        "C:\PostgreSQL\14\bin"
    )
    
    foreach ($pgPath in $possiblePaths) {
        if (Test-Path $pgPath) {
            $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
            if ($currentPath -notlike "*$pgPath*") {
                [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$pgPath", "User")
                $env:PATH += ";$pgPath"
                Write-ColorText "✅ PostgreSQL ajouté au PATH: $pgPath" "Success"
                return $true
            } else {
                Write-ColorText "✅ PostgreSQL déjà dans le PATH: $pgPath" "Success"
                return $true
            }
        }
    }
    
    Write-ColorText "⚠️ Impossible de trouver le dossier bin de PostgreSQL" "Warning"
    return $false
}

function Test-PostgreSQLConnection() {
    Write-ColorText "🔌 Test de connexion à PostgreSQL..." "Info"
    
    # Attendre que PostgreSQL soit prêt
    Start-Sleep 5
    
    $env:PGPASSWORD = $Password
    
    try {
        $result = psql -h localhost -U postgres -d postgres -c "SELECT version();" 2>$null
        if ($result -and $result -match "PostgreSQL") {
            Write-ColorText "✅ Connexion PostgreSQL réussie" "Success"
            Write-ColorText "📊 Version: $($result | Select-String 'PostgreSQL')" "Info"
            return $true
        } else {
            Write-ColorText "❌ Impossible de se connecter à PostgreSQL" "Error"
            return $false
        }
    } catch {
        Write-ColorText "❌ Erreur de connexion: $($_.Exception.Message)" "Error"
        return $false
    } finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Create-Databases() {
    Write-ColorText "🗃️ Création des bases de données..." "Info"
    
    $env:PGPASSWORD = $Password
    
    $databases = @("erp_topsteel_dev", "erp_topsteel_test")
    
    foreach ($dbName in $databases) {
        try {
            Write-ColorText "📊 Création de la base: $dbName" "Info"
            $result = psql -h localhost -U postgres -d postgres -c "CREATE DATABASE $dbName;" 2>$null
            
            # Vérifier si la base existe (même si elle existait déjà)
            $checkResult = psql -h localhost -U postgres -d postgres -c "SELECT datname FROM pg_database WHERE datname='$dbName';" 2>$null
            if ($checkResult -match $dbName) {
                Write-ColorText "✅ Base de données '$dbName' prête" "Success"
            }
        } catch {
            Write-ColorText "⚠️ Erreur lors de la création de $dbName : $($_.Exception.Message)" "Warning"
        }
    }
    
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
}

function Update-EnvFile() {
    Write-ColorText "📝 Mise à jour du fichier .env.local..." "Info"
    
    $envPath = "apps/api/.env.local"
    $envContent = @"
# Application
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$Password
DB_NAME=erp_topsteel_dev
DB_SSL=false
DB_MAX_CONNECTIONS=100

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=development-secret-key-$(Get-Random)
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=development-refresh-secret-$(Get-Random)
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=debug
"@
    
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-ColorText "✅ Fichier .env.local mis à jour" "Success"
}

# SCRIPT PRINCIPAL
Clear-Host
Write-ColorText "🗄️ CONFIGURATION POSTGRESQL - ERP TOPSTEEL" "Header"
Write-ColorText "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Info"

# Vérification préalable
if (-not (Test-Path "package.json")) {
    Write-ColorText "❌ Vous devez être dans la racine du projet ERP TOPSTEEL" "Error"
    exit 1
}

# Phase 1: Vérifier si PostgreSQL est déjà installé
Write-Section "🔍 VÉRIFICATION"

if (Test-Command "psql") {
    Write-ColorText "✅ PostgreSQL déjà installé" "Success"
    
    if (Start-PostgreSQLService) {
        if (Test-PostgreSQLConnection) {
            Write-ColorText "🎉 PostgreSQL fonctionne parfaitement !" "Success"
            Create-Databases
            Update-EnvFile
            
            Write-Section "✅ CONFIGURATION TERMINÉE"
            Write-ColorText "🚀 PostgreSQL est prêt pour le développement !" "Success"
            Write-ColorText "" "Info"
            Write-ColorText "📋 Informations de connexion :" "Info"
            Write-ColorText "  Host: localhost" "Info"
            Write-ColorText "  Port: 5432" "Info"
            Write-ColorText "  User: postgres" "Info"
            Write-ColorText "  Password: $Password" "Info"
            Write-ColorText "  Databases: erp_topsteel_dev, erp_topsteel_test" "Info"
            exit 0
        }
    }
} else {
    Write-ColorText "❌ PostgreSQL non installé" "Error"
}

# Phase 2: Installation
Write-Section "📦 INSTALLATION"

$installSuccess = Install-PostgreSQLWindows

if (-not $installSuccess) {
    Write-ColorText "❌ Échec de l'installation automatique" "Error"
    Write-ColorText "📋 Installation manuelle requise :" "Info"
    Write-ColorText "  1. Téléchargez PostgreSQL: https://www.postgresql.org/download/windows/" "Info"
    Write-ColorText "  2. Utilisez le mot de passe: $Password" "Info"
    Write-ColorText "  3. Relancez ce script après l'installation" "Info"
    exit 1
}

# Phase 3: Configuration post-installation
Write-Section "⚙️ CONFIGURATION"

Add-PostgreSQLToPath
Start-PostgreSQLService

if (Test-PostgreSQLConnection) {
    Create-Databases
    Update-EnvFile
    
    Write-Section "🎉 SUCCÈS"
    Write-ColorText "✅ PostgreSQL installé et configuré avec succès !" "Success"
    Write-ColorText "" "Info"
    Write-ColorText "📋 Prochaines étapes :" "Info"
    Write-ColorText "  1. 🚀 Démarrez l'API : pnpm dev:api" "Info"
    Write-ColorText "  2. 🗄️ Testez la connexion DB dans votre application" "Info"
    Write-ColorText "  3. 📊 Créez vos premières migrations : pnpm db:migrate:generate" "Info"
    
} else {
    Write-ColorText "❌ PostgreSQL installé mais problème de connexion" "Error"
    Write-ColorText "🔧 Vérifications à faire :" "Info"
    Write-ColorText "  1. Service PostgreSQL démarré" "Info"
    Write-ColorText "  2. Port 5432 disponible" "Info"
    Write-ColorText "  3. Mot de passe correct: $Password" "Info"
}

Write-ColorText "`n✅ Script terminé à $(Get-Date -Format 'HH:mm:ss')" "Success"