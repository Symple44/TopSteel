# Production Error Monitoring

## Overview

TopSteel ERP uses Sentry for comprehensive error monitoring and performance tracking in production. This document covers setup, configuration, and best practices.

## Sentry Integration

### Features

- **Error Tracking**: Automatic capture of exceptions and errors
- **Performance Monitoring**: Transaction tracing and performance metrics
- **Session Replay**: Visual replay of user sessions when errors occur
- **Release Tracking**: Associate errors with specific releases
- **User Context**: Track errors by user
- **Breadcrumbs**: Detailed trail of events leading to errors
- **Custom Context**: Add business-specific context to errors

### Backend (API) Setup

#### Installation

```bash
pnpm add @sentry/node @sentry/profiling-node @sentry/integrations
```

#### Configuration

The Sentry module is automatically initialized when the app starts if configured:

```typescript
// apps/api/src/app.module.ts
import { SentryModule } from './core/monitoring/sentry.module'

@Module({
  imports: [
    SentryModule.forRoot(),
    // other modules
  ],
})
export class AppModule {}
```

#### Environment Variables

```env
# Backend Sentry Configuration
SENTRY_DSN=https://your-key@sentry.io/project-id
SENTRY_ENABLED=true
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=1.0              # Percentage of errors to capture (1.0 = 100%)
SENTRY_TRACES_SAMPLE_RATE=0.1       # Percentage of transactions to trace
SENTRY_PROFILES_SAMPLE_RATE=0.1     # Percentage of transactions to profile
SENTRY_DEBUG=false
SENTRY_ATTACH_STACKTRACE=true
```

#### Usage in Services

```typescript
import { SentryService } from '@/core/monitoring/sentry.service'

@Injectable()
export class MyService {
  constructor(private readonly sentry: SentryService) {}

  async riskyOperation() {
    try {
      // Your code
    } catch (error) {
      // Capture with additional context
      this.sentry.captureException(error, {
        operation: 'riskyOperation',
        userId: user.id,
        data: relevantData
      })
      throw error
    }
  }

  trackUserAction(action: string, data: any) {
    // Add breadcrumb for debugging
    this.sentry.addBreadcrumb({
      message: `User action: ${action}`,
      category: 'user-action',
      level: 'info',
      data
    })
  }
}
```

### Frontend (Next.js) Setup

#### Installation

```bash
pnpm add @sentry/nextjs
```

#### Configuration Files

1. **sentry.client.config.ts** - Browser-side configuration
2. **sentry.server.config.ts** - Server-side configuration
3. **sentry.edge.config.ts** - Edge runtime configuration

#### Environment Variables

```env
# Frontend Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENABLED=true
NEXT_PUBLIC_ENV=production
```

#### Next.js Configuration

```javascript
// next.config.mjs
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  // your config
}

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  silent: true,
  org: 'your-org',
  project: 'your-project',
}, {
  // Upload options
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: true,
  disableLogger: true,
})
```

#### Usage in Components

```typescript
import { captureException, captureMessage, addBreadcrumb } from '@/lib/monitoring/sentry'

function MyComponent() {
  const handleError = (error: Error) => {
    captureException(error, {
      component: 'MyComponent',
      action: 'user-interaction'
    })
  }

  const trackImportantEvent = () => {
    addBreadcrumb({
      message: 'Important event occurred',
      category: 'ui',
      data: { timestamp: Date.now() }
    })
  }

  return <div>...</div>
}
```

## Error Filtering

### Backend Filtering

Errors are filtered based on:
- HTTP status codes (4xx errors are not sent in production)
- Health check endpoints are ignored
- Sensitive data is removed from requests

### Frontend Filtering

Common non-errors are filtered:
- Browser extension errors
- Network errors (expected failures)
- ResizeObserver benign errors
- Hydration errors from extensions

## Privacy & Security

### Data Sanitization

The following data is automatically removed:
- Authorization headers
- Cookies
- API keys
- Passwords
- Email addresses
- IP addresses
- Credit card information

### User Context

Only non-sensitive user data is sent:
- User ID
- Username
- Role (if applicable)

## Performance Monitoring

