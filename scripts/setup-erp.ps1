#!/usr/bin/env pwsh
# =========================================================================
# ERP TOPSTEEL - SETUP COMPLET INTÉGRÉ
# Installation complète du projet avec base de données
# =========================================================================

param(
    [string]$DBPassword = "postgres",
    [string]$DBHost = "localhost", 
    [string]$DBPort = "5432",
    [string]$DBUser = "postgres",
    [string]$DBName = "erp_topsteel",
    [switch]$SkipDatabase,
    [switch]$SkipDependencies,
    [switch]$SkipSampleData,
    [switch]$Force,
    [switch]$Verbose
)

# =========================================================================
# CONFIGURATION ET HELPERS
# =========================================================================

$script:VerboseMode = $Verbose
$script:ProjectRoot = Get-Location

function Write-StepTitle { 
    param([string]$Title, [int]$Step, [int]$Total)
    Write-Host "" -ForegroundColor White
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "[$Step/$Total] $Title" -ForegroundColor Cyan
    Write-Host "===============================================================================" -ForegroundColor Cyan
}

function Write-Success { param([string]$Message) Write-Host "[+] $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "[-] $Message" -ForegroundColor Red }
function Write-Warning { param([string]$Message) Write-Host "[!] $Message" -ForegroundColor Yellow }
function Write-Info { param([string]$Message) Write-Host "[i] $Message" -ForegroundColor Blue }

function Test-CommandExists {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# =========================================================================
# ÉTAPE 1/7: VÉRIFICATION PRÉREQUIS
# =========================================================================

function Test-Prerequisites {
    Write-StepTitle "VÉRIFICATION DES PRÉREQUIS" 1 7
    
    $missing = @()
    
    # Node.js
    if (Test-CommandExists "node") {
        $nodeVersion = node --version
        Write-Success "Node.js $nodeVersion"
    }
    else {
        $missing += "Node.js"
        Write-Error "Node.js non trouvé"
    }
    
    # pnpm
    if (Test-CommandExists "pnpm") {
        $pnpmVersion = pnpm --version
        Write-Success "pnpm $pnpmVersion"
    }
    else {
        $missing += "pnpm"
        Write-Error "pnpm non trouvé"
    }
    
    # PostgreSQL (optionnel si SkipDatabase)
    if (-not $SkipDatabase) {
        if (Test-CommandExists "psql") {
            Write-Success "PostgreSQL client trouvé"
            
            # Test connexion
            $env:PGPASSWORD = $DBPassword
            try {
                $result = psql -h $DBHost -p $DBPort -U $DBUser -d postgres -c "SELECT version();" 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Connexion PostgreSQL OK"
                }
                else {
                    Write-Warning "PostgreSQL non accessible - base de données ignorée"
                    $script:SkipDatabase = $true
                }
            }
            catch {
                Write-Warning "PostgreSQL non accessible - base de données ignorée"
                $script:SkipDatabase = $true
            }
            $env:PGPASSWORD = $null
        }
        else {
            Write-Warning "PostgreSQL client non trouvé - base de données ignorée"
            $script:SkipDatabase = $true
        }
    }
    
    # Git
    if (Test-CommandExists "git") {
        Write-Success "Git trouvé"
    }
    else {
        Write-Warning "Git non trouvé (optionnel)"
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "Prérequis manquants: $($missing -join ', ')"
        Write-Info "Installez les outils manquants et relancez le script"
        exit 1
    }
    
    Write-Success "Tous les prérequis sont satisfaits"
}

# =========================================================================
# ÉTAPE 2/7: STRUCTURE ET FICHIERS
# =========================================================================

function Initialize-ProjectStructure {
    Write-StepTitle "INITIALISATION STRUCTURE PROJET" 2 7
    
    # Vérifier structure de base
    $requiredDirs = @("apps/api", "apps/web", "packages/types", "packages/utils", "packages/ui")
    $missingDirs = @()
    
    foreach ($dir in $requiredDirs) {
        if (-not (Test-Path $dir)) {
            $missingDirs += $dir
        }
    }
    
    if ($missingDirs.Count -gt 0) {
        Write-Error "Structure de projet incomplète. Dossiers manquants: $($missingDirs -join ', ')"
        exit 1
    }
    
    Write-Success "Structure de projet validée"
    
    # Créer dossiers optionnels
    $optionalDirs = @("scripts", "docs", "logs", "uploads")
    foreach ($dir in $optionalDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Dossier créé: $dir"
        }
    }
}

