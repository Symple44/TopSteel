# Module Marketplace TopSteel

## Vue d'ensemble

Le marketplace TopSteel est une solution e-commerce multi-tenant intégrée à l'ERP principal. Il permet à chaque société (tenant) d'avoir sa propre boutique en ligne avec gestion des produits, clients et commandes.

## Architecture

### Backend (marketplace-api)
- **Framework**: NestJS avec TypeORM
- **Base de données**: PostgreSQL (`erp_topsteel_marketplace`)
- **Port**: 3004
- **Documentation API**: http://localhost:3004/api/docs

### Frontend (marketplace-storefront)
- **Framework**: Next.js 15 avec App Router
- **État**: Zustand pour le panier
- **UI**: Tailwind CSS + Radix UI
- **Port**: 3007

## Configuration

### Variables d'environnement

Toutes les variables sont centralisées dans `/.env.local` à la racine :

```env
# Ports
MARKETPLACE_API_PORT=3004
MARKETPLACE_WEB_PORT=3007

# Base de données
MARKETPLACE_DB_HOST=localhost
MARKETPLACE_DB_PORT=5432
MARKETPLACE_DB_USERNAME=marketplace_user
MARKETPLACE_DB_PASSWORD=CHANGEME_strong_password
MARKETPLACE_DB_NAME=erp_topsteel_marketplace

# URLs publiques
NEXT_PUBLIC_MARKETPLACE_API_URL=http://127.0.0.1:3004/api
NEXT_PUBLIC_MARKETPLACE_URL=http://127.0.0.1:3007
NEXT_PUBLIC_DEFAULT_TENANT=TOPSTEEL

# JWT (partagé avec l'ERP principal)
JWT_SECRET=same_as_main_erp_secret
JWT_EXPIRES_IN=24h
```

## Installation

### Prérequis
1. PostgreSQL en cours d'exécution
2. Base de données `erp_topsteel_marketplace` créée
3. Société avec marketplace activée dans `erp_topsteel_auth`

### Création de la base de données

```sql
-- Créer la base marketplace
CREATE DATABASE erp_topsteel_marketplace;

-- Créer l'utilisateur
CREATE USER marketplace_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE erp_topsteel_marketplace TO marketplace_user;
```

### Commandes de démarrage

```bash
# Depuis la racine du projet
cd /path/to/topsteel

# Installation des dépendances
pnpm install

# Build des packages partagés
pnpm build --filter="./packages/*"

# Démarrage du marketplace uniquement
pnpm dev:marketplace

# Ou démarrage individuel
cd apps/marketplace-api && pnpm dev  # API sur :3004
cd apps/marketplace-storefront && pnpm dev  # Frontend sur :3007
```

## Fonctionnalités

### Multi-tenant

Chaque société peut avoir sa propre boutique avec :
- URL personnalisée (sous-domaine ou path)
- Thème et branding personnalisés
- Catalogue produits indépendant
- Gestion des clients séparée

### Gestion des produits

```typescript
// Structure d'un produit marketplace
interface MarketplaceProduct {
  id: string;
  tenantId: string;
  erpArticleId?: string; // Lien avec l'article ERP
  sku: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  categories: Category[];
  tags: string[];
  inventory: {
    quantity: number;
    trackInventory: boolean;
    allowBackorder: boolean;
  };
  seo: {
    title: string;
    description: string;
    slug: string;
  };
  isActive: boolean;
  publishedAt?: Date;
}
```

### Synchronisation avec l'ERP

Le marketplace peut synchroniser avec l'ERP principal :

```typescript
// Service de synchronisation
@Injectable()
export class SyncService {
  async syncProductsFromERP(tenantId: string): Promise<SyncResult> {
    // 1. Récupérer les articles depuis l'ERP
    const articles = await this.erpApi.getArticles(tenantId);
    
    // 2. Transformer en produits marketplace
    const products = articles.map(article => this.transformToProduct(article));
    
    // 3. Mettre à jour le catalogue
    await this.productRepository.upsertMany(products);
    
    // 4. Synchroniser les stocks
    await this.syncInventory(tenantId);
    
    return {
      synced: products.length,
      timestamp: new Date()
    };
  }
}
```

### Gestion des commandes

```typescript
// Workflow de commande
enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

interface Order {
  id: string;
  tenantId: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  payment: {
    method: string;
    status: PaymentStatus;
    transactionId?: string;
  };
  shipping: {
    address: Address;
    method: string;
    trackingNumber?: string;
    cost: number;
  };
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Produits

```http
# Liste des produits
GET /api/products?page=1&limit=20&category=tools

# Détail d'un produit
GET /api/products/:slug

# Recherche
GET /api/products/search?q=steel&filters[price][min]=10

# Catégories
GET /api/categories
```

### Panier

```http
# Récupérer le panier
GET /api/cart

# Ajouter au panier
POST /api/cart/items
{
  "productId": "uuid",
  "quantity": 2,
  "variantId": "uuid"
}

# Mettre à jour la quantité
PATCH /api/cart/items/:itemId
{
  "quantity": 3
}

# Supprimer du panier
DELETE /api/cart/items/:itemId
```

### Commandes

```http
# Créer une commande
POST /api/orders
{
  "customer": {
    "email": "client@example.com",
    "firstName": "Jean",
    "lastName": "Dupont"
  },
  "shipping": {
    "address": {...},
    "method": "standard"
  },
  "payment": {
    "method": "card"
  }
}

# Suivre une commande
GET /api/orders/:orderNumber

