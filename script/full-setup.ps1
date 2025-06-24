# scripts/full-setup.ps1
# Script de setup complet avec installation automatique de PostgreSQL

param(
    [switch]$SkipPostgreSQL,
    [switch]$Force,
    [string]$PostgreSQLPassword = "postgres"
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

function Test-Command($Command) {
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Test-AdminRights() {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-PostgreSQL() {
    Write-ColorText "🗄️ Installation de PostgreSQL..." "Info"
    
    # Vérifier les droits admin
    if (-not (Test-AdminRights)) {
        Write-ColorText "⚠️ Droits administrateur requis pour installer PostgreSQL" "Warning"
        Write-ColorText "Relancez VS Code en tant qu'administrateur ou installez PostgreSQL manuellement" "Info"
        return $false
    }
    
    # Vérifier si winget est disponible
    if (Test-Command "winget") {
        Write-ColorText "📦 Installation via winget..." "Info"
        try {
            winget install --id PostgreSQL.PostgreSQL --silent --accept-package-agreements --accept-source-agreements
            Write-ColorText "✅ PostgreSQL installé via winget" "Success"
            
            # Attendre que l'installation soit terminée
            Start-Sleep 10
            
            return $true
        } catch {
            Write-ColorText "❌ Échec installation via winget: $($_.Exception.Message)" "Error"
        }
    }
    
    # Alternative: Chocolatey
    if (Test-Command "choco") {
        Write-ColorText "📦 Installation via Chocolatey..." "Info"
        try {
            choco install postgresql --yes --params "/Password:$PostgreSQLPassword"
            Write-ColorText "✅ PostgreSQL installé via Chocolatey" "Success"
            return $true
        } catch {
            Write-ColorText "❌ Échec installation via Chocolatey: $($_.Exception.Message)" "Error"
        }
    }
    
    # Installation manuelle
    Write-ColorText "📥 Téléchargement de PostgreSQL..." "Info"
    $downloadUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe"
    $installerPath = "$env:TEMP\postgresql-installer.exe"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
        Write-ColorText "✅ PostgreSQL téléchargé" "Success"
        
        Write-ColorText "🚀 Lancement de l'installation..." "Info"
        Start-Process -FilePath $installerPath -ArgumentList @(
            "--mode", "unattended",
            "--unattendedmodeui", "none",
            "--superpassword", $PostgreSQLPassword,
            "--servicename", "postgresql-x64-15",
            "--servicepassword", $PostgreSQLPassword,
            "--serverport", "5432"
        ) -Wait
        
        Write-ColorText "✅ PostgreSQL installé" "Success"
        return $true
    } catch {
        Write-ColorText "❌ Échec installation PostgreSQL: $($_.Exception.Message)" "Error"
        Write-ColorText "📝 Installez PostgreSQL manuellement depuis: https://www.postgresql.org/download/windows/" "Info"
        return $false
    }
}

function Start-PostgreSQLService() {
    Write-ColorText "🔄 Démarrage du service PostgreSQL..." "Info"
    
    $services = @("postgresql-x64-15", "postgresql-x64-14", "postgresql-x64-13", "postgresql", "PostgreSQL")
    
    foreach ($serviceName in $services) {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            if ($service.Status -ne "Running") {
                try {
                    Start-Service -Name $serviceName
                    Write-ColorText "✅ Service PostgreSQL démarré: $serviceName" "Success"
                    return $true
                } catch {
                    Write-ColorText "⚠️ Impossible de démarrer le service $serviceName" "Warning"
                }
            } else {
                Write-ColorText "✅ Service PostgreSQL déjà en cours: $serviceName" "Success"
                return $true
            }
        }
    }
    
    Write-ColorText "❌ Aucun service PostgreSQL trouvé" "Error"
    return $false
}

function Setup-Database() {
    Write-ColorText "🗄️ Configuration de la base de données..." "Info"
    
    # Attendre que PostgreSQL soit prêt
    Start-Sleep 5
    
    # Variables de connexion
    $env:PGPASSWORD = $PostgreSQLPassword
    
    try {
        # Tester la connexion
        $testConnection = psql -h localhost -U postgres -d postgres -c "SELECT 1;" 2>$null
        if (-not $testConnection) {
            Write-ColorText "❌ Impossible de se connecter à PostgreSQL" "Error"
            return $false
        }
        
        Write-ColorText "✅ Connexion PostgreSQL OK" "Success"
        
        # Créer la base de données de développement
        Write-ColorText "📊 Création de la base erp_topsteel_dev..." "Info"
        psql -h localhost -U postgres -d postgres -c "CREATE DATABASE erp_topsteel_dev;" 2>$null
        
        # Créer la base de test
        Write-ColorText "📊 Création de la base erp_topsteel_test..." "Info"
        psql -h localhost -U postgres -d postgres -c "CREATE DATABASE erp_topsteel_test;" 2>$null
        
        Write-ColorText "✅ Bases de données créées" "Success"
        return $true
        
    } catch {
        Write-ColorText "❌ Erreur lors de la configuration: $($_.Exception.Message)" "Error"
        return $false
    } finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Create-MissingDirectories() {
    Write-ColorText "📁 Création des dossiers manquants..." "Info"
    
    $directories = @(
        "apps/api/src/modules/clients/dto",
        "apps/api/src/modules/clients/entities",
        "apps/api/src/modules/devis/dto", 
        "apps/api/src/modules/devis/entities",
        "apps/api/src/modules/documents/dto",
        "apps/api/src/modules/documents/entities",
        "apps/api/src/modules/facturation/dto",
        "apps/api/src/modules/facturation/entities",
        "apps/api/src/modules/notifications/dto",
        "apps/api/src/modules/notifications/entities",
        "apps/api/src/modules/production/dto",
        "apps/api/src/modules/production/entities",
        "apps/api/src/modules/stocks/dto",
        "apps/api/src/modules/stocks/entities",
        "apps/api/src/common/decorators",
        "apps/api/src/common/guards",
        "apps/api/src/common/middleware",
        "apps/api/src/common/filters"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-ColorText "✅ Créé: $dir" "Success"
        }
    }
}

function Create-MissingFiles() {
    Write-ColorText "📄 Création des fichiers manquants..." "Info"
    
    # Créer les DTOs vides pour éviter les erreurs
    $dtoFiles = @(
        "apps/api/src/modules/fournisseurs/dto/create-fournisseur.dto.ts",
        "apps/api/src/modules/fournisseurs/dto/update-fournisseur.dto.ts",
        "apps/api/src/modules/projets/dto/create-projet.dto.ts",
        "apps/api/src/modules/projets/dto/update-projet.dto.ts",
        "apps/api/src/modules/projets/dto/projet-query.dto.ts"
    )
    
    foreach ($file in $dtoFiles) {
        if (-not (Test-Path $file)) {
            $className = (Split-Path $file -Leaf) -replace "\.ts$", "" | ForEach-Object { 
                $_ -split "-" | ForEach-Object { 
                    $_.Substring(0,1).ToUpper() + $_.Substring(1).ToLower() 
                } 
            } -join ""
            
            $content = @"
import { IsOptional, IsString } from 'class-validator';

export class $className {
  @IsString()
  @IsOptional()
  placeholder?: string;
}
"@
            Set-Content -Path $file -Value $content -Encoding UTF8
            Write-ColorText "✅ Créé: $file" "Success"
        }
    }
    
    # Créer les services manquants
    $missingServices = @(
        "apps/api/src/modules/clients/clients.service.ts",
        "apps/api/src/modules/users/users.service.ts"
    )
    
    foreach ($serviceFile in $missingServices) {
        if (-not (Test-Path $serviceFile)) {
            $serviceName = (Split-Path $serviceFile -Leaf) -replace "\.ts$", "" | ForEach-Object {
                $parts = $_ -split "\."
                $parts[0].Substring(0,1).ToUpper() + $parts[0].Substring(1) + $parts[1].Substring(0,1).ToUpper() + $parts[1].Substring(1)
            }
            
            $content = @"
import { Injectable } from '@nestjs/common';

@Injectable()
export class $serviceName {
  // TODO: Implémenter les méthodes du service
}
"@
            Set-Content -Path $serviceFile -Value $content -Encoding UTF8
            Write-ColorText "✅ Créé: $serviceFile" "Success"
        }
    }
}

function Update-EnvFiles() {
    Write-ColorText "⚙️ Mise à jour des fichiers d'environnement..." "Info"
    
    # Fichier .env pour l'API
    $apiEnvPath = "apps/api/.env.local"
    $apiEnvContent = @"
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
DB_PASSWORD=$PostgreSQLPassword
DB_NAME=erp_topsteel_dev
DB_SSL=false
DB_MAX_CONNECTIONS=100

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# JWT
JWT_SECRET=development-secret-key-change-in-production-$(Get-Random)
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=development-refresh-secret-$(Get-Random)
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=debug
LOG_FILE=true
"@
    
    Set-Content -Path $apiEnvPath -Value $apiEnvContent -Encoding UTF8
    Write-ColorText "✅ Fichier .env.local créé pour l'API" "Success"
    
    # Fichier .env pour le web
    $webEnvPath = "apps/web/.env.local"
    if (-not (Test-Path $webEnvPath)) {
        $webEnvContent = @"
# Base URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
NEXTAUTH_SECRET=nextauth-secret-$(Get-Random)
NEXTAUTH_URL=http://localhost:3000

# Optional services
NEXT_PUBLIC_SENTRY_DSN=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
"@
        Set-Content -Path $webEnvPath -Value $webEnvContent -Encoding UTF8
        Write-ColorText "✅ Fichier .env.local créé pour le Web" "Success"
    }
}

# SCRIPT PRINCIPAL
Clear-Host
Write-ColorText "🚀 SETUP COMPLET ERP TOPSTEEL" "Header"
Write-ColorText "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Info"

# Vérifier la structure du projet
if (-not (Test-Path "package.json")) {
    Write-ColorText "❌ Vous devez être dans la racine du projet ERP TOPSTEEL" "Error"
    exit 1
}

Write-ColorText "✅ Structure du projet validée" "Success"

# Phase 1: PostgreSQL
if (-not $SkipPostgreSQL) {
    Write-Section "🗄️ CONFIGURATION POSTGRESQL"
    
    if (-not (Test-Command "psql")) {
        Write-ColorText "PostgreSQL non trouvé. Installation automatique..." "Warning"
        $pgInstalled = Install-PostgreSQL
        
        if ($pgInstalled) {
            # Ajouter PostgreSQL au PATH
            $pgPath = "C:\Program Files\PostgreSQL\15\bin"
            if (Test-Path $pgPath) {
                $env:PATH += ";$pgPath"
                Write-ColorText "✅ PostgreSQL ajouté au PATH" "Success"
            }
        }
    } else {
        Write-ColorText "✅ PostgreSQL déjà installé" "Success"
    }
    
    # Démarrer le service
    Start-PostgreSQLService
    
    # Configurer les bases de données
    Setup-Database
}

# Phase 2: Structure du projet
Write-Section "🏗️ STRUCTURE DU PROJET"
Create-MissingDirectories
Create-MissingFiles

# Phase 3: Fichiers d'environnement
Write-Section "⚙️ CONFIGURATION"
Update-EnvFiles

# Phase 4: Dépendances
Write-Section "📦 DÉPENDANCES"

Write-ColorText "📦 Installation des dépendances..." "Info"
try {
    pnpm install
    Write-ColorText "✅ Dépendances installées" "Success"
} catch {
    Write-ColorText "❌ Erreur lors de l'installation des dépendances" "Error"
    Write-ColorText $_.Exception.Message "Error"
}

# Phase 5: Construction
Write-Section "🔨 CONSTRUCTION"

Write-ColorText "🔨 Construction des packages partagés..." "Info"
try {
    pnpm build --filter="!@erp/web" --filter="!@erp/api"
    Write-ColorText "✅ Packages construits" "Success"
} catch {
    Write-ColorText "⚠️ Certains packages n'ont pas pu être construits" "Warning"
}

# Phase 6: Vérification finale
Write-Section "✅ VÉRIFICATION FINALE"

& "$PSScriptRoot/check-environment.ps1"

# Résumé final
Write-Section "🎉 SETUP TERMINÉ"

Write-ColorText "🚀 Votre environnement ERP TopSteel est maintenant configuré !" "Success"
Write-ColorText "" "Info"
Write-ColorText "📋 Prochaines étapes :" "Info"
Write-ColorText "  1. 🔍 Vérifiez la configuration PostgreSQL" "Info"
Write-ColorText "  2. 🚀 Démarrez l'API : pnpm dev:api" "Info"
Write-ColorText "  3. 🌐 Démarrez le web : pnpm dev:web" "Info"
Write-ColorText "  4. 📚 Accédez à la doc API : http://localhost:3001/api/docs" "Info"
Write-ColorText "" "Info"
Write-ColorText "🔧 Commandes utiles :" "Info"
Write-ColorText "  • pnpm dev          - Démarre tout" "Info"
Write-ColorText "  • pnpm test         - Lance les tests" "Info"
Write-ColorText "  • pnpm lint         - Vérifie le code" "Info"

Write-ColorText "`n✨ Happy coding ! ✨" "Header"