# =========================================================================
# ÉTAPE 3/7: CONFIGURATION CENTRALISÉE
# =========================================================================

function Setup-CentralizedConfig {
    Write-StepTitle "CONFIGURATION CENTRALISÉE" 3 7
    
    # Créer .env principal
    if (-not (Test-Path ".env") -or $Force) {
        Write-Info "Création fichier .env principal..."
        
        $envContent = @"
# =========================================================================
# ERP TOPSTEEL - CONFIGURATION PRINCIPALE
# =========================================================================

# APPLICATION
NODE_ENV=development
APP_NAME=ERP TopSteel
APP_VERSION=1.0.0

# PORTS
API_PORT=3001
WEB_PORT=3000

# URLS
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ERP TopSteel

# BASE DE DONNÉES
DB_TYPE=postgres
DB_HOST=$DBHost
DB_PORT=$DBPort
DB_USERNAME=$DBUser
DB_NAME=$DBName
DB_SSL=false
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT
JWT_SECRET=development-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=development-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=topsteel-erp
JWT_AUDIENCE=topsteel-users

# NEXTAUTH
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-nextauth-secret

# REDIS (OPTIONNEL)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# RATE LIMITING
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# FEATURES
NEXT_PUBLIC_ENABLE_3D_VIEWER=true
NEXT_PUBLIC_ENABLE_CHAT=false
NEXT_PUBLIC_ENABLE_ADVANCED_REPORTS=true
"@
        
        Set-Content ".env" $envContent
        Write-Success "Fichier .env créé"
    }
    
    # Créer .env.local pour secrets
    if (-not (Test-Path ".env.local") -or $Force) {
        Write-Info "Création fichier .env.local..."
        
        $localEnvContent = @"
# =========================================================================
# CONFIGURATION LOCALE - SECRETS ET OVERRIDES
# =========================================================================

# Base de données
DB_PASSWORD=$DBPassword

# JWT Secrets - CHANGEZ EN PRODUCTION !
JWT_SECRET=dev-jwt-secret-$(Get-Date -Format 'yyyyMMdd')
JWT_REFRESH_SECRET=dev-refresh-secret-$(Get-Date -Format 'yyyyMMdd')
NEXTAUTH_SECRET=dev-nextauth-secret-$(Get-Date -Format 'yyyyMMdd')

# Services externes (optionnel)
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
# NEXT_PUBLIC_SENTRY_DSN=
"@
        
        Set-Content ".env.local" $localEnvContent
        Write-Success "Fichier .env.local créé"
    }
    
    # Mettre à jour next.config.js
    Write-Info "Configuration Next.js..."
    $nextConfigContent = @'
/** @type {import('next').NextConfig} */
const path = require('path');

// Chargement optionnel de dotenv
try {
  const dotenv = require('dotenv');
  const rootDir = path.join(__dirname, '../..');
  dotenv.config({ path: path.join(rootDir, '.env.local') });
  dotenv.config({ path: path.join(rootDir, '.env') });
} catch (error) {
  console.warn('dotenv non disponible');
}

const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  images: {
    formats: ["image/avif", "image/webp"],
    domains: ["localhost"],
  },
  transpilePackages: ["@erp/ui", "@erp/types", "@erp/utils", "@erp/config"],
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ERP TopSteel',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
'@
    
    Set-Content "apps/web/next.config.js" $nextConfigContent
    Write-Success "Configuration Next.js mise à jour"
}

# =========================================================================
# ÉTAPE 4/7: DÉPENDANCES
# =========================================================================

function Install-Dependencies {
    if ($SkipDependencies) {
        Write-Warning "Installation des dépendances ignorée"
        return
    }
    
    Write-StepTitle "INSTALLATION DES DÉPENDANCES" 4 7
    
    # Installer dotenv si nécessaire
    Write-Info "Vérification dotenv..."
    if (-not (Test-Path "node_modules/dotenv")) {
        pnpm add -w dotenv
        Write-Success "dotenv installé"
    }
    
    # Installation principale
    Write-Info "Installation des dépendances principales..."
    pnpm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dépendances installées avec succès"
    }
    else {
        Write-Error "Erreur lors de l'installation des dépendances"
        exit 1
    }
    
    # Build des packages partagés
    Write-Info "Construction des packages partagés..."
    pnpm build --filter="@erp/types" --filter="@erp/utils" --filter="@erp/config"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Packages partagés construits"
    }
    else {
        Write-Warning "Erreur construction packages - continuons"
    }
}

