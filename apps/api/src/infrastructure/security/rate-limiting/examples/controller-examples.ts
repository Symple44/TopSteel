/**
 * Controller Examples for Advanced Rate Limiting
 * Demonstrates how to integrate the rate limiting system with existing controllers
 */

import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GlobalUserRole } from '../../../../domains/auth/core/constants/roles.constants'

// Type definitions for proper typing
interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  company?: string
}

interface ForgotPasswordRequest {
  email: string
}

interface CreateUserData {
  email: string
  firstName: string
  lastName: string
  role: string
  isActive?: boolean
}

interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  isActive?: boolean
}

interface SystemConfig {
  maintenanceMode?: boolean
  maxFileUploadSize?: number
  allowedFileTypes?: string[]
  [key: string]: unknown
}

interface FileData {
  filename: string
  mimetype: string
  size: number
  buffer: Buffer
}

interface SearchQuery {
  query: string
  filters?: Record<string, unknown>
  page?: number
  limit?: number
}

interface ComplexSearchQuery extends SearchQuery {
  aggregations?: Record<string, unknown>
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>
  highlight?: string[]
}

interface QueryData {
  sql?: string
  parameters?: Record<string, unknown>
  table?: string
  columns?: string[]
  conditions?: Array<{
    field: string
    operator: string
    value: unknown
  }>
}

interface OrderData {
  productId: string
  quantity: number
  customOptions?: Record<string, unknown>
}

interface PaymentData {
  amount: number
  currency: string
  paymentMethodId: string
  metadata?: Record<string, unknown>
}

interface StripeWebhookPayload {
  id: string
  object: string
  type: string
  data: {
    object: Record<string, unknown>
  }
}

interface MarketplaceWebhookPayload {
  event: string
  timestamp: number
  data: Record<string, unknown>
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Rate limiting decorators
import {
  AdminRateLimit,
  ApiRateLimit,
  AuthRateLimit,
  BurstRateLimit,
  BypassRateLimit,
  ComplexityBasedRateLimit,
  CrudRateLimit,
  DangerousOperationRateLimit,
  MarketplaceRateLimit,
  MultiLayerRateLimit,
  RoleBasedRateLimit,
  SearchRateLimit,
  UploadRateLimit,
} from '../decorators/rate-limit.decorators'
// Rate limiting guards
import { AdvancedRateLimitGuard, CombinedRateLimitGuard, RoleBasedRateLimitGuard } from '../guards'

// ===== AUTHENTICATION CONTROLLER =====

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(AdvancedRateLimitGuard) // Apply advanced rate limiting to entire controller
export class AuthControllerExample {
  @Post('login')
  @AuthRateLimit.Login()
  @ApiOperation({ summary: 'User login with strict rate limiting' })
  async login(@Body() _credentials: LoginCredentials): Promise<ApiResponse<{ token: string }>> {
    // Login logic with 5 attempts per 15 minutes
    return { success: true, data: { token: 'jwt-token' } }
  }

  @Post('register')
  @AuthRateLimit.Register()
  @ApiOperation({ summary: 'User registration with strict limits' })
  async register(@Body() _userData: RegisterData): Promise<ApiResponse<{ success: boolean }>> {
    // Registration logic with 3 attempts per hour
    return { success: true, data: { success: true } }
  }

  @Post('forgot-password')
  @AuthRateLimit.ForgotPassword()
  @ApiOperation({ summary: 'Password reset request' })
  async forgotPassword(
    @Body() _email: ForgotPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    // Forgot password logic with 3 attempts per hour
    return { success: true, data: { message: 'Reset email sent' } }
  }

  @Post('logout')
  @AuthRateLimit.Logout()
  @ApiOperation({ summary: 'User logout' })
  async logout(): Promise<ApiResponse<{ success: boolean }>> {
    // Logout logic with moderate limits
    return { success: true, data: { success: true } }
  }
}

// ===== API CONTROLLER WITH CRUD OPERATIONS =====

@ApiTags('Users')
@Controller('api/users')
@UseGuards(CombinedRateLimitGuard) // Apply both IP and user limits
export class UsersControllerExample {
  @Get()
  @CrudRateLimit.Read()
  @ApiOperation({ summary: 'Get all users with read-only limits' })
  async getUsers(): Promise<ApiResponse<unknown[]>> {
    // High limits for read operations (200 per minute)
    return { success: true, data: [] }
  }

