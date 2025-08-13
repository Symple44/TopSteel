# Système de Tarification TopSteel

## Vue d'ensemble

Le système de tarification TopSteel est un module complet de gestion des prix avec support multi-critères, règles dynamiques et analytics avancés.

## État actuel

- **Status**: ✅ PRÊT POUR LA PRODUCTION
- **Score de validation**: 87.5%
- **Build**: RÉUSSI

## Architecture

### Composants principaux

```typescript
// Structure du système
pricing-system/
├── core/                    # Logique métier
│   ├── PricingEngine       # Moteur de calcul
│   ├── RuleEvaluator       # Évaluation des règles
│   └── FormulaParser       # Parsing des formules
├── services/               # Services
│   ├── PriceCalculation    # Calcul des prix
│   ├── BulkPricing        # Tarification en masse
│   └── Analytics          # Analytics pricing
├── cache/                 # Cache Redis
│   ├── PriceCache        # Cache des prix
│   └── RuleCache         # Cache des règles
└── ml/                   # Machine Learning
    ├── PricePrediction   # Prédiction de prix
    └── DemandForecasting # Prévision demande
```

## Configuration

### Variables d'environnement

```env
# Pricing Configuration
PRICING_CACHE_TTL=3600          # TTL cache en secondes
PRICING_MAX_BULK_SIZE=1000      # Taille max traitement bulk
PRICING_DEFAULT_MARGIN=0.3      # Marge par défaut (30%)
PRICING_ROUND_PRECISION=2       # Précision arrondi

# Machine Learning
ML_MODEL_PATH=./models/pricing
ML_TRAINING_ENABLED=false
ML_PREDICTION_THRESHOLD=0.85

# Webhooks
WEBHOOK_MAX_RETRIES=3
WEBHOOK_TIMEOUT=5000

# Analytics
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_AGGREGATION_INTERVAL=3600000
```

## Modèle de données

### Tables principales

```sql
-- Règles de tarification
CREATE TABLE price_rules (
    id UUID PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed', 'formula', 'tiered'
    priority INTEGER DEFAULT 0,
    conditions JSONB DEFAULT '{}',
    formula TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historique des prix
CREATE TABLE price_history (
    id UUID PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES articles(id),
    price_type VARCHAR(50) NOT NULL, -- 'base', 'sale', 'purchase'
    old_price DECIMAL(12,2),
    new_price DECIMAL(12,2) NOT NULL,
    rule_id UUID REFERENCES price_rules(id),
    reason TEXT,
    applied_by UUID,
    applied_at TIMESTAMP DEFAULT NOW()
);

-- Grilles tarifaires
CREATE TABLE price_grids (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'customer', 'volume', 'seasonal'
    rules JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics de pricing
CREATE TABLE pricing_analytics (
    id UUID PRIMARY KEY,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    metrics JSONB NOT NULL,
    aggregations JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_analytics_period (period_start, period_end)
);
```

## Moteur de calcul

### Calcul de prix simple

```typescript
@Injectable()
export class PricingEngine {
  async calculatePrice(
    articleId: string,
    quantity: number,
    context: PricingContext
  ): Promise<PriceCalculation> {
    // 1. Récupérer l'article
    const article = await this.articleService.findById(articleId);
    
    // 2. Prix de base
    let price = article.basePrice;
    
    // 3. Appliquer les règles par priorité
    const rules = await this.getRulesForContext(context);
    
    for (const rule of rules) {
      if (await this.evaluateConditions(rule, context)) {
        price = this.applyRule(price, rule, quantity);
      }
    }
    
    // 4. Appliquer les remises volume
    price = this.applyVolumeDiscount(price, quantity);
    
    // 5. Taxes et frais
    const taxes = this.calculateTaxes(price, context);
    const fees = this.calculateFees(price, context);
    
    return {
      articleId,
      basePrice: article.basePrice,
      finalPrice: price,
      taxes,
      fees,
      totalPrice: price + taxes + fees,
      appliedRules: rules.map(r => r.id),
      calculation: {
        quantity,
        unitPrice: price / quantity,
        discount: article.basePrice - price,
        margin: this.calculateMargin(price, article.cost)
      }
    };
  }
}
```

