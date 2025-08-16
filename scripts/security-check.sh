#!/bin/bash

# TopSteel ERP Security Check Script
# Compatible with Windows (Git Bash/WSL) and Linux
# Author: TopSteel Security Team

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Security check results
SECURITY_ISSUES=0
WARNINGS=0
INFO_ITEMS=0

# Log file
LOG_FILE="security-check-$(date +%Y%m%d-%H%M%S).log"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
    ((INFO_ITEMS++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    ((SECURITY_ISSUES++))
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}    TopSteel Security Check     ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Check if running on Windows (Git Bash/WSL)
is_windows() {
    [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || -n "${WSL_DISTRO_NAME:-}" ]]
}

# File permission checks
check_file_permissions() {
    log_info "Checking file permissions..."
    
    # Sensitive files that should not be world-readable
    local sensitive_files=(
        "*.env*"
        "*.key"
        "*.pem"
        "*.p12"
        "*.pfx"
        "*secret*"
        "*password*"
        "jwt.config.*"
        "database.config.*"
    )
    
    for pattern in "${sensitive_files[@]}"; do
        if is_windows; then
            # Windows check using PowerShell
            files=$(find . -name "$pattern" -type f 2>/dev/null || true)
            if [ -n "$files" ]; then
                while IFS= read -r file; do
                    log_warning "Sensitive file found: $file"
                    # Note: Windows file permission checking is complex, so we just warn
                done <<< "$files"
            fi
        else
            # Unix/Linux permission check
            find . -name "$pattern" -type f -exec ls -la {} \; 2>/dev/null | while read -r line; do
                if [[ $line =~ ^-.*r.*r.*r.* ]]; then
                    log_error "World-readable sensitive file: ${line##* }"
                elif [[ $line =~ ^-.....w.* ]] || [[ $line =~ ^-........w.* ]]; then
                    log_warning "Writable sensitive file: ${line##* }"
                fi
            done
        fi
    done
    
    # Check for executable files in suspicious locations
    suspicious_dirs=("uploads" "public" "temp" "tmp" "node_modules/.bin")
    for dir in "${suspicious_dirs[@]}"; do
        if [ -d "$dir" ]; then
            execs=$(find "$dir" -name "*.exe" -o -name "*.bat" -o -name "*.sh" -o -name "*.ps1" 2>/dev/null || true)
            if [ -n "$execs" ]; then
                log_warning "Executable files in $dir: $execs"
            fi
        fi
    done
}

