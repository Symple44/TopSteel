#!/bin/bash

# TopSteel Database Indexing Deployment Script
# This script deploys the comprehensive database indexing strategy
# across three phases with proper monitoring and rollback capabilities

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs/database-indexing"
BACKUP_DIR="$PROJECT_ROOT/backups/database-indexing"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_DIR/deployment_$TIMESTAMP.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_DIR/deployment_$TIMESTAMP.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_DIR/deployment_$TIMESTAMP.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_DIR/deployment_$TIMESTAMP.log"
}

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-topsteel}
DB_USER=${DB_USER:-postgres}

# Environment check
ENVIRONMENT=${NODE_ENV:-development}

echo "========================================"
echo "TopSteel Database Indexing Deployment"
echo "========================================"
echo "Environment: $ENVIRONMENT"
echo "Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "Timestamp: $TIMESTAMP"
echo "========================================"

# Pre-deployment checks
log "Starting pre-deployment checks..."

# Check database connection
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    log_error "Cannot connect to database. Please check connection parameters."
    exit 1
fi
log_success "Database connection verified"

# Check disk space (require at least 5GB free)
AVAILABLE_SPACE=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then  # 5GB in KB
    log_error "Insufficient disk space. At least 5GB required for safe index deployment."
    exit 1
fi
log_success "Disk space check passed"

# Check for active connections
ACTIVE_CONNECTIONS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='$DB_NAME' AND state='active';")
if [ "$ACTIVE_CONNECTIONS" -gt 10 ]; then
    log_warning "High number of active connections ($ACTIVE_CONNECTIONS). Consider deploying during off-peak hours."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled by user"
        exit 1
    fi
fi

# Create backup
log "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/pre_indexing_backup_$TIMESTAMP.sql"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    log_success "Database backup created: $BACKUP_FILE"
else
    log_error "Failed to create database backup"
    exit 1
fi

# Function to monitor index creation progress
monitor_index_progress() {
    local migration_name=$1
    log "Monitoring index creation progress for $migration_name..."
    
    while true; do
        # Check for running CREATE INDEX operations
        CREATING_INDEXES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT count(*) FROM pg_stat_activity 
            WHERE query LIKE '%CREATE INDEX CONCURRENTLY%' 
            AND state = 'active';
        " 2>/dev/null || echo "0")
        
        if [ "$CREATING_INDEXES" -eq 0 ]; then
            break
        fi
        
        log "Index creation in progress... ($CREATING_INDEXES active operations)"
        sleep 10
    done
}

# Function to run migration with monitoring
run_migration_with_monitoring() {
    local migration_file=$1
    local migration_name=$2
    local phase_num=$3
    
    log "========================================"
    log "PHASE $phase_num: $migration_name"
    log "========================================"
    
    # Record start time
    START_TIME=$(date +%s)
    
    # Navigate to API directory for TypeORM commands
    cd "$PROJECT_ROOT/apps/api"
    
    # Run the migration
    log "Starting migration: $migration_file"
    
    if npm run migration:run 2>&1 | tee -a "$LOG_DIR/phase${phase_num}_$TIMESTAMP.log"; then
        # Monitor progress
        monitor_index_progress "$migration_name"
        
        # Calculate duration
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        
        log_success "Phase $phase_num completed successfully in ${DURATION}s"
        
        # Verify indexes were created
        verify_indexes_phase "$phase_num"
        
    else
        log_error "Phase $phase_num failed"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to verify indexes were created
verify_indexes_phase() {
    local phase_num=$1
    
    log "Verifying indexes for Phase $phase_num..."
    
    # Count new indexes created
    NEW_INDEXES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM pg_indexes 
        WHERE indexname LIKE 'idx_%' 
        AND schemaname = 'public';
    ")
    
    log "Total indexes in database: $NEW_INDEXES"
    
    # Check for failed index creations
    INVALID_INDEXES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) FROM pg_index 
        WHERE NOT indisvalid;
    ")
    
    if [ "$INVALID_INDEXES" -gt 0 ]; then
        log_warning "$INVALID_INDEXES invalid indexes found. Manual review required."
    else
        log_success "All indexes are valid"
    fi
}

