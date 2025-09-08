# 📋 Plan TODO - Amélioration Projet TopSteel

## 🎯 Objectif
Améliorer la qualité, sécurité et performance du projet TopSteel de manière progressive et mesurable.

---

## 🔴 PHASE 1: URGENT - Corrections Critiques (Semaine 1)
*Impact: Sécurité et stabilité production*

### 1.1 Sécurité Base de Données (Jour 1)
```bash
# Commandes à exécuter
```
- [ ] **Désactiver synchronize en production**
  - Fichiers: `apps/api/src/core/config/database.config.ts`
  - Remplacer: `synchronize: true` → `synchronize: false`
  - Créer migration initiale: `npm run typeorm:migration:generate`
  
- [ ] **Forcer SSL pour connexions DB**
  - Ajouter: `ssl: { rejectUnauthorized: process.env.NODE_ENV === 'production' }`
  - Vérifier tous les datasources (4 fichiers)

- [ ] **Auditer les secrets**
  ```bash
  # Script de vérification
  grep -r "JWT_SECRET\|DB_PASSWORD" --include="*.ts" --include="*.js"
  ```

### 1.2 Erreurs TypeScript Bloquantes (Jour 2-3)
```bash
# Commande pour identifier
npx tsc --noEmit
```
- [ ] **Corriger 286 duplicate JSX props**
  ```bash
  # Script de correction automatique
  find packages/ui -name "*.tsx" -exec sed -i 's/type="button" type="button"/type="button"/g' {} \;
  ```
  
- [ ] **Corriger 7 erreurs auth type safety**
  - Fichiers guards dans `apps/api/src/domains/auth/security/guards/`
  - Remplacer `any` par types appropriés

- [ ] **Installer types manquants**
  ```bash
  pnpm add -D @types/async-lock @types/lodash-es @types/rbush @types/opentype.js
  ```

### 1.3 Corrections Biome Automatiques (Jour 4)
```bash
# Corrections automatiques
npx biome check --apply
npx biome check --apply-unsafe
```
- [ ] **Appliquer formatting global**
- [ ] **Corriger imports (1,852 warnings)**
- [ ] **Ajouter button types manquants (166)**

---

## 🟠 PHASE 2: HAUTE PRIORITÉ - Optimisations (Semaine 2)
*Impact: Performance et UX*

### 2.1 Optimisation Bundles (Jour 5-6)
- [ ] **Analyser bundle sizes actuels**
  ```bash
  ANALYZE=true pnpm build:web
  ```

- [ ] **Réduire package UI de 2.4MB à <1MB**
  - [ ] Séparer business components en chunks
  - [ ] Lazy loading des composants lourds
  - [ ] Tree shaking agressif
  ```typescript
  // vite.config.mts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'radix': ['@radix-ui/*'],
          'business': ['./src/components/business/*'],
          'charts': ['recharts', 'd3']
        }
      }
    }
  }
  ```

- [ ] **Simplifier webpack config Next.js**
  - Réduire de 560 à <300 lignes
  - Supprimer polyfills inutiles

### 2.2 Tests Critiques (Jour 7-8)
- [ ] **Créer tests pour auth guards**
  ```bash
  mkdir -p apps/api/src/domains/auth/security/guards/__tests__
  ```
  
- [ ] **Tests DataTable (composant critique)**
  ```bash
  mkdir -p packages/ui/src/components/data-display/datatable/__tests__
  ```

- [ ] **Tests stores Zustand**
  ```bash
  mkdir -p apps/web/src/stores/__tests__
  ```

### 2.3 Configuration CI/CD (Jour 9)
- [ ] **Ajouter quality gates**
  ```yaml
  # .github/workflows/quality-gates.yml
  - name: Check test coverage
    run: |
      coverage=$(pnpm test:coverage | grep "All files" | awk '{print $10}')
      if [ "$coverage" -lt "30" ]; then exit 1; fi
  ```

- [ ] **Bundle size monitoring**
  ```yaml
  - name: Check bundle size
    run: |
      if [ $(stat -f%z dist/ui.js) -gt 1000000 ]; then
        echo "Bundle too large!"
        exit 1
      fi
  ```

---

