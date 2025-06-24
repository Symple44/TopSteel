# scripts/postgres-diagnostic.ps1
# Script de diagnostic PostgreSQL pour VS Code

param(
    [string]$Password = "postgres",
    [switch]$Verbose,
    [switch]$Fix
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
    Write-Host "`n" + "="*60 -ForegroundColor $colors.Header
    Write-Host " $Title" -ForegroundColor $colors.Header
    Write-Host "="*60 -ForegroundColor $colors.Header
}

function Test-PostgreSQLInstallation() {
    Write-Section "🔍 VÉRIFICATION DE L'INSTALLATION"
    
    $results = @{
        Installed = $false
        BinPath = $null
        Version = $null
        InPath = $false
    }
    
    # 1. Vérifier les répertoires d'installation
    Write-ColorText "📁 Recherche dans les répertoires standards..." "Info"
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin", 
        "C:\Program Files\PostgreSQL\14\bin",
        "C:\Program Files (x86)\PostgreSQL\16\bin",
        "C:\Program Files (x86)\PostgreSQL\15\bin"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path "$path\psql.exe") {
            $results.Installed = $true
            $results.BinPath = $path
            try {
                $results.Version = & "$path\psql.exe" --version 2>$null
                Write-ColorText "✅ Trouvé: $path" "Success"
                Write-ColorText "   Version: $($results.Version)" "Info"
            } catch {
                Write-ColorText "⚠️ Trouvé mais erreur de version: $path" "Warning"
            }
            break
        }
    }
    
    if (-not $results.Installed) {
        Write-ColorText "❌ Aucune installation PostgreSQL trouvée" "Error"
    }
    
    # 2. Vérifier si psql est dans le PATH
    Write-ColorText "`n🛤️ Vérification du PATH..." "Info"
    try {
        $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
        if ($psqlPath) {
            $results.InPath = $true
            Write-ColorText "✅ psql disponible dans PATH: $($psqlPath.Source)" "Success"
        } else {
            Write-ColorText "❌ psql non disponible dans PATH" "Error"
        }
    } catch {
        Write-ColorText "❌ Erreur lors de la vérification PATH" "Error"
    }
    
    return $results
}

function Test-PostgreSQLServices() {
    Write-Section "⚙️ VÉRIFICATION DES SERVICES"
    
    $serviceNames = @(
        "postgresql-x64-16",
        "postgresql-x64-15", 
        "postgresql-x64-14",
        "postgresql-x64-13",
        "postgresql",
        "PostgreSQL"
    )
    
    $foundServices = @()
    
    Write-ColorText "🔍 Recherche des services PostgreSQL..." "Info"
    
    foreach ($serviceName in $serviceNames) {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            $foundServices += $service
            $statusColor = if ($service.Status -eq "Running") { "Success" } else { "Warning" }
            Write-ColorText "📍 Service: $($service.Name) - Status: $($service.Status)" $statusColor
        }
    }
    
    if ($foundServices.Count -eq 0) {
        Write-ColorText "❌ Aucun service PostgreSQL trouvé" "Error"
        
        # Afficher tous les services contenant "postgres"
        Write-ColorText "`n🔍 Services avec 'postgres' dans le nom:" "Info"
        $allPostgresServices = Get-Service | Where-Object { $_.Name -like "*postgres*" }
        if ($allPostgresServices) {
            foreach ($svc in $allPostgresServices) {
                Write-ColorText "  - $($svc.Name): $($svc.Status)" "Info"
            }
        } else {
            Write-ColorText "  Aucun service trouvé" "Warning"
        }
    }
    
    return $foundServices
}

