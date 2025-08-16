import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { MarketplaceOrder } from '../entities/marketplace-order.entity';
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity';
import { Article } from '@erp/entities';
import { MarketplaceShipment } from '../entities/marketplace-shipment.entity';

export interface DashboardMetrics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  recentActivity: {
    newOrders: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      total: number;
      status: string;
      createdAt: Date;
    }>;
    newCustomers: Array<{
      id: string;
      name: string;
      email: string;
      createdAt: Date;
    }>;
    lowStockProducts: Array<{
      id: string;
      name: string;
      stockQuantity: number;
      minStockLevel: number;
    }>;
  };
  analytics: {
    salesTrend: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      totalSold: number;
      revenue: number;
    }>;
    orderStatusBreakdown: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    customerGrowth: Array<{
      date: string;
      newCustomers: number;
      totalCustomers: number;
    }>;
  };
  performance: {
    averageProcessingTime: number; // in hours
    deliverySuccessRate: number;
    customerSatisfaction: number;
    returnRate: number;
  };
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class MarketplaceDashboardService {
  private readonly logger = new Logger(MarketplaceDashboardService.name);
  private readonly CACHE_TTL = 900; // 15 minutes

  constructor(
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceCustomer)
    private readonly customerRepository: Repository<MarketplaceCustomer>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(MarketplaceShipment)
    private readonly shipmentRepository: Repository<MarketplaceShipment>,
    @InjectRedis() private readonly redisService: Redis
  ) {}

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(tenantId: string, dateRange?: DateRange): Promise<DashboardMetrics> {
    const cacheKey = `dashboard:metrics:${tenantId}:${dateRange ? `${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}` : 'all'}`;
    
    try {
      // Check cache first
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Calculate metrics
      const [
        overview,
        recentActivity,
        analytics,
        performance
      ] = await Promise.all([
        this.getOverviewMetrics(tenantId, dateRange),
        this.getRecentActivity(tenantId),
        this.getAnalytics(tenantId, dateRange),
        this.getPerformanceMetrics(tenantId, dateRange)
      ]);

      const metrics: DashboardMetrics = {
        overview,
        recentActivity,
        analytics,
        performance
      };

      // Cache for 15 minutes
      await this.redisService.setex(cacheKey, this.CACHE_TTL, JSON.stringify(metrics));

      return metrics;

    } catch (error) {
      this.logger.error(`Failed to get dashboard metrics for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get overview metrics (totals, averages)
   */
  private async getOverviewMetrics(tenantId: string, dateRange?: DateRange): Promise<DashboardMetrics['overview']> {
    const whereCondition = dateRange 
      ? { tenantId, createdAt: Between(dateRange.startDate, dateRange.endDate) }
      : { tenantId };

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      paidOrders
    ] = await Promise.all([
      // Total revenue from paid orders
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'total')
        .where('order.tenant_id = :tenantId AND order.payment_status = :status', { 
          tenantId, 
          status: 'PAID' 
        })
        .andWhere(dateRange ? 'order.created_at BETWEEN :startDate AND :endDate' : '1=1', {
          startDate: dateRange?.startDate,
          endDate: dateRange?.endDate
        })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0')),

      // Total orders
      this.orderRepository.count({
        where: whereCondition
      }),

      // Total customers
      this.customerRepository.count({
        where: { tenantId }
      }),

      // Total products
      this.articleRepository.count({
        where: { isMarketplaceEnabled: true }
      }),

      // Paid orders for AOV calculation
      this.orderRepository.find({
        where: { 
          tenantId, 
          paymentStatus: 'PAID',
          ...(dateRange && {
            createdAt: Between(dateRange.startDate, dateRange.endDate)
          })
        },
        select: ['total']
      })
    ]);

    const averageOrderValue = paidOrders.length > 0 
      ? paidOrders.reduce((sum, order) => sum + order.total, 0) / paidOrders.length 
      : 0;

    // Simple conversion rate calculation (paid orders / total orders)
    const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      conversionRate: Math.round(conversionRate * 10) / 10
    };
  }

  /**
   * Get recent activity (new orders, customers, low stock alerts)
   */
  private async getRecentActivity(tenantId: string): Promise<DashboardMetrics['recentActivity']> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [newOrders, newCustomers, lowStockProducts] = await Promise.all([
      // Recent orders
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.customer', 'customer')
        .where('order.tenant_id = :tenantId AND order.created_at > :date', {
          tenantId,
          date: last24Hours
        })
        .orderBy('order.created_at', 'DESC')
        .limit(10)
        .getMany()
        .then(orders => orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt
        }))),

      // New customers
      this.customerRepository.find({
        where: {
          tenantId,
          createdAt: MoreThan(last24Hours)
        },
        order: { createdAt: 'DESC' },
        take: 10
      }).then(customers => customers.map(customer => ({
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        createdAt: customer.createdAt
      }))),

      // Low stock products
      this.articleRepository
        .createQueryBuilder('product')
        .where('product.tenant_id = :tenantId', { tenantId })
        .andWhere('product.is_marketplace_enabled = true')
        .andWhere('product.stock_quantity <= product.min_stock_level')
        .orderBy('product.stock_quantity', 'ASC')
        .limit(10)
        .getMany()
        .then(products => products.map(product => ({
          id: product.id,
          name: product.designation,
          stockQuantity: product.stockPhysique,
          minStockLevel: product.stockMini || 0
        })))
    ]);

    return {
      newOrders,
      newCustomers,
      lowStockProducts
    };
  }

  /**
   * Get analytics data (trends, top products, etc.)
   */
  private async getAnalytics(tenantId: string, dateRange?: DateRange): Promise<DashboardMetrics['analytics']> {
    const days = dateRange 
      ? Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    const startDate = dateRange?.startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.endDate || new Date();

    const [salesTrend, topProducts, orderStatusBreakdown, customerGrowth] = await Promise.all([
      // Sales trend
      this.orderRepository
        .createQueryBuilder('order')
        .select([
          "DATE(order.created_at) as date",
          "SUM(CASE WHEN order.payment_status = 'PAID' THEN order.total ELSE 0 END) as revenue",
          "COUNT(*) as orders"
        ])
        .where('order.tenant_id = :tenantId', { tenantId })
        .andWhere('order.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('DATE(order.created_at)')
        .orderBy('date', 'ASC')
        .getRawMany()
        .then(results => results.map(row => ({
          date: row.date,
          revenue: parseFloat(row.revenue || '0'),
          orders: parseInt(row.orders || '0')
        }))),

      // Top products by revenue
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoin('order.items', 'item')
        .leftJoin('item.product', 'product')
        .select([
          'product.id as productId',
          'product.name as productName',
          'SUM(item.quantity) as totalSold',
          'SUM(item.total_price) as revenue'
        ])
        .where('order.tenant_id = :tenantId', { tenantId })
        .andWhere('order.payment_status = :status', { status: 'PAID' })
        .andWhere(dateRange ? 'order.created_at BETWEEN :startDate AND :endDate' : '1=1', {
          startDate,
          endDate
        })
        .groupBy('product.id, product.name')
        .orderBy('revenue', 'DESC')
        .limit(10)
        .getRawMany()
        .then(results => results.map(row => ({
          productId: row.productId,
          productName: row.productName,
          totalSold: parseInt(row.totalSold || '0'),
          revenue: parseFloat(row.revenue || '0')
        }))),

      // Order status breakdown
      this.orderRepository
        .createQueryBuilder('order')
        .select(['order.status as status', 'COUNT(*) as count'])
        .where('order.tenant_id = :tenantId', { tenantId })
        .andWhere(dateRange ? 'order.created_at BETWEEN :startDate AND :endDate' : '1=1', {
          startDate,
          endDate
        })
        .groupBy('order.status')
        .getRawMany()
        .then(results => {
          const total = results.reduce((sum, row) => sum + parseInt(row.count), 0);
          return results.map(row => ({
            status: row.status,
            count: parseInt(row.count),
            percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0
          }));
        }),

      // Customer growth
      this.customerRepository
        .createQueryBuilder('customer')
        .select([
          "DATE(customer.created_at) as date",
          "COUNT(*) as newCustomers"
        ])
        .where('customer.tenant_id = :tenantId', { tenantId })
        .andWhere('customer.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('DATE(customer.created_at)')
        .orderBy('date', 'ASC')
        .getRawMany()
        .then(async results => {
          let totalCustomers = await this.customerRepository.count({
            where: { tenantId, createdAt: Between(new Date(0), startDate) }
          });

          return results.map(row => {
            const newCustomers = parseInt(row.newCustomers);
            totalCustomers += newCustomers;
            return {
              date: row.date,
              newCustomers,
              totalCustomers
            };
          });
        })
    ]);

    return {
      salesTrend,
      topProducts,
      orderStatusBreakdown,
      customerGrowth
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(tenantId: string, dateRange?: DateRange): Promise<DashboardMetrics['performance']> {
    const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.endDate || new Date();

    // Get processing time (order created to shipped)
    const processingTimes = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        'EXTRACT(EPOCH FROM (order.shipped_at - order.created_at))/3600 as hours'
      ])
      .where('order.tenant_id = :tenantId', { tenantId })
      .andWhere('order.shipped_at IS NOT NULL')
      .andWhere('order.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawMany();

    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, row) => sum + parseFloat(row.hours || '0'), 0) / processingTimes.length
      : 0;

    // Delivery success rate
    const totalShipments = await this.shipmentRepository.count({
      where: {
        createdAt: Between(startDate, endDate)
      }
    });

    const successfulDeliveries = await this.shipmentRepository.count({
      where: {
        status: 'DELIVERED' as any,
        createdAt: Between(startDate, endDate)
      }
    });

    const deliverySuccessRate = totalShipments > 0 ? (successfulDeliveries / totalShipments) * 100 : 0;

    // Placeholder metrics (would be calculated from actual data)
    const customerSatisfaction = 4.2; // Would come from reviews/ratings
    const returnRate = 2.1; // Would come from return orders

    return {
      averageProcessingTime: Math.round(averageProcessingTime * 10) / 10,
      deliverySuccessRate: Math.round(deliverySuccessRate * 10) / 10,
      customerSatisfaction,
      returnRate
    };
  }

  /**
   * Clear dashboard cache
   */
  async clearCache(tenantId: string): Promise<void> {
    try {
      const pattern = `dashboard:*:${tenantId}:*`;
      const keys = await this.redisService.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisService.del(...keys);
      }
      
      this.logger.log(`Dashboard cache cleared for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to clear dashboard cache for tenant ${tenantId}:`, error);
    }
  }
}