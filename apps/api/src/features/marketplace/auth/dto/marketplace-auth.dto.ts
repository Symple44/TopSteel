import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Customer email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(254, { message: 'Email address is too long' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string

  @ApiProperty({
    example: 'SecureP@ssw0rd!',
    description: 'Strong password with uppercase, lowercase, number and special character',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password is too long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(50, { message: 'First name is too long' })
  @Transform(({ value }) => value?.trim())
  firstName: string

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name is too long' })
  @Transform(({ value }) => value?.trim())
  lastName: string

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsOptional()
  @IsString()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
    message: 'Please provide a valid phone number',
  })
  @Transform(({ value }) => value?.trim())
  phone?: string

  @ApiPropertyOptional({
    example: true,
    description: 'Accept marketing emails',
  })
  @IsOptional()
  @IsBoolean()
  acceptMarketing?: boolean
}

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string

  @ApiProperty({ example: 'SecureP@ssw0rd!' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string

  @ApiPropertyOptional({
    example: false,
    description: 'Keep user logged in for 30 days',
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @MinLength(1, { message: 'Refresh token is required' })
  refreshToken: string
}

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @MinLength(1, { message: 'Reset token is required' })
  token: string

  @ApiProperty({
    example: 'NewSecureP@ssw0rd!',
    description: 'New password',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password is too long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword: string
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @MinLength(1, { message: 'Verification token is required' })
  token: string
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentP@ssw0rd!' })
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string

  @ApiProperty({ example: 'NewSecureP@ssw0rd!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password is too long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  newPassword: string
}

export class AuthTokensResponse {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string

  @ApiProperty({
    description: 'JWT refresh token for getting new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string

  @ApiProperty({
    description: 'Access token expiry time in seconds',
    example: 3600,
  })
  expiresIn: number

  @ApiPropertyOptional({
    description: 'Customer information',
    example: {
      id: 'uuid',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  })
  customer?: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export class MessageResponse {
  @ApiProperty({
    example: 'Operation completed successfully',
  })
  message: string

  @ApiPropertyOptional({
    example: true,
  })
  success?: boolean
}
