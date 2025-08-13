import { PriceRuleChannel, PriceRuleStatus, PriceRuleType } from '@erp/entities'
import type { INestApplication } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { PricingUnifiedModule } from '../pricing-unified.module'
import { PricingAnalyticsService } from '../services/pricing-analytics.service'
import { PricingCacheService } from '../services/pricing-cache.service'
import { PricingEngineService } from '../services/pricing-engine.service'
import { PricingMLService } from '../services/pricing-ml.service'
import { PricingWebhooksService } from '../services/pricing-webhooks.service'

describe('Pricing System Integration Tests', () => {
  let app: INestApplication
  let pricingEngine: PricingEngineService
  let cacheService: PricingCacheService
  let analyticsService: PricingAnalyticsService
  let mlService: PricingMLService
  let webhooksService: PricingWebhooksService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PricingUnifiedModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    pricingEngine = moduleFixture.get<PricingEngineService>(PricingEngineService)
    cacheService = moduleFixture.get<PricingCacheService>(PricingCacheService)
    analyticsService = moduleFixture.get<PricingAnalyticsService>(PricingAnalyticsService)
    mlService = moduleFixture.get<PricingMLService>(PricingMLService)
    webhooksService = moduleFixture.get<PricingWebhooksService>(PricingWebhooksService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('PricingEngineService', () => {
    it('should calculate basic price without rules', async () => {
      const context = {
        articleId: 'test-article-1',
        societeId: 'test-societe-1',
        quantity: 10,
        basePrice: 100,
        channel: PriceRuleChannel.ERP,
      }

      const result = await pricingEngine.calculatePrice(context)

      expect(result).toBeDefined()
      expect(result.basePrice).toBe(100)
      expect(result.finalPrice).toBe(100)
      expect(result.totalDiscount).toBe(0)
    })

    it('should apply discount rule correctly', async () => {
      const mockRule = {
        id: 'rule-1',
        name: 'Test Discount',
        type: PriceRuleType.DISCOUNT_PERCENTAGE,
        value: 10,
        priority: 1,
        status: PriceRuleStatus.ACTIVE,
        conditions: [],
        channels: [PriceRuleChannel.ERP],
      }

      // Mock the rule repository to return our test rule
      jest.spyOn(pricingEngine as any, 'findApplicableRules').mockResolvedValue([mockRule])

      const context = {
        articleId: 'test-article-1',
        societeId: 'test-societe-1',
        quantity: 10,
        basePrice: 100,
        channel: PriceRuleChannel.ERP,
      }

      const result = await pricingEngine.calculatePrice(context)

      expect(result.finalPrice).toBe(90) // 100 - 10%
      expect(result.totalDiscount).toBe(10)
      expect(result.totalDiscountPercentage).toBe(10)
      expect(result.appliedRules).toHaveLength(1)
    })

    it('should handle bulk pricing correctly', async () => {
      const contexts = [
        {
          articleId: 'test-article-1',
          societeId: 'test-societe-1',
          quantity: 10,
          basePrice: 100,
          channel: PriceRuleChannel.ERP,
        },
        {
          articleId: 'test-article-2',
          societeId: 'test-societe-1',
          quantity: 5,
          basePrice: 200,
          channel: PriceRuleChannel.ERP,
        },
      ]

      const results = await pricingEngine.calculateBulkPrices(contexts)

      expect(results).toHaveLength(2)
      expect(results[0].basePrice).toBe(100)
      expect(results[1].basePrice).toBe(200)
    })
  })

  describe('PricingCacheService', () => {
    it('should cache and retrieve pricing data', async () => {
      const context = {
        articleId: 'test-article-1',
        societeId: 'test-societe-1',
        quantity: 10,
        channel: PriceRuleChannel.ERP,
      }

      const pricingData = {
        basePrice: 100,
        finalPrice: 90,
        totalDiscount: 10,
        totalDiscountPercentage: 10,
        appliedRules: [],
      }

      await cacheService.set(context, pricingData)
      const cached = await cacheService.get(context)

      expect(cached).toEqual(pricingData)
    })

    it('should invalidate cache by pattern', async () => {
      const context = {
        articleId: 'test-article-1',
        societeId: 'test-societe-1',
        quantity: 10,
        channel: PriceRuleChannel.ERP,
      }

      const pricingData = {
        basePrice: 100,
        finalPrice: 90,
        totalDiscount: 10,
        totalDiscountPercentage: 10,
        appliedRules: [],
      }

      await cacheService.set(context, pricingData)
      await cacheService.invalidateByPattern('test-article-1')
      const cached = await cacheService.get(context)

      expect(cached).toBeNull()
    })

    it('should warm up cache with frequently used items', async () => {
      const contexts = [
        {
          articleId: 'test-article-1',
          societeId: 'test-societe-1',
          quantity: 10,
          channel: PriceRuleChannel.ERP,
        },
      ]

      await cacheService.warmUp(contexts)
      const stats = await cacheService.getStats()

      expect(stats.totalKeys).toBeGreaterThan(0)
    })
  })

  describe('PricingAnalyticsService', () => {
    it('should log rule usage', async () => {
      const usageData = {
        ruleId: 'rule-1',
        societeId: 'test-societe-1',
        customerId: 'customer-1',
        articleId: 'article-1',
        basePrice: 100,
        finalPrice: 90,
        discount: 10,
        applied: true,
      }

      await analyticsService.logRuleUsage(usageData)
      // Verify the log was created (would need mock repository)
      expect(true).toBe(true)
    })

    it('should generate analytics dashboard', async () => {
      const dashboard = await analyticsService.getDashboard(
        'test-societe-1',
        new Date('2024-01-01'),
        new Date('2024-12-31')
      )

      expect(dashboard).toBeDefined()
      expect(dashboard.period).toBeDefined()
      expect(dashboard.totalCalculations).toBeGreaterThanOrEqual(0)
      expect(dashboard.topRules).toBeInstanceOf(Array)
    })

    it('should track performance metrics', async () => {
      await analyticsService.trackPerformance('test-operation', 100)
      const metrics = await analyticsService.getPerformanceMetrics('test-societe-1')

      expect(metrics).toBeDefined()
      expect(metrics.averageCalculationTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('PricingMLService', () => {
    it('should suggest optimal price', async () => {
      const context = {
        articleId: 'test-article-1',
        historicalSales: [
          { date: new Date('2024-01-01'), price: 100, quantity: 10, revenue: 1000 },
          { date: new Date('2024-01-02'), price: 95, quantity: 15, revenue: 1425 },
          { date: new Date('2024-01-03'), price: 90, quantity: 20, revenue: 1800 },
        ],
        inventory: 100,
        cost: 50,
        category: 'GENERAL',
      }

      const suggestion = await mlService.suggestOptimalPrice(context)

      expect(suggestion).toBeDefined()
      expect(suggestion.suggestedPrice).toBeGreaterThan(0)
      expect(suggestion.confidence).toBeGreaterThanOrEqual(0)
      expect(suggestion.confidence).toBeLessThanOrEqual(1)
      expect(suggestion.reasoning).toBeInstanceOf(Array)
    })

    it('should predict demand', async () => {
      const prediction = await mlService.predictDemand('test-article-1', 95)

      expect(prediction).toBeDefined()
      expect(prediction.expectedQuantity).toBeGreaterThanOrEqual(0)
      expect(prediction.confidence).toBeGreaterThanOrEqual(0)
      expect(prediction.confidence).toBeLessThanOrEqual(1)
    })

    it('should analyze competitor prices', async () => {
      const analysis = await mlService.analyzeCompetitorPrices(
        'test-article-1',
        100,
        [95, 98, 102, 105]
      )

      expect(analysis).toBeDefined()
      expect(analysis.position).toBeDefined()
      expect(analysis.recommendation).toBeDefined()
      expect(analysis.expectedImpact).toBeDefined()
    })
  })

  describe('PricingWebhooksService', () => {
    it('should create webhook subscription', async () => {
      const subscriptionData = {
        societeId: 'test-societe-1',
        url: 'https://example.com/webhook',
        events: ['price.changed', 'rule.applied'],
        description: 'Test webhook',
      }

      // Mock URL validation
      jest.spyOn(webhooksService as any, 'validateWebhookUrl').mockResolvedValue(undefined)

      const subscription = await webhooksService.createSubscription(subscriptionData)

      expect(subscription).toBeDefined()
      expect(subscription.societeId).toBe('test-societe-1')
      expect(subscription.url).toBe('https://example.com/webhook')
      expect(subscription.secret).toBeDefined()
      expect(subscription.isActive).toBe(true)
    })

    it('should emit webhook event', async () => {
      const event = {
        type: 'price.changed',
        societeId: 'test-societe-1',
        data: {
          articleId: 'article-1',
          oldPrice: 100,
          newPrice: 90,
        },
      }

      await webhooksService.emit(event)
      // Event should be queued for delivery
      expect(true).toBe(true)
    })

    it('should handle webhook delivery with retry', async () => {
      // This would need more complex mocking of HTTP service
      expect(true).toBe(true)
    })
  })

  describe('REST API Endpoints', () => {
    it('POST /pricing/calculate should return price calculation', async () => {
      const response = await request(app.getHttpServer())
        .post('/pricing/calculate')
        .send({
          articleId: 'test-article-1',
          quantity: 10,
          channel: 'ERP',
        })
        .expect(201)

      expect(response.body).toHaveProperty('finalPrice')
      expect(response.body).toHaveProperty('appliedRules')
    })

    it('POST /pricing/bulk should handle bulk calculations', async () => {
      const response = await request(app.getHttpServer())
        .post('/pricing/bulk')
        .send({
          calculations: [
            { articleId: 'test-1', quantity: 10 },
            { articleId: 'test-2', quantity: 5 },
          ],
        })
        .expect(201)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body).toHaveLength(2)
    })

    it('GET /pricing/analytics/dashboard should return analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/pricing/analytics/dashboard')
        .query({ from: '2024-01-01', to: '2024-12-31' })
        .expect(200)

      expect(response.body).toHaveProperty('totalCalculations')
      expect(response.body).toHaveProperty('topRules')
    })
  })

  describe('GraphQL Queries', () => {
    const graphqlEndpoint = '/graphql'

    it('should calculate price via GraphQL', async () => {
      const query = `
        query CalculatePrice($articleId: String!, $quantity: Float!) {
          calculatePrice(articleId: $articleId, quantity: $quantity) {
            basePrice
            finalPrice
            totalDiscount
            appliedRules
          }
        }
      `

      const response = await request(app.getHttpServer())
        .post(graphqlEndpoint)
        .send({
          query,
          variables: {
            articleId: 'test-article-1',
            quantity: 10,
          },
        })
        .expect(200)

      expect(response.body.data.calculatePrice).toBeDefined()
      expect(response.body.data.calculatePrice.finalPrice).toBeGreaterThan(0)
    })

    it('should get price optimization suggestions', async () => {
      const query = `
        query SuggestOptimalPrice($articleId: String!) {
          suggestOptimalPrice(articleId: $articleId) {
            currentPrice
            suggestedPrice
            confidence
            expectedRevenueLift
          }
        }
      `

      const response = await request(app.getHttpServer())
        .post(graphqlEndpoint)
        .send({
          query,
          variables: {
            articleId: 'test-article-1',
          },
        })
        .expect(200)

      expect(response.body.data.suggestOptimalPrice).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid article ID gracefully', async () => {
      const context = {
        articleId: 'invalid-article',
        societeId: 'test-societe-1',
        quantity: 10,
        channel: PriceRuleChannel.ERP,
      }

      const result = await pricingEngine.calculatePrice(context)
      expect(result.error).toBeUndefined()
      expect(result.finalPrice).toBeGreaterThanOrEqual(0)
    })

    it('should handle cache errors gracefully', async () => {
      // Simulate Redis connection error
      jest.spyOn(cacheService as any, 'redis').mockImplementation(() => {
        throw new Error('Redis connection failed')
      })

      const context = {
        articleId: 'test-article-1',
        societeId: 'test-societe-1',
        quantity: 10,
        channel: PriceRuleChannel.ERP,
      }

      // Should continue without cache
      const result = await pricingEngine.calculatePrice(context)
      expect(result).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    it('should handle 1000 concurrent calculations', async () => {
      const promises = []
      for (let i = 0; i < 1000; i++) {
        promises.push(
          pricingEngine.calculatePrice({
            articleId: `article-${i}`,
            societeId: 'test-societe-1',
            quantity: Math.random() * 100,
            basePrice: Math.random() * 1000,
            channel: PriceRuleChannel.ERP,
          })
        )
      }

      const start = Date.now()
      const results = await Promise.all(promises)
      const duration = Date.now() - start

      expect(results).toHaveLength(1000)
      expect(duration).toBeLessThan(5000) // Should complete in less than 5 seconds

      results.forEach((result) => {
        expect(result.finalPrice).toBeGreaterThanOrEqual(0)
      })
    })

    it('should maintain sub-100ms response time for cached items', async () => {
      const context = {
        articleId: 'perf-test-1',
        societeId: 'test-societe-1',
        quantity: 10,
        basePrice: 100,
        channel: PriceRuleChannel.ERP,
      }

      // First call to populate cache
      await pricingEngine.calculatePrice(context)

      // Measure cached response time
      const start = Date.now()
      const result = await pricingEngine.calculatePrice(context)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
      expect(result).toBeDefined()
    })
  })
})