### Transaction Tracing

```typescript
// Backend
const transaction = this.sentry.startTransaction('process-order', 'task')
// ... perform operation
transaction.finish()

// Frontend
import { startTransaction } from '@/lib/monitoring/sentry'
const transaction = startTransaction('checkout', 'navigation')
// ... perform operation
transaction.finish()
```

### Slow Query Detection

Queries taking longer than 1 second are automatically logged as performance issues.

## Alerting

### Recommended Alerts

1. **Error Rate Spike**: > 100 errors in 5 minutes
2. **New Error Types**: First occurrence of an error
3. **Performance Degradation**: P95 response time > 2 seconds
4. **User Impact**: Error affecting > 10 unique users

### Alert Channels

Configure in Sentry dashboard:
- Email
- Slack
- PagerDuty
- Webhooks

## Best Practices

### 1. Add Context

```typescript
// Good
this.sentry.captureException(error, {
  userId: user.id,
  orderId: order.id,
  action: 'process-payment',
  amount: order.total
})

// Bad
this.sentry.captureException(error)
```

### 2. Use Breadcrumbs

```typescript
// Track user journey
this.sentry.addBreadcrumb({
  message: 'User viewed product',
  category: 'navigation',
  data: { productId, timestamp }
})
```

### 3. Set User Context

```typescript
// On login
this.sentry.setUser({
  id: user.id,
  username: user.username,
  subscription: user.plan
})

// On logout
this.sentry.clearUser()
```

### 4. Custom Fingerprinting

```typescript
// Group similar errors
this.sentry.setFingerprint([
  'database-connection',
  'timeout',
  error.code
])
```

## Testing

### Local Testing

```env
# Enable debug mode
SENTRY_DEBUG=true
SENTRY_ENVIRONMENT=development
```

### Test Error Capture

```typescript
// Backend test endpoint
@Get('test-sentry')
testSentry() {
  throw new Error('Test Sentry error capture')
}

// Frontend test
const testSentry = () => {
  throw new Error('Test Sentry error capture')
}
```

## Dashboard Setup

### Key Metrics to Monitor

1. **Error Rate**: Errors per minute/hour
2. **Affected Users**: Unique users experiencing errors
3. **Transaction Performance**: P50, P75, P95, P99
4. **Apdex Score**: Application performance index
5. **Crash Rate**: Sessions ending in crash

### Custom Dashboards

Create dashboards for:
- Business-critical flows (checkout, payment)
- API endpoints performance
- Database query performance
- Third-party service failures

## Cost Optimization

### Sampling Strategies

```javascript
// Dynamic sampling based on environment
tracesSampler: (samplingContext) => {
  // Always trace critical transactions
  if (samplingContext.transactionContext.name.includes('payment')) {
    return 1.0
  }
  // Lower rate for high-volume endpoints
  if (samplingContext.transactionContext.name.includes('health')) {
    return 0.01
  }
  // Default rate
  return 0.1
}
```

### Data Retention

- Errors: 90 days (recommended)
- Transactions: 30 days
- Replays: 30 days
- Attachments: 30 days

## Troubleshooting

### Common Issues

#### Sentry not capturing errors

1. Check DSN is correctly configured
2. Verify SENTRY_ENABLED=true
3. Check network connectivity
4. Review beforeSend filters

#### High volume of errors

1. Review error filtering rules
2. Adjust sample rates
3. Fix root causes of common errors
4. Implement client-side validation

#### Missing context

1. Ensure user context is set on login
2. Add breadcrumbs for user actions
3. Include relevant data in error capture

## Migration from Other Services

### From Bugsnag

```typescript
// Before (Bugsnag)
Bugsnag.notify(error, event => {
  event.addMetadata('user', { id: userId })
})

// After (Sentry)
this.sentry.captureException(error, {
  user: { id: userId }
})
```

### From Rollbar

```typescript
// Before (Rollbar)
Rollbar.error(error, { userId })

// After (Sentry)
this.sentry.captureException(error, { userId })
```

## Support

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Status Page](https://status.sentry.io/)
- [Community Forum](https://forum.sentry.io/)