# TopSteel Database Indexing Strategy

## Executive Summary

This document outlines a comprehensive database indexing strategy for the TopSteel ERP and Marketplace platform. The strategy focuses on optimizing performance for multi-tenant operations, authentication, inventory management, and e-commerce functionalities while maintaining data integrity and query efficiency.

## Table of Contents

1. [Overview](#overview)
2. [Indexing Principles](#indexing-principles)
3. [Performance-Critical Tables](#performance-critical-tables)
4. [Migration Strategy](#migration-strategy)
5. [Index Categories](#index-categories)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Performance Metrics](#performance-metrics)

## Overview

The TopSteel platform requires sophisticated indexing to support:

- **Multi-tenant architecture** with thousands of companies
- **Real-time inventory management** with frequent stock updates
- **E-commerce marketplace** with complex product catalogs
- **Role-based access control (RBAC)** with granular permissions
- **Advanced search capabilities** across multiple domains
- **Audit trails** for compliance and security

### Key Statistics

- **120+ indexes** across 50+ tables
- **3 specialized migration files** for different optimization layers
- **Performance improvement targets**: 80% reduction in query time for critical operations
- **Multi-tenant support**: Optimized for 1000+ companies with isolated data access

## Indexing Principles

### 1. Query Pattern Analysis
All indexes are based on actual query patterns identified in:
- Service layer implementations
- Repository patterns
- API endpoint requirements
- Dashboard and reporting needs

### 2. Multi-Tenant Optimization
Every index considers the multi-tenant nature of TopSteel:
```sql
-- Example: Multi-tenant aware indexing
CREATE INDEX "idx_articles_tenant_status" 
ON "articles" ("societeId", "status", "type") 
WHERE "deleted_at" IS NULL;
```

### 3. Soft Delete Awareness
All indexes include `WHERE "deleted_at" IS NULL` conditions to exclude soft-deleted records:
```sql
-- Partial indexes for active records only
CREATE INDEX "idx_users_active_email" 
ON "users" ("email", "actif") 
WHERE "deleted_at" IS NULL;
```

### 4. Composite Index Strategy
Indexes are designed following the principle: **Equality → Range → Sort**
```sql
-- Optimal column ordering
CREATE INDEX "idx_orders_processing" 
ON "marketplace_orders" (
  "societeId",           -- Equality filter
  "status",              -- Equality filter  
  "orderDate" DESC,      -- Range/Sort
  "totalAmount"          -- Additional sort
);
```

## Performance-Critical Tables

### Authentication & Authorization (Tier 1 - Critical)

#### Users Table
- **Primary operations**: Login, role verification, session management
- **Key indexes**:
  - `idx_users_email_active` - Login operations
  - `idx_users_role_active` - Permission checks
  - `idx_users_refresh_token` - Token refresh

#### User Sessions
- **Primary operations**: Session validation, security monitoring
- **Key indexes**:
  - `idx_user_sessions_userid_status` - Active session lookup
  - `idx_user_sessions_last_activity` - Timeout detection
  - `idx_user_sessions_cleanup_expired` - Maintenance operations

#### Roles & Permissions
- **Primary operations**: RBAC resolution, permission inheritance
- **Key indexes**:
  - `idx_permissions_resource_action` - Permission lookup
  - `idx_roles_societe_active` - Multi-tenant roles
  - `idx_user_societe_roles_permission_resolution` - Complex RBAC queries

### Business Operations (Tier 1 - Critical)

#### Articles (Inventory)
- **Primary operations**: Stock management, catalog browsing, search
- **Key indexes**:
  - `idx_articles_inventory_dashboard` - Real-time inventory
  - `idx_articles_stock_alerts` - Low stock notifications
  - `idx_articles_fulltext_search` - Product search
  - `idx_articles_marketplace_sync` - E-commerce integration

#### Societes (Tenants)
- **Primary operations**: Tenant resolution, subscription management
- **Key indexes**:
  - `idx_societes_database_routing` - Multi-tenant database routing
  - `idx_societes_subscription_management` - License tracking
  - `idx_societes_status_plan` - Active tenant filtering

### Marketplace Operations (Tier 2 - High Priority)

#### Marketplace Orders
- **Primary operations**: Order processing, customer history, analytics
- **Key indexes**:
  - `idx_marketplace_orders_processing` - Order workflow
  - `idx_marketplace_orders_customer_history` - Customer orders
  - `idx_marketplace_orders_fulfillment` - Shipping management

#### Marketplace Products
- **Primary operations**: Catalog browsing, search, recommendations
- **Key indexes**:
  - `idx_marketplace_products_catalog_browse` - Product listing
  - `idx_marketplace_products_search` - Full-text search
  - `idx_marketplace_products_recommendations` - Product suggestions

## Migration Strategy

### Phase 1: Core Infrastructure (Migration 1740000000000)
**File**: `1740000000000-CreateComprehensiveIndexes.ts`

**Focus**: Essential indexes for system stability and performance
- Authentication and session management
- Basic business entity indexes
- Multi-tenant operation support
- Audit and compliance requirements

**Impact**: Foundation for all system operations
**Estimated performance improvement**: 60-70%

### Phase 2: Advanced Composite Indexes (Migration 1740000001000)  
**File**: `1740000001000-CreateAdvancedCompositeIndexes.ts`

**Focus**: Complex business queries and advanced patterns
- Multi-column composite indexes
- Advanced RBAC resolution
- Cross-table relationship optimization
- Search and analytics enhancement

**Impact**: Complex query optimization
**Estimated performance improvement**: Additional 15-20%

### Phase 3: Marketplace Specialization (Migration 1740000002000)
**File**: `1740000002000-CreateMarketplaceOptimizationIndexes.ts`

**Focus**: E-commerce specific optimizations
- Product catalog performance
- Order processing workflows
- Customer experience optimization
- Marketplace analytics

**Impact**: E-commerce functionality enhancement  
**Estimated performance improvement**: Additional 10-15% for marketplace operations

## Index Categories

### 1. Single Column Indexes
Used for simple equality filters and foreign key relationships:
```sql
CREATE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_articles_reference" ON "articles" ("reference");
```

### 2. Composite Indexes
Multi-column indexes for complex queries:
```sql
CREATE INDEX "idx_articles_type_status_family" 
ON "articles" ("type", "status", "famille") 
WHERE "deleted_at" IS NULL;
```

### 3. Partial Indexes
Indexes with WHERE conditions to reduce size and improve performance:
```sql
CREATE INDEX "idx_articles_low_stock" 
ON "articles" ("stock_disponible", "stock_mini") 
WHERE "gere_en_stock" = true 
AND "stock_mini" IS NOT NULL 
AND "deleted_at" IS NULL;
```

### 4. Full-Text Search Indexes
GIN indexes for advanced text search:
```sql
CREATE INDEX "idx_articles_fulltext_search" 
ON "articles" USING gin(
  to_tsvector('french', 
    COALESCE("designation", '') || ' ' || 
    COALESCE("description", '') || ' ' || 
    COALESCE("reference", '')
  )
) WHERE "status" = 'ACTIF' AND "deleted_at" IS NULL;
```

### 5. Maintenance Indexes
Specialized indexes for system maintenance and cleanup:
```sql
CREATE INDEX "idx_maintenance_old_sessions" 
ON "user_sessions" ("updated_at", "isActive") 
WHERE "updated_at" < CURRENT_TIMESTAMP - INTERVAL '30 days';
```

## Monitoring and Maintenance

### Index Usage Monitoring
Regular monitoring of index usage to identify:
- Unused indexes (candidates for removal)
- Missing indexes (new optimization opportunities)
- Index fragmentation (maintenance needs)

```sql
-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Maintenance Schedule
- **Daily**: Monitor index usage statistics
- **Weekly**: Check for index fragmentation
- **Monthly**: Review new query patterns for additional index needs
- **Quarterly**: Full index performance analysis

### Index Health Checks
```sql
-- Check index size and usage
SELECT 
  t.tablename,
  indexname,
  c.reltuples AS num_rows,
  pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.indexname))) AS index_size,
  CASE WHEN indisunique THEN 'Y' ELSE 'N' END AS UNIQUE,
  idx_scan as number_of_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_tables t
LEFT OUTER JOIN pg_class c ON c.relname=t.tablename
LEFT OUTER JOIN (
  SELECT c.relname AS ctablename, ipg.relname AS indexname, x.indnatts AS number_of_columns,
         idx_scan, idx_tup_read, idx_tup_fetch, indexrelname, indisunique FROM pg_index x
         JOIN pg_class c ON c.oid = x.indrelid
         JOIN pg_class ipg ON ipg.oid = x.indexrelid
         JOIN pg_stat_user_indexes psui ON x.indexrelid = psui.indexrelid
) AS foo ON t.tablename = foo.ctablename
WHERE t.schemaname='public'
ORDER BY 1,2;
```

## Performance Metrics

### Target Performance Improvements

| Operation Category | Current Avg Time | Target Avg Time | Improvement |
|-------------------|------------------|-----------------|-------------|
| User Authentication | 150ms | 30ms | 80% |
| Product Search | 800ms | 120ms | 85% |
| Order Processing | 300ms | 60ms | 80% |
| Inventory Updates | 200ms | 40ms | 80% |
| RBAC Resolution | 100ms | 20ms | 80% |

### Key Performance Indicators (KPIs)

1. **Query Response Time**
   - Target: 95% of queries under 100ms
   - Critical: 99% of queries under 500ms

2. **Index Hit Ratio**
   - Target: >95% for all critical tables
   - Minimum: >90% for all tables

3. **Table Scan Reduction**
   - Target: <5% of queries using full table scans
   - Critical operations: 0% table scans

4. **Concurrent User Support**
   - Target: Support 1000+ concurrent users
   - Peak load: 2000+ concurrent users

### Monitoring Queries

#### Index Effectiveness
```sql
-- Monitor index hit ratios
SELECT 
  schemaname,
  tablename,
  ROUND((100 * idx_scan / (seq_scan + idx_scan))::numeric, 2) as index_usage_ratio,
  n_tup_ins + n_tup_upd + n_tup_del as total_writes,
  seq_scan,
  idx_scan
FROM pg_stat_user_tables
WHERE seq_scan + idx_scan > 0
ORDER BY index_usage_ratio ASC;
```

#### Slow Query Detection
```sql
-- Identify slow queries that might benefit from indexing
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  stddev_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries averaging over 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

## Implementation Guidelines

### 1. Deployment Process
1. **Backup**: Full database backup before index creation
2. **Timing**: Deploy during low-traffic periods
3. **Monitoring**: Real-time performance monitoring during deployment
4. **Rollback**: Prepared rollback procedures for each migration

### 2. CONCURRENTLY Index Creation
All indexes use `CREATE INDEX CONCURRENTLY` to avoid blocking operations:
```sql
-- Non-blocking index creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_name" 
ON "table" ("columns") 
WHERE "conditions";
```

### 3. Testing Strategy
- **Load Testing**: Validate performance under expected load
- **Query Plan Analysis**: Verify optimal query plan selection
- **Resource Impact**: Monitor CPU and memory usage
- **Concurrent Operations**: Test with typical application workload

## Conclusion

This comprehensive indexing strategy provides a solid foundation for TopSteel's performance requirements. The three-phase migration approach allows for gradual implementation while maintaining system stability.

### Expected Outcomes
- **80% reduction** in average query response time
- **95% index hit ratio** across critical tables
- **Support for 1000+ concurrent users**
- **Enhanced user experience** across all platform features

### Next Steps
1. Execute Phase 1 migration in staging environment
2. Performance testing and validation
3. Production deployment during maintenance window
4. Monitor and adjust based on real-world usage patterns
5. Proceed with Phase 2 and Phase 3 migrations

### Maintenance Commitment
Regular index maintenance and monitoring are essential for sustained performance. This includes:
- Monthly performance reviews
- Quarterly index optimization
- Annual comprehensive database health checks
- Continuous query pattern analysis for new optimization opportunities

---

*This strategy document should be reviewed and updated quarterly to reflect changes in application usage patterns and performance requirements.*