### Règles de tarification

```typescript
enum PriceRuleType {
  PERCENTAGE = 'percentage',      // Remise/majoration en %
  FIXED = 'fixed',                // Montant fixe
  FORMULA = 'formula',            // Formule personnalisée
  TIERED = 'tiered',              // Par paliers
  BUNDLE = 'bundle',              // Pack/bundle
  BOGO = 'bogo'                   // Buy One Get One
}

interface PriceRule {
  id: string;
  type: PriceRuleType;
  priority: number;
  conditions: RuleCondition[];
  action: RuleAction;
  metadata: {
    name: string;
    description: string;
    tags: string[];
  };
}

interface RuleCondition {
  field: string;           // 'quantity', 'customer.type', 'date', etc.
  operator: string;        // '>', '<', '=', 'in', 'between'
  value: any;
  combinator?: 'AND' | 'OR';
}

interface RuleAction {
  type: 'discount' | 'markup' | 'replace';
  value: number | string;  // Valeur ou formule
  maxDiscount?: number;    // Limite de remise
}
```

### Formules personnalisées

```typescript
@Injectable()
export class FormulaParser {
  private readonly functions = {
    // Fonctions mathématiques
    MIN: Math.min,
    MAX: Math.max,
    ROUND: Math.round,
    CEIL: Math.ceil,
    FLOOR: Math.floor,
    
    // Fonctions métier
    COST: (article) => article.cost,
    WEIGHT: (article) => article.weight,
    MARGIN: (price, cost) => (price - cost) / cost,
    
    // Fonctions conditionnelles
    IF: (condition, ifTrue, ifFalse) => condition ? ifTrue : ifFalse,
    CASE: (...args) => this.evaluateCase(args)
  };

  async evaluate(
    formula: string,
    context: FormulaContext
  ): Promise<number> {
    // Parser et évaluer la formule
    const ast = this.parse(formula);
    return this.evaluateAST(ast, context);
  }

  // Exemples de formules
  examples = {
    // Marge fixe de 30%
    marginFixed: "COST * 1.3",
    
    // Remise dégressive
    volumeDiscount: "BASE * IF(QTY > 100, 0.8, IF(QTY > 50, 0.9, 1))",
    
    // Prix au poids avec minimum
    weightPricing: "MAX(WEIGHT * 2.5, 10)",
    
    // Tarification complexe
    complex: "ROUND((COST * 1.25 + FIXED_FEE) * (1 - DISCOUNT_RATE), 2)"
  };
}
```

## Grilles tarifaires

### Types de grilles

```typescript
// Grille client
interface CustomerPriceGrid {
  id: string;
  customerType: 'B2B' | 'B2C' | 'VIP' | 'DISTRIBUTOR';
  discounts: {
    global?: number;           // Remise globale
    byCategory?: Record<string, number>;  // Par catégorie
    byProduct?: Record<string, number>;   // Par produit
  };
  minimumOrder?: number;
  paymentTerms?: {
    days: number;
    earlyPaymentDiscount?: number;
  };
}

// Grille volume
interface VolumePriceGrid {
  id: string;
  tiers: Array<{
    minQuantity: number;
    maxQuantity?: number;
    discount: number;        // En pourcentage
    fixedPrice?: number;     // Ou prix fixe
  }>;
  cumulative: boolean;       // Remise cumulative ou par palier
}

// Grille saisonnière
interface SeasonalPriceGrid {
  id: string;
  periods: Array<{
    startDate: string;       // Format: MM-DD
    endDate: string;
    adjustment: number;      // % de variation
    categories?: string[];   // Catégories concernées
  }>;
}
```

### Application des grilles

