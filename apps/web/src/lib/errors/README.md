# Comprehensive Error Handling System

## Overview

A production-ready error handling and logging system for the TopSteel ERP frontend application. This system provides:

- **Centralized error handling** with classification and user-friendly messages
- **Structured logging** with multiple levels and context
- **Error boundaries** for React component errors
- **i18n support** for error messages in French, English, and Spanish
- **Error recovery** with retry logic and graceful degradation
- **Performance tracking** and monitoring

## Architecture

```
lib/errors/
├── error-types.ts          # Custom error classes
├── error-handler.ts        # Centralized error handler
├── logger.ts               # Structured logging service
├── index.ts                # Central exports
├── api-client-integration-example.ts  # API integration example
└── README.md               # This file

components/
├── error-boundary.tsx      # Component-level error boundary
└── global-error-boundary.tsx  # Root-level error boundary

hooks/
└── use-error-handler.ts    # Error handling hook

lib/i18n/translations/
├── errors-fr.ts            # French error messages
├── errors-en.ts            # English error messages
└── errors-es.ts            # Spanish error messages
```

## Features

### 1. Custom Error Types

Nine specialized error classes for different scenarios:

- **NetworkError** - Connection failures, timeouts
- **ValidationError** - Form/data validation errors
- **AuthError** - Authentication failures
- **AuthorizationError** - Permission denied
- **NotFoundError** - 404 resource not found
- **ConflictError** - Duplicate resources, race conditions
- **RateLimitError** - Too many requests
- **ServerError** - Server errors (500, 503, etc.)
- **UnexpectedError** - Catch-all for unknown errors

### 2. Structured Logging

```typescript
import { logger } from './lib/errors/logger'

// Log levels: debug, info, warn, error
logger.debug('Debug message', { userId: '123' })
logger.info('User action', { action: 'click', component: 'Button' })
logger.warn('Deprecated API', { endpoint: '/old-api' })
logger.error('Failed to save', error, { orderId: '456' })

// Performance tracking
logger.startPerformance('api-call')
await fetchData()
logger.endPerformance('api-call', { endpoint: '/data' })
```

### 3. Error Handler

```typescript
import { errorHandler } from './lib/errors/error-handler'

try {
  await api.fetchData()
} catch (error) {
  const userMessage = errorHandler.handle(error, {
    logError: true,
    reportToBackend: true,
  })

  // userMessage contains:
  // - title: "Connection Error"
  // - message: "Unable to connect to server..."
  // - action: "Check Connection"
  // - code: "NETWORK_ERROR"
  // - recoverable: true
  // - retryable: true
}
```

### 4. React Error Boundaries

**Global Error Boundary** (Root level):
```typescript
import { GlobalErrorBoundary } from './components/global-error-boundary'

function App() {
  return (
    <GlobalErrorBoundary>
      <YourApp />
    </GlobalErrorBoundary>
  )
}
```

**Component Error Boundary**:
```typescript
import { ErrorBoundary } from './components/error-boundary'

function Feature() {
  return (
    <ErrorBoundary fallback={<CustomErrorUI />}>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### 5. Error Handling Hook

```typescript
import { useErrorHandler } from './hooks/use-error-handler'