# Environment variables security check
check_environment_variables() {
    log_info "Checking environment variables and .env files..."
    
    # Check for hardcoded secrets in .env files
    env_files=$(find . -name ".env*" -type f 2>/dev/null || true)
    
    if [ -n "$env_files" ]; then
        while IFS= read -r env_file; do
            log_info "Scanning $env_file"
            
            # Check for weak or default passwords
            if grep -qi "password.*123\|password.*admin\|password.*test\|password.*password" "$env_file" 2>/dev/null; then
                log_error "Weak default password found in $env_file"
            fi
            
            # Check for exposed API keys
            if grep -E "api[_-]?key.*=.*[a-zA-Z0-9]{20,}" "$env_file" 2>/dev/null; then
                log_warning "Potential API key found in $env_file"
            fi
            
            # Check for database URLs with credentials
            if grep -E "DATABASE_URL.*://.*:.*@" "$env_file" 2>/dev/null; then
                log_warning "Database URL with credentials in $env_file"
            fi
            
            # Check for JWT secrets that are too short
            jwt_secret=$(grep -E "JWT_SECRET.*=.*" "$env_file" 2>/dev/null | cut -d'=' -f2 | tr -d ' "' || true)
            if [ -n "$jwt_secret" ] && [ ${#jwt_secret} -lt 32 ]; then
                log_error "JWT secret too short (< 32 characters) in $env_file"
            fi
            
        done <<< "$env_files"
    fi
    
    # Check for secrets in code files
    log_info "Checking for hardcoded secrets in source code..."
    
    # TypeScript/JavaScript files
    ts_js_files=$(find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | grep -v node_modules | head -100)
    
    if [ -n "$ts_js_files" ]; then
        while IFS= read -r file; do
            # Check for hardcoded passwords/secrets
            if grep -nE "(password|secret|key)\s*[:=]\s*['\"][^'\"]{8,}['\"]" "$file" 2>/dev/null; then
                log_warning "Potential hardcoded secret in $file"
            fi
            
            # Check for hardcoded database connections
            if grep -nE "postgresql://|mysql://|mongodb://" "$file" 2>/dev/null; then
                log_warning "Hardcoded database connection string in $file"
            fi
        done <<< "$ts_js_files"
    fi
}

# Security headers check
check_security_headers() {
    log_info "Checking security headers configuration..."
    
    # Check Next.js configuration
    if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
        config_file=""
        [ -f "next.config.js" ] && config_file="next.config.js"
        [ -f "next.config.mjs" ] && config_file="next.config.mjs"
        
        log_info "Checking $config_file for security headers"
        
        # Check for security headers
        security_headers=(
            "X-Frame-Options"
            "X-Content-Type-Options"
            "Referrer-Policy"
            "Strict-Transport-Security"
            "Content-Security-Policy"
        )
        
        for header in "${security_headers[@]}"; do
            if ! grep -qi "$header" "$config_file" 2>/dev/null; then
                log_warning "Missing security header: $header in $config_file"
            fi
        done
    fi
    
    # Check for CORS configuration
    cors_files=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -l "cors\|CORS" 2>/dev/null || true)
    if [ -n "$cors_files" ]; then
        while IFS= read -r file; do
            if grep -E "origin.*['\"]?\*['\"]?" "$file" 2>/dev/null; then
                log_warning "Overly permissive CORS configuration in $file"
            fi
        done <<< "$cors_files"
    fi
}

# SQL injection vulnerability check
check_sql_injection() {
    log_info "Checking for potential SQL injection vulnerabilities..."
    
    # Check TypeScript/JavaScript files for unsafe SQL queries
    sql_files=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | grep -v ".d.ts" | head -100)
    
    if [ -n "$sql_files" ]; then
        while IFS= read -r file; do
            # Check for string concatenation in SQL queries
            if grep -nE "(query|execute).*\+.*\\\$|SELECT.*\+|INSERT.*\+|UPDATE.*\+|DELETE.*\+" "$file" 2>/dev/null; then
                log_error "Potential SQL injection vulnerability (string concatenation) in $file"
            fi
            
            # Check for template literals with user input
            if grep -nE "\\\`.*SELECT.*\\\$\{|\\\`.*INSERT.*\\\$\{|\\\`.*UPDATE.*\\\$\{|\\\`.*DELETE.*\\\$\{" "$file" 2>/dev/null; then
                log_warning "Potential SQL injection via template literals in $file"
            fi
            
            # Check for raw query usage
            if grep -nE "\.query\s*\(.*\\\$\{|\.raw\s*\(.*\\\$\{" "$file" 2>/dev/null; then
                log_warning "Raw query with interpolation in $file"
            fi
        done <<< "$sql_files"
    fi
    
    # Check for parameterized queries usage (good practice)
    param_queries=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -l "\\$[0-9]\|\\?" 2>/dev/null | wc -l)
    if [ "$param_queries" -gt 0 ]; then
        log_success "Found $param_queries files using parameterized queries"
    fi
}

# JWT security check
check_jwt_security() {
    log_info "Checking JWT implementation security..."
    
    jwt_files=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -l "jwt\|JWT" 2>/dev/null || true)
    
    if [ -n "$jwt_files" ]; then
        while IFS= read -r file; do
            # Check for weak JWT algorithms
            if grep -E "algorithm.*HS256|algorithm.*none" "$file" 2>/dev/null; then
                log_warning "Potentially weak JWT algorithm in $file"
            fi
            
            # Check for missing JWT expiration
            if grep -qi "jwt.sign" "$file" 2>/dev/null && ! grep -qi "expiresIn\|exp:" "$file" 2>/dev/null; then
                log_warning "JWT without expiration in $file"
            fi
            
            # Check for JWT secret in code
            if grep -E "jwt.*secret.*['\"][^'\"]{8,}['\"]" "$file" 2>/dev/null; then
                log_error "Hardcoded JWT secret in $file"
            fi
            
        done <<< "$jwt_files"
    fi
    
    # Check JWT configuration files
    if [ -f "apps/api/src/core/config/jwt.config.ts" ]; then
        log_info "Checking JWT configuration"
        config_file="apps/api/src/core/config/jwt.config.ts"
        
        # Check for secure defaults
        if ! grep -qi "expiresIn" "$config_file" 2>/dev/null; then
            log_warning "JWT expiration not configured in $config_file"
        fi
        
        if grep -E "algorithm.*HS256" "$config_file" 2>/dev/null; then
            log_info "Using HS256 algorithm (consider RS256 for production)"
        fi
    fi
}

