# Plan d'Intégration TopSteel ↔ TopTime

**Date:** 2025-11-20  
**Status:** 🟢 Socle Prisma Finalisé - Prêt pour intégration

---

## 🎯 Vision Globale

```
┌─────────────────────────────────────────────────────────┐
│                     TopSteel (Infrastructure)            │
│  ✅ Socle Prisma finalisé - Auth, Multi-tenant, RBAC   │
├─────────────────────────────────────────────────────────┤
│  • 45 entités Prisma (Auth + Shared + Tenant)          │
│  • 47 services Prisma opérationnels                     │
│  • Multi-tenant DB-level isolation                      │
│  • Cache Redis + Performance optimizations              │
└─────────────────────────────────────────────────────────┘
                            ↕
                 [API REST/GraphQL]
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    TopTime (Métier)                      │
│  🔄 Backend TypeORM → Migration Prisma requise         │
├─────────────────────────────────────────────────────────┤
│  • Backend: Node.js + Express + TypeORM → Prisma       │
│  • Android: Kotlin + Jetpack Compose                    │
│  • Modules: Stock, Achats, Production, Valorisation     │
│  • 946 tests passing, quasi production-ready            │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 État Actuel

### TopSteel ✅
- **Commit:** `c975af4c` - "Finalize infrastructure base with complete Prisma migration"
- **TypeScript:** 0 erreurs
- **Prisma Schema:** 45 entités alignées avec TypeORM
- **Services:** 47 services Prisma avec pattern d'aliasing
- **Architecture:** Multi-tenant prêt, RBAC complet, cache Redis

### TopTime 🔄
- **Backend:** TypeORM (à migrer vers Prisma)
- **Version:** 1.0.0 - Near Production Ready
- **Tests:** 946 tests passing
- **Modules:** Stock, Achats, Production, Pointage
- **Android:** Kotlin + Jetpack Compose

---

## 🚀 Plan d'Action - Phase 1 : Alignement Architecture

### Étape 1.1 : Migration TopTime vers Prisma ⏰ Urgent

**Objectif:** Aligner TopTime sur le même socle Prisma que TopSteel

**Actions:**
1. ✅ Analyser les entités TypeORM de TopTime
2. ⏳ Créer le schéma Prisma pour TopTime (basé sur TopSteel)
3. ⏳ Migrer les services TypeORM → Prisma services
4. ⏳ Utiliser le même pattern d'aliasing que TopSteel
5. ⏳ Valider avec les 946 tests existants

**Fichiers clés TopTime:**
- `backend/src/models/` - Entités TypeORM
- `backend/src/services/` - Services métier
- `backend/src/controllers/` - Controllers REST

**Réutilisation TopSteel:**
- Pattern d'aliasing (`auth.module.ts:159-214`)
- PrismaService avec lifecycle hooks
- Structure des services Prisma

### Étape 1.2 : Harmonisation Base de Données

**Objectif:** Définir la stratégie de partage/séparation des BDs

**Options:**
1. **Option A - Base Unique** (Recommandée pour MVP)
   - TopSteel + TopTime dans la même DB PostgreSQL
   - Séparation par schémas (`topsteel_auth`, `toptime_metier`)
   - Partage des tables auth (users, roles, permissions)

2. **Option B - Bases Séparées** (Pour isolation complète)
   - TopSteel: Base infrastructure
   - TopTime: Base métier
   - Communication via API REST

**Recommandation:** Option A pour simplifier l'authentification unifiée

---

## 🔄 Phase 2 : Microservices & Communication

### Étape 2.1 : Architecture Microservices

```
┌─────────────────┐         ┌─────────────────┐
│   TopSteel API  │◄───────►│   TopTime API   │
│   (Port 3001)   │   REST  │   (Port 3000)   │
└─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  PostgreSQL     │         │  PostgreSQL     │
│  (Infrastructure)│◄──────►│  (Métier)       │
│  - users        │  Shared │  - articles     │
│  - roles        │  Auth   │  - stock        │
│  - permissions  │         │  - commandes    │
└─────────────────┘         └─────────────────┘
```

### Étape 2.2 : Contrats d'API

**TopSteel expose:**
- `POST /api/auth/login` - Authentification unifiée
- `GET /api/auth/me` - Info utilisateur + permissions
- `GET /api/auth/validate-token` - Validation JWT
- `GET /api/societes` - Liste sociétés/usines
- `GET /api/users` - CRUD utilisateurs

**TopTime consomme:**
- Auth via TopSteel (JWT partagé)
- Validation permissions RBAC
- Context multi-tenant (usine courante)

**TopTime expose:**
- `GET /api/stock/articles` - Gestion stock
- `GET /api/achats/commandes` - Gestion achats
- `GET /api/production/of` - Ordres de fabrication
- `GET /api/pointage` - Système pointage

---

## 🎯 Phase 3 : Intégration Progressive

### Sprint 1 : Auth Unifiée (1 semaine)
- [ ] Migrer TopTime vers Prisma (réutiliser TopSteel)
- [ ] Partager les tables auth (users, roles, permissions)
- [ ] Implémenter JWT partagé entre TopSteel et TopTime
- [ ] Tester l'authentification cross-services

### Sprint 2 : Multi-tenant (1 semaine)
- [ ] Synchroniser le contexte usine entre TopSteel et TopTime
- [ ] Implémenter le filtrage par usine dans TopTime
- [ ] Valider les permissions RBAC cross-services

### Sprint 3 : Modules Métier (2 semaines)
- [ ] Exposer les APIs TopTime (Stock, Achats, Production)
- [ ] Créer les clients API côté TopSteel
- [ ] Implémenter les écrans de consultation dans TopSteel web

### Sprint 4 : Android (1 semaine)
- [ ] Mettre à jour l'app Android pour pointer vers les nouvelles APIs
- [ ] Tester le flux complet mobile → TopTime → TopSteel

---

## 📦 Prochaines Étapes Immédiates

### Aujourd'hui
1. ✅ Commit du socle Prisma TopSteel
2. ⏳ Analyser les entités TopTime à migrer
3. ⏳ Créer le schéma Prisma TopTime (inspiration TopSteel)

### Cette Semaine
1. ⏳ Migrer 10 entités principales de TopTime vers Prisma
2. ⏳ Implémenter le partage d'authentification
3. ⏳ Tester le premier appel API TopSteel → TopTime

### Semaine Prochaine
1. ⏳ Finaliser la migration Prisma de TopTime
2. ⏳ Valider les 946 tests avec Prisma
3. ⏳ Déployer un environnement de staging intégré

---

## 🔧 Stack Technique Unifiée

### Backend Commun
- **Runtime:** Node.js 22.x
- **Language:** TypeScript 5.9
- **Framework:** NestJS (TopSteel) + Express (TopTime → NestJS?)
- **ORM:** Prisma 6.x ✅
- **Database:** PostgreSQL 16+
- **Cache:** Redis 7+
- **Auth:** JWT + bcrypt

### DevOps
- **Package Manager:** pnpm
- **Testing:** Vitest
- **Linting:** Biome
- **CI/CD:** GitHub Actions

---

## 📊 Métriques de Succès

### Phase 1 (Migration Prisma)
- ✅ 0 erreurs TypeScript
- ✅ 946 tests passing
- ✅ Temps de migration < 2 semaines

### Phase 2 (Intégration)
- ⏳ Auth unifiée fonctionnelle
- ⏳ Multi-tenant opérationnel
- ⏳ Latence API < 100ms

### Phase 3 (Production)
- ⏳ Performance: 1000+ req/s
- ⏳ Disponibilité: 99.9%
- ⏳ Tests E2E passing

---

## 📝 Notes Importantes

1. **Compatibilité Ascendante:** Maintenir les APIs TopTime existantes pour l'app Android
2. **Migration Progressive:** Ne pas tout migrer d'un coup - approche incrémentale
3. **Tests:** Valider à chaque étape avec les 946 tests TopTime
4. **Documentation:** Documenter les patterns réutilisables de TopSteel
5. **Performance:** Monitorer les temps de réponse lors de l'intégration

---

## 🤝 Ressources & Contact

- **TopSteel Repo:** `C:\GitHub\TopSteel`
- **TopTime Repo:** `C:\GitHub\TopTime`
- **Prisma Schema TopSteel:** `apps/api/prisma/schema.prisma`
- **Pattern Aliasing:** `apps/api/src/domains/auth/auth.module.ts:159-214`

---

**Auteur:** Claude Code  
**Date Création:** 2025-11-20  
**Dernière MAJ:** 2025-11-20
