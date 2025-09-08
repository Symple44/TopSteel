# Plan d'amélioration de la couverture de tests - TopSteel

## État actuel de la couverture de tests

### Vue d'ensemble
- **Couverture actuelle globale**: ~72%
- **Objectif**: 85%
- **Gap à combler**: 13%

### Analyse par module

#### 1. Apps/Web (0% de couverture)
**Zones critiques non testées:**
- Stores (auth.store, app.store, projet.store)
- Hooks (use-auth, use-articles, use-notifications)
- Components (partners, admin, production)
- Utils (backend-api, fetch-safe)
- Pages (inventory, partners, admin)

#### 2. Apps/API (Tests timeout - Problème de configuration)
**Zones critiques à tester:**
- Services d'authentification
- Services de pricing
- Query builder
- Controllers CRUD
- Guards et interceptors

#### 3. Packages/UI (Couverture partielle)
**Tests existants:**
- ✅ DataTable hooks (100%)
- ✅ Button component (partial)
- ✅ Input component (partial)

**Tests manquants:**
- Business components
- Dialogs
- Forms complexes
- Filters
- Charts

## Plan d'action prioritaire

### Phase 1: Tests critiques (Semaine 1)
Focus sur les fonctionnalités critiques pour le business

#### 1.1 Authentification et sécurité
```typescript
// apps/web/src/stores/__tests__/auth.store.test.ts
- Login/logout flows
- Token management
- Permission checks
- Session expiration
```

#### 1.2 Gestion des articles
```typescript
// apps/web/src/hooks/__tests__/use-articles.test.ts
- CRUD operations
- Inventory management
- Stock calculations
- Price calculations
```

#### 1.3 Production et projets
```typescript
// apps/web/src/stores/__tests__/projet.store.test.ts
- Project creation/update
- Status management
- Filtering and sorting
```

### Phase 2: Tests de composants UI (Semaine 2)

#### 2.1 Composants business critiques
```typescript
// packages/ui/src/components/business/__tests__/
- PriceCalculator
- WeightCalculator
- MaterialSelector
- ClientSelector
```

#### 2.2 Formulaires et validation
```typescript
// apps/web/src/components/__tests__/
- ArticleForm
- ClientForm
- ProjectForm
- MaterialForm
```

### Phase 3: Tests d'intégration (Semaine 3)

#### 3.1 API Integration tests
```typescript
// apps/api/src/__tests__/integration/
- Auth flows end-to-end
- CRUD operations
- Query builder security
- Multi-tenant isolation
```

#### 3.2 E2E avec Playwright
```typescript
// apps/e2e/
- Login workflow
- Article creation
- Project management
- Invoice generation
```

## Stratégies d'implémentation

### 1. Configuration des tests

#### Jest configuration pour apps/web
```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/src/test/setup.ts"],
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.tsx",
    "!src/test/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

### 2. Templates de tests réutilisables

#### Store test template
```typescript
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../auth.store'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset()
  })

  it('should handle login', async () => {
    const { result } = renderHook(() => useAuthStore())
    
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password'
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toBeDefined()
  })
})
```

#### Component test template
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ArticleForm } from '../ArticleForm'

describe('ArticleForm', () => {
  it('should validate required fields', async () => {
    render(<ArticleForm onSubmit={jest.fn()} />)
    
    const submitButton = screen.getByText('Enregistrer')
    fireEvent.click(submitButton)
    
    expect(await screen.findByText('La référence est requise')).toBeInTheDocument()
    expect(await screen.findByText('La désignation est requise')).toBeInTheDocument()
  })
})
```

### 3. Mocking strategies

#### API mocking avec MSW
```typescript
import { setupServer } from 'msw/node'
import { rest } from 'msw'

const server = setupServer(
  rest.get('/api/articles', (req, res, ctx) => {
    return res(ctx.json({ 
      data: mockArticles,
      total: 100 
    }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Métriques de succès

### Objectifs de couverture par type
- **Statements**: 85%
- **Branches**: 80%
- **Functions**: 85%
- **Lines**: 85%

### Objectifs par module
- **Core business logic**: 95%
- **UI Components**: 85%
- **Utilities**: 75%
- **Types/Interfaces**: N/A

## Timeline

### Semaine 1 (Jours 1-5)
- Jour 1-2: Setup et configuration des tests
- Jour 3-4: Tests stores et hooks critiques
- Jour 5: Tests services API

### Semaine 2 (Jours 6-10)
- Jour 6-7: Tests composants UI business
- Jour 8-9: Tests formulaires et validation
- Jour 10: Tests d'intégration

### Semaine 3 (Jours 11-15)
- Jour 11-12: Tests E2E Playwright
- Jour 13-14: Optimisation et refactoring
- Jour 15: Documentation et rapport final

## Scripts NPM à ajouter

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm test && pnpm test:e2e"
  }
}
```

## Outils et dépendances

### Dépendances de test à installer
```bash
pnpm add -D @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event @testing-library/react-hooks
pnpm add -D msw @mswjs/data
pnpm add -D @playwright/test
pnpm add -D jest-environment-jsdom
```

## Commandes pour lancer l'amélioration

```bash
# 1. Setup initial
pnpm install

# 2. Créer les fichiers de test
mkdir -p apps/web/src/stores/__tests__
mkdir -p apps/web/src/hooks/__tests__
mkdir -p apps/web/src/components/__tests__

# 3. Lancer les tests en mode watch
pnpm test:watch

# 4. Vérifier la couverture
pnpm test:coverage

# 5. Générer le rapport HTML
pnpm test:coverage:report
```

## Prochaines étapes immédiates

1. **Créer le setup de test pour apps/web**
2. **Écrire les premiers tests pour auth.store**
3. **Configurer MSW pour les mocks API**
4. **Implémenter les tests pour use-articles hook**
5. **Mesurer la progression de la couverture**