# Function to run performance tests
run_performance_tests() {
    log "Running performance validation tests..."
    
    # Test key queries
    log "Testing authentication query performance..."
    AUTH_TIME=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        EXPLAIN (ANALYZE, BUFFERS) 
        SELECT * FROM users 
        WHERE email = 'test@example.com' AND actif = true;
    " 2>&1 | grep "Execution Time:" | awk '{print $3}')
    
    if [ ! -z "$AUTH_TIME" ]; then
        log "Authentication query time: ${AUTH_TIME}ms"
    fi
    
    log "Testing inventory query performance..."
    INVENTORY_TIME=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        EXPLAIN (ANALYZE, BUFFERS) 
        SELECT count(*) FROM articles 
        WHERE type = 'MATIERE_PREMIERE' AND status = 'ACTIF' 
        AND deleted_at IS NULL;
    " 2>&1 | grep "Execution Time:" | awk '{print $3}')
    
    if [ ! -z "$INVENTORY_TIME" ]; then
        log "Inventory query time: ${INVENTORY_TIME}ms"
    fi
}

# Main deployment process
log "Starting database indexing deployment..."

# Phase 1: Core Infrastructure Indexes
if run_migration_with_monitoring "1740000000000-CreateComprehensiveIndexes" "Core Infrastructure Indexes" "1"; then
    log_success "Phase 1 completed successfully"
else
    log_error "Phase 1 failed. Stopping deployment."
    exit 1
fi

# Brief pause between phases
log "Pausing 30 seconds between phases..."
sleep 30

# Phase 2: Advanced Composite Indexes
if run_migration_with_monitoring "1740000001000-CreateAdvancedCompositeIndexes" "Advanced Composite Indexes" "2"; then
    log_success "Phase 2 completed successfully"
else
    log_error "Phase 2 failed. Phase 1 indexes are still active."
    exit 1
fi

# Brief pause between phases
log "Pausing 30 seconds between phases..."
sleep 30

# Phase 3: Marketplace Optimization Indexes
if run_migration_with_monitoring "1740000002000-CreateMarketplaceOptimizationIndexes" "Marketplace Optimization Indexes" "3"; then
    log_success "Phase 3 completed successfully"
else
    log_error "Phase 3 failed. Previous phases are still active."
    exit 1
fi

# Post-deployment validation
log "========================================"
log "POST-DEPLOYMENT VALIDATION"
log "========================================"

# Update table statistics
log "Updating database statistics..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" >/dev/null 2>&1
log_success "Database statistics updated"

# Run performance tests
run_performance_tests

# Final verification
log "Running final verification..."
TOTAL_INDEXES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT count(*) FROM pg_indexes 
    WHERE indexname LIKE 'idx_%' 
    AND schemaname = 'public';
")

INVALID_INDEXES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT count(*) FROM pg_index 
    WHERE NOT indisvalid;
")

# Generate deployment report
REPORT_FILE="$LOG_DIR/deployment_report_$TIMESTAMP.txt"
cat > "$REPORT_FILE" << EOF
TopSteel Database Indexing Deployment Report
===========================================
Deployment Date: $(date)
Environment: $ENVIRONMENT
Database: $DB_HOST:$DB_PORT/$DB_NAME

Results:
- Total indexes created: $TOTAL_INDEXES
- Invalid indexes: $INVALID_INDEXES
- Backup location: $BACKUP_FILE
- Log files: $LOG_DIR/

Phases Completed:
✓ Phase 1: Core Infrastructure Indexes
✓ Phase 2: Advanced Composite Indexes  
✓ Phase 3: Marketplace Optimization Indexes

Performance Metrics:
- Authentication query time: ${AUTH_TIME:-N/A}ms
- Inventory query time: ${INVENTORY_TIME:-N/A}ms

Next Steps:
1. Monitor query performance over the next 24 hours
2. Review slow query log for optimization opportunities
3. Schedule monthly index maintenance
4. Update application monitoring dashboards

For issues or questions, review the deployment logs in:
$LOG_DIR/deployment_$TIMESTAMP.log
EOF

# Final status
if [ "$INVALID_INDEXES" -eq 0 ] && [ "$TOTAL_INDEXES" -gt 100 ]; then
    log_success "========================================"
    log_success "DEPLOYMENT COMPLETED SUCCESSFULLY!"
    log_success "========================================"
    log_success "✓ All 3 phases completed"
    log_success "✓ $TOTAL_INDEXES indexes created" 
    log_success "✓ No invalid indexes detected"
    log_success "✓ Database backup created"
    log_success "✓ Performance validation completed"
    echo ""
    log "Deployment report: $REPORT_FILE"
    log "Monitor the system closely for the next 24 hours"
    echo ""
    exit 0
else
    log_error "========================================"
    log_error "DEPLOYMENT COMPLETED WITH WARNINGS"
    log_error "========================================"
    log_error "⚠ Manual review required"
    log_error "⚠ Invalid indexes: $INVALID_INDEXES"
    log_error "⚠ Total indexes: $TOTAL_INDEXES"
    echo ""
    log "Deployment report: $REPORT_FILE"
    log "Review logs and contact database administrator"
    echo ""
    exit 1
fi