```typescript
@Injectable()
export class GridPricingService {
  async applyPriceGrids(
    basePrice: number,
    article: Article,
    customer: Customer,
    quantity: number,
    date: Date = new Date()
  ): Promise<GridPricingResult> {
    const grids: PriceGrid[] = [];
    
    // 1. Grille client
    const customerGrid = await this.getCustomerGrid(customer);
    if (customerGrid) {
      grids.push(customerGrid);
      basePrice = this.applyCustomerGrid(basePrice, customerGrid, article);
    }
    
    // 2. Grille volume
    const volumeGrid = await this.getVolumeGrid(article.category);
    if (volumeGrid) {
      grids.push(volumeGrid);
      basePrice = this.applyVolumeGrid(basePrice, volumeGrid, quantity);
    }
    
    // 3. Grille saisonnière
    const seasonalGrid = await this.getSeasonalGrid(date);
    if (seasonalGrid) {
      grids.push(seasonalGrid);
      basePrice = this.applySeasonalGrid(basePrice, seasonalGrid, article, date);
    }
    
    return {
      originalPrice: article.basePrice,
      finalPrice: basePrice,
      appliedGrids: grids.map(g => g.id),
      totalDiscount: article.basePrice - basePrice,
      discountPercentage: ((article.basePrice - basePrice) / article.basePrice) * 100
    };
  }
}
```

## Tarification en masse (Bulk Pricing)

### Service de traitement bulk

```typescript
@Injectable()
export class BulkPricingService {
  constructor(
    private readonly pricingEngine: PricingEngine,
    private readonly queueService: QueueService,
    private readonly cacheService: CacheService
  ) {}

  async processBulkPricing(
    request: BulkPricingRequest
  ): Promise<BulkPricingResult> {
    // Validation
    if (request.items.length > PRICING_MAX_BULK_SIZE) {
      throw new BadRequestException(
        `Maximum ${PRICING_MAX_BULK_SIZE} items allowed`
      );
    }

    // Créer un job
    const job = await this.queueService.addJob('bulk-pricing', {
      requestId: uuid(),
      items: request.items,
      context: request.context,
      options: request.options
    });

    // Traitement asynchrone
    return new Promise((resolve, reject) => {
      job.on('completed', (result) => resolve(result));
      job.on('failed', (error) => reject(error));
      job.on('progress', (progress) => {
        this.emitProgress(request.clientId, progress);
      });
    });
  }

  @Process('bulk-pricing')
  async handleBulkPricing(job: Job<BulkPricingJob>) {
    const { items, context, options } = job.data;
    const results: PriceCalculation[] = [];
    const errors: PricingError[] = [];

    // Traitement par batch
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Calcul parallèle
      const batchResults = await Promise.allSettled(
        batch.map(item => 
          this.pricingEngine.calculatePrice(
            item.articleId,
            item.quantity,
            context
          )
        )
      );

      // Traitement des résultats
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push({
            itemIndex: i + index,
            error: result.reason.message
          });
        }
      });

      // Mise à jour de la progression
      await job.progress((i + batch.length) / items.length * 100);
    }

    // Cache des résultats
    if (options.cacheResults) {
      await this.cacheResults(results, context);
    }

    return {
      requestId: job.data.requestId,
      totalItems: items.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
      processingTime: Date.now() - job.timestamp
    };
  }
}
```

## Analytics et reporting

### Métriques de pricing

