# TODO - Evolution TopSteel + Integration TopTime

> **Objectif** : Ameliorer l'UX de TopSteel Web + Migrer le backend TopTime pour que l'app mobile KMP consomme une API unifiee.

## Architecture Cible

```
                    BACKEND UNIFIE
              (TopSteel + Backend TopTime)
  ┌─────────────┬─────────────┬─────────────────┐
  │ Auth/Users  │ Stock/Prod  │ Pointage/Metier │
  │ (TopSteel)  │ (Commun)    │ (ex-TopTime)    │
  └─────────────┴─────────────┴─────────────────┘
                        │ API
          ┌─────────────┴─────────────┐
          │                           │
  ┌───────▼───────┐       ┌───────────▼───────────┐
  │ TopSteel Web  │       │   TopTime Mobile      │
  │ (Next.js)     │       │   (Kotlin KMP)        │
  │               │       │   iOS + Android       │
  │ • Admin       │       │ • Pointage terrain    │
  │ • Dashboard   │       │ • Scan/RFID           │
  │ • Rapports    │       │ • Stock mobile        │
  └───────────────┘       └───────────────────────┘
```

---

## Estimation Globale

| Phase | Theme | Duree | Priorite | Statut |
|-------|-------|-------|----------|--------|
| 1 | Quick Wins UX | 1 sem | Critique | COMPLETE |
| 2 | Composants Feedback | 1 sem | Haute | COMPLETE |
| 3 | Accessibilite | 1 sem | Haute | COMPLETE |
| 4 | UX Formulaires | 1 sem | Haute | COMPLETE |
| 5 | Performance Web | 1 sem | Moyenne | COMPLETE |
| 6 | Migration Backend TopTime | 3 sem | Haute | A FAIRE |
| 7 | Integration TopTime Mobile | 2 sem | Haute | A FAIRE |
| 8 | Tests & Qualite | 1 sem | Moyenne | A FAIRE |
| 9 | Documentation | Continu | Moyenne | A FAIRE |

**Total estime** : 11-12 semaines (1 developpeur)
**Phases 1-5 completees** : 2025-11-26

---

## PHASE 1 : QUICK WINS UX WEB (Semaine 1) - COMPLETE

Objectif : Corrections rapides a fort impact sur l'experience utilisateur.

### Taches

- [x] **Header: Menu utilisateur Radix**
  - Fichier: `apps/web/src/components/layout/header.tsx`
  - Remplace le dropdown custom par `DropdownMenu` de @erp/ui
  - Ajoute aria-label="Menu utilisateur"

- [x] **Header: Aria-labels**
  - aria-label sur bouton recherche
  - aria-hidden sur icones decoratives
  - Ajouter aria-label sur toggle theme

- [ ] **Toasts: Timeout 5 secondes**
  - Fichier: `apps/web/src/hooks/use-toast.ts`
  - Passer duration de 3000 a 5000ms
  - Permettre dismiss manuel

- [ ] **Tables: Etat vide**
  - Fichier: `apps/web/src/components/data-table/`
  - Afficher "Aucun resultat" quand data.length === 0
  - Ajouter illustration optionnelle

- [ ] **Forms: Loading state**
  - Ajouter isSubmitting aux formulaires
  - Afficher spinner dans bouton submit
  - Desactiver bouton pendant soumission

### Criteres de validation
- [ ] Menu utilisateur navigable au clavier
- [ ] Toast reste visible 5 secondes
- [ ] Tables vides affichent message explicite
- [ ] Boutons submit montrent etat loading

---

## PHASE 2 : COMPOSANTS FEEDBACK (Semaine 2)

Objectif : Creer composants reutilisables pour feedback utilisateur.

### Taches

- [ ] **Creer SkeletonLoader**
  - Fichier: `apps/web/src/components/feedback/skeleton-loader.tsx`
  - Props: width, height, variant (text, circular, rectangular)
  - Animation pulse CSS

