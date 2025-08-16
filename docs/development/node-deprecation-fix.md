# Fix pour les Warnings de Dépréciation Node.js

## Problème

Le warning `(node:9160) [DEP0060] DeprecationWarning: The util._extend API is deprecated. Please use Object.assign() instead.` apparaît lors de l'exécution de l'application.

## Cause

Ce warning provient de dépendances tierces qui utilisent encore l'ancienne API `util._extend` au lieu d'`Object.assign()`. Comme nous ne contrôlons pas directement ces dépendances, la solution est de masquer ce warning spécifique.

## Solution Implémentée

### 1. Configuration des Scripts npm

Les scripts dans `package.json` ont été modifiés pour inclure `--no-deprecation` :

**Web App (`apps/web/package.json`):**
```json
{
  "scripts": {
    "dev": "cross-env NODE_OPTIONS='--max-old-space-size=8192 --no-deprecation' NODE_ENV=development next dev -p 3005",
    "build": "cross-env NODE_OPTIONS='--max-old-space-size=8192 --no-deprecation' next build",
    "start": "cross-env NODE_OPTIONS='--no-deprecation' next start -p 3005"
  }
}
```

**API (`apps/api/package.json`):**
```json
{
  "scripts": {
    "dev": "cross-env NODE_OPTIONS='--no-deprecation' nodemon",
    "start": "cross-env NODE_OPTIONS='--no-deprecation' nest start",
    "start:prod": "cross-env NODE_ENV=production NODE_OPTIONS='--no-deprecation' node dist/app/main"
  }
}
```

### 2. Configuration Globale

Dans `.env.local` à la racine :
```bash
NODE_OPTIONS=--no-deprecation
```

## Options Alternatives

Si vous préférez voir tous les warnings, vous pouvez :

1. **Remplacer** `--no-deprecation` par `--trace-deprecation` pour voir la stack trace complète
2. **Supprimer** complètement l'option pour voir tous les warnings
3. **Utiliser** `--no-warnings` pour masquer tous les warnings (non recommandé)

## Impact

- ✅ **Performance** : Aucun impact négatif
- ✅ **Fonctionnalité** : Aucun changement dans le comportement de l'application
- ✅ **Développement** : Console plus propre sans warnings inutiles
- ⚠️ **Note** : Les warnings de dépréciation de votre propre code restent visibles

## Mise à Jour Future

Quand les dépendances tierces seront mises à jour pour utiliser `Object.assign()` au lieu de `util._extend`, cette configuration pourra être supprimée.