  @Get(':id')
  @CrudRateLimit.Read()
  @ApiOperation({ summary: 'Get specific user' })
  async getUser(@Param('id') id: string): Promise<ApiResponse<{ id: string; name: string }>> {
    return { success: true, data: { id, name: 'User' } }
  }

  @Post()
  @CrudRateLimit.Create()
  @ApiOperation({ summary: 'Create user with creation limits' })
  async createUser(
    @Body() userData: CreateUserData
  ): Promise<ApiResponse<{ id: string } & CreateUserData>> {
    // Moderate limits for create operations (50 per minute)
    return { success: true, data: { id: 'new-id', ...userData } }
  }

  @Put(':id')
  @CrudRateLimit.Update()
  @ApiOperation({ summary: 'Update user with update limits' })
  async updateUser(
    @Param('id') id: string,
    @Body() userData: UpdateUserData
  ): Promise<ApiResponse<{ id: string } & UpdateUserData>> {
    // Stricter limits for updates (30 per minute)
    return { success: true, data: { id, ...userData } }
  }

  @Delete(':id')
  @CrudRateLimit.Delete()
  @ApiOperation({ summary: 'Delete user with strict delete limits' })
  async deleteUser(@Param('id') _id: string): Promise<ApiResponse<{ success: boolean }>> {
    // Very strict limits for deletions (10 per minute)
    return { success: true, data: { success: true } }
  }
}

// ===== ADMIN CONTROLLER WITH ROLE-BASED LIMITS =====

@ApiTags('Administration')
@Controller('admin')
@UseGuards(RoleBasedRateLimitGuard) // Apply role-based limiting
export class AdminControllerExample {
  @Get('dashboard')
  @AdminRateLimit()
  @ApiOperation({ summary: 'Admin dashboard with role-based limits' })
  async getDashboard(): Promise<ApiResponse<{ stats: Record<string, unknown> }>> {
    // Higher limits for admin users
    return { success: true, data: { stats: {} } }
  }

  @Post('system-config')
  @RoleBasedRateLimit({
    [GlobalUserRole.SUPER_ADMIN]: { windowSizeMs: 60000, maxRequests: 100 },
    [GlobalUserRole.ADMIN]: { windowSizeMs: 60000, maxRequests: 20 },
  })
  @ApiOperation({ summary: 'System configuration with role-specific limits' })
  async updateSystemConfig(
    @Body() _config: SystemConfig
  ): Promise<ApiResponse<{ success: boolean }>> {
    // Different limits based on admin role
    return { success: true, data: { success: true } }
  }

  @Delete('user/:id')
  @DangerousOperationRateLimit()
  @ApiOperation({ summary: 'Delete user - dangerous operation' })
  async deleteUser(@Param('id') _id: string): Promise<ApiResponse<{ success: boolean }>> {
    // Very strict limits for dangerous operations (3 per 5 minutes)
    return { success: true, data: { success: true } }
  }

  @Post('bulk-import')
  @ComplexityBasedRateLimit('critical', {
    customMessage: 'Bulk import operations are strictly limited due to resource usage.',
  })
  @ApiOperation({ summary: 'Bulk import with complexity-based limits' })
  async bulkImport(
    @Body() data: Record<string, unknown>[]
  ): Promise<ApiResponse<{ imported: number }>> {
    // Critical complexity = 5 requests per 5 minutes
    return { success: true, data: { imported: data.length } }
  }
}

// ===== MARKETPLACE CONTROLLER =====

@ApiTags('Marketplace')
@Controller('marketplace')
@UseGuards(AdvancedRateLimitGuard)
export class MarketplaceControllerExample {
  @Get('products')
  @MarketplaceRateLimit('browse')
  @ApiOperation({ summary: 'Browse marketplace products' })
  async getProducts(): Promise<ApiResponse<unknown[]>> {
    // Moderate limits for browsing (100 per minute)
    return { success: true, data: [] }
  }