- [ ] **Creer TableSkeleton**
  - Fichier: `apps/web/src/components/feedback/table-skeleton.tsx`
  - Props: rows (default 5), columns (default 4)
  - Skeleton pour header + lignes

- [ ] **Creer EmptyState**
  - Fichier: `apps/web/src/components/feedback/empty-state.tsx`
  - Props: title, description, icon, action (bouton optionnel)
  - Illustration SVG par defaut

- [ ] **Creer LoadingSpinner**
  - Fichier: `apps/web/src/components/feedback/loading-spinner.tsx`
  - Props: size (sm, md, lg), label (pour a11y)
  - Utiliser Lucide Loader2 avec animation spin

- [ ] **Integrer dans pages principales**
  - Dashboard: skeleton pendant chargement stats
  - Users: TableSkeleton pendant fetch
  - Admin: skeleton pour panels

### Criteres de validation
- [ ] Composants exportes dans index.ts
- [ ] Storybook stories creees (optionnel)
- [ ] Utilises sur au moins 3 pages

---

## PHASE 3 : ACCESSIBILITE (Semaine 3)

Objectif : Atteindre score Lighthouse Accessibility > 90.

### Taches

- [ ] **Audit axe DevTools**
  - Lancer audit sur toutes les pages principales
  - Documenter issues dans fichier AUDIT-A11Y.md
  - Prioriser corrections

- [ ] **Breadcrumbs semantiques**
  - Fichier: `apps/web/src/components/wrappers/auto-breadcrumb-wrapper.tsx`
  - Wrapper avec `<nav aria-label="Fil d'Ariane">`
  - Utiliser `<ol>` pour liste ordonnee

- [ ] **Focus trap modales**
  - Verifier que Dialog Radix gere le focus
  - Ajouter `@radix-ui/react-focus-guards` si necessaire
  - Tester navigation Tab dans modales

- [ ] **Erreurs formulaires**
  - Associer messages erreur via aria-describedby
  - Ajouter role="alert" sur messages erreur
  - Focus automatique sur premier champ en erreur

- [ ] **Contraste couleurs**
  - Verifier text-muted-foreground vs background
  - Utiliser outil contrast checker
  - Corriger si ratio < 4.5:1 (WCAG AA)

### Criteres de validation
- [ ] Score Lighthouse Accessibility > 90
- [ ] 0 erreurs critiques axe DevTools
- [ ] Navigation clavier complete possible

---

## PHASE 4 : UX FORMULAIRES (Semaine 4)

Objectif : Ameliorer l'experience de saisie et validation.

### Taches

- [ ] **Validation temps reel**
  - Fichier: `apps/web/src/hooks/use-form-validation.ts`
  - Valider onBlur avec debounce 500ms
  - Afficher erreur des que champ invalide

- [ ] **Indicateur champs requis**
  - Ajouter asterisque rouge (*) sur labels requis
  - Creer composant FormLabel avec prop required
  - Ajouter aria-required="true"

- [ ] **Affichage erreurs ameliore**
  - Icone AlertCircle a cote du message
  - Bordure rouge sur input en erreur
  - Animation shake subtile

- [ ] **i18n messages erreur**
  - Externaliser dans fichiers traduction
  - Fichiers: `apps/web/src/lib/i18n/translations/*.ts`
  - Cles: validation.required, validation.email, etc.

### Criteres de validation
- [ ] Erreurs visibles immediatement apres blur
- [ ] Champs requis clairement identifies
- [ ] Messages traduits FR/EN/ES

---

## PHASE 5 : PERFORMANCE WEB (Semaine 5)

Objectif : Reduire temps de chargement initial et ameliorer Core Web Vitals.

### Taches

- [ ] **Code splitting routes admin**
  - Fichier: `apps/web/src/app/(dashboard)/admin/`
  - Utiliser `dynamic()` de Next.js
  - Lazy load: users, roles, database, menus

- [ ] **Suspense boundaries**
  - Ajouter `<Suspense fallback={<Skeleton />}>` aux pages async
  - Wrapper les composants qui fetchent des donnees