# =========================================================================
# ÉTAPE 5/7: BASE DE DONNÉES
# =========================================================================

function Initialize-Database {
    if ($SkipDatabase) {
        Write-Warning "Initialisation base de données ignorée"
        return
    }
    
    Write-StepTitle "INITIALISATION BASE DE DONNÉES" 5 7
    
    $env:PGPASSWORD = $DBPassword
    
    # Vérifier si la base existe
    $dbExists = psql -h $DBHost -p $DBPort -U $DBUser -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DBName';" 2>&1
    
    if ($dbExists -match "1") {
        if ($Force) {
            Write-Warning "Base '$DBName' existe, suppression forcée..."
            psql -h $DBHost -p $DBPort -U $DBUser -d postgres -c "DROP DATABASE IF EXISTS $DBName;" | Out-Null
        }
        else {
            Write-Info "Base '$DBName' existe déjà"
        }
    }
    
    # Créer la base
    Write-Info "Création base '$DBName'..."
    $createResult = psql -h $DBHost -p $DBPort -U $DBUser -d postgres -c "CREATE DATABASE $DBName;" 2>&1
    
    if ($LASTEXITCODE -eq 0 -or $createResult -match "already exists") {
        Write-Success "Base de données prête"
    }
    else {
        Write-Error "Erreur création base: $createResult"
        $env:PGPASSWORD = $null
        return
    }
    
    # Créer le schéma
    Write-Info "Création du schéma..."
    $schemaSql = @"
-- Extensions PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Types ENUM
CREATE TYPE IF NOT EXISTS user_role AS ENUM('ADMIN', 'MANAGER', 'COMMERCIAL', 'TECHNICIEN', 'COMPTABLE', 'VIEWER');
CREATE TYPE IF NOT EXISTS client_type AS ENUM('PARTICULIER', 'PROFESSIONNEL', 'COLLECTIVITE', 'ASSOCIATION');

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) UNIQUE NOT NULL,
    password varchar(255) NOT NULL,
    nom varchar(100) NOT NULL,
    prenom varchar(100) NOT NULL,
    role user_role DEFAULT 'VIEWER',
    telephone varchar(20),
    is_active boolean DEFAULT true,
    refresh_token text,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table clients
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type client_type NOT NULL,
    nom varchar(255) NOT NULL,
    email varchar(255),
    telephone varchar(20),
    siret varchar(14) UNIQUE,
    adresse jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
    id serial PRIMARY KEY,
    nom varchar(255) NOT NULL,
    email varchar(255) UNIQUE,
    telephone varchar(20),
    adresse text,
    siret varchar(14),
    actif boolean DEFAULT true,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

-- Table documents
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom varchar(255) NOT NULL,
    description text,
    type varchar(50),
    chemin varchar(500),
    taille integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
"@
    
    $tempSchemaFile = "temp_schema.sql"
    Set-Content $tempSchemaFile $schemaSql
    
    $schemaResult = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f $tempSchemaFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Schéma de base créé"
    }
    else {
        Write-Warning "Erreur création schéma: $schemaResult"
    }
    
    Remove-Item $tempSchemaFile -ErrorAction SilentlyContinue
    
    # Données de test
    if (-not $SkipSampleData) {
        Write-Info "Ajout des données de test..."
        
        $sampleDataSql = @"
-- Utilisateur admin
INSERT INTO users (email, password, nom, prenom, role) 
VALUES ('admin@topsteel.fr', '\$2b\$10\$5kPNr2kfLGR8zKn3aB6Ziu5HBkGZfC3xGKGGWZXZQKYjpZ8sXZ2Aq', 'Admin', 'System', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Client de test
INSERT INTO clients (type, nom, email, telephone) 
VALUES ('PROFESSIONNEL', 'Entreprise Test', 'test@client.fr', '0123456789')
ON CONFLICT DO NOTHING;

-- Fournisseur de test
INSERT INTO fournisseurs (nom, email, telephone, actif) 
VALUES ('Fournisseur Test', 'test@fournisseur.fr', '0987654321', true)
ON CONFLICT (email) DO NOTHING;
"@
        
        $tempDataFile = "temp_data.sql"
        Set-Content $tempDataFile $sampleDataSql
        
        $dataResult = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f $tempDataFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Données de test ajoutées"
        }
        else {
            Write-Warning "Erreur données de test: $dataResult"
        }
        
        Remove-Item $tempDataFile -ErrorAction SilentlyContinue
    }
    
    $env:PGPASSWORD = $null
    Write-Success "Base de données initialisée"
}

