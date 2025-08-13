@echo off
echo ===================================================
echo   INSTALLATION DU SYSTEME DE RECHERCHE GLOBALE
echo ===================================================
echo.

echo [1/4] Creation des index PostgreSQL...
cd apps\api
call pnpm migration:search-indexes
cd ..\..

echo.
echo [2/4] Installation des dependances si necessaire...
call pnpm install

echo.
echo [3/4] Build des packages...
call pnpm build:packages

echo.
echo ===================================================
echo   RECHERCHE GLOBALE INSTALLEE AVEC SUCCES!
echo ===================================================
echo.
echo Pour demarrer l'application:
echo   pnpm dev
echo.
echo Pour utiliser la recherche:
echo   - Appuyez sur Ctrl+K dans l'application
echo   - Ou cliquez sur la barre de recherche
echo.
echo Pour activer ElasticSearch (optionnel):
echo   1. docker-compose -f docker-compose.elasticsearch.yml up -d
echo   2. Definir ELASTICSEARCH_ENABLED=true dans .env
echo   3. Redemarrer l'application
echo.
pause