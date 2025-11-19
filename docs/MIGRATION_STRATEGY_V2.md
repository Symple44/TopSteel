# Stratégie de Migration TypeORM → Prisma V2

**Date**: 2025-11-19
**Approche**: Stabilisation + Migration Incrémentale Domaine par Domaine
**Objectif**: Migration complète 100% Prisma avec risque minimal

---

## 🎯 Philosophie de l'Approche

### Principes Directeurs

1. **Stabiliser AVANT de migrer** - Codebase doit compiler avant toute migration
2. **Incrémental > Massif** - Un domaine à la fois, pas tout en même temps
3. **Tester après chaque étape** - Tests E2E après chaque domaine migré
4. **Réversible** - Chaque étape est committable et réversible
5. **Visibilité** - Métriques claires de progression

### Ce Que Nous Avons Appris

❌ **Ce qui ne fonctionne PAS**:
- Supprimer entities en masse sans analyser usages
- Remplacer tous les imports automatiquement
- Assumer que Prisma types = TypeORM entities

✅ **Ce qui fonctionne**:
- Analyse détaillée avant action
- Scripts ciblés avec whitelist
- Migration domaine par domaine
- Tests continus

---

## 📋 Plan en 4 Phases

### Phase 1: Stabilisation (Priorité CRITIQUE)

**Objectif**: Retour à état compilable
**Durée estimée**: 2-3 heures
**Critère de succès**: `npx tsc --noEmit` → 0 erreurs

#### Étape 1.1: Identifier Entities Nécessaires

**Action**: Analyser quelles entities TypeORM sont vraiment nécessaires

**Script à créer**: `analyze-typeorm-usage.js`
```javascript
// Pour chaque entity TypeORM supprimée:
// 1. Chercher usages de decorators (@ManyToOne, @Entity, etc.)
// 2. Chercher usages dans TypeOrmModule.forFeature([...])
// 3. Chercher usages dans @InjectRepository(...)
// 4. Générer rapport: NÉCESSAIRE vs PEUT ÊTRE SUPPRIMÉ
```

**Output attendu**:
```json
{
  "critical": [
    "user.entity.ts",
    "menu-item.entity.ts",
    // ... entities avec decorators actifs
  ],
  "canRemove": [
    // entities vraiment inutilisées
  ]
}
```

#### Étape 1.2: Restaurer Entities Critiques Uniquement

**Action**: Restaurer seulement les entities identifiées comme NÉCESSAIRES

**Commandes**:
```bash
# Depuis rapport précédent
for entity in "${critical_entities[@]}"; do
  git checkout f024017b~1 -- "apps/api/src/**/$entity"
done
```

#### Étape 1.3: Nettoyer Imports Dupliqués

**Action**: Retirer imports Prisma là où entity TypeORM existe

**Script à créer**: `cleanup-duplicate-imports.js`
```javascript
// Pour chaque fichier:
// Si importe User de TypeORM ET de Prisma:
//   - Garder import TypeORM (nécessaire pour decorators)
//   - Retirer import Prisma
```

#### Étape 1.4: Validation

**Tests**:
```bash
npx tsc --noEmit  # → 0 erreurs
pnpm test:unit    # → Tous passent
pnpm test:e2e -- licensing-api  # → 21/21 passent
```

**Commit**: `fix: restore critical TypeORM entities for stability`

---

### Phase 2: Cartographie (Analyse Stratégique)

**Objectif**: Comprendre l'architecture actuelle
**Durée estimée**: 1-2 heures
**Critère de succès**: Carte claire des domaines et leur état ORM

#### Étape 2.1: Inventaire par Domaine

**Script à créer**: `map-orm-usage-by-domain.js`

**Analyse pour chaque domaine**:
```javascript
{
  "licensing": {
    "status": "100% Prisma ✅",
    "prismaModels": ["License", "LicenseFeature", ...],
    "typeormEntities": [],
    "typeormUsage": {
      "decorators": 0,
      "repositories": 0,
      "modules": 0
    },
    "migrationComplexity": "COMPLETED",
    "testCoverage": "21/21 E2E tests"
  },
  "auth": {
    "status": "Hybride ⚠️",
    "prismaModels": ["User", "Role", "Permission", ...],
    "typeormEntities": ["user-session.entity", "mfa-session.entity", ...],
    "typeormUsage": {
      "decorators": 15,
      "repositories": 8,
      "modules": 3
    },
    "migrationComplexity": "HIGH",
    "testCoverage": "Unknown"
  },
  // ... pour chaque domaine
}
```

#### Étape 2.2: Scorer Complexité Migration

**Critères de scoring**:
- Nombre decorators TypeORM: +2 points par decorator
- Nombre repositories TypeORM: +3 points par repository
- Relations complexes: +5 points
- Tests E2E existants: -10 points (facilite validation)

**Classification**:
- EASY (0-10 points): Migration 1-2h
- MEDIUM (11-30 points): Migration 3-6h
- HIGH (31-50 points): Migration 1-2 jours
- VERY HIGH (50+ points): Migration 2-4 jours

#### Étape 2.3: Plan de Migration

