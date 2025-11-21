# Error Handling System - Integration Notes

## Overview
A comprehensive error handling and logging system has been implemented for the frontend application.

## Files Created

### Phase 1: Error Utilities
1. **`lib/errors/error-types.ts`** (~280 lines)
   - Custom error classes: `NetworkError`, `ValidationError`, `AuthError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `ServerError`, `UnexpectedError`
   - Type guards and error classification utilities
   - Structured error context with timestamps and metadata

2. **`lib/errors/logger.ts`** (~240 lines)
   - Structured logging service with levels: `debug`, `info`, `warn`, `error`
   - Performance tracking with `startPerformance()` and `endPerformance()`
   - Context attachment (userId, sessionId, componentName, etc.)
   - Console output in development, API logging in production
   - Automatic sensitive data sanitization

3. **`lib/errors/error-handler.ts`** (~320 lines)
   - Centralized error handling with classification
   - User-friendly message generation with i18n support
   - Error recovery suggestions
   - Retry logic determination
   - Backend error reporting

4. **`lib/errors/index.ts`** - Central export file

### Phase 2: Error Boundaries
5. **`components/global-error-boundary.tsx`** (~180 lines)
   - Global error boundary for root-level errors
   - Full-page error UI with reload/home options
   - Technical details in development mode
   - Error reporting integration
   - HOC: `withGlobalErrorBoundary(Component)`

6. **`components/error-boundary.tsx`** (existing file - already comprehensive)
   - Component-level error boundary
   - Automatic retry for retryable errors
   - Custom fallback UI support
   - Detailed error logging

### Phase 3: i18n Error Messages
7. **`lib/i18n/translations/errors-fr.ts`** - French error messages
8. **`lib/i18n/translations/errors-en.ts`** - English error messages
9. **`lib/i18n/translations/errors-es.ts`** - Spanish error messages

Error message categories:
- `errors.network.*` - Network/connection errors
- `errors.validation.*` - Form/data validation errors
- `errors.auth.*` - Authentication errors
- `errors.authorization.*` - Permission/authorization errors
- `errors.notFound.*` - 404 resource not found errors
- `errors.conflict.*` - Conflict/duplicate errors
- `errors.rateLimit.*` - Rate limiting errors
- `errors.server.*` - Server errors (500, 503, etc.)
- `errors.unexpected.*` - Unexpected/catch-all errors
- `errors.boundary.*` - Error boundary UI messages

### Phase 4: React Hooks
10. **`hooks/use-error-handler.ts`** (~150 lines)
    - `useErrorHandler()` - Main error handling hook
    - `useApiErrorHandler()` - API-specific error handling
    - Toast notifications with Sonner
    - Retry logic with exponential backoff
    - Error state management

## Integration Steps

### Step 1: Merge Translation Files
Add the error translations to the main translation files:

```typescript
// In lib/i18n/translations/fr.ts
import { errorsFr } from './errors-fr'

export const fr = {
  // ... existing translations
  errors: {
    ...errors, // existing errors
    ...errorsFr, // new comprehensive errors
  },
}
```

Repeat for `en.ts` and `es.ts`.

### Step 2: Wrap App with GlobalErrorBoundary
In `app/layout.tsx`:

```typescript
import { GlobalErrorBoundary } from '../components/global-error-boundary'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <GlobalErrorBoundary>
          <Providers>{children}</Providers>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
```

### Step 3: Enhance API Client (Optional)
In `lib/api-client-enhanced.ts`, integrate centralized error handling:

```typescript
import { errorHandler } from './errors/error-handler'
import { logger } from './errors/logger'

class APIClientEnhanced extends APIClient {
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    try {
      const result = await super.request<T>(endpoint, config)
      return result
    } catch (error) {
      // Log error
      logger.error('API request failed', error instanceof Error ? error : undefined, {
        endpoint,
        method: config.method,
      })

      // Handle error
      const userMessage = errorHandler.handle(error, {
        logError: false, // already logged above
        reportToBackend: true,
      })

      // Re-throw or handle based on your needs
      throw error
    }
  }
}
```

## Usage Examples

### Basic Error Handling
```typescript
import { useErrorHandler } from '../hooks/use-error-handler'

