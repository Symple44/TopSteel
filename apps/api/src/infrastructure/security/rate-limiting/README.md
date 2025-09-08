# Advanced Rate Limiting System

A comprehensive, Redis-backed rate limiting system with granular per-user controls, progressive penalties, and extensive monitoring capabilities.

## Features

- **Multi-layered Rate Limiting**: IP-based, user-based, role-based, and endpoint-specific limits
- **Sliding Window Algorithm**: More accurate than fixed windows, prevents burst attacks
- **Progressive Penalties**: Automatic escalating penalties for repeat offenders
- **Role-based Limits**: Different limits based on user roles and permissions
- **Comprehensive Monitoring**: Real-time metrics, alerts, and analytics
- **Redis-backed**: Scalable and distributed-friendly
- **Flexible Configuration**: Environment-based configuration with sensible defaults
- **Rich Headers**: Detailed rate limit information in response headers
- **Custom Exceptions**: Detailed error responses with actionable suggestions

## Quick Start

### 1. Basic Usage with Decorators

```typescript
import { Controller, Get, Post } from '@nestjs/common'
import { 
  ApiRateLimit, 
  StrictRateLimit, 
  AuthRateLimit 
} from './infrastructure/security/rate-limiting/decorators/rate-limit.decorators'

@Controller('api')
export class ApiController {
  
  // Standard API rate limiting
  @Get('users')
  @ApiRateLimit()
  async getUsers() {
    return await this.userService.findAll()
  }

  // Strict rate limiting for sensitive operations
  @Post('users')
  @StrictRateLimit()
  async createUser() {
    return await this.userService.create()
  }

  // Authentication-specific limits
  @Post('auth/login')
  @AuthRateLimit.Login()
  async login() {
    return await this.authService.login()
  }
}
```

### 2. Custom Rate Limits

```typescript
import { RateLimit } from './infrastructure/security/rate-limiting/decorators/rate-limit.decorators'

@Controller('upload')
export class UploadController {
  
  @Post('file')
  @RateLimit({
    windowSizeMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    ipMaxRequests: 5,
    progressivePenalties: true,
    customMessage: 'File upload rate limit exceeded. Please wait before uploading more files.'
  })
  async uploadFile() {
    // Upload logic
  }
}
```

### 3. Role-based Rate Limiting

```typescript
import { RoleBasedRateLimit } from './infrastructure/security/rate-limiting/decorators/rate-limit.decorators'
import { GlobalUserRole } from '../../domains/auth/core/constants/roles.constants'

@Controller('admin')
export class AdminController {
  
  @Get('users')
  @RoleBasedRateLimit({
    [GlobalUserRole.SUPER_ADMIN]: { windowSizeMs: 60000, maxRequests: 1000 },
    [GlobalUserRole.ADMIN]: { windowSizeMs: 60000, maxRequests: 500 },
    [GlobalUserRole.MANAGER]: { windowSizeMs: 60000, maxRequests: 100 }
  })
  async getUsers() {
    // Admin logic
  }
}
```

### 4. Using Guards Directly

```typescript
import { UseGuards } from '@nestjs/common'
import { 
  AdvancedRateLimitGuard, 
  UserRateLimitGuard, 
  CombinedRateLimitGuard 
} from './infrastructure/security/rate-limiting/guards'

@Controller('api')
@UseGuards(CombinedRateLimitGuard) // Apply to entire controller
export class ProtectedController {
  
  @Get('data')
  @UseGuards(UserRateLimitGuard) // Additional user-specific limits
  async getData() {
    return await this.dataService.getData()
  }
}
```

## Configuration

The rate limiting system is highly configurable through environment variables and the `rateLimitingConfig`:

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Rate Limiting Configuration
RATE_LIMIT_REDIS_PREFIX=topsteel:rate_limit
RATE_LIMIT_ALERT_THRESHOLD=50
TRUSTED_IPS=127.0.0.1,::1,192.168.1.0/24

# Security
NODE_ENV=production
```

### Default Rate Limits

| Endpoint Type | Window | Max Requests | IP Max | Notes |
|---------------|--------|--------------|--------|-------|
| Authentication | 15 min | 5 | 10 | Very strict |
| File Upload | 5 min | 10 | 5 | Strict |
| API Endpoints | 1 min | 200 | 100 | Moderate |
| Admin | 1 min | 500 | 200 | Higher limits |
| Health Checks | 1 min | 1000 | 1000 | Very permissive |

### Role-based Multipliers

| Role | Multiplier | Description |
|------|------------|-------------|
| SUPER_ADMIN | 20x | Virtually unlimited |
| ADMIN | 10x | Very high limits |
| MANAGER | 5x | High limits |
| COMMERCIAL | 3x | Elevated limits |
| USER | 1x | Standard limits |
| VIEWER | 0.5x | Reduced limits |

## Progressive Penalties

The system automatically escalates penalties for repeat offenders:

1. **Level 1** (5 violations): 5-minute ban
2. **Level 2** (10 violations): 15-minute ban
3. **Level 3** (20 violations): 1-hour ban
4. **Level 4** (35 violations): 4-hour ban
5. **Level 5** (50 violations): 12-hour ban
6. **Level 6** (75 violations): 24-hour ban
7. **Level 7** (100 violations): 3-day ban
8. **Level 8** (150 violations): 1-week ban
9. **Level 9** (200 violations): 30-day ban

## Monitoring and Administration

### Metrics Dashboard

Access comprehensive metrics through the admin API:

```bash
GET /admin/rate-limiting/metrics?hours=24
GET /admin/rate-limiting/alerts
GET /admin/rate-limiting/top-violators
GET /admin/rate-limiting/system-health
```

### Manual Administration

```bash
# Clear rate limits for a user
POST /admin/rate-limiting/clear-limits
{
  "identifier": "user:123",
  "reason": "Admin intervention"
}