```typescript
interface PricingMetrics {
  period: {
    start: Date;
    end: Date;
  };
  
  // Métriques globales
  global: {
    totalCalculations: number;
    averagePrice: number;
    medianPrice: number;
    totalRevenue: number;
    averageMargin: number;
  };
  
  // Par catégorie
  byCategory: Map<string, CategoryMetrics>;
  
  // Par règle
  byRule: Map<string, RuleMetrics>;
  
  // Performance
  performance: {
    averageCalculationTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  
  // Tendances
  trends: {
    priceEvolution: TrendData[];
    marginEvolution: TrendData[];
    volumeEvolution: TrendData[];
  };
}

@Injectable()
export class PricingAnalyticsService {
  async generateReport(
    startDate: Date,
    endDate: Date,
    options: ReportOptions = {}
  ): Promise<PricingReport> {
    // Collecter les données
    const calculations = await this.getCalculations(startDate, endDate);
    const rules = await this.getRuleUsage(startDate, endDate);
    
    // Calculer les métriques
    const metrics = this.calculateMetrics(calculations);
    
    // Analyser les tendances
    const trends = this.analyzeTrends(calculations, options.trendInterval);
    
    // Identifier les anomalies
    const anomalies = await this.detectAnomalies(calculations);
    
    // Recommandations
    const recommendations = this.generateRecommendations(metrics, trends);
    
    return {
      period: { start: startDate, end: endDate },
      metrics,
      trends,
      anomalies,
      recommendations,
      topPerformingRules: this.getTopRules(rules),
      worstPerformingRules: this.getWorstRules(rules)
    };
  }

  // Détection d'anomalies
  async detectAnomalies(data: PriceCalculation[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Variations de prix anormales
    const priceVariations = this.calculatePriceVariations(data);
    for (const variation of priceVariations) {
      if (Math.abs(variation.change) > ANOMALY_THRESHOLD) {
        anomalies.push({
          type: 'PRICE_VARIATION',
          severity: this.calculateSeverity(variation.change),
          description: `Variation de ${variation.change}% détectée`,
          data: variation
        });
      }
    }
    
    // Marges négatives
    const negativeMargins = data.filter(d => d.calculation.margin < 0);
    if (negativeMargins.length > 0) {
      anomalies.push({
        type: 'NEGATIVE_MARGIN',
        severity: 'HIGH',
        description: `${negativeMargins.length} calculs avec marge négative`,
        data: negativeMargins
      });
    }
    
    return anomalies;
  }
}
```

## Machine Learning

### Prédiction de prix

```typescript
@Injectable()
export class PricePredictionService {
  private model: tf.LayersModel;

  async loadModel() {
    this.model = await tf.loadLayersModel(
      `file://${ML_MODEL_PATH}/price-prediction/model.json`
    );
  }

  async predictPrice(
    features: PricingFeatures
  ): Promise<PricePrediction> {
    // Préparer les features
    const input = this.prepareFeatures(features);
    
    // Prédiction
    const prediction = this.model.predict(input) as tf.Tensor;
    const price = await prediction.data();
    
    // Calculer la confiance
    const confidence = this.calculateConfidence(features, price[0]);
    
    return {
      predictedPrice: price[0],
      confidence,
      range: {
        min: price[0] * (1 - (1 - confidence) * 0.1),
        max: price[0] * (1 + (1 - confidence) * 0.1)
      },
      factors: this.explainPrediction(features, price[0])
    };
  }

  private prepareFeatures(features: PricingFeatures): tf.Tensor {
    return tf.tensor2d([
      [
        features.cost,
        features.category,
        features.seasonality,
        features.competitorPrice,
        features.demandScore,
        features.inventoryLevel,
        features.customerSegment,
        features.historicalVolume
      ]
    ]);
  }
}
```

### Optimisation des prix

```typescript
@Injectable()
export class PriceOptimizationService {
  async optimizePricing(
    constraints: OptimizationConstraints
  ): Promise<OptimizationResult> {
    // Définir l'objectif
    const objective = this.defineObjective(constraints);
    
    // Contraintes
    const businessConstraints = [
      { type: 'margin', min: constraints.minMargin },
      { type: 'competitiveness', max: constraints.maxPriceIndex },
      { type: 'volume', min: constraints.minVolume }
    ];
    
    // Algorithme d'optimisation
    const result = await this.runOptimization(
      objective,
      businessConstraints,
      constraints.products
    );
    
    // Simulation d'impact
    const simulation = await this.simulateImpact(result);
    
    return {
      recommendations: result.prices,
      expectedImpact: {
        revenue: simulation.revenueChange,
        margin: simulation.marginChange,
        volume: simulation.volumeChange
      },
      confidence: result.confidence,
      risks: this.identifyRisks(result)
    };
  }
}
```

## API Endpoints

### Calcul de prix

```http
# Calcul simple
POST /api/pricing/calculate
{
  "articleId": "uuid",
  "quantity": 100,
  "customerId": "uuid",
  "date": "2024-01-15"
}

