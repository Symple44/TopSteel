import 'reflect-metadata'
import { AdjustmentType, PriceRule, PriceRuleChannel } from '@erp/entities'
import { Test, type TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { vi } from 'vitest'
import { Article } from '../../../domains/inventory/entities/article.entity'
import { type PricingContext, PricingEngineService } from './pricing-engine.service'

describe('PricingEngineService', () => {
  let service: PricingEngineService
  let priceRuleRepository: Repository<PriceRule>
  let articleRepository: Repository<Article>
  let _dataSource: DataSource

  // Mock data
  const mockArticle = {
    id: 'article-123',
    reference: 'TEST-001',
    designation: 'Article de test',
    famille: 'TEST',
    prixVenteHT: 100,
    poids: 10,
    longueur: 1000,
    largeur: 500,
    hauteur: 100,
    uniteVente: 'U',
    coefficientVente: 1,
  }

  const mockPriceRule = {
    id: 'rule-123',
    ruleName: 'Remise VIP',
    adjustmentType: AdjustmentType.PERCENTAGE,
    adjustmentValue: -10, // -10%
    priority: 100,
    combinable: true,
    isActive: true,
    channel: PriceRuleChannel.ERP,
    conditions: [
      {
        type: 'customer_group' as const,
        operator: 'equals' as const,
        value: 'VIP',
      },
    ],
    canBeApplied: vi.fn().mockReturnValue(true),
    incrementUsage: vi.fn(),
    validate: vi.fn().mockReturnValue([]),
  }

  const mockContext: PricingContext = {
    articleId: 'article-123',
    societeId: 'societe-123',
    customerId: 'customer-123',
    customerGroup: 'VIP',
    quantity: 1,
    channel: PriceRuleChannel.ERP,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingEngineService,
        {
          provide: getRepositoryToken(PriceRule),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Article),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: {
            // Mock DataSource methods if needed
          },
        },
      ],
    }).compile()

    service = module.get<PricingEngineService>(PricingEngineService)
    priceRuleRepository = module.get<Repository<PriceRule>>(getRepositoryToken(PriceRule))
    articleRepository = module.get<Repository<Article>>(getRepositoryToken(Article))
    _dataSource = module.get<DataSource>(DataSource)

    // Setup default mocks
    vi.spyOn(articleRepository, 'createQueryBuilder').mockReturnValue({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(mockArticle),
    } as any)

    vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([mockPriceRule]),
    } as any)

    vi.spyOn(priceRuleRepository, 'save').mockResolvedValue(mockPriceRule as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('calculatePrice', () => {
    it('should calculate price without rules', async () => {
      // Mock no rules found
      vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      } as any)

      const result = await service.calculatePrice(mockContext)

      expect(result).toMatchObject({
        basePrice: 100,
        finalPrice: 100,
        currency: 'EUR',
        appliedRules: [],
        totalDiscount: 0,
        totalDiscountPercentage: 0,
      })
    })

    it('should apply percentage discount rule', async () => {
      const result = await service.calculatePrice(mockContext)

      expect(result.basePrice).toBe(100)
      expect(result.finalPrice).toBe(90) // 100 - 10%
      expect(result.appliedRules).toHaveLength(1)
      expect(result.appliedRules[0]).toMatchObject({
        ruleId: 'rule-123',
        ruleName: 'Remise VIP',
        ruleType: AdjustmentType.PERCENTAGE,
      })
      expect(result.totalDiscount).toBe(10)
      expect(result.totalDiscountPercentage).toBe(10)
    })

    it('should apply coefficient de vente', async () => {
      const articleWithCoeff = {
        ...mockArticle,
        coefficientVente: 1.2,
      }

      vi.spyOn(articleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(articleWithCoeff),
      } as any)

      // No rules to focus on coefficient
      vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      } as any)

      const result = await service.calculatePrice(mockContext)

      expect(result.basePrice).toBe(120) // 100 * 1.2
      expect(result.finalPrice).toBe(120)
    })

    it('should handle fixed amount rule', async () => {
      const fixedAmountRule = {
        ...mockPriceRule,
        adjustmentType: AdjustmentType.FIXED_AMOUNT,
        adjustmentValue: -15, // -15€
      }

      vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([fixedAmountRule]),
      } as any)

      const result = await service.calculatePrice(mockContext)

      expect(result.finalPrice).toBe(85) // 100 - 15
      expect(result.totalDiscount).toBe(15)
    })

    it('should handle fixed price rule', async () => {
      const fixedPriceRule = {
        ...mockPriceRule,
        adjustmentType: AdjustmentType.FIXED_PRICE,
        adjustmentValue: 75, // 75€ fixe
      }

      vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([fixedPriceRule]),
      } as any)

      const result = await service.calculatePrice(mockContext)

      expect(result.finalPrice).toBe(75)
      expect(result.totalDiscount).toBe(25) // 100 - 75
    })

    it('should respect rule priority', async () => {
      const lowPriorityRule = {
        ...mockPriceRule,
        id: 'rule-low',
        priority: 50,
        adjustmentValue: -20,
      }

      const highPriorityRule = {
        ...mockPriceRule,
        id: 'rule-high',
        priority: 100,
        adjustmentValue: -10,
      }

      vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([lowPriorityRule, highPriorityRule]),
      } as any)

      const result = await service.calculatePrice(mockContext)

      // High priority rule should be applied first
      expect(result.appliedRules[0].ruleId).toBe('rule-high')
      expect(result.finalPrice).toBe(72) // 100 * 0.9 * 0.8 = 72 (if combinable)
    })

    it('should stop at non-combinable rule', async () => {
      const nonCombinableRule = {
        ...mockPriceRule,
        combinable: false,
      }

      const secondRule = {
        ...mockPriceRule,
        id: 'rule-2',
        priority: 90,
      }

      vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([nonCombinableRule, secondRule]),
      } as any)

      const result = await service.calculatePrice(mockContext)

      expect(result.appliedRules).toHaveLength(1)
      expect(result.appliedRules[0].ruleId).toBe('rule-123')
    })

    it('should handle missing article', async () => {
      vi.spyOn(articleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      } as any)

      const result = await service.calculatePrice(mockContext)

      expect(result.basePrice).toBe(0)
      expect(result.finalPrice).toBe(0)
      expect(result.warnings).toContain('Article introuvable')
    })

    it('should provide detailed breakdown when requested', async () => {
      const result = await service.calculatePrice(mockContext, {
        detailed: true,
        includeMargins: true,
        includeSkippedRules: true,
      })

      expect(result.breakdown).toBeDefined()
      expect(result.breakdown?.steps).toBeDefined()
      expect(result.breakdown?.context).toBeDefined()
      expect(result.breakdown?.metadata).toBeDefined()
    })
  })

  describe('calculateBulkPrices', () => {
    it('should calculate prices for multiple articles', async () => {
      const articles = [
        { articleId: 'article-1', quantity: 1 },
        { articleId: 'article-2', quantity: 2 },
      ]

      const context = {
        societeId: 'societe-123',
        customerId: 'customer-123',
        channel: PriceRuleChannel.ERP,
      }

      const result = await service.calculateBulkPrices(articles, context)

      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(2)
      expect(result.has('article-1')).toBe(true)
      expect(result.has('article-2')).toBe(true)
    })
  })

  describe('previewRule', () => {
    it('should preview a specific rule', async () => {
      vi.spyOn(priceRuleRepository, 'findOne').mockResolvedValue(mockPriceRule as any)

      const result = await service.previewRule('rule-123', 'article-123', {
        societeId: 'societe-123',
      })

      expect(result.appliedRules).toHaveLength(1)
      expect(result.appliedRules[0].ruleId).toBe('rule-123')
    })

    it('should handle missing rule', async () => {
      vi.spyOn(priceRuleRepository, 'findOne').mockResolvedValue(null)

      const result = await service.previewRule('missing-rule', 'article-123', {
        societeId: 'societe-123',
      })

      expect(result.warnings).toContain('Règle introuvable')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.spyOn(articleRepository, 'createQueryBuilder').mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      await expect(service.calculatePrice(mockContext)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should handle rule evaluation errors', async () => {
      const problematicRule = {
        ...mockPriceRule,
        canBeApplied: vi.fn().mockImplementation(() => {
          throw new Error('Rule evaluation failed')
        }),
      }

      vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([problematicRule]),
      } as any)

      const result = await service.calculatePrice(mockContext)

      // Should continue despite rule error
      expect(result).toBeDefined()
      expect(result.warnings).toContain('Erreur règle Remise VIP')
    })
  })

  describe('Edge cases', () => {
    it('should handle zero base price', async () => {
      const _zeroPrice = 0
      const zeroPriceArticle = {
        ...mockArticle,
        prixVenteHT: 0,
      }

      vi.spyOn(articleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(zeroPriceArticle),
      } as any)

      const result = await service.calculatePrice(mockContext)

      expect(result.basePrice).toBe(0)
      expect(result.totalDiscountPercentage).toBe(0)
    })

    it('should not allow negative final price', async () => {
      const largeDiscountRule = {
        ...mockPriceRule,
        adjustmentType: AdjustmentType.FIXED_AMOUNT,
        adjustmentValue: -150, // Plus que le prix de base
      }

      vi.spyOn(priceRuleRepository, 'createQueryBuilder').mockReturnValue({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([largeDiscountRule]),
      } as any)

      const result = await service.calculatePrice(mockContext)

      expect(result.finalPrice).toBe(0) // Should not be negative
    })

    it('should handle very large quantities', async () => {
      const largeQuantityContext = {
        ...mockContext,
        quantity: 999999,
      }

      const result = await service.calculatePrice(largeQuantityContext)

      expect(result).toBeDefined()
      expect(result.finalPrice).toBeGreaterThanOrEqual(0)
    })
  })
})
