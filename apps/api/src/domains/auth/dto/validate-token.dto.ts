import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

/**
 * DTO for token validation request
 * Used by external services (e.g., TopTime API) to validate JWT tokens
 */
export class ValidateTokenDto {
  @ApiProperty({
    description: 'JWT access token to validate',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string
}

/**
 * DTO for token validation response
 */
export class ValidateTokenResponseDto {
  @ApiProperty({
    description: 'Whether the token is valid',
    example: true,
  })
  valid: boolean

  @ApiProperty({
    description: 'User information from the token',
    required: false,
  })
  user?: {
    id: string
    email: string
    username: string
    firstName?: string | null
    lastName?: string | null
    isActive: boolean
  }

  @ApiProperty({
    description: 'User permissions (roles and specific permissions)',
    required: false,
  })
  permissions?: {
    roles: string[]
    societes: Array<{
      societeId: string
      roles: string[]
    }>
  }

  @ApiProperty({
    description: 'Session information',
    required: false,
  })
  session?: {
    sessionId: string
    isActive: boolean
    lastActivity: Date
  }

  @ApiProperty({
    description: 'Error message if validation fails',
    required: false,
  })
  error?: string
}