# Historique client
GET /api/customers/:customerId/orders
```

## Frontend Storefront

### Structure des pages

```
apps/marketplace-storefront/src/app/
├── [tenant]/                    # Routes multi-tenant
│   ├── page.tsx                # Page d'accueil boutique
│   ├── products/               
│   │   ├── page.tsx            # Liste des produits
│   │   └── [slug]/
│   │       └── page.tsx        # Détail produit
│   ├── categories/
│   │   └── [category]/
│   │       └── page.tsx        # Produits par catégorie
│   ├── cart/
│   │   └── page.tsx            # Panier
│   ├── checkout/
│   │   └── page.tsx            # Checkout
│   └── account/
│       ├── page.tsx            # Compte client
│       └── orders/
│           └── page.tsx        # Historique commandes
```

### Composants principaux

```tsx
// Carte produit
export function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore(state => state.addItem);
  
  return (
    <div className="product-card">
      <Image 
        src={product.images[0]?.url} 
        alt={product.name}
      />
      <h3>{product.name}</h3>
      <p className="price">{formatPrice(product.price)}</p>
      <button onClick={() => addToCart(product)}>
        Ajouter au panier
      </button>
    </div>
  );
}

// Store Zustand pour le panier
interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (product) => set(state => {
    const existing = state.items.find(i => i.productId === product.id);
    if (existing) {
      return {
        items: state.items.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      };
    }
    return {
      items: [...state.items, {
        id: uuid(),
        productId: product.id,
        product,
        quantity: 1
      }]
    };
  }),
  
  // ... autres méthodes
  
  get total() {
    return get().items.reduce(
      (sum, item) => sum + (item.product.price * item.quantity),
      0
    );
  }
}));
```

## Thèmes et personnalisation

### Configuration par tenant

```typescript
interface TenantTheme {
  id: string;
  tenantId: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo: {
    url: string;
    alt: string;
  };
  favicon: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  customCss?: string;
}
```

### Application du thème

```tsx
// Layout avec thème dynamique
export default async function TenantLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  const theme = await getThemeByTenant(params.tenant);
  
  return (
    <html>
      <head>
        <style>{generateThemeCSS(theme)}</style>
      </head>
      <body>
        <MarketplaceHeader theme={theme} />
        <main>{children}</main>
        <MarketplaceFooter theme={theme} />
      </body>
    </html>
  );
}
```

## Intégrations

### Paiement

Support des passerelles de paiement :
- Stripe
- PayPal
- Virement bancaire
- Paiement à la livraison

```typescript
// Service de paiement
@Injectable()
export class PaymentService {
  async processPayment(
    order: Order,
    method: PaymentMethod
  ): Promise<PaymentResult> {
    switch (method) {
      case 'stripe':
        return this.stripeService.charge(order);
      case 'paypal':
        return this.paypalService.process(order);
      case 'bank_transfer':
        return this.bankTransferService.initiate(order);
      default:
        throw new Error('Unsupported payment method');
    }
  }
}
```

### Livraison

Calcul des frais et suivi :

```typescript
interface ShippingRate {
  carrier: string;
  service: string;
  price: number;
  estimatedDays: number;
}

@Injectable()
export class ShippingService {
  async calculateRates(
    cart: Cart,
    destination: Address
  ): Promise<ShippingRate[]> {
    const weight = this.calculateWeight(cart.items);
    const dimensions = this.calculateDimensions(cart.items);
    
    const rates = await Promise.all([
      this.colissimoService.getRate(weight, destination),
      this.upsService.getRate(weight, dimensions, destination),
      this.dhlService.getRate(weight, destination)
    ]);
    
    return rates.filter(r => r !== null);
  }
}
```

## Performance

### Optimisations

1. **SSG pour les produits**
   ```tsx
   export async function generateStaticParams() {
     const products = await getProducts();
     return products.map(p => ({
       slug: p.slug
     }));
   }
   ```

2. **Cache Redis**
   ```typescript
   @Cacheable({ ttl: 300 })
   async getProduct(slug: string): Promise<Product> {
     return this.productRepository.findBySlug(slug);
   }
   ```

3. **Images optimisées**
   ```tsx
   <Image
     src={product.image}
     alt={product.name}
     width={400}
     height={400}
     loading="lazy"
     placeholder="blur"
   />
   ```

## Monitoring

### Métriques e-commerce

```typescript
interface MarketplaceMetrics {
  orders: {
    total: number;
    revenue: number;
    averageValue: number;
    conversionRate: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
    views: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    lifetime: number;
  };
  cart: {
    abandonment: number;
    averageSize: number;
  };
}
```

### Dashboard admin

Accessible via l'ERP principal pour visualiser :
- Chiffre d'affaires
- Commandes en cours
- Produits populaires
- Taux de conversion
- Paniers abandonnés

## Déploiement

### Docker

```dockerfile
# Dockerfile.marketplace-api
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/apps/marketplace-api ./
EXPOSE 3004
CMD ["node", "main.js"]

# Dockerfile.marketplace-storefront
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3007
CMD ["npm", "start"]
```

### Variables de production

```env
# Production
NODE_ENV=production
MARKETPLACE_API_URL=https://api-marketplace.topsteel.com
MARKETPLACE_STOREFRONT_URL=https://shop.topsteel.com

# CDN
NEXT_PUBLIC_CDN_URL=https://cdn.topsteel.com

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Support

Pour toute question sur le marketplace :
- Documentation API: `/api/docs`
- Email: marketplace@topsteel.fr
- Support technique: support@topsteel.fr