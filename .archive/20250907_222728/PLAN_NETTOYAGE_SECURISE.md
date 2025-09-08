# 🧹 Plan de Nettoyage Sécurisé - Projet TopSteel

> **Date** : 5 Septembre 2025  
> **Espace libérable** : ~50-60 MB  
> **Risque** : Minimal avec validation

---

## 📊 Résumé de l'Analyse

| Catégorie | Fichiers | Taille | Action |
|-----------|----------|--------|--------|
| **Backup obsolète** | 45+ | 29 MB | ❌ Supprimer |
| **Rapports temporaires** | 33 | 5-10 MB | ❌ Supprimer |
| **Build artifacts** | Multiple | 75 MB | 📝 Gitignore |
| **Caches** | Multiple | 205 MB | 🔄 Nettoyer |
| **Coverage** | Multiple | 11 MB | 📝 Gitignore |

---

## 🎯 Actions Immédiates (Sans Risque)

### 1. Supprimer le dossier de backup
```bash
rm -rf .backup-cleanup-20250905/
```
**Impact** : Libère 29 MB, aucun risque

### 2. Supprimer les rapports temporaires
```bash
# Rapports de correction et analyse
rm AMELIORATIONS_PACKAGES_UI_EFFECTUEES.md
rm ANALYSE_COMPLETE_PACKAGES_UI.md
rm ANALYSE_CONFIGURATION_VITE_UI.md
rm ANALYSE_DATATABLE_DUPLICATION.md
rm ANALYSE_FICHIERS_RACINE_UI.md
rm COGNITIVE_COMPLEXITY_OPTIMIZATION_REPORT.md
rm CORRECTION_TESTS_PERFORMANCE_UI_RAPPORT.md
rm CORRECTION_TESTS_UI_RAPPORT.md
rm NETTOYAGE_EFFECTUE.md
rm NETTOYAGE_FICHIERS_RACINE_UI_RAPPORT.md
rm NETTOYAGE_PACKAGES_UI_EFFECTUE.md
rm OPTIMISATION_VITE_UI_RAPPORT.md
rm RAPPORT_ANALYSE_ERREURS.md
rm RAPPORT_CONSOLIDATION_DATATABLE.md
rm RAPPORT_CORRECTIONS_ERREURS.md
rm RAPPORT_FICHIERS_RACINE_UI.md
rm RAPPORT_NETTOYAGE_PACKAGES_UI.md
rm VERIFICATION_GLOBALE_DATATABLE.md
```

### 3. Supprimer les fichiers temporaires
```bash
rm apps/web/nul
rm -f temp_output.txt
```

---

## 📝 Configuration .gitignore

### Ajouter au .gitignore principal
```gitignore
# Build directories
dist/
.next/
build/
out/

# Coverage reports
coverage/
*.lcov
.nyc_output/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Turbo
.turbo/
turbo-*.log

# Testing
test-results/
playwright-report/
playwright/.cache/

# Temporary files
*.tmp
*.temp
*.bak
*.old
*~

# OS files
.DS_Store
Thumbs.db
desktop.ini

# Editor directories
.idea/
*.swp
*.swo
```

---

## 🔄 Scripts de Maintenance

### Script de nettoyage périodique
```bash
#!/bin/bash
# clean-project.sh

echo "🧹 Nettoyage du projet TopSteel..."

# Nettoyer les caches Turbo (garder le dernier)
echo "Nettoyage des caches Turbo..."
npx turbo prune

# Nettoyer les logs de plus de 7 jours
echo "Nettoyage des logs..."
find . -name "*.log" -mtime +7 -delete

# Nettoyer les fichiers temporaires
echo "Nettoyage des fichiers temporaires..."
find . -name "*.tmp" -delete
find . -name "*.temp" -delete
find . -name "*~" -delete

# Nettoyer les builds si demandé
read -p "Nettoyer les builds? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run clean
fi

echo "✅ Nettoyage terminé!"
```

---

## ⚠️ Actions à Valider

### Types temporaires
- `apps/web/src/types/global-fixes.d.ts`
- `apps/web/src/types/typescript-fixes.d.ts`

**Action suggérée** : Vérifier si ces corrections sont encore nécessaires

### Configuration dupliquée
- `packages/ui/.gitignore`

**Action suggérée** : Fusionner avec le .gitignore principal

---

## 📋 Checklist de Nettoyage

- [ ] Backup du projet avant nettoyage
- [ ] Supprimer `.backup-cleanup-20250905/`
- [ ] Supprimer les rapports .md temporaires
- [ ] Supprimer `apps/web/nul`
- [ ] Mettre à jour `.gitignore`
- [ ] Créer script `clean-project.sh`
- [ ] Configurer nettoyage automatique CI/CD
- [ ] Documenter la procédure de maintenance

---

## 🚀 Commande de Nettoyage Rapide

```bash
# Exécution sécurisée en une commande
rm -rf .backup-cleanup-20250905/ && \
rm -f AMELIORATIONS_PACKAGES_UI_EFFECTUEES.md ANALYSE_COMPLETE_PACKAGES_UI.md \
ANALYSE_CONFIGURATION_VITE_UI.md ANALYSE_DATATABLE_DUPLICATION.md \
ANALYSE_FICHIERS_RACINE_UI.md COGNITIVE_COMPLEXITY_OPTIMIZATION_REPORT.md \
CORRECTION_TESTS_PERFORMANCE_UI_RAPPORT.md CORRECTION_TESTS_UI_RAPPORT.md \
NETTOYAGE_EFFECTUE.md NETTOYAGE_FICHIERS_RACINE_UI_RAPPORT.md \
NETTOYAGE_PACKAGES_UI_EFFECTUE.md OPTIMISATION_VITE_UI_RAPPORT.md \
RAPPORT_ANALYSE_ERREURS.md RAPPORT_CONSOLIDATION_DATATABLE.md \
RAPPORT_CORRECTIONS_ERREURS.md RAPPORT_FICHIERS_RACINE_UI.md \
RAPPORT_NETTOYAGE_PACKAGES_UI.md VERIFICATION_GLOBALE_DATATABLE.md && \
rm -f apps/web/nul temp_output.txt && \
echo "✅ Nettoyage terminé - ~50 MB libérés"
```

---

## 📈 Bénéfices Attendus

- **Espace disque** : ~50-60 MB libérés immédiatement
- **Performance Git** : Réduction du nombre de fichiers trackés
- **Clarté du projet** : Structure plus propre et organisée
- **CI/CD** : Builds plus rapides sans fichiers inutiles
- **Maintenance** : Procédure automatisée pour l'avenir

---

*Plan créé le 5 Septembre 2025 - Prêt pour exécution*