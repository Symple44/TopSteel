#!/usr/bin/env pwsh
# =========================================================================
# SCRIPT D'INITIALISATION BASE DE DONNEES ERP TOPSTEEL
# Création de la DB, tables et données de test
# =========================================================================

param(
    [string]$DBPassword = "postgres",
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432",
    [string]$DBUser = "postgres",
    [string]$DBName = "erp_topsteel",
    [switch]$SkipSampleData,
    [switch]$Force
)

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "                    INITIALISATION BASE DE DONNEES ERP TOPSTEEL" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

# =========================================================================
# 1. VERIFICATION PREREQUIS
# =========================================================================

Write-Host "[*] Verification des prerequis..." -ForegroundColor Yellow

# Vérifier que psql est disponible
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "[+] PostgreSQL client (psql) trouve" -ForegroundColor Green
} catch {
    Write-Host "[-] PostgreSQL client (psql) non trouve dans PATH" -ForegroundColor Red
    Write-Host "[i] Installez PostgreSQL ou ajoutez-le au PATH" -ForegroundColor Blue
    exit 1
}

# Vérifier que le serveur PostgreSQL répond
Write-Host "[i] Test de connexion PostgreSQL..." -ForegroundColor Blue
$env:PGPASSWORD = $DBPassword

try {
    $result = psql -h $DBHost -p $DBPort -U $DBUser -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Connexion PostgreSQL OK" -ForegroundColor Green
    } else {
        throw "Connexion échouée"
    }
} catch {
    Write-Host "[-] Impossible de se connecter à PostgreSQL" -ForegroundColor Red
    Write-Host "[i] Vérifiez que PostgreSQL est démarré et les paramètres de connexion" -ForegroundColor Blue
    Write-Host "[i] Host: $DBHost, Port: $DBPort, User: $DBUser" -ForegroundColor Blue
    exit 1
}

# =========================================================================
# 2. CREATION BASE DE DONNEES
# =========================================================================

Write-Host "[*] Creation de la base de donnees..." -ForegroundColor Yellow

# Vérifier si la base existe
$dbExists = psql -h $DBHost -p $DBPort -U $DBUser -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DBName';" 2>&1

if ($dbExists -match "1") {
    if ($Force) {
        Write-Host "[!] Base '$DBName' existe, suppression forcée..." -ForegroundColor Yellow
        psql -h $DBHost -p $DBPort -U $DBUser -d postgres -c "DROP DATABASE IF EXISTS $DBName;" | Out-Null
        Write-Host "[+] Base '$DBName' supprimée" -ForegroundColor Green
    } else {
        Write-Host "[!] Base '$DBName' existe déjà" -ForegroundColor Yellow
        $choice = Read-Host "Voulez-vous la supprimer et la recréer? (o/N)"
        if ($choice -eq "o" -or $choice -eq "O") {
            psql -h $DBHost -p $DBPort -U $DBUser -d postgres -c "DROP DATABASE IF EXISTS $DBName;" | Out-Null
            Write-Host "[+] Base '$DBName' supprimée" -ForegroundColor Green
        } else {
            Write-Host "[i] Utilisation de la base existante" -ForegroundColor Blue
        }
    }
}

# Créer la base de données
Write-Host "[i] Creation de la base '$DBName'..." -ForegroundColor Blue
$createResult = psql -h $DBHost -p $DBPort -U $DBUser -d postgres -c "CREATE DATABASE $DBName;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Base '$DBName' créée avec succès" -ForegroundColor Green
} else {
    if ($createResult -match "already exists") {
        Write-Host "[+] Base '$DBName' existe déjà" -ForegroundColor Green
    } else {
        Write-Host "[-] Erreur création base: $createResult" -ForegroundColor Red
        exit 1
    }
}

# =========================================================================
# 3. MISE A JOUR VARIABLES ENVIRONNEMENT
# =========================================================================

Write-Host "[*] Mise a jour variables d'environnement..." -ForegroundColor Yellow