function Test-PostgreSQLConnection() {
    Write-Section "🔗 TEST DE CONNEXION"
    
    $env:PGPASSWORD = $Password
    
    Write-ColorText "🔑 Tentative de connexion..." "Info"
    Write-ColorText "  Host: localhost" "Info"
    Write-ColorText "  Port: 5432" "Info"
    Write-ColorText "  User: postgres" "Info"
    Write-ColorText "  Password: $Password" "Info"
    
    try {
        $result = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();" 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "✅ Connexion réussie!" "Success"
            Write-ColorText "📊 Version PostgreSQL:" "Info"
            Write-ColorText "   $result" "Info"
            return $true
        } else {
            Write-ColorText "❌ Échec de connexion (Code: $LASTEXITCODE)" "Error"
        }
    } catch {
        Write-ColorText "❌ Erreur de connexion: $($_.Exception.Message)" "Error"
    }
    
    # Tests de diagnostic supplémentaires
    Write-ColorText "`n🔧 Diagnostic réseau..." "Info"
    
    # Test de port
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", 5432)
        $tcpClient.Close()
        Write-ColorText "✅ Port 5432 accessible" "Success"
    } catch {
        Write-ColorText "❌ Port 5432 non accessible" "Error"
        Write-ColorText "   Causes possibles:" "Warning"
        Write-ColorText "   - Service PostgreSQL arrêté" "Info"
        Write-ColorText "   - Port utilisé par un autre processus" "Info"
        Write-ColorText "   - Pare-feu bloque le port" "Info"
    }
    
    return $false
}

function Test-DatabaseExists() {
    Write-Section "🗃️ VÉRIFICATION DES BASES DE DONNÉES"
    
    $env:PGPASSWORD = $Password
    $expectedDatabases = @("erp_topsteel_dev", "erp_topsteel_test")
    
    foreach ($db in $expectedDatabases) {
        try {
            $exists = psql -h localhost -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db';" 2>$null
            
            if ($exists -eq "1") {
                Write-ColorText "✅ Base de données '$db' existe" "Success"
            } else {
                Write-ColorText "❌ Base de données '$db' n'existe pas" "Error"
                
                if ($Fix) {
                    Write-ColorText "🔧 Création de la base '$db'..." "Info"
                    psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE $db;" 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        Write-ColorText "✅ Base '$db' créée avec succès" "Success"
                    } else {
                        Write-ColorText "❌ Échec de création de '$db'" "Error"
                    }
                }
            }
        } catch {
            Write-ColorText "❌ Erreur lors de la vérification de '$db': $($_.Exception.Message)" "Error"
        }
    }
}

function Test-EnvironmentFiles() {
    Write-Section "📝 VÉRIFICATION DES FICHIERS D'ENVIRONNEMENT"
    
    $envFiles = @(
        @{ Path = "apps/api/.env.local"; Required = $true; Description = "Configuration API" },
        @{ Path = "apps/web/.env.local"; Required = $false; Description = "Configuration Frontend" }
    )
    
    foreach ($envFile in $envFiles) {
        if (Test-Path $envFile.Path) {
            Write-ColorText "✅ $($envFile.Path) existe" "Success"
            
            # Vérifier les variables PostgreSQL importantes
            $content = Get-Content $envFile.Path -ErrorAction SilentlyContinue
            $pgVars = @("DB_HOST", "DB_PORT", "DB_USERNAME", "DB_PASSWORD", "DB_NAME")
            
            foreach ($var in $pgVars) {
                $found = $content | Where-Object { $_ -like "$var=*" }
                if ($found) {
                    Write-ColorText "  ✅ $var configuré" "Success"
                } else {
                    Write-ColorText "  ❌ $var manquant" "Warning"
                }
            }
        } else {
            $color = if ($envFile.Required) { "Error" } else { "Warning" }
            Write-ColorText "❌ $($envFile.Path) n'existe pas" $color
            
            if ($Fix -and $envFile.Required) {
                $examplePath = $envFile.Path -replace "\.local$", ".example"
                if (Test-Path $examplePath) {
                    Write-ColorText "🔧 Création depuis $examplePath..." "Info"
                    Copy-Item $examplePath $envFile.Path
                    Write-ColorText "✅ Fichier créé" "Success"
                }
            }
        }
    }
}