# Calcul en masse
POST /api/pricing/bulk
{
  "items": [
    {
      "articleId": "uuid",
      "quantity": 100
    }
  ],
  "context": {
    "customerId": "uuid",
    "siteId": "uuid"
  }
}

# Simulation
POST /api/pricing/simulate
{
  "scenarios": [
    {
      "name": "10% discount",
      "rules": [...]
    }
  ]
}
```

### Gestion des règles

```http
# Créer une règle
POST /api/pricing/rules
{
  "code": "VOLUME_Q1_2024",
  "name": "Remise volume Q1 2024",
  "type": "tiered",
  "conditions": [...],
  "action": {...}
}

# Tester une règle
POST /api/pricing/rules/test
{
  "rule": {...},
  "testCases": [...]
}

# Analytics
GET /api/pricing/analytics?start=2024-01-01&end=2024-01-31
```

## Monitoring

### Dashboards

```typescript
// Métriques temps réel
interface PricingDashboard {
  realtime: {
    calculationsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
  
  daily: {
    totalCalculations: number;
    uniqueProducts: number;
    uniqueCustomers: number;
    averageDiscount: number;
  };
  
  alerts: Array<{
    type: 'margin' | 'volume' | 'error';
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: Date;
  }>;
}
```

### Alertes

Configuration des alertes :

```yaml
alerts:
  - name: "Marge faible"
    condition: "margin < 10%"
    severity: "high"
    actions:
      - email: "finance@topsteel.fr"
      - slack: "#alerts-pricing"
  
  - name: "Volume élevé"
    condition: "calculations_per_minute > 1000"
    severity: "medium"
    actions:
      - scale: "auto"
  
  - name: "Erreur de calcul"
    condition: "error_rate > 1%"
    severity: "high"
    actions:
      - pagerduty: "pricing-team"
```

## Performance

### Optimisations

1. **Cache multi-niveau**
   - L1: Cache mémoire (10s)
   - L2: Redis (5 min)
   - L3: Base de données (1h)

2. **Calcul parallèle**
   - Workers dédiés pour bulk
   - Queue prioritaire

3. **Pré-calcul**
   - Prix fréquents en cache warm
   - Agrégations nocturnes

### Benchmarks

| Opération | Temps moyen | P95 | P99 |
|-----------|------------|-----|-----|
| Calcul simple | 15ms | 25ms | 50ms |
| Calcul avec règles | 35ms | 60ms | 100ms |
| Bulk (100 items) | 500ms | 800ms | 1200ms |
| Analytics query | 200ms | 400ms | 800ms |

## Troubleshooting

### Problèmes courants

1. **Prix incorrects**
   ```bash
   # Vérifier les règles actives
   curl /api/pricing/rules/active
   
   # Tester le calcul
   curl -X POST /api/pricing/debug \
     -d '{"articleId": "...", "verbose": true}'
   ```

2. **Performance dégradée**
   ```bash
   # Vérifier le cache
   redis-cli INFO stats
   
   # Analyser les slow queries
   curl /api/pricing/metrics/slow-queries
   ```

3. **Règles non appliquées**
   ```bash
   # Vérifier les conditions
   curl /api/pricing/rules/{id}/evaluate \
     -d '{"context": {...}}'
   ```

## Conclusion

Le système de tarification TopSteel offre :
- **Flexibilité** avec règles et formules personnalisées
- **Performance** avec cache et calcul optimisé
- **Intelligence** avec ML et analytics
- **Scalabilité** pour traitement en masse
- **Traçabilité** complète des calculs

Pour support : pricing@topsteel.fr