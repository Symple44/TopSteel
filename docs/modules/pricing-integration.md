# 💰 Guide d'Intégration du Système de Pricing

> **Module** : Pricing & Tarification  
> **Version** : 2.0.0  
> **Dernière mise à jour** : 14/08/2025

## 📋 Vue d'Ensemble

Le système de pricing TopSteel est un moteur de tarification avancé qui supporte des règles complexes et multi-canaux.

## 🏗️ Architecture du Système

### Services Principaux

```
PricingEngineService (Core)
├── Calcul de base
├── Règles par priorité
├── Support multi-canal
├── Calcul TVA/TTC
├── Promotions
└── Cache Redis

SectorPricingService (Sectoriel)
├── Coefficients BTP
├── Tarifs industrie
├── Frais transport
└── Remises secteur
```

## 🔧 Configuration

### Installation du Module

```typescript
// app.module.ts
import { PricingUnifiedModule } from '@features/pricing/pricing-unified.module';

@Module({
  imports: [
    PricingUnifiedModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      },
      cache: {
        enabled: true,
        ttl: 300 // 5 minutes
      },
      ml: {
        enabled: false // Activera le ML pricing
      }
    })
  ]
})
export class AppModule {}
```

### Variables d'Environnement

```env
# Pricing Configuration
ENABLE_PRICE_CACHE=true
PRICE_CACHE_TTL=300
PRICING_DEFAULT_MARGIN=1.3
PRICING_DEFAULT_TVA=0.20

# Redis (pour cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

## 💻 Utilisation

### 1. Calcul Simple

```typescript
import { PricingEngineService, PricingContext } from '@features/pricing/services/pricing-engine.service';

@Injectable()
export class MyService {
  constructor(
    private readonly pricingEngine: PricingEngineService
  ) {}

  async calculatePrice(articleId: string, quantity: number) {
    const context: PricingContext = {
      articleId,
      quantity,
      societeId: 'tenant-uuid',
      channel: PriceRuleChannel.ERP
    };

    const result = await this.pricingEngine.calculatePrice(context);
    
    return {
      price: result.finalPrice,
      basePrice: result.basePrice,
      discount: result.totalDiscount
    };
  }
}
```

### 2. Calcul en Masse (Panier)

```typescript
async calculateCartPrices(items: CartItem[], customerId: string) {
  const prices = await this.pricingEngine.calculateBulkPrices(
    items.map(item => ({
      articleId: item.articleId,
      quantity: item.quantity,
      customizations: item.customizations
    })),
    'tenant-uuid',
    customerId
  );

  let total = 0;
  const enrichedItems = [];

  for (const item of items) {
    const price = prices.get(item.articleId);
    total += price.finalPrice * item.quantity;
    
    enrichedItems.push({
      ...item,
      unitPrice: price.finalPrice,
      totalPrice: price.finalPrice * item.quantity,
      discount: price.totalDiscount
    });
  }

  return { items: enrichedItems, total };
}
```

## 📊 Types de Règles de Prix

### Types d'Ajustement

| Type | Description | Exemple |
|------|-------------|---------|
| `PERCENTAGE` | Remise/majoration en % | -10% |
| `FIXED_AMOUNT` | Montant fixe | -5€ |
| `FIXED_PRICE` | Prix fixe imposé | 99€ |
| `PRICE_PER_WEIGHT` | Prix au poids | 1.5€/kg |
| `PRICE_PER_LENGTH` | Prix à la longueur | 10€/m |
| `PRICE_PER_SURFACE` | Prix à la surface | 25€/m² |
| `PRICE_PER_VOLUME` | Prix au volume | 100€/m³ |
| `FORMULA` | Formule personnalisée | `base * 1.2 + 10` |

### Exemple de Règle

```typescript
const priceRule: PriceRule = {
  ruleName: 'Remise Gros Volume',
  description: 'Remise 15% pour commandes > 100 unités',
  isActive: true,
  channel: PriceRuleChannel.ALL,
  
  // Conditions
  conditions: [
    {
      field: 'quantity',
      operator: 'GREATER_THAN',
      value: 100
    }
  ],
  
  // Ajustement
  adjustmentType: AdjustmentType.PERCENTAGE,
  adjustmentValue: -15,
  
  // Priorité et combinaison
  priority: 10,
  combinable: true,
  
  // Validité
  validFrom: new Date('2024-01-01'),
  validUntil: new Date('2024-12-31')
};
```

## 🚀 API Endpoints

### Endpoints Pricing Core

```http
# Calcul de prix
POST /api/pricing/calculate
{
  "articleId": "uuid",
  "quantity": 10,
  "customerId": "uuid",
  "channel": "ERP"
}

