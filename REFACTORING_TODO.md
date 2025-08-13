# 📋 TODO - Refactorisation Architecture TopSteel ERP

## ⚠️ Règles Importantes
- ❌ **PAS de données MOCK** - Utiliser les vraies API ou afficher "En cours de construction"
- ✅ **Vérification qualité** avec les agents
- ✅ **Vérification sécurité** (multi-tenant, auth)
- ✅ **Test du build** après chaque modification

## 📊 État d'Avancement

### Phase 1 : Structure de Base
- [ ] **1. Créer la structure (app)**
  ```
  apps/web/src/app/(app)/
  ├── layout.tsx
  ├── page.tsx
  └── dashboard/page.tsx
  ```
  - Layout avec sidebar existante
  - Réutiliser les composants existants
  - PAS de nouveaux composants mock

- [ ] **2. Migrer partners existant**
  - Déplacer `(protected)/partners` → `(app)/partners`
  - Vérifier que la page fonctionne toujours
  - Conserver la connexion API existante

### Phase 2 : Module Inventory
- [ ] **3. Créer structure inventory**
  ```
  (app)/inventory/
  ├── page.tsx              # Dashboard ou "En construction"
  ├── articles/page.tsx
  ├── materials/page.tsx
  └── stock/page.tsx
  ```

- [ ] **4. Page Articles**
  ```typescript
  // SI pas d'API disponible:
  export default function ArticlesPage() {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Articles</h2>
        <p className="text-muted-foreground">
          Cette page est en cours de construction
        </p>
      </div>
    )
  }
  ```

- [ ] **5. Vérifier API articles**
  - Chercher dans `apps/api` si routes articles existent
  - Si oui → connecter la page
  - Si non → garder "En construction"

### Phase 3 : Modules Business
- [ ] **6. Module Sales**
  ```
  (app)/sales/
  ├── page.tsx
  ├── quotes/page.tsx       # "En construction" ou API réelle
  └── orders/page.tsx       # "En construction" ou API réelle
  ```

- [ ] **7. Module Finance**
  ```
  (app)/finance/
  ├── page.tsx
  └── invoices/page.tsx     # "En construction" ou API réelle
  ```

- [ ] **8. Module Projects**
  ```
  (app)/projects/
  └── page.tsx              # "En construction" ou API réelle
  ```

### Phase 4 : Navigation
- [ ] **9. Mettre à jour la sidebar**
  - Ajouter les nouveaux modules
  - Utiliser la configuration existante
  - Respecter les permissions

- [ ] **10. Corriger searchable-entities.config.ts**
  ```typescript
  // Nouvelles URLs après création des pages
  urlPattern: '/inventory/articles/{id}'
  urlPattern: '/partners/clients/{id}'
  urlPattern: '/sales/quotes/{id}'
  urlPattern: '/finance/invoices/{id}'
  urlPattern: '/projects/{id}'
  ```

### Phase 5 : Compatibilité
- [ ] **11. Créer redirections**
  ```typescript
  // next.config.js
  redirects: [
    {
      source: '/admin/marketplace',
      destination: '/marketplace',
      permanent: false
    }
  ]
  ```

### Phase 6 : Vérifications avec Agents

- [ ] **12. Agent Qualité**
  ```bash
  # Utiliser l'agent pour vérifier:
  - Structure des composants
  - Respect des patterns Next.js
  - Pas de code dupliqué
  - Imports corrects
  ```

- [ ] **13. Agent Sécurité**
  ```bash
  # Vérifier:
  - Multi-tenancy (tenantId partout)
  - Authentification sur toutes les pages
  - Pas de données sensibles exposées
  - CORS et CSP configurés
  ```

- [ ] **14. Test Build**
  ```bash
  cd apps/web && pnpm build
  cd apps/api && pnpm build
  ```

### Phase 7 : Documentation
- [ ] **15. Documenter la nouvelle structure**
  - README dans chaque module
  - Diagramme de navigation
  - Guide de migration

## 🎯 Critères de Validation

### Pour CHAQUE page créée :
1. ✅ Si API existe → Connexion réelle
2. ✅ Si pas d'API → Message "En construction"
3. ✅ Authentification requise
4. ✅ Multi-tenant respecté
5. ✅ Build passe sans erreur

### Pour CHAQUE module :
1. ✅ Structure claire
2. ✅ Navigation fonctionnelle
3. ✅ Permissions respectées
4. ✅ Pas de données mock

## 📝 Notes Importantes

### CE QU'ON FAIT :
- ✅ Créer la structure modulaire
- ✅ Pages "En construction" si pas d'API
- ✅ Réutiliser les composants existants
- ✅ Connexion aux vraies API quand disponibles

### CE QU'ON NE FAIT PAS :
- ❌ Données mock/fictives
- ❌ Composants factices
- ❌ API simulées
- ❌ Fonctionnalités non implémentées

## 🚀 Commandes Utiles

```bash
# Vérifier les routes API existantes
grep -r "router\|@Get\|@Post" apps/api/src

# Tester le build
pnpm build

# Vérifier la qualité
pnpm lint
pnpm type-check

# Lancer les tests
pnpm test
```

## 📅 Timeline Estimée

| Jour | Tâches | Validation |
|------|--------|------------|
| J1 | Structure (app) + Migration partners | Build OK |
| J2 | Module Inventory (3 pages) | Pages affichées |
| J3 | Modules Sales + Finance | Pages affichées |
| J4 | Navigation + Search URLs | Navigation OK |
| J5 | Vérifications Agents + Tests | Tout validé |

## ✅ Checklist Finale

- [ ] Toutes les pages créées (même "En construction")
- [ ] Navigation mise à jour
- [ ] Search URLs corrigées
- [ ] Build sans erreur
- [ ] Sécurité vérifiée par agent
- [ ] Qualité vérifiée par agent
- [ ] Documentation à jour

---
**Dernière mise à jour** : 12/08/2025
**Status** : À démarrer
**Priorité** : HAUTE