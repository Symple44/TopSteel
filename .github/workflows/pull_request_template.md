# .github/pull_request_template.md

## Description

<!-- Décrivez brièvement les changements apportés -->

## Type de changement

- [ ] 🐛 Bug fix (changement non-breaking qui corrige un problème)
- [ ] ✨ Nouvelle fonctionnalité (changement non-breaking qui ajoute une fonctionnalité)
- [ ] 💥 Breaking change (changement qui pourrait casser la compatibilité)
- [ ] 📝 Documentation
- [ ] 🎨 Style/UI
- [ ] ♻️ Refactoring
- [ ] ⚡ Performance
- [ ] ✅ Tests
- [ ] 🔧 Configuration
- [ ] 🔐 Sécurité

## Checklist

- [ ] Mon code suit les conventions du projet
- [ ] J'ai effectué une auto-review de mon code
- [ ] J'ai commenté mon code, particulièrement dans les parties complexes
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] J'ai ajouté des tests qui prouvent que ma correction/fonctionnalité fonctionne
- [ ] Les tests unitaires passent localement
- [ ] J'ai vérifié que ma branche est à jour avec `develop`/`main`

## 🏢 Multi-Tenant Checklist

<!-- Cochez cette section SI votre PR ajoute/modifie des tables ou fonctionnalités métier -->

### Modification de Données

- [ ] **Prisma Schema**: Toute nouvelle table métier inclut le champ `societeId`
  - [ ] Champ `societeId String @map("societe_id")` ajouté
  - [ ] Relation `societe Societe @relation(...)` ajoutée
  - [ ] Index `@@index([societeId])` ajouté
  - [ ] Index composites ajoutés si nécessaire (ex: `@@index([societeId, userId])`)

- [ ] **Type de societeId**:
  - [ ] `societeId` REQUIRED pour données strictement isolées (ex: notifications, commandes)
  - [ ] `societeId?` NULLABLE pour ressources globales (ex: paramètres système, menus globaux)

### Sécurité et Isolation

- [ ] **Row-Level Security (RLS)**: Politiques PostgreSQL ajoutées
  - [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` exécuté
  - [ ] Politique d'isolation créée: `CREATE POLICY societe_isolation_...`
  - [ ] Politique admin bypass créée: `CREATE POLICY admin_bypass_...`
  - [ ] Politique nullable créée (si applicable): `societe_id IS NULL OR ...`

- [ ] **Services Prisma**: Services utilisent le contexte tenant
  - [ ] `TenantContextService` injecté si nécessaire
  - [ ] `getSocieteId()` utilisé pour récupérer le contexte
  - [ ] Aucune requête Prisma directe sans contexte tenant

- [ ] **Middleware**: Vérification du middleware Prisma
  - [ ] Nouveau modèle ajouté à `TENANT_MODELS` dans `prisma-tenant.middleware.ts`
  - [ ] Ajouté à `NULLABLE_SOCIETE_ID_MODELS` si nullable

### Tests et Validation

- [ ] **Tests d'Isolation**: Tests multi-tenant ajoutés
  - [ ] Test d'isolation: User1 ne voit PAS les données de User2
  - [ ] Test super admin: Admin voit TOUTES les sociétés
  - [ ] Test nullable: Données globales visibles par tous
  - [ ] Test concurrent: Contextes isolés en parallèle

- [ ] **Validation SQL**: Index et RLS vérifiés
  - [ ] Script `check-indexes.js` exécuté - tous les index présents
  - [ ] Script `verify-rls.js` exécuté - RLS actif
  - [ ] Aucune requête SQL brute sans `societe_id`

### Performance

- [ ] **Index de Performance**: Index composites optimisés
  - [ ] Index `(societe_id, created_at)` pour tri par date
  - [ ] Index `(societe_id, user_id)` pour filtrage utilisateur
  - [ ] Index `(societe_id, status)` pour filtrage statut
  - [ ] `EXPLAIN ANALYZE` vérifié sur requêtes critiques

### Documentation

- [ ] **Documentation Mise à Jour**:
  - [ ] Architecture multi-tenant documentée dans PR description
  - [ ] Migrations Prisma générées et testées
  - [ ] README mis à jour si nouveau pattern introduit

---

## Tests effectués

<!-- Décrivez les tests que vous avez effectués pour vérifier vos changements -->

## Screenshots (si applicable)

<!-- Ajoutez des captures d'écran pour illustrer les changements visuels -->

## Notes pour les reviewers

<!-- Ajoutez des notes spécifiques pour aider les reviewers -->