**Ordre recommandé** (du plus facile au plus complexe):
1. Domaines EASY complétés (ex: Licensing déjà fait ✅)
2. Domaines EASY restants
3. Domaines MEDIUM
4. Domaines HIGH
5. Domaines VERY HIGH

**Output**: `MIGRATION_ROADMAP.md` avec timeline et ordre

---

### Phase 3: Migration Incrémentale (Domaine par Domaine)

**Objectif**: Migrer chaque domaine individuellement
**Durée estimée**: Variable selon complexité
**Critère de succès**: Tests E2E passent après chaque domaine

#### Template de Migration (Pour Chaque Domaine)

**Étape 3.X.1: Préparation**
```bash
# Créer branche dédiée
git checkout -b migrate/domain-name

# Documenter état initial
node scripts/map-orm-usage-by-domain.js --domain=domain-name > docs/MIGRATION_domain-name_BEFORE.json
```

**Étape 3.X.2: Vérifier Schema Prisma**
```prisma
// Vérifier que tous les models existent
// Si manquant, ajouter au schema.prisma
model NewModel {
  id String @id @default(cuid())
  // ... fields
}
```

**Étape 3.X.3: Créer Services Prisma**
```typescript
// domain-name/prisma/domain-prisma.service.ts
@Injectable()
export class DomainPrismaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.model.findMany();
  }
  // ... méthodes CRUD
}
```

**Étape 3.X.4: Remplacer dans Controllers**
```typescript
// AVANT:
constructor(
  @InjectRepository(Model)
  private repo: Repository<Model>
) {}

// APRÈS:
constructor(
  private domainPrisma: DomainPrismaService
) {}
```

**Étape 3.X.5: Retirer TypeORM du Module**
```typescript
// AVANT:
@Module({
  imports: [TypeOrmModule.forFeature([Model])],
  // ...
})

// APRÈS:
@Module({
  imports: [],
  providers: [DomainPrismaService],
  // ...
})
```

**Étape 3.X.6: Supprimer Entity TypeORM**
```bash
# Seulement si AUCUN usage restant
rm src/domains/domain-name/entities/model.entity.ts
```

**Étape 3.X.7: Tests**
```bash
# Tests unitaires
pnpm test -- domain-name

# Tests E2E
pnpm test:e2e -- domain-name

# Compilation
npx tsc --noEmit
```

**Étape 3.X.8: Commit**
```bash
git add -A
git commit -m "feat(domain-name): Complete Prisma migration ✅

- Migrated from TypeORM to Prisma
- Created DomainPrismaService
- Updated controllers and services
- Removed TypeORM entity
- Tests: X/X passing

Complexity: EASY/MEDIUM/HIGH
Time spent: Xh
"
```

**Étape 3.X.9: Merge & Continue**
```bash
git checkout main
git merge migrate/domain-name
git push

# Passer au domaine suivant
```

#### Domaines Suggérés (Ordre)

**Round 1 - EASY** (1-2h chacun):
1. ✅ Licensing (Déjà fait!)
2. Parameters (peu de relations)
3. Notifications (simple CRUD)
4. Query Builder (isolé)

**Round 2 - MEDIUM** (3-6h chacun):
5. Sites/Societes (relations modérées)
6. Menu/Admin (configuration simple)
7. Users (utilisé partout mais structure claire)

**Round 3 - HIGH** (1-2 jours chacun):
8. Auth (complexe, beaucoup de relations)
9. Roles/Permissions (relations multiples)

**Round 4 - Cleanup**:
10. Retirer TypeORM dependencies de package.json
11. Supprimer config TypeORM
12. Documentation finale

---

### Phase 4: Finalisation (Nettoyage Global)

**Objectif**: Projet 100% Prisma propre
**Durée estimée**: 2-3 heures
**Critère de succès**: Aucune trace de TypeORM dans le code

#### Étape 4.1: Retirer TypeORM Complètement

**package.json**:
```bash
pnpm remove typeorm @nestjs/typeorm
```

**Supprimer configs**:
```bash
rm apps/api/src/core/database/*.config.ts
rm apps/api/ormconfig.json
```

#### Étape 4.2: Cleanup Final

**Script**: `final-cleanup.js`
```javascript
// Chercher toutes références TypeORM restantes:
// - import from 'typeorm'
// - @InjectRepository
// - TypeOrmModule
// Générer rapport d'erreurs si trouvées
```

#### Étape 4.3: Documentation

**Créer**:
- `ARCHITECTURE.md` - Architecture finale 100% Prisma
- `MIGRATION_COMPLETE.md` - Résumé complet de la migration
- `PRISMA_BEST_PRACTICES.md` - Guide pour futures développements

#### Étape 4.4: Validation Finale

**Tests complets**:
```bash
# Tous les tests unitaires
pnpm test

# Tous les tests E2E
pnpm test:e2e

# Build production
pnpm build

# Performance tests
pnpm test:perf
```