function MyComponent() {
  const { showError, clearError, handleApiError, retryWithErrorHandling } = useErrorHandler()

  const handleSubmit = async () => {
    try {
      await api.submitForm(data)
    } catch (error) {
      showError(error, { showToast: true })
    }
  }

  const fetchWithRetry = async () => {
    const result = await retryWithErrorHandling(
      () => api.getData(),
      {
        maxRetries: 3,
        exponentialBackoff: true,
        onRetry: (attempt) => console.log(`Retry ${attempt}`)
      }
    )
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

## Quick Start

### 1. Basic Usage

```typescript
import { useErrorHandler } from './hooks/use-error-handler'

function Component() {
  const { showError } = useErrorHandler()

  const handleAction = async () => {
    try {
      await api.doSomething()
    } catch (error) {
      showError(error) // Shows toast notification automatically
    }
  }

  return <button onClick={handleAction}>Do Something</button>
}
```

### 2. With Custom Messages

```typescript
const { showError } = useErrorHandler()

try {
  await api.deleteUser(userId)
} catch (error) {
  showError(error, {
    customMessage: 'Unable to delete user. Please try again later.',
    showToast: true,
    reportToBackend: true,
  })
}
```

### 3. With Retry Logic

```typescript
import { useApiErrorHandler } from './hooks/use-error-handler'

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

## Integration Guide

### Step 1: Import Error Translations

In `lib/i18n/translations/fr.ts`:
```typescript
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

### Step 2: Add Global Error Boundary

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

See `api-client-integration-example.ts` for complete examples.

Basic pattern:
```typescript
import { errorHandler, logger } from './errors'

async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  logger.startPerformance(`api:${endpoint}`)

  try {
    const result = await fetch(endpoint, config)
    logger.endPerformance(`api:${endpoint}`, { success: true })
    return result
  } catch (error) {
    logger.endPerformance(`api:${endpoint}`, { success: false })

    errorHandler.handle(error, {
      logError: true,
      reportToBackend: true,
    })

    throw error
  }
}
```

## Best Practices

### 1. Error Messages
- Always use i18n keys for user-facing messages
- Keep messages clear, concise, and actionable
- Provide recovery suggestions when possible
- Use consistent message structure: title, message, action

### 2. Logging
- Use appropriate log levels (debug for dev, info for normal ops, warn for recoverable issues, error for failures)
- Always include context (userId, sessionId, componentName)
- Never log sensitive data (passwords, tokens, API keys)
- Use performance tracking for critical operations

### 3. Error Boundaries
- Place at strategic points (page level, feature level, critical components)
- Provide meaningful fallback UI
- Use GlobalErrorBoundary only at root level
- Test error boundaries with ErrorTrigger component (dev only)

### 4. Error Recovery
- Determine if errors are retryable using `errorHandler.isRetryable(error)`
- Use exponential backoff for retries (1s, 2s, 4s, 8s...)
- Limit retry attempts (typically 3-5)
- Show retry progress to users

### 5. Production Considerations
- Errors automatically reported to backend in production
- Stack traces only shown in development mode
- Sensitive data automatically sanitized in logs
- Performance logs can be disabled if needed

## Error Message Structure

All error messages follow this structure:

```typescript
{
  title: string         // Short, clear title
  message: string       // Detailed explanation
  action?: string       // What the user should do
  code: string          // Error code (e.g., "NETWORK_ERROR")
  recoverable: boolean  // Can the user recover?
  retryable: boolean    // Should we retry automatically?
}
```

Examples:

**Network Error:**
```typescript
{
  title: "Connection Error",
  message: "Unable to connect to server. Please check your internet connection.",
  action: "Check Connection",
  code: "NETWORK_ERROR",
  recoverable: true,
  retryable: true
}
```

**Validation Error:**
```typescript
{
  title: "Invalid Data",
  message: "Please correct the highlighted fields and try again.",
  action: "Correct Fields",
  code: "VALIDATION_ERROR",
  recoverable: true,
  retryable: false
}
```

## API Reference

### ErrorHandler

```typescript
class ErrorHandler {
  handle(error: unknown, options?: ErrorHandlingOptions): UserErrorMessage
  isRetryable(error: unknown): boolean
  getRecoverySuggestion(error: unknown): string | null
}
```

### Logger

```typescript
class Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error, context?: LogContext): void
  startPerformance(label: string): void
  endPerformance(label: string, context?: LogContext): number | null
  getHistory(level?: LogLevel): LogEntry[]
  clearHistory(): void
  exportLogs(): string
}
```

### useErrorHandler Hook

```typescript
interface UseErrorHandlerReturn {
  errorState: ErrorState
  showError: (error: unknown, options?: ErrorHandlerOptions) => void
  clearError: () => void
  handleApiError: (error: unknown) => void
  retryWithErrorHandling: <T>(fn: () => Promise<T>, options?: RetryOptions) => Promise<T | undefined>
}
```

## Testing

### Test Error Boundary

```typescript
import { ErrorTrigger } from '../components/error-boundary'

// Development only
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

### Test Different Error Types

```typescript
import { NetworkError, ValidationError } from './lib/errors/error-types'

// Test network error
throw new NetworkError('Connection timeout', { url: '/api/data' })

// Test validation error
throw new ValidationError('Invalid input', {
  email: ['Must be a valid email'],
  password: ['Must be at least 8 characters']
})
```

### Access Error History

```typescript
import { logger } from './lib/errors/logger'

// Get error logs
const errors = logger.getHistory('error')

// Get all logs
const allLogs = logger.getHistory()

// Export logs as JSON
const jsonLogs = logger.exportLogs()
console.log(jsonLogs)
```

## Performance

- **Minimal overhead**: ~0.1ms per logged operation
- **Memory efficient**: Last 100 logs kept in memory
- **Non-blocking**: Error reporting happens asynchronously
- **Optimized**: Production builds remove debug logs automatically

## Security

- **PII Protection**: Automatically redacts sensitive fields (password, token, secret, apiKey)
- **Stack Traces**: Only exposed in development mode
- **Error Context**: Sanitized before sending to backend
- **CORS-Safe**: Error reporting respects CORS policies

## Browser Compatibility

- Chrome: ✓ Latest
- Firefox: ✓ Latest
- Safari: ✓ Latest
- Edge: ✓ Latest
- IE11: ✗ Not supported

## License

Internal use only - TopSteel ERP

## Support

For issues or questions:
1. Check INTEGRATION-NOTES.md
2. Review examples in api-client-integration-example.ts
3. Contact the development team

---

**Version:** 1.0.0
**Last Updated:** 2025-11-21
**Author:** TopSteel Development Team