## 🟡 PHASE 3: PRIORITÉ MOYENNE - Qualité (Semaines 3-4)
*Impact: Maintenabilité*

### 3.1 Refactoring Composants (Semaine 3)
- [ ] **Identifier composants >1000 lignes**
  ```bash
  find . -name "*.tsx" -exec wc -l {} \; | sort -rn | head -20
  ```

- [ ] **Refactorer top 5 composants**
  - [ ] `apps/web/src/app/(dashboard)/settings/menu/page.tsx` (2000+ lignes)
  - [ ] `apps/api/src/features/partners/services/partner.service.ts` (2058 lignes)
  - [ ] Extraire logique en hooks custom
  - [ ] Créer sous-composants

### 3.2 Documentation (Semaine 3)
- [ ] **Créer README technique**
  ```markdown
  # Architecture
  ## Structure Monorepo
  ## Patterns utilisés
  ## Conventions de code
  ```

- [ ] **Documenter APIs critiques**
  ```typescript
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: User authentication
   */
  ```

### 3.3 Amélioration Tests (Semaine 4)
- [ ] **Objectif: 30% coverage**
  - [ ] Unit tests services critiques
  - [ ] Integration tests auth flow
  - [ ] E2E tests parcours utilisateur

---

## 🟢 PHASE 4: LONG TERME - Excellence (Mois 2-3)
*Impact: Scalabilité et excellence*

### 4.1 Architecture (Mois 2)
- [ ] **Micro-frontends exploration**
- [ ] **Event-driven architecture**
- [ ] **GraphQL federation**

### 4.2 Sécurité Avancée (Mois 2)
- [ ] **Implement vault integration**
- [ ] **Zero-trust architecture**
- [ ] **Penetration testing**

### 4.3 Performance (Mois 3)
- [ ] **Server-side rendering optimisation**
- [ ] **CDN integration**
- [ ] **Database query optimization**
- [ ] **Redis caching strategy**

---

## 📊 Métriques de Succès

### Semaine 1
- ✅ 0 erreurs de sécurité critique
- ✅ 0 erreurs TypeScript bloquantes
- ✅ <500 warnings Biome

### Semaine 2
- ✅ Bundle UI <1.5MB
- ✅ 15% test coverage
- ✅ Build time <40s

### Mois 1
- ✅ 30% test coverage
- ✅ Bundle UI <1MB
- ✅ 0 composants >1000 lignes
- ✅ Documentation API complète

### Mois 3
- ✅ 70% test coverage
- ✅ Performance score >90
- ✅ 0 vulnérabilités sécurité
- ✅ Architecture micro-frontends

---

## 🚀 Scripts Utiles

### Setup initial
```bash
# Créer branches de travail
git checkout -b fix/security-critical
git checkout -b fix/typescript-errors
git checkout -b feat/optimize-bundles
```

### Commandes quotidiennes
```bash
# Vérifier progression
pnpm typecheck
pnpm lint:check
pnpm test:coverage
pnpm build:analyze

# Corrections rapides
pnpm lint:fix
pnpm format
```

### Monitoring
```bash
# Bundle size check
du -sh packages/ui/dist
du -sh apps/web/.next

# Error count
npx tsc --noEmit 2>&1 | grep error | wc -l
npx biome check 2>&1 | grep error | wc -l
```

---

## 👥 Répartition Équipe

### Developer 1: Sécurité & TypeScript
- Phase 1.1 et 1.2
- Expertise: Backend, TypeScript

### Developer 2: Performance & Build
- Phase 1.3 et 2.1
- Expertise: Frontend, bundling

### Developer 3: Tests & Qualité
- Phase 2.2 et 3.3
- Expertise: Testing, QA

### Tech Lead: Architecture & Review
- Coordination phases
- Code reviews
- Architecture decisions

---

## ✅ Checklist Validation

### Avant chaque PR
- [ ] Tests passent
- [ ] 0 erreurs TypeScript
- [ ] Biome check clean
- [ ] Bundle size vérifié
- [ ] Documentation à jour

### Avant release
- [ ] Security audit passed
- [ ] Performance metrics OK
- [ ] Test coverage >target
- [ ] Changelog updated

---

*Plan créé le 09/01/2025 - À réviser chaque sprint*