# Check authentication implementation
check_authentication() {
    log_info "Checking authentication implementation..."
    
    # Check for proper password hashing
    auth_files=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -l "password\|hash" 2>/dev/null || true)
    
    if [ -n "$auth_files" ]; then
        while IFS= read -r file; do
            # Check for bcrypt usage
            if grep -qi "bcrypt" "$file" 2>/dev/null; then
                log_success "Found bcrypt usage in $file"
            fi
            
            # Check for dangerous password storage
            if grep -E "password.*=.*req\.|password.*plaintext" "$file" 2>/dev/null; then
                log_error "Potential plaintext password storage in $file"
            fi
            
            # Check for proper salt rounds
            if grep -E "bcrypt.*hash.*[0-9]+.*" "$file" 2>/dev/null; then
                salt_rounds=$(grep -oE "bcrypt.*hash.*([0-9]+)" "$file" | grep -oE "[0-9]+" | tail -1)
                if [ -n "$salt_rounds" ] && [ "$salt_rounds" -lt 10 ]; then
                    log_warning "Low bcrypt salt rounds ($salt_rounds) in $file"
                fi
            fi
            
        done <<< "$auth_files"
    fi
    
    # Check for session security
    session_files=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -l "session\|cookie" 2>/dev/null || true)
    
    if [ -n "$session_files" ]; then
        while IFS= read -r file; do
            # Check for secure cookie settings
            if grep -qi "secure.*false\|httpOnly.*false" "$file" 2>/dev/null; then
                log_warning "Insecure cookie settings in $file"
            fi
            
            if grep -qi "sameSite.*none" "$file" 2>/dev/null; then
                log_warning "Potentially insecure sameSite cookie setting in $file"
            fi
        done <<< "$session_files"
    fi
}

# Rate limiting check
check_rate_limiting() {
    log_info "Checking rate limiting implementation..."
    
    # Check for throttling/rate limiting
    rate_files=$(find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs grep -l "throttle\|rateLimit\|rate-limit" 2>/dev/null || true)
    
    if [ -n "$rate_files" ]; then
        while IFS= read -r file; do
            log_success "Rate limiting implementation found in $file"
        done <<< "$rate_files"
    else
        log_warning "No rate limiting implementation found"
    fi
    
    # Check for specific endpoints that should have rate limiting
    api_files=$(find . -path "*/api/*" -name "*.ts" -o -path "*/controllers/*" -name "*.ts" 2>/dev/null || true)
    if [ -n "$api_files" ]; then
        auth_endpoints=$(echo "$api_files" | xargs grep -l "login\|signin\|auth" 2>/dev/null || true)
        if [ -n "$auth_endpoints" ]; then
            while IFS= read -r file; do
                if ! grep -qi "throttle\|rateLimit" "$file" 2>/dev/null; then
                    log_warning "Authentication endpoint without rate limiting: $file"
                fi
            done <<< "$auth_endpoints"
        fi
    fi
}