# Prévisualisation règle
GET /api/pricing/rules/:ruleId/preview?articleId=uuid&quantity=10

# Gestion des règles
GET    /api/pricing/rules
POST   /api/pricing/rules
PUT    /api/pricing/rules/:id
DELETE /api/pricing/rules/:id
```

### Endpoints Supplémentaires

```http
# Prix en masse (panier)
POST /api/pricing/bulk
{
  "items": [
    { "articleId": "uuid1", "quantity": 5 },
    { "articleId": "uuid2", "quantity": 3 }
  ],
  "customerId": "uuid"
}

# Application promotion
POST /api/pricing/promotion/apply
{
  "code": "SUMMER2024",
  "currentPrice": 100,
  "articleId": "uuid"
}
```

## 🔐 Sécurité

### Validation des Entrées

```typescript
// DTO avec validation
import { IsUUID, IsNumber, Min, IsOptional } from 'class-validator';

export class CalculatePriceDto {
  @IsUUID()
  articleId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsUUID()
  @IsOptional()
  customerId?: string;
}
```

### Guards et Permissions

```typescript
@Controller('pricing')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PricingController {
  @Post('calculate')
  @RequirePermissions('pricing:read')
  async calculate(@Body() dto: CalculatePriceDto) {
    // ...
  }

  @Post('rules')
  @RequirePermissions('pricing:write')
  async createRule(@Body() dto: CreateRuleDto) {
    // ...
  }
}
```

## ⚡ Performance

### Cache Redis

Le système utilise Redis pour mettre en cache les calculs :

```typescript
// Clé de cache
price:tenantId:articleId:quantity:customerId:promotionCode

// TTL par défaut : 5 minutes
```

### Invalidation du Cache

```typescript
// Invalider pour un article
await pricingService.invalidateCache(articleId, tenantId);

// Invalider tout le tenant
await pricingService.invalidateTenantCache(tenantId);
```

### Optimisations

1. **Calcul en masse** : Utiliser `calculateBulkPrices` pour plusieurs articles
2. **Cache warming** : Pré-calculer les prix des articles populaires
3. **Lazy loading** : Charger les règles à la demande
4. **Index DB** : Index sur `(articleId, channel, isActive)`

## 🧪 Tests

### Test Unitaire

```typescript
describe('PricingEngineService', () => {
  it('should apply percentage discount', async () => {
    const context: PricingContext = {
      articleId: 'test-article',
      quantity: 100,
      societeId: 'test-tenant',
      channel: PriceRuleChannel.ERP
    };

    const result = await service.calculatePrice(context);
    
    expect(result.finalPrice).toBeLessThan(result.basePrice);
    expect(result.appliedRules).toHaveLength(1);
    expect(result.totalDiscount).toBeGreaterThan(0);
  });
});
```

### Test d'Intégration

```typescript
it('should calculate price with TVA', async () => {
  const context: PricingContext = {
    articleId,
    quantity: 1,
    societeId: tenantId,
    channel: PriceRuleChannel.ERP
  };

  const result = await pricingEngine.calculatePrice(context);
  const priceWithTVA = result.finalPrice * 1.20; // 20% TVA

  expect(priceWithTVA).toBeGreaterThan(result.finalPrice);
});
```

## 📈 Métriques

### KPIs à Monitorer

| Métrique | Objectif | Alerte |
|----------|----------|--------|
| Temps de calcul P95 | < 50ms | > 100ms |
| Hit rate cache | > 80% | < 60% |
| Erreurs de calcul | < 0.1% | > 1% |
| Règles appliquées/calcul | 2-5 | > 10 |

### Logging

```typescript
this.logger.log({
  event: 'price_calculated',
  articleId,
  basePrice: result.basePrice,
  finalPrice: result.finalPrice,
  discount: result.totalDiscount,
  rulesApplied: result.appliedRules.length,
  calculationTime: endTime - startTime
});
```

## 🔄 Évolutions Futures

1. **Machine Learning Pricing**
   - Prédiction de prix optimal
   - Élasticité de la demande
   - A/B testing automatique

2. **Dynamic Pricing**
   - Prix temps réel selon stock
   - Ajustement selon concurrence
   - Prix personnalisés par client

3. **Analytics Dashboard**
   - Visualisation des règles
   - Impact des promotions
   - ROI par règle de prix

## 📚 Ressources

- [Architecture Pricing](./pricing.md)
- [API Reference](../api/pricing-api.md)
- [Migration Guide](./pricing-migration.md)
- [Best Practices](./pricing-best-practices.md)

---

*Guide créé le 14/08/2025 - TopSteel ERP v2.0.0*