function Get-SystemInfo() {
    Write-Section "💻 INFORMATIONS SYSTÈME"
    
    Write-ColorText "🖥️ OS: $((Get-WmiObject Win32_OperatingSystem).Caption)" "Info"
    Write-ColorText "🏛️ Architecture: $($env:PROCESSOR_ARCHITECTURE)" "Info"
    Write-ColorText "👤 Utilisateur: $($env:USERNAME)" "Info"
    Write-ColorText "📁 Répertoire de travail: $(Get-Location)" "Info"
    
    # Vérifier les droits admin
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    $adminColor = if ($isAdmin) { "Success" } else { "Warning" }
    Write-ColorText "🔑 Droits administrateur: $isAdmin" $adminColor
    
    # Ports utilisés
    Write-ColorText "`n🌐 Ports réseau PostgreSQL:" "Info"
    try {
        $connections = netstat -an | findstr ":5432"
        if ($connections) {
            foreach ($conn in $connections) {
                Write-ColorText "  $conn" "Info"
            }
        } else {
            Write-ColorText "  Aucune connexion sur le port 5432" "Warning"
        }
    } catch {
        Write-ColorText "  Impossible de vérifier les ports" "Warning"
    }
}

function Show-Recommendations() {
    Write-Section "💡 RECOMMANDATIONS"
    
    Write-ColorText "🎯 Actions suggérées:" "Info"
    Write-ColorText "" "Info"
    
    if (-not (Test-Path "apps/api/.env.local")) {
        Write-ColorText "1. Créer le fichier .env.local:" "Warning"
        Write-ColorText "   cp apps/api/.env.example apps/api/.env.local" "Info"
    }
    
    Write-ColorText "2. Pour installer PostgreSQL automatiquement:" "Info"
    Write-ColorText "   .\scripts\setup-postgres.ps1" "Info"
    Write-ColorText "" "Info"
    
    Write-ColorText "3. Pour démarrer le service manuellement:" "Info"
    Write-ColorText "   Start-Service postgresql-x64-15" "Info"
    Write-ColorText "" "Info"
    
    Write-ColorText "4. Commandes VS Code utiles:" "Info"
    Write-ColorText "   Ctrl+Shift+P → 'Tasks: Run Task' → '🗄️ Setup PostgreSQL'" "Info"
    Write-ColorText "   Ctrl+Shift+P → 'Tasks: Run Task' → '🔄 PostgreSQL - Service Start'" "Info"
    Write-ColorText "" "Info"
    
    Write-ColorText "5. En cas de problème persistant:" "Info"
    Write-ColorText "   - Relancer VS Code en administrateur" "Info"
    Write-ColorText "   - Vérifier le pare-feu Windows" "Info"
    Write-ColorText "   - Installation manuelle: https://www.postgresql.org/download/windows/" "Info"
}

# ================================
# SCRIPT PRINCIPAL  
# ================================

Write-Section "🔍 DIAGNOSTIC POSTGRESQL - ERP TOPSTEEL"
Write-ColorText "Diagnostic démarré à $(Get-Date -Format 'HH:mm:ss')" "Info"

if ($Fix) {
    Write-ColorText "🔧 Mode correction activé" "Warning"
}

# Exécuter tous les tests
Get-SystemInfo
$installation = Test-PostgreSQLInstallation
$services = Test-PostgreSQLServices
Test-EnvironmentFiles

# Test de connexion seulement si PostgreSQL semble installé
if ($installation.Installed -and $services.Count -gt 0) {
    $connectionOk = Test-PostgreSQLConnection
    
    if ($connectionOk) {
        Test-DatabaseExists
        
        Write-Section "🎉 RÉSULTAT"
        Write-ColorText "✅ PostgreSQL est opérationnel!" "Success"
        Write-ColorText "🚀 Vous pouvez démarrer le développement avec:" "Info"
        Write-ColorText "   pnpm dev" "Info"
    } else {
        Write-Section "❌ PROBLÈME DÉTECTÉ"
        Write-ColorText "PostgreSQL est installé mais la connexion échoue" "Error"
        Show-Recommendations
    }
} else {
    Write-Section "❌ PROBLÈME DÉTECTÉ"
    Write-ColorText "PostgreSQL n'est pas correctement installé ou configuré" "Error"
    Show-Recommendations
}

Write-ColorText "`n✅ Diagnostic terminé à $(Get-Date -Format 'HH:mm:ss')" "Success"

if (-not $Fix) {
    Write-ColorText "`n💡 Relancez avec -Fix pour tenter des corrections automatiques:" "Info"
    Write-ColorText "   .\scripts\postgres-diagnostic.ps1 -Fix" "Info"
}