# Input validation check
check_input_validation() {
    log_info "Checking input validation..."
    
    # Check for validation libraries
    validation_libs=("joi" "yup" "zod" "class-validator")
    found_validation=false
    
    for lib in "${validation_libs[@]}"; do
        if grep -r "from.*$lib\|require.*$lib" . --include="*.ts" --include="*.js" --exclude-dir=node_modules 2>/dev/null | head -1; then
            log_success "Found $lib validation library"
            found_validation=true
        fi
    done
    
    if [ "$found_validation" = false ]; then
        log_warning "No validation library found"
    fi
    
    # Check for direct req.body usage without validation
    controller_files=$(find . -name "*.controller.ts" -o -name "*.ts" | grep -v node_modules | head -50)
    if [ -n "$controller_files" ]; then
        while IFS= read -r file; do
            if grep -n "req\.body\." "$file" 2>/dev/null && ! grep -qi "validate\|dto\|schema" "$file" 2>/dev/null; then
                log_warning "Direct req.body usage without validation in $file"
            fi
        done <<< "$controller_files"
    fi
}

# Dependency security check
check_dependencies() {
    log_info "Checking dependency security..."
    
    # Check for known vulnerable packages (basic check)
    vulnerable_packages=(
        "lodash@4.17.20"
        "axios@0.21.0"
        "jquery@3.4.1"
        "moment@2.29.1"
    )
    
    if [ -f "package.json" ]; then
        for pkg in "${vulnerable_packages[@]}"; do
            if grep -q "$pkg" package.json 2>/dev/null; then
                log_error "Known vulnerable package: $pkg"
            fi
        done
    fi
    
    # Check for outdated critical security packages
    security_packages=("helmet" "cors" "bcrypt" "jsonwebtoken")
    
    if [ -f "package.json" ]; then
        for pkg in "${security_packages[@]}"; do
            if grep -q "\"$pkg\"" package.json 2>/dev/null; then
                log_success "Security package found: $pkg"
            fi
        done
    fi
}

# Security configuration check
check_security_config() {
    log_info "Checking security configuration files..."
    
    # Check if security.config.json exists and validate it
    if [ -f "security.config.json" ]; then
        log_success "Security configuration file found"
        
        # Validate JSON
        if command -v jq >/dev/null 2>&1; then
            if jq empty security.config.json 2>/dev/null; then
                log_success "Security configuration JSON is valid"
                
                # Check for required security settings
                required_configs=("cors" "headers" "rateLimit" "validation" "auth")
                for config in "${required_configs[@]}"; do
                    if jq -e ".$config" security.config.json >/dev/null 2>&1; then
                        log_success "Security config section found: $config"
                    else
                        log_warning "Missing security config section: $config"
                    fi
                done
            else
                log_error "Invalid JSON in security.config.json"
            fi
        else
            log_info "jq not available, skipping JSON validation"
        fi
    else
        log_warning "No security.config.json found"
    fi
}

# Generate security report
generate_report() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}      Security Check Report     ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "Timestamp: $(date)"
    echo "Log file: $LOG_FILE"
    echo ""
    
    if [ $SECURITY_ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        log_success "No security issues found!"
    else
        echo -e "${RED}Security Issues: $SECURITY_ISSUES${NC}"
        echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
        echo -e "${BLUE}Info items: $INFO_ITEMS${NC}"
        echo ""
        
        if [ $SECURITY_ISSUES -gt 0 ]; then
            echo -e "${RED}CRITICAL: Please address the security issues above before deploying.${NC}"
        fi
        
        if [ $WARNINGS -gt 0 ]; then
            echo -e "${YELLOW}RECOMMENDED: Review and address the warnings above.${NC}"
        fi
    fi
    
    echo ""
    echo "Full log available in: $LOG_FILE"
    
    # Return non-zero if critical issues found
    [ $SECURITY_ISSUES -eq 0 ]
}

# Main execution
main() {
    print_header
    
    log_info "Starting TopSteel ERP security check..."
    log_info "Platform: $(uname -s 2>/dev/null || echo "Windows")"
    
    # Run all security checks
    check_file_permissions
    check_environment_variables
    check_security_headers
    check_sql_injection
    check_jwt_security
    check_authentication
    check_rate_limiting
    check_input_validation
    check_dependencies
    check_security_config
    
    # Generate final report
    generate_report
}

# Trap to cleanup on exit
cleanup() {
    if [ -f "$LOG_FILE" ]; then
        log_info "Security check completed. Log saved to $LOG_FILE"
    fi
}
trap cleanup EXIT

# Run main function
main "$@"