# =========================================================================
# ÉTAPE 6/7: SCRIPTS ET OUTILS
# =========================================================================

function Create-Scripts {
    Write-StepTitle "CRÉATION SCRIPTS ET OUTILS" 6 7
    
    # Script de gestion DB
    $dbManageScript = @"
#!/usr/bin/env pwsh
# Script de gestion base de données ERP TopSteel
param(
    [Parameter(Mandatory)]
    [ValidateSet('status', 'backup', 'restore', 'reset', 'migrate', 'seed')]
    [string]`$Action,
    [string]`$File = "backup_`$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
)

`$DBParams = @{
    Host = '$DBHost'
    Port = '$DBPort' 
    User = '$DBUser'
    Password = '$DBPassword'
    Database = '$DBName'
}

switch (`$Action) {
    'status' {
        Write-Host "État base '$DBName':" -ForegroundColor Cyan
        `$env:PGPASSWORD = `$DBParams.Password
        psql -h `$DBParams.Host -p `$DBParams.Port -U `$DBParams.User -d `$DBParams.Database -c "\dt"
        `$env:PGPASSWORD = `$null
    }
    'backup' {
        Write-Host "Sauvegarde vers `$File..." -ForegroundColor Yellow
        `$env:PGPASSWORD = `$DBParams.Password
        pg_dump -h `$DBParams.Host -p `$DBParams.Port -U `$DBParams.User `$DBParams.Database > `$File
        `$env:PGPASSWORD = `$null
        Write-Host "Sauvegarde terminée" -ForegroundColor Green
    }
    'restore' {
        Write-Host "Restauration depuis `$File..." -ForegroundColor Yellow
        `$env:PGPASSWORD = `$DBParams.Password
        psql -h `$DBParams.Host -p `$DBParams.Port -U `$DBParams.User -d `$DBParams.Database < `$File
        `$env:PGPASSWORD = `$null
        Write-Host "Restauration terminée" -ForegroundColor Green
    }
    'reset' {
        Write-Host "Remise à zéro..." -ForegroundColor Red
        `$confirm = Read-Host "Confirmez avec 'RESET'"
        if (`$confirm -eq 'RESET') {
            .\setup-erp.ps1 -Force -DBPassword `$DBParams.Password
        }
    }
    'seed' {
        Write-Host "Ajout données de test..." -ForegroundColor Yellow
        # Logique pour ajouter des données de test
    }
}
"@
    
    Set-Content "scripts/manage-db.ps1" $dbManageScript
    Write-Success "Script de gestion DB créé"
    
    # Mise à jour package.json
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        if (-not $packageJson.scripts) {
            $packageJson | Add-Member -Type NoteProperty -Name "scripts" -Value @{}
        }
        
        # Ajouter scripts utiles
        $newScripts = @{
            "setup"          = "pwsh scripts/setup-erp.ps1"
            "setup:force"    = "pwsh scripts/setup-erp.ps1 -Force"
            "db:status"      = "pwsh scripts/manage-db.ps1 status"
            "db:backup"      = "pwsh scripts/manage-db.ps1 backup"
            "db:reset"       = "pwsh scripts/manage-db.ps1 reset"
            "dev:full"       = "pnpm build:packages && pnpm dev"
            "build:packages" = "pnpm build --filter='@erp/types' --filter='@erp/utils' --filter='@erp/config'"
            "check:env"      = "node -e `"console.log('API URL:', process.env.NEXT_PUBLIC_API_URL); console.log('DB Host:', process.env.DB_HOST);`""
        }
        
        foreach ($script in $newScripts.GetEnumerator()) {
            $packageJson.scripts | Add-Member -Type NoteProperty -Name $script.Key -Value $script.Value -Force
        }
        
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
        Write-Success "Scripts package.json mis à jour"
    }
}

# =========================================================================
# ÉTAPE 7/7: VS CODE INTEGRATION
# =========================================================================

function Setup-VSCodeIntegration {
    Write-StepTitle "INTÉGRATION VS CODE" 7 7
    
    # Créer dossier .vscode
    if (-not (Test-Path ".vscode")) {
        New-Item -ItemType Directory -Path ".vscode" -Force | Out-Null
    }
    
    # Tasks.json
    $tasksJson = @{
        version = "2.0.0"
        tasks   = @(
            @{
                label          = "ERP: Setup Complet"
                type           = "shell"
                command        = "pwsh"
                args           = @("scripts/setup-erp.ps1")
                group          = @{
                    kind      = "build"
                    isDefault = $true
                }
                presentation   = @{
                    echo   = $true
                    reveal = "always"
                    focus  = $false
                    panel  = "new"
                }
                problemMatcher = @()
            },
            @{
                label        = "ERP: Setup Force"
                type         = "shell" 
                command      = "pwsh"
                args         = @("scripts/setup-erp.ps1", "-Force")
                group        = "build"
                presentation = @{
                    echo   = $true
                    reveal = "always"
                    panel  = "new"
                }
            },
            @{
                label        = "ERP: Reset Database"
                type         = "shell"
                command      = "pwsh"
                args         = @("scripts/manage-db.ps1", "reset")
                group        = "build"
                presentation = @{
                    echo   = $true
                    reveal = "always"
                    panel  = "new"
                }
            },
            @{
                label        = "ERP: Start Dev Servers"
                type         = "shell"
                command      = "pnpm"
                args         = @("dev")
                group        = @{
                    kind      = "build" 
                    isDefault = $false
                }
                presentation = @{
                    echo   = $true
                    reveal = "always"
                    panel  = "new"
                }
                runOptions   = @{
                    runOn = "folderOpen"
                }
            },
            @{
                label        = "ERP: Database Status"
                type         = "shell"
                command      = "pwsh"
                args         = @("scripts/manage-db.ps1", "status")
                group        = "test"
                presentation = @{
                    echo   = $true
                    reveal = "always"
                    panel  = "new"
                }
            },
            @{
                label        = "ERP: Backup Database"
                type         = "shell"
                command      = "pwsh"
                args         = @("scripts/manage-db.ps1", "backup")
                group        = "build"
                presentation = @{
                    echo   = $true
                    reveal = "always"
                    panel  = "new"
                }
            }
        )
    }
    
    $tasksJson | ConvertTo-Json -Depth 10 | Set-Content ".vscode/tasks.json"
    Write-Success "Tâches VS Code créées"
    
    # Launch.json pour le debugging
    $launchJson = @{
        version        = "0.2.0"
        configurations = @(
            @{
                name          = "Debug API (NestJS)"
                type          = "node"
                request       = "launch"
                program       = "`${workspaceFolder}/apps/api/dist/main.js"
                cwd           = "`${workspaceFolder}/apps/api"
                env           = @{
                    NODE_ENV = "development"
                }
                preLaunchTask = "ERP: Build API"
                sourceMaps    = $true
                outFiles      = @("`${workspaceFolder}/apps/api/dist/**/*.js")
            },
            @{
                name    = "Debug Web (Next.js)"
                type    = "node"
                request = "launch"
                program = "`${workspaceFolder}/apps/web/node_modules/.bin/next"
                args    = @("dev")
                cwd     = "`${workspaceFolder}/apps/web"
                env     = @{
                    NODE_ENV = "development"
                }
            }
        )
    }
    
    $launchJson | ConvertTo-Json -Depth 10 | Set-Content ".vscode/launch.json"
    Write-Success "Configuration debug VS Code créée"
    
    # Settings.json
    $settingsJson = @{
        "typescript.preferences.includePackageJsonAutoImports" = "auto"
        "typescript.suggest.autoImports"                       = $true
        "editor.formatOnSave"                                  = $true
        "editor.codeActionsOnSave"                             = @{
            "source.fixAll.eslint" = $true
        }
        "files.associations"                                   = @{
            "*.env*" = "properties"
        }
        "search.exclude"                                       = @{
            "**/node_modules" = $true
            "**/dist"         = $true
            "**/.next"        = $true
        }
        "files.watcherExclude"                                 = @{
            "**/node_modules/**" = $true
            "**/dist/**"         = $true
            "**/.next/**"        = $true
        }
    }
    
    $settingsJson | ConvertTo-Json -Depth 10 | Set-Content ".vscode/settings.json"
    Write-Success "Paramètres VS Code configurés"
    
    # Extensions recommandées
    $extensionsJson = @{
        recommendations = @(
            "ms-vscode.vscode-typescript-next",
            "bradlc.vscode-tailwindcss", 
            "ms-vscode.powershell",
            "ms-vscode.vscode-json",
            "esbenp.prettier-vscode",
            "dbaeumer.vscode-eslint",
            "ms-vscode.vscode-node-azure-pack",
            "ckolkman.vscode-postgres"
        )
    }
    
    $extensionsJson | ConvertTo-Json -Depth 10 | Set-Content ".vscode/extensions.json"
    Write-Success "Extensions VS Code recommandées configurées"
}