function MyComponent() {
  const { showError, clearError } = useErrorHandler()

  const handleSubmit = async () => {
    try {
      await api.submitForm(data)
    } catch (error) {
      showError(error)
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### API Error Handling with Retry
```typescript
import { useApiErrorHandler } from '../hooks/use-error-handler'

function DataFetcher() {
  const { handleWithRetry } = useApiErrorHandler()

  const fetchData = async () => {
    const result = await handleWithRetry(
      () => api.getData(),
      3 // max retries
    )

    if (result) {
      // Handle successful result
    }
  }

  return <button onClick={fetchData}>Fetch Data</button>
}
```

### Component-Level Error Boundary
```typescript
import { ErrorBoundary } from '../components/error-boundary'

function App() {
  return (
    <ErrorBoundary fallback={<CustomErrorUI />}>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### Direct Logging
```typescript
import { logger } from '../lib/errors/logger'

// Performance tracking
logger.startPerformance('api-call')
await api.fetchData()
logger.endPerformance('api-call', { endpoint: '/data' })

// Regular logging
logger.info('User logged in', { userId: '123' })
logger.warn('Deprecated API used', { endpoint: '/old-api' })
logger.error('Failed to process', error, { orderId: '456' })
```

### Custom Error Types
```typescript
import { NetworkError, ValidationError } from '../lib/errors/error-types'

// Throw custom errors
throw new NetworkError('Connection timeout', {
  url: '/api/data',
  method: 'GET',
})

throw new ValidationError('Invalid email', {
  email: ['Must be a valid email address'],
})
```

## Best Practices

### 1. Error Messages
- Always use i18n keys for user-facing messages
- Keep messages clear, concise, and actionable
- Provide recovery suggestions when possible

### 2. Logging
- Use appropriate log levels (`debug`, `info`, `warn`, `error`)
- Always include context (userId, componentName, etc.)
- Never log sensitive data (passwords, tokens)

### 3. Error Boundaries
- Place error boundaries at strategic points (page level, feature level)
- Provide meaningful fallback UI
- Use global boundary for root-level errors only

### 4. Error Recovery
- Determine if errors are retryable
- Use exponential backoff for retries
- Limit number of retry attempts
- Show retry progress to users

### 5. Production Considerations
- Errors are automatically reported to backend in production
- Detailed stack traces only shown in development
- Performance logs can be disabled in production if needed

## Testing

### Test Error Boundary
```typescript
// Development only
import { ErrorTrigger } from '../components/error-boundary'

function TestPage() {
  return (
    <ErrorBoundary>
      <ErrorTrigger>
        <MyComponent />
      </ErrorTrigger>
    </ErrorBoundary>
  )
}
```

### Test Error Handler
```typescript
import { errorHandler } from '../lib/errors/error-handler'

// Test different error types
const errors = [
  new Error('Network timeout'),
  { status: 404, message: 'Not found' },
  { status: 401, message: 'Unauthorized' },
]

errors.forEach(error => {
  const userMessage = errorHandler.handle(error)
  console.log(userMessage)
})
```

## Monitoring & Analytics

The error handling system automatically:
1. Logs all errors with full context
2. Reports operational errors to backend (production only)
3. Tracks error metrics (timestamps, user agent, URL)
4. Maintains error history (last 100 errors)
5. Integrates with Google Analytics (if configured)

Access error history:
```typescript
import { logger } from '../lib/errors/logger'

const errorHistory = logger.getHistory('error')
const allLogs = logger.getHistory()
const exportedLogs = logger.exportLogs() // JSON string
```

## Next Steps

1. **Integrate in layout.tsx** - Wrap app with GlobalErrorBoundary
2. **Merge translation files** - Add error messages to main i18n files
3. **Enhance API client** - Integrate centralized error handling
4. **Add error boundaries** - Wrap critical components
5. **Test thoroughly** - Verify error boundaries don't break app
6. **Monitor logs** - Check console and backend logs

## Files Summary

**Created (10 new files):**
- `lib/errors/error-types.ts`
- `lib/errors/logger.ts`
- `lib/errors/error-handler.ts`
- `lib/errors/index.ts`
- `components/global-error-boundary.tsx`
- `hooks/use-error-handler.ts`
- `lib/i18n/translations/errors-fr.ts`
- `lib/i18n/translations/errors-en.ts`
- `lib/i18n/translations/errors-es.ts`
- `INTEGRATION-NOTES.md` (this file)

**To be updated:**
- `app/layout.tsx` - Add GlobalErrorBoundary wrapper
- `lib/i18n/translations/fr.ts` - Merge error translations
- `lib/i18n/translations/en.ts` - Merge error translations
- `lib/i18n/translations/es.ts` - Merge error translations
- `lib/api-client-enhanced.ts` (optional) - Integrate error handling

**Total Lines of Code:** ~1,500 lines of production-ready error handling infrastructure
