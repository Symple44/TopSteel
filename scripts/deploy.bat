@echo off
REM TopSteel ERP Deployment Script for Windows
REM Version: 1.0.0
REM Description: Automated deployment script for production environment

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_ROOT=%~dp0..
set LOG_FILE=%PROJECT_ROOT%\deploy.log
set BACKUP_DIR=%PROJECT_ROOT%\backups
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

REM Colors (Windows 10+)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set NC=[0m

echo ========================================= >> "%LOG_FILE%"
echo Starting TopSteel ERP Deployment >> "%LOG_FILE%"
echo Timestamp: %TIMESTAMP% >> "%LOG_FILE%"
echo ========================================= >> "%LOG_FILE%"

REM Check prerequisites
echo Checking prerequisites...
echo Checking prerequisites... >> "%LOG_FILE%"

REM Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed >> "%LOG_FILE%"
    echo Error: Node.js is not installed
    exit /b 1
)

REM Check pnpm
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pnpm is not installed >> "%LOG_FILE%"
    echo Error: pnpm is not installed
    exit /b 1
)

echo Prerequisites check completed >> "%LOG_FILE%"

REM Backup database
echo Starting database backup...
echo Starting database backup... >> "%LOG_FILE%"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Load database credentials
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=erp_topsteel_topsteel
if "%DB_USER%"=="" set DB_USER=postgres

set BACKUP_FILE=%BACKUP_DIR%\db_backup_%TIMESTAMP%.sql

REM Check if pg_dump exists
where pg_dump >nul 2>&1
if %errorlevel% equ 0 (
    set PGPASSWORD=%DB_PASSWORD%
    pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% > "%BACKUP_FILE%" 2>> "%LOG_FILE%"
    if !errorlevel! equ 0 (
        echo Database backup completed: %BACKUP_FILE% >> "%LOG_FILE%"
    ) else (
        echo Database backup failed >> "%LOG_FILE%"
    )
) else (
    echo pg_dump not found. Skipping database backup. >> "%LOG_FILE%"
)

REM Pull latest code
echo Pulling latest code from repository...
echo Pulling latest code from repository... >> "%LOG_FILE%"

cd /d "%PROJECT_ROOT%"

REM Check for uncommitted changes
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('git status --porcelain') do (
        echo Uncommitted changes detected. Stashing... >> "%LOG_FILE%"
        git stash save "Auto-stash before deployment %TIMESTAMP%"
        goto :continue_pull
    )
)

:continue_pull
git fetch origin >> "%LOG_FILE%" 2>&1
git pull origin main >> "%LOG_FILE%" 2>&1

echo Code updated successfully >> "%LOG_FILE%"

REM Install dependencies
echo Installing dependencies...
echo Installing dependencies... >> "%LOG_FILE%"

cd /d "%PROJECT_ROOT%"
call pnpm install --frozen-lockfile >> "%LOG_FILE%" 2>&1

if %errorlevel% equ 0 (
    echo Dependencies installed successfully >> "%LOG_FILE%"
) else (
    echo Failed to install dependencies >> "%LOG_FILE%"
    exit /b 1
)

REM Build application
echo Building application...
echo Building application... >> "%LOG_FILE%"

cd /d "%PROJECT_ROOT%"

REM Clean previous builds
echo Cleaning previous builds... >> "%LOG_FILE%"
call pnpm clean >> "%LOG_FILE%" 2>&1

REM Build all packages
echo Building packages... >> "%LOG_FILE%"
call pnpm build >> "%LOG_FILE%" 2>&1

if %errorlevel% equ 0 (
    echo Build completed successfully >> "%LOG_FILE%"
) else (
    echo Build failed >> "%LOG_FILE%"
    exit /b 1
)

REM Run migrations
echo Running database migrations...
echo Running database migrations... >> "%LOG_FILE%"

cd /d "%PROJECT_ROOT%\apps\api"

set NODE_ENV=production
call pnpm typeorm migration:run >> "%LOG_FILE%" 2>&1

if %errorlevel% equ 0 (
    echo Migrations completed successfully >> "%LOG_FILE%"
) else (
    echo Migration failed. Manual intervention may be required >> "%LOG_FILE%"
)

REM Setup environment
echo Setting up environment variables...
echo Setting up environment variables... >> "%LOG_FILE%"

if not exist "%PROJECT_ROOT%\.env.production" (
    if exist "%PROJECT_ROOT%\.env.example" (
        copy "%PROJECT_ROOT%\.env.example" "%PROJECT_ROOT%\.env.production"
        echo Please update .env.production with production values >> "%LOG_FILE%"
    )
)

set NODE_ENV=production

echo Environment setup completed >> "%LOG_FILE%"

REM Start services
echo Starting services...
echo Starting services... >> "%LOG_FILE%"

REM Check if PM2 is installed
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    REM Start API with PM2
    cd /d "%PROJECT_ROOT%\apps\api"
    call pm2 delete topsteel-api 2>nul
    call pm2 start dist\main.js --name topsteel-api --env production
    call pm2 save
    
    REM Start Web with PM2
    cd /d "%PROJECT_ROOT%\apps\web"
    call pm2 delete topsteel-web 2>nul
    call pm2 start npm --name topsteel-web -- start
    call pm2 save
) else (
    REM Start without PM2
    echo PM2 not found. Starting services in background... >> "%LOG_FILE%"
    
    cd /d "%PROJECT_ROOT%\apps\api"
    start /B node dist\main.js > "%PROJECT_ROOT%\api.log" 2>&1
    
    cd /d "%PROJECT_ROOT%\apps\web"
    start /B npm start > "%PROJECT_ROOT%\web.log" 2>&1
)

echo Services started successfully >> "%LOG_FILE%"

REM Health check
echo Performing health checks...
echo Performing health checks... >> "%LOG_FILE%"

timeout /t 10 /nobreak >nul

REM Check API health
curl -f http://localhost:3002/health >nul 2>&1
if %errorlevel% equ 0 (
    echo API health check passed >> "%LOG_FILE%"
) else (
    echo API health check failed >> "%LOG_FILE%"
)

REM Check Web health
curl -f http://localhost:3005 >nul 2>&1
if %errorlevel% equ 0 (
    echo Web health check passed >> "%LOG_FILE%"
) else (
    echo Web health check failed >> "%LOG_FILE%"
)

echo Health checks completed >> "%LOG_FILE%"

REM Cleanup old backups
echo Cleaning up old backups...
echo Cleaning up old backups... >> "%LOG_FILE%"

if exist "%BACKUP_DIR%" (
    REM Keep only last 10 backups
    for /f "skip=10" %%f in ('dir /b /o-d "%BACKUP_DIR%\db_backup_*.sql" 2^>nul') do (
        del "%BACKUP_DIR%\%%f" 2>nul
    )
    echo Old backups cleaned up >> "%LOG_FILE%"
)

echo ========================================= >> "%LOG_FILE%"
echo Deployment completed successfully! >> "%LOG_FILE%"
echo ========================================= >> "%LOG_FILE%"

echo.
echo Deployment completed successfully!
echo.

REM Show PM2 status if available
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    call pm2 status
)

endlocal
exit /b 0