- [ ] **Virtualisation tables**
  - Installer `@tanstack/react-virtual`
  - Appliquer sur tables > 100 lignes
  - Fichier: `apps/web/src/components/data-table/`

- [ ] **Bundle analyzer**
  - Configurer `@next/bundle-analyzer`
  - Identifier packages lourds
  - Documenter opportunites d'optimisation

### Criteres de validation
- [ ] LCP < 2.5s
- [ ] Bundle JS initial < 200kb gzipped
- [ ] Tables 1000+ lignes fluides

---

## PHASE 6 : MIGRATION BACKEND TOPTIME (Semaines 6-8)

Objectif : Integrer les modules metier TopTime dans le backend TopSteel.

### Semaine 6 : Analyse et planification

- [ ] **Analyser schema Prisma TopTime**
  - Fichier: `C:\GitHub\TopTime\backend\prisma\schema.prisma`
  - Lister toutes les entites
  - Identifier relations et contraintes

- [ ] **Comparer avec schema TopSteel**
  - Fichier: `apps/api/prisma/schema.prisma`
  - Identifier entites communes (User, Article, etc.)
  - Documenter differences de nommage

- [ ] **Definir strategie migration**
  - Option A: Microservices (modules separes)
  - Option B: Monolithe enrichi (tout dans TopSteel)
  - Documenter decision et justification

- [ ] **Plan de migration tables**
  - Creer fichier MIGRATION-PLAN.md
  - Ordre de migration des modules
  - Scripts de migration donnees

### Semaine 7 : Migration modules core

- [ ] **Migrer module Pointage**
  - Entites: Pointage, Badge, Terminal
  - Controllers: pointage.controller.ts
  - Services: pointage.service.ts
  - DTOs et validation

- [ ] **Migrer module Production**
  - Entites: OrdreFabrication, Gamme, Operation, Nomenclature
  - Controllers et services
  - Logique metier (calculs, etats)

### Semaine 8 : Migration modules complementaires

- [ ] **Migrer module Stock avance**
  - Entites: Lot, MouvementStock, Emplacement
  - Tracabilite et historique
  - Valorisation stock

- [ ] **Migrer module Achats**
  - Entites: DemandeAchat, CommandeFournisseur, Reception
  - Workflow validation
  - Integration fournisseurs

### Criteres de validation
- [ ] Schema Prisma unifie sans conflits
- [ ] Migrations executees sans erreur
- [ ] Tests unitaires passes pour nouveaux modules

---

## PHASE 7 : INTEGRATION TOPTIME MOBILE (Semaines 9-10)

Objectif : Adapter l'app mobile TopTime pour consommer le backend unifie.

### Taches

