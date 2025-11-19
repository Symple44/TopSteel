import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger'
import { IsEmail, IsString, IsOptional, IsBoolean, MinLength, Matches } from 'class-validator'
import { UserPrismaService } from './prisma/user-prisma.service'
import { CombinedSecurityGuard } from '../auth/security/guards/combined-security.guard'
import { Prisma } from '@prisma/client'

// DTOs with validation
class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one number'
  })
  password: string

  @IsString()
  @MinLength(3)
  username: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string

  @IsOptional()
  @IsString()
  username?: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

class UpdateUserSettingsDto {
  @IsOptional()
  profile?: Prisma.InputJsonValue

  @IsOptional()
  company?: Prisma.InputJsonValue

  @IsOptional()
  preferences?: Prisma.InputJsonValue
}

class UserQueryDto {
  @IsOptional()
  page?: number

  @IsOptional()
  limit?: number

  @IsOptional()
  @IsBoolean()
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
    // Parse query params to numbers (they come as strings from HTTP)
    const page = parseInt(String(query.page || 1), 10)
    const limit = parseInt(String(query.limit || 10), 10)
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
      throw new NotFoundException('User not found')
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
   * PATCH /users/:id
   * Update a user (partial update)
   */
  @Patch(':id')
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
   * PATCH /users/:id/settings
   * Update user settings (partial update)
   */
  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profile: { type: 'object' },
        company: { type: 'object' },
        preferences: { type: 'object' },
        language: { type: 'string' },
        timezone: { type: 'string' },
        theme: { type: 'string' },
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