  @Post('orders')
  @MarketplaceRateLimit('order')
  @ApiOperation({ summary: 'Create marketplace order' })
  async createOrder(@Body() _orderData: OrderData): Promise<ApiResponse<{ orderId: string }>> {
    // Stricter limits for orders (10 per 5 minutes)
    return { success: true, data: { orderId: 'order-123' } }
  }

  @Post('payment')
  @MarketplaceRateLimit('payment')
  @ApiOperation({ summary: 'Process payment' })
  async processPayment(
    @Body() _paymentData: PaymentData
  ): Promise<ApiResponse<{ success: boolean; transactionId: string }>> {
    // Very strict limits for payments (3 per 10 minutes)
    return { success: true, data: { success: true, transactionId: 'tx-123' } }
  }
}

// ===== SEARCH CONTROLLER =====

@ApiTags('Search')
@Controller('search')
export class SearchControllerExample {
  @Post('simple')
  @SearchRateLimit()
  @ApiOperation({ summary: 'Simple search with standard limits' })
  async simpleSearch(@Body() _query: SearchQuery): Promise<ApiResponse<{ results: unknown[] }>> {
    // Standard search limits (50 per minute)
    return { success: true, data: { results: [] } }
  }

  @Post('complex')
  @ComplexityBasedRateLimit('high', {
    customMessage: 'Complex searches are limited to prevent resource exhaustion.',
  })
  @ApiOperation({ summary: 'Complex search with strict limits' })
  async complexSearch(
    @Body() _complexQuery: ComplexSearchQuery
  ): Promise<ApiResponse<{ results: unknown[]; took: string }>> {
    // High complexity = 30 requests per minute
    return { success: true, data: { results: [], took: '500ms' } }
  }

  @Post('ai-powered')
  @MultiLayerRateLimit(SearchRateLimit(), ComplexityBasedRateLimit('critical'))
  @ApiOperation({ summary: 'AI-powered search with multiple rate limits' })
  async aiSearch(
    @Body() _query: SearchQuery
  ): Promise<ApiResponse<{ results: unknown[]; confidence: number }>> {
    // Multiple layers of protection
    return { success: true, data: { results: [], confidence: 0.95 } }
  }
}

// ===== FILE UPLOAD CONTROLLER =====

@ApiTags('Files')
@Controller('files')
export class FilesControllerExample {
  @Post('upload')
  @UploadRateLimit()
  @ApiOperation({ summary: 'File upload with strict limits' })
  async uploadFile(@Body() _fileData: FileData): Promise<ApiResponse<{ fileId: string }>> {
    // Strict upload limits (10 per 5 minutes)
    return { success: true, data: { fileId: 'file-123' } }
  }

  @Post('bulk-upload')
  @BurstRateLimit(
    { windowSizeMs: 10000, maxRequests: 3 }, // 3 per 10 seconds
    { windowSizeMs: 3600000, maxRequests: 20 } // 20 per hour
  )
  @ApiOperation({ summary: 'Bulk upload with burst protection' })
  async bulkUpload(@Body() files: FileData[]): Promise<ApiResponse<{ uploaded: number }>> {
    // Burst protection for bulk operations
    return { success: true, data: { uploaded: files.length } }
  }

  @Get(':id/download')
  @ApiRateLimit({ maxRequests: 100 })
  @ApiOperation({ summary: 'File download' })
  async downloadFile(@Param('id') id: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    // Moderate limits for downloads
    return { success: true, data: { downloadUrl: `https://example.com/files/${id}` } }
  }
}

// ===== QUERY BUILDER CONTROLLER (SECURITY CRITICAL) =====

@ApiTags('Query Builder')
@Controller('query-builder')
@UseGuards(CombinedRateLimitGuard)
export class QueryBuilderControllerExample {
  @Post('execute')
  @DangerousOperationRateLimit({
    maxRequests: 10,
    windowSizeMs: 60000,
    progressivePenalties: true,
    customMessage: 'SQL query execution is strictly rate limited for security reasons.',
    bypassForRoles: [GlobalUserRole.SUPER_ADMIN],
  })
  @ApiOperation({ summary: 'Execute SQL query - dangerous operation' })
  async executeQuery(
    @Body() _queryData: QueryData
  ): Promise<ApiResponse<{ results: unknown[]; executionTime: string }>> {
    // Very strict limits for SQL execution (10 per minute)
    return { success: true, data: { results: [], executionTime: '100ms' } }
  }