- [ ] **Adapter clients API Ktor**
  - Fichier: `C:\GitHub\TopTime\shared\src\commonMain\kotlin\com\toptime\data\api\`
  - Mettre a jour baseUrl vers nouveau backend
  - Adapter endpoints si renommes

- [ ] **Tester authentification unifiee**
  - Verifier JWT compatible
  - Tester login depuis app mobile
  - Valider refresh token

- [ ] **Valider endpoints Pointage**
  - POST /pointage (badger)
  - GET /pointage/historique
  - GET /pointage/stats

- [ ] **Valider endpoints Stock**
  - GET /articles
  - POST /mouvements
  - GET /lots/{id}

- [ ] **Valider endpoints Production**
  - GET /ordres-fabrication
  - PUT /ordres-fabrication/{id}/status
  - GET /gammes

- [ ] **Tests E2E cross-platform**
  - Scenario: Login web + mobile meme compte
  - Scenario: Creer OF web, voir sur mobile
  - Scenario: Pointage mobile, stats web

### Criteres de validation
- [ ] App mobile fonctionne avec nouveau backend
- [ ] Pas de regression fonctionnelle
- [ ] Temps reponse API < 500ms

---

## PHASE 8 : TESTS & QUALITE (Semaine 11)

Objectif : Assurer qualite et non-regression.

### Taches

- [ ] **Tests E2E Playwright**
  - Ajouter tests pour nouvelles pages
  - Couvrir scenarios critiques (login, CRUD)
  - Fichier: `apps/web/e2e/`

- [ ] **Integrer axe-core CI**
  - Ajouter @axe-core/playwright
  - Echouer CI si erreurs a11y critiques
  - Fichier: `.github/workflows/pr-checks.yml`

- [ ] **Lighthouse CI**
  - Configurer lighthouse-ci
  - Seuils: Performance > 80, A11y > 90
  - Rapport sur chaque PR

- [ ] **Sentry error tracking**
  - Installer @sentry/nextjs
  - Configurer DSN production
  - Tester capture erreurs

### Criteres de validation
- [ ] CI passe sur toutes les PR
- [ ] Coverage tests > 70%
- [ ] Sentry capture erreurs production

---

## PHASE 9 : DOCUMENTATION (Continu)

Objectif : Documenter pour maintenabilite et onboarding.

### Taches

- [ ] **API unifiee OpenAPI**
  - Generer spec Swagger depuis NestJS
  - Publier sur /api/docs
  - Versionner API

- [ ] **Guide migration equipe TopTime**
  - Comment pointer vers nouveau backend
  - Mapping anciens/nouveaux endpoints
  - Breaking changes

- [ ] **Changelog modifications**
  - CHANGELOG.md a jour
  - Notes de version
  - Migration guide utilisateurs

### Criteres de validation
- [ ] Documentation API accessible
- [ ] Guide migration relu par equipe TopTime
- [ ] Changelog a jour

---

## Fichiers cles a modifier

### TopSteel Web (apps/web/)

| Fichier | Phase | Modification |
|---------|-------|--------------|
| `components/layout/header.tsx` | 1 | Menu Radix, aria-labels |
| `hooks/use-toast.ts` | 1 | Timeout 5s |
| `components/feedback/*.tsx` | 2 | Nouveaux composants |
| `components/wrappers/auto-breadcrumb-wrapper.tsx` | 3 | Semantique nav |
| `hooks/use-form-validation.ts` | 4 | Validation temps reel |
| `lib/i18n/translations/*.ts` | 4 | Messages erreur |
| `app/(dashboard)/admin/*` | 5 | Code splitting |

### TopSteel API (apps/api/)

| Fichier | Phase | Modification |
|---------|-------|--------------|
| `prisma/schema.prisma` | 6 | Entites TopTime |
| `src/domains/pointage/*` | 6 | Nouveau module |
| `src/domains/production/*` | 6 | Nouveau module |
| `src/domains/stock/*` | 6 | Extensions |
| `src/domains/achats/*` | 6 | Nouveau module |

### TopTime (C:\GitHub\TopTime\)

| Fichier | Phase | Modification |
|---------|-------|--------------|
| `shared/.../api/BaseApiClient.kt` | 7 | baseUrl |
| `shared/.../api/*Api.kt` | 7 | Endpoints adaptes |

---

## Metriques de succes

| Metrique | Actuel | Cible |
|----------|--------|-------|
| Lighthouse Performance | ~70 | > 85 |
| Lighthouse Accessibility | ~60 | > 90 |
| Temps chargement initial | ~4s | < 2s |
| Erreurs axe critiques | ? | 0 |
| Tests E2E coverage | 95 tests | +30 tests |
| Backends a maintenir | 2 | 1 |
| Temps reponse API | ? | < 500ms |

---

## Notes

- **Priorite** : Phases 1-4 (UX) peuvent etre faites en parallele de Phase 6 (Backend)
- **Risques** : Migration backend peut reveler incompatibilites de schema
- **Dependencies** : Phase 7 depend de Phase 6 completee
- **Equipe suggeree** : 1 dev frontend (Phases 1-5) + 1 dev backend (Phases 6-7)

---

*Document cree le 2025-11-26*
*Derniere mise a jour : 2025-11-26*
