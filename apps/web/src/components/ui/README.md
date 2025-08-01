# 🚫 DOSSIER OBSOLÈTE - NE PAS UTILISER

## ⚠️ ATTENTION : Ce dossier est désormais vide et ne doit plus être utilisé

**Date de migration** : 31 juillet 2025  
**Status** : ✅ Migration complétée

---

## 📍 Où créer les nouveaux composants ?

### ✅ **Utilisez maintenant :**
```
packages/ui/src/components/
├── primitives/     # Composants de base (Button, Input, etc.)
├── layout/         # Mise en page (Card, Separator, etc.)
├── forms/          # Formulaires (Label, etc.)
├── data-display/   # Affichage de données (DataTable, Badge, etc.)
├── feedback/       # Retours utilisateur (Toast, Dialog, etc.)
├── navigation/     # Navigation (Menu, Breadcrumb, etc.)
├── business/       # Composants métier spécifiques
└── theme/          # Gestion des thèmes
```

### ❌ **N'utilisez plus :**
```
apps/web/src/components/ui/  # <-- CE DOSSIER EST OBSOLÈTE
```

---

## 🔄 Comment importer les composants ?

### ✅ **Nouvelle méthode :**
```typescript
// Import depuis le package unifié
import { Button, Input, Card, Badge } from '@erp/ui'
import { AdvancedDataTable } from '@erp/ui'
import type { ColumnConfig } from '@erp/ui'

// Ou imports spécifiques
import { Button } from '@erp/ui/primitives'
import { Card } from '@erp/ui/layout'
```

### ❌ **Ancienne méthode (ne plus utiliser) :**
```typescript
// NE PLUS FAIRE ÇA
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/datatable'
```

---

## 🏗️ Règles pour les nouveaux composants

1. **Composants réutilisables** → `packages/ui/src/components/`
2. **Composants spécifiques à l'app** → `apps/web/src/components/` (mais pas dans `/ui`)
3. **Wrappers d'intégration** → `apps/web/src/components/wrappers/`

---

## 📚 Documentation

- Architecture des composants : [Design System Documentation]
- Guide de migration : [Migration Guide]
- Composants disponibles : `packages/ui/src/components/*/index.ts`

---

**🤖 Note pour Claude :** Ce dossier `apps/web/src/components/ui/` ne doit plus jamais être utilisé pour créer de nouveaux composants. Tous les composants doivent maintenant être créés dans `packages/ui/src/components/` selon l'architecture du design system unifié.