  @Get('saved-queries')
  @ApiRateLimit()
  @ApiOperation({ summary: 'Get saved queries' })
  async getSavedQueries(): Promise<ApiResponse<unknown[]>> {
    // Standard limits for reading queries
    return { success: true, data: [] }
  }

  @Post('validate')
  @ComplexityBasedRateLimit('medium')
  @ApiOperation({ summary: 'Validate query syntax' })
  async validateQuery(
    @Body() _query: QueryData
  ): Promise<ApiResponse<{ valid: boolean; suggestions: string[] }>> {
    // Medium complexity for validation
    return { success: true, data: { valid: true, suggestions: [] } }
  }
}

// ===== HEALTH AND MONITORING (BYPASSED) =====

@ApiTags('Health')
@Controller('health')
export class HealthControllerExample {
  @Get()
  @BypassRateLimit('Health checks should not be rate limited')
  @ApiOperation({ summary: 'Health check - bypassed from rate limiting' })
  async getHealth(): Promise<ApiResponse<{ status: string; timestamp: number }>> {
    return { success: true, data: { status: 'ok', timestamp: Date.now() } }
  }

  @Get('detailed')
  @ApiRateLimit({ maxRequests: 1000 }) // Very high limits
  @ApiOperation({ summary: 'Detailed health check' })
  async getDetailedHealth(): Promise<
    ApiResponse<{ status: string; database: string; redis: string; services: string[] }>
  > {
    return {
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        redis: 'connected',
        services: ['auth', 'api', 'marketplace'],
      },
    }
  }
}

// ===== WEBHOOKS CONTROLLER =====

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksControllerExample {
  @Post('stripe')
  @BurstRateLimit(
    { windowSizeMs: 1000, maxRequests: 10 }, // 10 per second
    { windowSizeMs: 60000, maxRequests: 1000 } // 1000 per minute
  )
  @ApiOperation({ summary: 'Stripe webhook with burst protection' })
  async stripeWebhook(
    @Body() _payload: StripeWebhookPayload
  ): Promise<ApiResponse<{ processed: boolean }>> {
    // Handle high-frequency webhooks with burst protection
    return { success: true, data: { processed: true } }
  }

  @Post('marketplace')
  @ComplexityBasedRateLimit('low', {
    skipSuccessfulRequests: true, // Only count failed webhook attempts
  })
  @ApiOperation({ summary: 'Marketplace webhook' })
  async marketplaceWebhook(
    @Body() _payload: MarketplaceWebhookPayload
  ): Promise<ApiResponse<{ received: boolean }>> {
    // Skip successful webhook processing from rate limits
    return { success: true, data: { received: true } }
  }
}

// ===== DEVELOPMENT/TESTING CONTROLLER =====

@ApiTags('Testing')
@Controller('test')
export class TestingControllerExample {
  @Post('rate-limit-test')
  @ApiRateLimit({
    windowSizeMs: 10000, // 10 seconds for easy testing
    maxRequests: 5,
    customMessage: 'This is a test endpoint for rate limiting - 5 requests per 10 seconds',
  })
  @ApiOperation({ summary: 'Test rate limiting behavior' })
  async testRateLimit(): Promise<ApiResponse<{ message: string; timestamp: number; tip: string }>> {
    return {
      success: true,
      data: {
        message: 'Request processed',
        timestamp: Date.now(),
        tip: 'Make 6 requests quickly to see rate limiting in action',
      },
    }
  }

  @Get('bypass-test')
  @BypassRateLimit('Testing bypass functionality')
  @ApiOperation({ summary: 'Test bypass functionality' })
  async testBypass(): Promise<ApiResponse<{ message: string }>> {
    return { success: true, data: { message: 'This endpoint bypasses all rate limits' } }
  }
}
