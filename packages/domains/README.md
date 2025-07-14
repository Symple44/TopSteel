# @erp/domains

Package de domaines métier pour l'ERP TopSteel, utilisant l'architecture Domain-Driven Design (DDD).

## 📦 Installation

```bash
pnpm add @erp/domains
```

## 🚀 Utilisation

### Import global
```typescript
import { Client, ClientType, ClientService } from '@erp/domains'
```

### Imports modulaires (recommandé)
```typescript
// Core - Domaine Client
import { Client, ClientType, ClientStatut } from '@erp/domains/core'
import { ClientBusinessService } from '@erp/domains/core'

// Sales - Domaine Devis
import { Quote, QuoteStatut, QuoteType } from '@erp/domains/sales'
```

## 🏗️ Architecture

```
├── core/                    # Domaines fondamentaux
│   ├── client/             # Gestion des clients
│   ├── user/               # Gestion des utilisateurs
│   └── organization/       # Structure organisationnelle
│
└── sales/                  # Domaine commercial
    └── quotes/             # Gestion des devis
```

## 📖 Exemples

### Utilisation du service client
```typescript
import { ClientBusinessService } from '@erp/domains/core'

const client = { /* ... */ }
const score = ClientBusinessService.calculateClientScore(client)
const discount = ClientBusinessService.calculateDiscountPercentage(client)
```

### Création de commande
```typescript
import type { CreateClientCommand } from '@erp/domains/core'

const command: CreateClientCommand = {
  nom: 'ACME Corp',
  type: ClientType.PROFESSIONNEL,
  email: 'contact@acme.com',
  // ...
}
```

## 🔧 Configuration TypeScript

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "paths": {
      "@erp/domains/*": ["./node_modules/@erp/domains/dist/*"]
    }
  }
}
```

## 📋 Domaines disponibles

### Core
- **Client** : Gestion complète des clients (CRUD, validation, business rules)
- **User** : Utilisateurs, rôles et permissions
- **Organization** : Structure de l'entreprise, sites et départements

### Sales
- **Quotes** : Devis, conditions commerciales et suivi

## 🎯 Principes DDD

1. **Entités** : Objets avec identité unique
2. **Value Objects** : Objets immuables sans identité
3. **Services** : Logique métier complexe
4. **Repositories** : Interfaces d'accès aux données
5. **Commands/Queries** : Séparation lecture/écriture (CQRS)

## 🔗 Liens

- [Documentation complète](https://docs.topsteel.internal/packages/domains)
- [Guide DDD](https://docs.topsteel.internal/architecture/ddd)