@echo off
echo === NETTOYAGE DES PORTS TOPSTEEL API ===

echo Recherche des processus Node.js sur les ports 3002-3005...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :300') do (
    echo Arret du processus PID %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo Nettoyage complet des processus Node.js orphelins...
taskkill /IM node.exe /F >nul 2>&1

echo Verification des ports...
netstat -ano | findstr :300

echo === NETTOYAGE TERMINE ===
pause