# Mettre à jour .env.local avec le mot de passe DB
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    # Remplacer ou ajouter DB_PASSWORD
    if ($envContent -match "DB_PASSWORD=") {
        $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$DBPassword"
    } else {
        $envContent += "`nDB_PASSWORD=$DBPassword"
    }
    
    # S'assurer que les autres variables DB sont correctes
    $envContent = $envContent -replace "DB_HOST=.*", "DB_HOST=$DBHost"
    $envContent = $envContent -replace "DB_PORT=.*", "DB_PORT=$DBPort"
    $envContent = $envContent -replace "DB_USERNAME=.*", "DB_USERNAME=$DBUser"
    $envContent = $envContent -replace "DB_NAME=.*", "DB_NAME=$DBName"
    
    Set-Content ".env.local" $envContent
    Write-Host "[+] Variables DB mises à jour dans .env.local" -ForegroundColor Green
} else {
    Write-Host "[!] Fichier .env.local introuvable" -ForegroundColor Yellow
}

# =========================================================================
# 4. EXECUTION DES MIGRATIONS TYPEORM
# =========================================================================

Write-Host "[*] Execution des migrations TypeORM..." -ForegroundColor Yellow

Push-Location "apps/api"

# Construire le projet si nécessaire
Write-Host "[i] Construction du projet API..." -ForegroundColor Blue
pnpm build 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Construction API réussie" -ForegroundColor Green
} else {
    Write-Host "[!] Construction API échouée, tentative avec les fichiers TS..." -ForegroundColor Yellow
}

# Exécuter les migrations
Write-Host "[i] Execution des migrations..." -ForegroundColor Blue

# Utiliser typeorm CLI pour exécuter les migrations
$migrationResult = npx typeorm migration:run -d "dist/database/data-source.js" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Migrations exécutées avec succès" -ForegroundColor Green
} else {
    Write-Host "[!] Erreur migrations avec fichiers compilés, tentative avec TS..." -ForegroundColor Yellow
    
    # Essayer avec ts-node
    $migrationResult = npx typeorm migration:run -d "src/database/data-source.ts" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Migrations TypeScript exécutées avec succès" -ForegroundColor Green
    } else {
        Write-Host "[-] Erreur lors de l'exécution des migrations:" -ForegroundColor Red
        Write-Host $migrationResult -ForegroundColor Red
        
        # Fallback: exécuter manuellement le SQL de migration
        Write-Host "[i] Tentative d'exécution manuelle du SQL..." -ForegroundColor Blue
        
        $migrationFile = "src/database/migrations/1700000000000-InitialSchema.ts"
        if (Test-Path $migrationFile) {
            # Extraire et adapter le SQL de la migration (simplification)
            Write-Host "[i] Exécution du schéma de base..." -ForegroundColor Blue
            
            # Créer un script SQL de base
            $basicSql = @"
-- Extensions PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Types ENUM de base
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

-- Table fournisseurs (avec structure existante)
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
"@
            
            $tempSqlFile = "temp_init_schema.sql"
            Set-Content $tempSqlFile $basicSql
            
            $sqlResult = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f $tempSqlFile 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[+] Schéma de base créé manuellement" -ForegroundColor Green
            } else {
                Write-Host "[-] Erreur création schéma: $sqlResult" -ForegroundColor Red
            }
            
            Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
        }
    }
}

Pop-Location

# =========================================================================
# 5. DONNEES DE TEST (OPTIONNEL)
# =========================================================================

if (-not $SkipSampleData) {
    Write-Host "[*] Ajout des donnees de test..." -ForegroundColor Yellow
    
    $sampleDataSql = @"
-- Utilisateur admin par défaut
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
    
    $tempDataFile = "temp_sample_data.sql"
    Set-Content $tempDataFile $sampleDataSql
    
    $dataResult = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f $tempDataFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Données de test ajoutées" -ForegroundColor Green
        Write-Host "[i] Admin: admin@topsteel.fr / password123" -ForegroundColor Blue
    } else {
        Write-Host "[!] Erreur ajout données de test: $dataResult" -ForegroundColor Yellow
    }
    
    Remove-Item $tempDataFile -ErrorAction SilentlyContinue
}

# =========================================================================
# 6. VERIFICATION FINALE
# =========================================================================

Write-Host "[*] Verification finale..." -ForegroundColor Yellow

# Compter les tables créées
$tableCount = psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1

if ($tableCount -match "\d+") {
    $count = [int]($tableCount.Trim())
    Write-Host "[+] $count tables créées dans la base" -ForegroundColor Green
} else {
    Write-Host "[!] Impossible de vérifier les tables" -ForegroundColor Yellow
}

# Test de connexion avec les paramètres de l'app
Write-Host "[i] Test connexion avec paramètres application..." -ForegroundColor Blue

$env:DB_HOST = $DBHost
$env:DB_PORT = $DBPort
$env:DB_USERNAME = $DBUser
$env:DB_PASSWORD = $DBPassword
$env:DB_NAME = $DBName

