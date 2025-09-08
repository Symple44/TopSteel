# Database Index Quick Reference Guide

## Common Query Patterns and Their Optimized Indexes

### Authentication & User Management

| Query Pattern | Optimized Index | Usage |
|---------------|-----------------|-------|
| `SELECT * FROM users WHERE email = ? AND actif = true` | `idx_users_email_active` | Login validation |
| `SELECT * FROM user_sessions WHERE userId = ? AND status = 'active'` | `idx_user_sessions_userid_status` | Session lookup |
| `SELECT * FROM roles WHERE societeId = ? AND isActive = true` | `idx_roles_societe_active` | Role resolution |

### Inventory Management

| Query Pattern | Optimized Index | Usage |
|---------------|-----------------|-------|
| `SELECT * FROM articles WHERE type = ? AND status = 'ACTIF'` | `idx_articles_type_status` | Product filtering |
| `SELECT * FROM articles WHERE stock_disponible <= stock_mini` | `idx_articles_stock_alerts` | Low stock alerts |
| `SELECT * FROM articles WHERE famille = ? AND sous_famille = ?` | `idx_articles_famille_sousfamille` | Category browsing |

### Marketplace Operations

| Query Pattern | Optimized Index | Usage |
|---------------|-----------------|-------|
| `SELECT * FROM marketplace_orders WHERE societeId = ? AND status = ?` | `idx_marketplace_orders_societe_status` | Order filtering |
| `SELECT * FROM marketplace_products WHERE societeId = ? AND isActive = true` | `idx_marketplace_products_societe_active` | Product catalog |
| `SELECT * FROM marketplace_customers WHERE email = ? AND societeId = ?` | `idx_marketplace_customers_societe_email` | Customer lookup |

## Index Naming Conventions

### Pattern: `idx_[table]_[purpose]_[columns]`

- **Single column**: `idx_users_email`
- **Composite**: `idx_articles_type_status_famille`  
- **Functional**: `idx_articles_fulltext_search`
- **Partial**: `idx_articles_stock_alerts` (with WHERE clause)

## Performance Optimization Tips

### 1. Multi-Tenant Queries
Always include `societeId` as the first column in composite indexes for multi-tenant queries:
```sql
-- ✅ Optimal
CREATE INDEX ON table (societeId, status, created_at);

-- ❌ Suboptimal  
CREATE INDEX ON table (status, societeId, created_at);
```

### 2. Soft Delete Filtering
Use partial indexes to exclude soft-deleted records:
```sql
-- ✅ Optimal with partial index
CREATE INDEX idx_table_active 
ON table (column1, column2) 
WHERE deleted_at IS NULL;

-- ❌ Includes deleted records
CREATE INDEX ON table (column1, column2, deleted_at);
```

### 3. Date Range Queries
Put date columns last in composite indexes:
```sql
-- ✅ Optimal for filtering + date range
CREATE INDEX ON orders (societeId, status, order_date DESC);

-- ❌ Less optimal
CREATE INDEX ON orders (order_date, societeId, status);
```

## Index Maintenance Commands

### Check Index Usage
```sql
SELECT 
  schemaname, tablename, indexname,
  idx_scan as scans,
  idx_tup_read as reads,
  idx_tup_fetch as fetches
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### Find Unused Indexes
```sql
SELECT 
  schemaname, tablename, indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Monitor Index Health
```sql
SELECT 
  t.tablename,
  i.indexname,
  i.idx_scan,
  pg_size_pretty(pg_relation_size(i.indexrelid)) as size,
  CASE WHEN i.idx_scan = 0 THEN 'UNUSED'
       WHEN i.idx_scan < 100 THEN 'LOW USAGE'  
       ELSE 'ACTIVE' END as status
FROM pg_stat_user_indexes i
JOIN pg_stat_user_tables t ON i.relid = t.relid
WHERE t.schemaname = 'public'
ORDER BY i.idx_scan DESC;
```

## Critical Performance Indexes

### Must-Have Indexes (Never Remove)
- `users_email_unique` - User authentication
- `idx_users_email_active` - Login validation  
- `idx_user_sessions_userid_status` - Session management
- `idx_articles_reference_active` - Inventory lookup
- `idx_societes_code` - Tenant resolution

### High-Impact Indexes
- `idx_articles_inventory_dashboard` - Real-time inventory
- `idx_marketplace_orders_processing` - Order workflow
- `idx_permissions_resource_action` - RBAC resolution
- `idx_articles_stock_alerts` - Inventory alerts

## Query Optimization Checklist

- [ ] **Multi-tenant**: Does the query filter by `societeId` first?
- [ ] **Soft delete**: Does the query exclude `deleted_at IS NULL`?
- [ ] **Index order**: Are equality filters before range filters?
- [ ] **Covering index**: Does the index cover all selected columns?
- [ ] **Statistics**: Are table statistics up to date?

## Common Anti-Patterns to Avoid

### ❌ Wrong Index Column Order
```sql
-- Bad: Date first in composite index
CREATE INDEX ON orders (order_date, societe_id, status);

-- Good: Equality filters first  
CREATE INDEX ON orders (societe_id, status, order_date DESC);
```

### ❌ Too Many Single-Column Indexes
```sql
-- Bad: Multiple single-column indexes
CREATE INDEX ON table (col1);
CREATE INDEX ON table (col2);
CREATE INDEX ON table (col3);

-- Good: One composite index
CREATE INDEX ON table (col1, col2, col3);
```

### ❌ Ignoring Partial Index Opportunities
```sql
-- Bad: Full table index
CREATE INDEX ON articles (status);

-- Good: Partial index for active records
CREATE INDEX ON articles (status) 
WHERE deleted_at IS NULL AND status = 'ACTIF';
```

## Emergency Performance Fixes

### Quick Wins for Slow Queries

1. **Add missing WHERE clause indexes**:
```sql
-- If query: WHERE societeId = ? AND status = ?
CREATE INDEX CONCURRENTLY idx_emergency_societe_status 
ON table (societeId, status);
```

2. **Optimize ORDER BY clauses**:
```sql  
-- If query: ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY idx_emergency_created_desc 
ON table (societeId, created_at DESC);
```

3. **Fix table scans**:
```sql
-- Check for sequential scans
SELECT query, calls, total_time, seq_scan 
FROM pg_stat_statements 
WHERE seq_scan > 0 
ORDER BY total_time DESC;
```

## Index Size Monitoring

### Large Index Alert Thresholds
- **Warning**: Index > 100MB
- **Critical**: Index > 500MB  
- **Action Required**: Index > 1GB

### Monitor Index Growth
```sql
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as current_size,
  pg_size_pretty(pg_total_relation_size(indexrelid)) as total_size
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 100 * 1024 * 1024  -- > 100MB
ORDER BY pg_relation_size(indexrelid) DESC;
```

Remember: **Indexes improve read performance but slow down writes**. Always balance index creation with write operation requirements.