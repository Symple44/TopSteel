@echo off
echo ===============================================
echo    DEMARRAGE DU SYSTEME DE PRICING TOPSTEEL
echo ===============================================
echo.

REM Vérifier Redis
echo [1/4] Verification de Redis...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Redis n'est pas demarre. Tentative de demarrage avec Docker...
    docker run -d --name redis-pricing -p 6379:6379 redis:alpine >nul 2>&1
    if %errorlevel% neq 0 (
        docker start redis-pricing >nul 2>&1
    )
    timeout /t 2 >nul
    redis-cli ping >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Impossible de demarrer Redis. Installez Redis manuellement.
        pause
        exit /b 1
    )
)
echo ✅ Redis OK

REM Vérifier PostgreSQL
echo [2/4] Verification de PostgreSQL...
set PGPASSWORD=postgres
psql -U postgres -h localhost -c "SELECT 1" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL n'est pas accessible. Verifiez votre installation.
    pause
    exit /b 1
)
echo ✅ PostgreSQL OK

REM Compiler l'application
echo [3/4] Compilation de l'application...
cd apps\api
call pnpm build >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur de compilation
    pause
    exit /b 1
)
echo ✅ Build OK

REM Démarrer l'application
echo [4/4] Demarrage de l'application...
echo.
echo ===============================================
echo    SYSTEME PRICING PRET !
echo ===============================================
echo.
echo Endpoints disponibles:
echo   - REST API:  http://localhost:3000/pricing
echo   - GraphQL:   http://localhost:3000/graphql
echo   - Swagger:   http://localhost:3000/api
echo   - Health:    http://localhost:3000/health
echo.
echo Appuyez sur Ctrl+C pour arreter
echo ===============================================
echo.

REM Démarrer en mode développement
call pnpm start:dev