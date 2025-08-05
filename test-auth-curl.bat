@echo off
echo === Test d'authentification TopSteel ===
echo.

echo 1. Test de login...
curl -X POST http://localhost:3002/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"login\":\"admin@topsteel.tech\",\"password\":\"TopSteel44!\"}" ^
  > login-response.json

echo.
echo Response saved to login-response.json
type login-response.json