// apps/api/src/config/validation.config.ts
import { plainToInstance, Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  type ValidationError,
  validateSync,
} from 'class-validator'

export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development

  @IsNumber()
  @Type(() => Number)
  API_PORT = 3001

  @IsNumber()
  @Type(() => Number)
  WEB_PORT = 3000

  @IsString()
  DATABASE_HOST = 'localhost'

  @IsNumber()
  @Type(() => Number)
  DATABASE_PORT = 5432

  @IsString()
  DATABASE_NAME = 'erp_topsteel'

  @IsString()
  DATABASE_USERNAME = 'postgres'

  @IsString()
  DATABASE_PASSWORD = ''

  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true'
    }
    return Boolean(value)
  })
  DATABASE_SYNCHRONIZE = false

  @IsOptional()
  @IsString()
  REDIS_HOST?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  REDIS_PORT?: number

  @IsOptional()
  @IsString()
  JWT_SECRET?: string

  @IsOptional()
  @IsUrl()
  FRONTEND_URL?: string
}

export function validateConfig(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    excludeExtraneousValues: false,
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  })

  if (errors.length > 0) {
    const errorMessages = errors.map((error: ValidationError) => {
      return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`
    })

    throw new Error(`❌ Configuration invalide:\\n${errorMessages.join('\\n')}`)
  }

  return validatedConfig
}

export const configValidation = {
  validate: validateConfig,
  validationSchema: EnvironmentVariables,
}