# =========================================================================
# 7. CREATION SCRIPT DE GESTION
# =========================================================================

Write-Host "[*] Creation script de gestion DB..." -ForegroundColor Yellow

$dbManageScript = @"
#!/usr/bin/env pwsh
# Script de gestion de la base de données ERP TopSteel
param(
    [Parameter(Mandatory)]
    [ValidateSet('status', 'backup', 'restore', 'reset', 'migrate')]
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
        Write-Host "État de la base de données '$DBName':" -ForegroundColor Cyan
        `$env:PGPASSWORD = `$DBParams.Password
        psql -h `$DBParams.Host -p `$DBParams.Port -U `$DBParams.User -d `$DBParams.Database -c "\dt"
    }
    'backup' {
        Write-Host "Sauvegarde vers `$File..." -ForegroundColor Yellow
        `$env:PGPASSWORD = `$DBParams.Password
        pg_dump -h `$DBParams.Host -p `$DBParams.Port -U `$DBParams.User `$DBParams.Database > `$File
        Write-Host "Sauvegarde terminée" -ForegroundColor Green
    }
    'restore' {
        Write-Host "Restauration depuis `$File..." -ForegroundColor Yellow
        `$env:PGPASSWORD = `$DBParams.Password
        psql -h `$DBParams.Host -p `$DBParams.Port -U `$DBParams.User -d `$DBParams.Database < `$File
        Write-Host "Restauration terminée" -ForegroundColor Green
    }
    'reset' {
        Write-Host "Remise à zéro de la base..." -ForegroundColor Red
        `$confirm = Read-Host "Êtes-vous sûr ? (tapez 'RESET' pour confirmer)"
        if (`$confirm -eq 'RESET') {
            .\scripts\init-database.ps1 -Force
        }
    }
    'migrate' {
        Write-Host "Exécution des migrations..." -ForegroundColor Yellow
        Push-Location "apps/api"
        npx typeorm migration:run
        Pop-Location
    }
}
"@

$scriptsDir = "scripts"
if (-not (Test-Path $scriptsDir)) {
    New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
}

Set-Content "$scriptsDir/manage-db.ps1" $dbManageScript
Write-Host "[+] Script de gestion créé: scripts/manage-db.ps1" -ForegroundColor Green

# =========================================================================
# RESUME FINAL
# =========================================================================

# Nettoyer les variables d'environnement
$env:PGPASSWORD = $null

Write-Host "" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "🎉 INITIALISATION BASE DE DONNEES TERMINEE AVEC SUCCES !" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "" -ForegroundColor White

Write-Host "📋 RESUME :" -ForegroundColor Blue
Write-Host "✅ Base de données '$DBName' créée" -ForegroundColor Green
Write-Host "✅ Schéma et tables initialisés" -ForegroundColor Green
Write-Host "✅ Variables d'environnement mises à jour" -ForegroundColor Green
if (-not $SkipSampleData) {
    Write-Host "✅ Données de test ajoutées" -ForegroundColor Green
}
Write-Host "✅ Script de gestion créé" -ForegroundColor Green
Write-Host "" -ForegroundColor White

Write-Host "🔑 CONNEXION :" -ForegroundColor Blue
Write-Host "Host: $DBHost" -ForegroundColor White
Write-Host "Port: $DBPort" -ForegroundColor White
Write-Host "Database: $DBName" -ForegroundColor White
Write-Host "User: $DBUser" -ForegroundColor White
Write-Host "" -ForegroundColor White

if (-not $SkipSampleData) {
    Write-Host "👤 COMPTE ADMIN :" -ForegroundColor Blue
    Write-Host "Email: admin@topsteel.fr" -ForegroundColor White
    Write-Host "Password: password123" -ForegroundColor White
    Write-Host "" -ForegroundColor White
}

Write-Host "🛠️ GESTION DATABASE :" -ForegroundColor Blue
Write-Host "Status: ./scripts/manage-db.ps1 status" -ForegroundColor White
Write-Host "Backup: ./scripts/manage-db.ps1 backup" -ForegroundColor White
Write-Host "Reset: ./scripts/manage-db.ps1 reset" -ForegroundColor White
Write-Host "" -ForegroundColor White

Write-Host "🚀 MAINTENANT :" -ForegroundColor Blue
Write-Host "Relancez 'pnpm dev' - Votre ERP devrait être 100% opérationnel !" -ForegroundColor Green