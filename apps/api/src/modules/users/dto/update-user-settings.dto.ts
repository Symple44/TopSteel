import { IsOptional, IsString, IsBoolean, IsObject, IsIn, IsEmail, IsPhoneNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class NotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  email?: boolean

  @IsBoolean()
  @IsOptional()
  push?: boolean

  @IsBoolean()
  @IsOptional()
  sms?: boolean
}

export class UserPreferencesDto {
  @IsString()
  @IsOptional()
  @IsIn(['fr', 'en', 'es'])
  language?: string

  @IsString()
  @IsOptional()
  timezone?: string

  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark', 'auto'])
  theme?: 'light' | 'dark' | 'auto'

  @IsOptional()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto
}

export class CompanyInfoDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  address?: string

  @IsString()
  @IsOptional()
  city?: string

  @IsString()
  @IsOptional()
  postalCode?: string

  @IsString()
  @IsOptional()
  country?: string
}

export class UserProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string

  @IsString()
  @IsOptional()
  lastName?: string

  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsString()
  @IsOptional()
  position?: string

  @IsString()
  @IsOptional()
  department?: string

  @IsString()
  @IsOptional()
  avatar?: string
}

export class UpdateUserSettingsDto {
  @IsOptional()
  @Type(() => UserProfileDto)
  profile?: UserProfileDto

  @IsOptional()
  @Type(() => CompanyInfoDto)
  company?: CompanyInfoDto

  @IsOptional()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}