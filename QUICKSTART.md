# 🚀 QuickStart - TopSteel ERP

## Démarrage Rapide (2 minutes)

### 1. Démarrer l'API
```bash
cd apps/api
pnpm dev
```
✅ API disponible sur http://localhost:3002

### 2. Démarrer le Frontend
```bash
cd apps/web
pnpm dev
```
✅ Frontend disponible sur http://localhost:3005

### 3. Se connecter
```
URL:      http://localhost:3005/login
Email:    admin@topsteel.fr
Password: Admin2025!
```

## ✅ Vérifications

### Santé de l'API
```bash
curl http://localhost:3002/api/health
```

### Test E2E Complet
```bash
node test-e2e-complete.js
```

## 📚 Documentation Complète
Voir `VERIFICATION_COMPLETE_REPORT.md` pour le rapport détaillé.

## 🆘 Support
- API Swagger: http://localhost:3002/api/docs
- Logs API: `apps/api/api.log`
- Logs Web: `apps/web/web.log`
