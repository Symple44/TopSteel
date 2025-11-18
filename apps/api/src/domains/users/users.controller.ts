import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger'
import { UserPrismaService } from './prisma/user-prisma.service'
import { CombinedSecurityGuard } from '../auth/security/guards/combined-security.guard'
import { Prisma } from '@prisma/client'

// DTOs
interface CreateUserDto {
  email: string
  password: string
  username: string
  firstName?: string
  lastName?: string
  isActive?: boolean
}

interface UpdateUserDto {
  email?: string
  password?: string
  username?: string
  firstName?: string
  lastName?: string
  isActive?: boolean
}

interface UpdateUserSettingsDto {
  profile?: Prisma.InputJsonValue
  company?: Prisma.InputJsonValue
  preferences?: Prisma.InputJsonValue
}

interface UserQueryDto {
  page?: number
  limit?: number
  includeDeleted?: boolean
}

/**
 * UsersController - Prisma-based User Management
 *
 * Primary user management controller using Prisma ORM
 * Route: /users
 *
 * Endpoints:
 * - GET    /users          List users (pagination)
 * - GET    /users/stats    User statistics
 * - GET    /users/:id      User details
 * - POST   /users          Create user
 * - PUT    /users/:id      Update user
 * - DELETE /users/:id      Delete user (soft)
 * - GET    /users/:id/settings    Get user settings
 * - PUT    /users/:id/settings    Update user settings
 *
 * @see /users-legacy/* for deprecated TypeORM endpoints
 */
@Controller('users')
@ApiTags('👥 Users')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly userPrismaService: UserPrismaService) {}

  /**
   * GET /users
   * List users with pagination
   */
  @Get()
  @ApiOperation({ summary: 'List users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() query: UserQueryDto) {
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const result = await this.userPrismaService.findAll({
      skip,
      take: limit,
      includeDeleted: query.includeDeleted || false,
    })

    return {
      success: true,
      data: result.users,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    }
  }

  /**
   * GET /users/stats
   * User statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'User statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    const stats = await this.userPrismaService.getStats()

    return {
      success: true,
      data: stats,
    }
  }

  /**
   * GET /users/:id
   * Get user by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.userPrismaService.findOne(id, true)

    if (!user) {
      return {
        success: false,
        message: 'User not found',
        statusCode: 404,
      }
    }

    // Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user as any

    return {
      success: true,
      data: userWithoutPassword,
    }
  }

  /**
   * POST /users
   * Create a new user
   */
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['email', 'password', 'username'],
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userPrismaService.create(createUserDto)

    return {
      success: true,
      data: user,
      message: 'User created successfully',
      statusCode: 201,
    }
  }

  /**
   * PUT /users/:id
   * Update a user
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userPrismaService.update(id, updateUserDto)

    return {
      success: true,
      data: user,
      message: 'User updated successfully',
    }
  }

  /**
   * DELETE /users/:id
   * Delete a user (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user - soft delete' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    await this.userPrismaService.remove(id)

    return {
      success: true,
      message: 'User deleted successfully',
    }
  }

  /**
   * GET /users/:id/settings
   * Get user settings
   */
  @Get(':id/settings')
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getUserSettings(@Param('id') id: string) {
    const settings = await this.userPrismaService.getUserSettings(id)

    return {
      success: true,
      data: settings,
    }
  }

  /**
   * PUT /users/:id/settings
   * Update user settings
   */
  @Put(':id/settings')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profile: { type: 'object' },
        company: { type: 'object' },
        preferences: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateUserSettings(
    @Param('id') id: string,
    @Body() updateSettingsDto: UpdateUserSettingsDto
  ) {
    const settings = await this.userPrismaService.updateUserSettings(id, updateSettingsDto)

    return {
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    }
  }
}
