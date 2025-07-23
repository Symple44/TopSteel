# Query Builder - Résumé des corrections apportées

## Problème initial
Le Query Builder avait des erreurs d'authentification 401 lors de l'accès aux colonnes de tables.

## Problème identifié
Les rewrites Next.js interceptaient TOUS les appels `/api/*` et les redigeaient vers le backend, empêchant l'utilisation des routes Next.js pour Query Builder.

## Solutions implémentées

### 1. Correction des routes Query Builder Next.js
- **Problème** : Les routes utilisaient `cookies()` de Next.js au lieu de la logique d'auth standard
- **Solution** : Uniformisation avec la logique utilisée dans `/api/admin/users/route.ts`
- **Fichiers modifiés** :
  - `apps/web/src/app/api/query-builder/route.ts`
  - `apps/web/src/app/api/query-builder/schema/tables/route.ts`
  - `apps/web/src/app/api/query-builder/schema/tables/[table]/columns/route.ts`
  - `apps/web/src/app/api/query-builder/[id]/route.ts`
  - `apps/web/src/app/api/query-builder/[id]/execute/route.ts`

### 2. Correction des rewrites Next.js
- **Problème** : Le rewrite global `'/api/:path*'` interceptait aussi les routes Query Builder
- **Solution** : Rewrites explicites pour chaque module, excluant Query Builder
- **Fichier modifié** : `apps/web/next.config.mjs`

### 3. Uniformisation de l'authentification
Toutes les routes Query Builder utilisent maintenant la même logique d'authentification :

```typescript
function getAuthHeaders(request: NextRequest): Record<string, string> {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')
  
  let accessToken = null
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='))
    if (accessTokenCookie) {
      accessToken = accessTokenCookie.split('=')[1]
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (authHeader) {
    headers['Authorization'] = authHeader
  } else if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }
  
  return headers
}
```

### 4. Améliorations apportées
- **Timeouts** : Ajout de `AbortSignal.timeout()` pour éviter les blocages
- **Gestion d'erreurs** : Amélioration des messages d'erreur
- **Réponses uniformes** : Extraction de `responseData.data || responseData` comme dans les autres routes
- **Logs** : Ajout de logs structurés pour debugging

## Configuration finale des rewrites

```javascript
// Routes spécifiques qui vont vers le backend
{
  source: '/api/admin/:path*',
  destination: `${apiUrl}/api/v1/admin/:path*`,
},
{
  source: '/api/auth/:path*',
  destination: `${apiUrl}/api/v1/auth/:path*`,
},
{
  source: '/api/user/:path*',
  destination: `${apiUrl}/api/v1/user/:path*`,
},
{
  source: '/api/users/:path*',
  destination: `${apiUrl}/api/v1/users/:path*`,
},
// ... autres routes
// Query Builder utilise les routes Next.js (pas de rewrite)
```

## Résultat attendu

1. ✅ Les appels `/api/query-builder/*` passent par les routes Next.js
2. ✅ L'authentification fonctionne via les cookies `accessToken`
3. ✅ Les autres routes continuent à être redirigées vers le backend
4. ✅ Les colonnes importées s'affichent correctement cochées
5. ✅ Le DataTable s'affiche en temps réel en bas de l'interface

## Instructions pour démarrer

1. Supprimez le dossier `.next` : `rm -rf apps/web/.next`
2. Redémarrez le serveur Next.js : `pnpm dev --filter=web`
3. Redémarrez le serveur API : `pnpm dev --filter=api`
4. Testez le Query Builder sur `/query-builder/new`

## Test de validation

Pour valider que tout fonctionne :

1. Aller sur `/query-builder/new`
2. Sélectionner une table (ex: "users")
3. Les colonnes devraient se charger sans erreur 401
4. Importer un JSON de configuration
5. Les colonnes importées devraient apparaître cochées
6. Exécuter la requête devrait afficher des données dans le DataTable

Si vous voyez encore des erreurs 401, vérifiez que :
- Le serveur Next.js a bien redémarré
- Le cache `.next` a été supprimé
- Vous êtes bien authentifié dans l'application