# Impose manual ban
POST /admin/rate-limiting/impose-ban
{
  "identifier": "ip:192.168.1.100",
  "durationMs": 3600000,
  "reason": "Suspicious activity"
}

# Remove ban
DELETE /admin/rate-limiting/ban/user:123?reason=Appeal approved
```

## Rate Limit Headers

The system provides detailed information in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1640000000
X-RateLimit-Window: 60
X-RateLimit-Policy: advanced-sliding-window
Retry-After: 30
```

For combined limits:

```http
X-RateLimit-Limiting-Factor: user
X-IP-RateLimit-Remaining: 45
X-User-RateLimit-Remaining: 85
X-User-Role: ADMIN
```

## Error Responses

Rate limit exceeded responses include detailed information:

```json
{
  "message": "User rate limit exceeded for role ADMIN. Please try again later.",
  "statusCode": 429,
  "retryAfter": 30,
  "resetTime": 1640000000000,
  "remainingRequests": 0,
  "limitType": "user",
  "userRole": "ADMIN",
  "suggestions": [
    "Your current role has specific limitations for this operation",
    "Contact an administrator if you need higher limits",
    "Wait for the rate limit window to reset"
  ]
}
```

## Advanced Usage

### Custom Key Generators

```typescript
@Controller('api')
export class ApiController {
  
  @Post('search')
  @RateLimit({
    windowSizeMs: 60000,
    maxRequests: 20,
    keyGenerator: 'searchKeyGenerator' // Custom key based on search complexity
  })
  async search(@Body() query: SearchQuery) {
    // Search logic
  }
}
```

### Burst Rate Limiting

```typescript
@Post('process')
@BurstRateLimit(
  { windowSizeMs: 1000, maxRequests: 5 },    // Short term: 5 requests per second
  { windowSizeMs: 60000, maxRequests: 100 }  // Long term: 100 requests per minute
)
async processData() {
  // Processing logic
}
```

### Complexity-based Limits

```typescript
@Get('light-operation')
@ComplexityBasedRateLimit('low')
async lightOperation() {
  // Simple operation
}

@Post('heavy-operation')
@ComplexityBasedRateLimit('critical', {
  customMessage: 'This operation requires significant resources.'
})
async heavyOperation() {
  // Resource-intensive operation
}
```

## Security Considerations

1. **Redis Security**: Ensure Redis is properly secured with authentication and network restrictions
2. **IP Spoofing**: The system handles common proxy headers but validate your proxy configuration
3. **Bypass Mechanisms**: Trusted IPs and role bypasses should be carefully managed
4. **Monitoring**: Enable monitoring in production to detect and respond to attacks
5. **Rate Limit Tuning**: Adjust limits based on your application's usage patterns

## Performance

- **Redis Pipeline**: Uses Redis pipelining for better performance
- **Lua Scripts**: Atomic operations prevent race conditions
- **Efficient Storage**: Sliding window implementation optimizes memory usage
- **Background Cleanup**: Automatic cleanup of expired data
- **Fail-Open**: System fails open if Redis is unavailable

## Development and Testing

### Running Tests

```bash
npm run test infrastructure/security/rate-limiting
```

### Load Testing

```bash
# Test rate limiting under load
npm run test:load-rate-limiting
```

### Development Mode

In development mode:
- Rate limits are 10x more permissive
- Progressive penalties are disabled by default
- Detailed logging is enabled

## Troubleshooting

### Common Issues

1. **Redis Connection**: Check Redis connectivity and credentials
2. **High CPU Usage**: Monitor Lua script execution times
3. **Memory Usage**: Review Redis memory usage and cleanup settings
4. **False Positives**: Adjust trusted IPs and role configurations

### Debugging

Enable debug logging:

```bash
DEBUG=rate-limiting:* npm start
```

## Migration from Simple Throttling

1. **Phase 1**: Deploy alongside existing throttling
2. **Phase 2**: Gradually enable on non-critical endpoints  
3. **Phase 3**: Replace existing throttling completely
4. **Phase 4**: Enable progressive penalties and monitoring

## Contributing

1. Add tests for new features
2. Update documentation
3. Follow existing code patterns
4. Consider backward compatibility