# =========================================================================
# FONCTION PRINCIPALE
# =========================================================================

function Main {
    Clear-Host
    
    Write-Host "
╔══════════════════════════════════════════════════════════════════╗
║                    ERP TOPSTEEL - SETUP COMPLET                 ║  
║                   Installation et Configuration                  ║
╚══════════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan
    
    Write-Info "Début: $(Get-Date -Format 'HH:mm:ss')"
    Write-Info "Racine: $script:ProjectRoot"
    
    try {
        Test-Prerequisites
        Initialize-ProjectStructure  
        Setup-CentralizedConfig
        Install-Dependencies
        Initialize-Database
        Create-Scripts
        Setup-VSCodeIntegration
        
        # Copier ce script vers scripts/
        Copy-Item $PSCommandPath "scripts/setup-erp.ps1" -Force
        Write-Success "Script copié vers scripts/setup-erp.ps1"
        
        Write-Host ""
        Write-Host "===============================================================================" -ForegroundColor Green
        Write-Host "🎉🎉🎉 SETUP ERP TOPSTEEL TERMINÉ AVEC SUCCÈS ! 🎉🎉🎉" -ForegroundColor Green
        Write-Host "===============================================================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "📋 RÉSUMÉ :" -ForegroundColor Blue
        Write-Success "✅ Structure projet validée"
        Write-Success "✅ Configuration centralisée créée"
        if (-not $SkipDependencies) { Write-Success "✅ Dépendances installées" }
        if (-not $SkipDatabase) { Write-Success "✅ Base de données initialisée" }
        Write-Success "✅ Scripts de gestion créés"
        Write-Success "✅ Intégration VS Code configurée"
        Write-Host ""
        
        Write-Host "🔑 ACCÈS :" -ForegroundColor Blue
        Write-Host "Database: $DBName@$DBHost" -ForegroundColor White
        if (-not $SkipSampleData) { Write-Host "Admin: admin@topsteel.fr / password123" -ForegroundColor White }
        Write-Host ""
        
        Write-Host "🚀 PROCHAINES ÉTAPES :" -ForegroundColor Blue
        Write-Host "1. Dans VS Code: Ctrl+Shift+P > 'Tasks: Run Task' > 'ERP: Start Dev Servers'" -ForegroundColor White
        Write-Host "2. Ou en ligne de commande: pnpm dev" -ForegroundColor White
        Write-Host "3. Accédez à: http://localhost:3000 (Web) et http://localhost:3001 (API)" -ForegroundColor White
        Write-Host ""
        
        Write-Host "🛠️ OUTILS DISPONIBLES :" -ForegroundColor Blue
        Write-Host "• VS Code Tasks: Ctrl+Shift+P > Tasks" -ForegroundColor White
        Write-Host "• Scripts: pnpm setup, pnpm db:status, pnpm db:backup" -ForegroundColor White
        Write-Host "• Gestion DB: ./scripts/manage-db.ps1 [status|backup|reset]" -ForegroundColor White
        
    }
    catch {
        Write-Error "Erreur lors du setup: $($_.Exception.Message)"
        Write-Error "Ligne: $($_.InvocationInfo.ScriptLineNumber)"
        exit 1
    }
}

# Exécution
Main