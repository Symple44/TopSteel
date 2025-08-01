import { Type } from 'class-transformer'
import { IsBoolean, IsEmail, IsIn, IsObject, IsOptional, IsString } from 'class-validator'

export class NotificationEmailTypesDto {
  @IsBoolean()
  @IsOptional()
  newMessages?: boolean

  @IsBoolean()
  @IsOptional()
  systemAlerts?: boolean

  @IsBoolean()
  @IsOptional()
  taskReminders?: boolean

  @IsBoolean()
  @IsOptional()
  weeklyReports?: boolean

  @IsBoolean()
  @IsOptional()
  securityAlerts?: boolean

  @IsBoolean()
  @IsOptional()
  maintenanceNotice?: boolean
}

export class NotificationPushTypesDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean

  @IsBoolean()
  @IsOptional()
  sound?: boolean

  @IsBoolean()
  @IsOptional()
  urgent?: boolean

  @IsBoolean()
  @IsOptional()
  normal?: boolean

  @IsBoolean()
  @IsOptional()
  quiet?: boolean
}

export class NotificationQuietHoursDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean

  @IsString()
  @IsOptional()
  start?: string

  @IsString()
  @IsOptional()
  end?: string
}

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

  @IsOptional()
  @Type(() => NotificationEmailTypesDto)
  emailTypes?: NotificationEmailTypesDto

  @IsOptional()
  @Type(() => NotificationPushTypesDto)
  pushTypes?: NotificationPushTypesDto

  @IsOptional()
  @Type(() => NotificationQuietHoursDto)
  quietHours?: NotificationQuietHoursDto
}

export class AppearanceSettingsDto {
  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark', 'vibrant', 'system'])
  theme?: 'light' | 'dark' | 'vibrant' | 'system'

  @IsString()
  @IsOptional()
  @IsIn(['fr', 'en', 'es', 'de'])
  language?: string

  @IsString()
  @IsOptional()
  @IsIn(['small', 'medium', 'large'])
  fontSize?: 'small' | 'medium' | 'large'

  @IsString()
  @IsOptional()
  @IsIn(['compact', 'normal', 'wide'])
  sidebarWidth?: 'compact' | 'normal' | 'wide'

  @IsString()
  @IsOptional()
  @IsIn(['compact', 'comfortable', 'spacious'])
  density?: 'compact' | 'comfortable' | 'spacious'

  @IsString()
  @IsOptional()
  @IsIn(['blue', 'green', 'purple', 'orange', 'pink', 'red'])
  accentColor?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red'

  @IsString()
  @IsOptional()
  @IsIn(['compact', 'full'])
  contentWidth?: 'compact' | 'full'
}

export class UserPreferencesDto {
  @IsString()
  @IsOptional()
  @IsIn(['fr', 'en', 'es', 'de'])
  language?: string

  @IsString()
  @IsOptional()
  timezone?: string

  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark', 'vibrant', 'system'])
  theme?: 'light' | 'dark' | 'vibrant' | 'system'

  @IsOptional()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto

  @IsOptional()
  @Type(() => AppearanceSettingsDto)
  appearance?: AppearanceSettingsDto
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