**Commit**:
```bash
git commit -m "feat: Complete TypeORM → Prisma migration 🎉

Project is now 100% Prisma:
- All domains migrated
- TypeORM removed from dependencies
- All tests passing (X/X)
- Documentation updated

Migration stats:
- Duration: X days
- Domains migrated: X
- Files changed: X
- Tests created: X
- Lines removed: -X (TypeORM)
- Lines added: +X (Prisma)
"
```

---

## 📊 Métriques de Succès

### Par Phase

**Phase 1 - Stabilisation**:
- ✅ 0 erreurs TypeScript
- ✅ Tests Licensing E2E passent (21/21)
- ✅ Temps: < 3h

**Phase 2 - Cartographie**:
- ✅ Carte complète des domaines créée
- ✅ Plan de migration priorisé
- ✅ Temps: < 2h

**Phase 3 - Migration**:
- ✅ Chaque domaine: tests E2E passent avant merge
- ✅ Compilation propre après chaque domaine
- ✅ Commits propres et réversibles

**Phase 4 - Finalisation**:
- ✅ 0 dépendances TypeORM
- ✅ Tous tests passent (100%)
- ✅ Documentation complète

### Globales

**Techniques**:
- TypeScript: 0 erreurs ✅
- Tests unitaires: 100% passing ✅
- Tests E2E: 100% passing ✅
- Build: Success ✅
- Performance: Pas de régression ✅

**Projet**:
- Code coverage: Maintenu ou amélioré
- Lignes de code: Réduit (TypeORM boilerplate retiré)
- Complexité: Réduite (un seul ORM)
- Maintenabilité: Améliorée

---

## 🛠️ Scripts à Créer

### Priorité HAUTE (Phase 1)

1. **`analyze-typeorm-usage.js`**
   - Scanne tous fichiers pour usages TypeORM
   - Identifie entities critiques vs supprimables
   - Output: JSON avec classification

2. **`cleanup-duplicate-imports.js`**
   - Détecte imports dupliqués (TypeORM + Prisma)
   - Garde TypeORM si decorators présents
   - Garde Prisma sinon
   - Applique corrections

3. **`restore-critical-entities.js`**
   - Lit rapport analyze-typeorm-usage
   - Restaure entities depuis git
   - Vérifie restauration réussie

### Priorité MOYENNE (Phase 2)

4. **`map-orm-usage-by-domain.js`**
   - Analyse chaque domaine individuellement
   - Score complexité migration
   - Génère roadmap priorisé

5. **`generate-migration-checklist.js`**
   - Crée checklist pour migration domaine
   - Template commit message
   - Tests à exécuter

### Priorité BASSE (Phase 4)

6. **`final-cleanup.js`**
   - Scanne références TypeORM restantes
   - Vérifie aucune dépendance orpheline
   - Génère rapport final

---

## ⏱️ Timeline Estimée

### Optimiste (Si tout va bien)

| Phase | Durée | Total Cumulé |
|-------|-------|--------------|
| Phase 1: Stabilisation | 2-3h | 3h |
| Phase 2: Cartographie | 1-2h | 5h |
| Phase 3: Round 1 (4 domaines EASY) | 6-8h | 13h |
| Phase 3: Round 2 (3 domaines MEDIUM) | 12-18h | 31h |
| Phase 3: Round 3 (2 domaines HIGH) | 16-32h | 63h |
| Phase 4: Finalisation | 2-3h | 66h |

**Total optimiste**: ~8-9 jours de travail

### Réaliste (Avec imprévus)

| Phase | Durée | Total Cumulé |
|-------|-------|--------------|
| Phase 1: Stabilisation | 3-4h | 4h |
| Phase 2: Cartographie | 2-3h | 7h |
| Phase 3: Round 1 | 8-12h | 19h |
| Phase 3: Round 2 | 18-24h | 43h |
| Phase 3: Round 3 | 32-48h | 91h |
| Phase 4: Finalisation | 3-5h | 96h |

**Total réaliste**: ~12-14 jours de travail

---

## 🎯 Décision Immédiate Recommandée

### Option 1: Commencer Phase 1 Maintenant

**Si**: Tu as 2-3h disponibles maintenant
**Action**: Commencer Phase 1 - Stabilisation
**Résultat**: Codebase compile ce soir

### Option 2: Planifier Session Dédiée

**Si**: Préfères session dédiée plus longue
**Action**: Planifier 1 journée complète pour Phases 1+2
**Résultat**: Codebase stable + Roadmap complet

### Option 3: Approche Hybride Long Terme

**Si**: Migration complète non prioritaire
**Action**: Stabiliser seulement (Phase 1), garder hybride
**Résultat**: Codebase stable, migration progressive ultérieure

---

## 💬 Questions à Clarifier

Avant de commencer, clarifions:

1. **Timeline**: Migration complète est-elle prioritaire ou peut être étalée?
2. **Ressources**: Combien de temps disponible par session?
3. **Risque**: Tolérance au risque (migration aggressive vs prudente)?
4. **Tests**: Tests E2E existent-ils pour autres domaines que Licensing?
5. **Équipe**: Migration en solo ou avec revue équipe?

---

**Document par**: Claude Code
**Date**: 2025-11-19
**Statut**: Stratégie V2 - Prête à exécuter
**Next**: Décision sur option + Commencer Phase 1
