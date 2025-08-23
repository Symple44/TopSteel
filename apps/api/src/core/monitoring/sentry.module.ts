import { Module, Global, DynamicModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core'
import { SentryInterceptor } from './sentry.interceptor'
import { SentryExceptionFilter } from './sentry.filter'
import { SentryService } from './sentry.service'
import { initSentry, SentryConfig } from './sentry.config'

@Global()
@Module({})
export class SentryModule {
  static forRoot(): DynamicModule {
    return {
      module: SentryModule,
      providers: [
        SentryService,
        {
          provide: APP_INTERCEPTOR,
          useClass: SentryInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: SentryExceptionFilter,
        },
        {
          provide: 'SENTRY_INIT',
          useFactory: (configService: ConfigService) => {
            const config: SentryConfig = {
              dsn: configService.get('SENTRY_DSN', ''),
              environment: configService.get('NODE_ENV', 'development'),
              enabled: configService.get('SENTRY_ENABLED', 'false') === 'true',
              sampleRate: parseFloat(configService.get('SENTRY_SAMPLE_RATE', '1.0')),
              tracesSampleRate: parseFloat(configService.get('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
              profilesSampleRate: parseFloat(configService.get('SENTRY_PROFILES_SAMPLE_RATE', '0.1')),
              debug: configService.get('SENTRY_DEBUG', 'false') === 'true',
              attachStacktrace: configService.get('SENTRY_ATTACH_STACKTRACE', 'true') === 'true',
            }
            
            initSentry(config)
            
            return config
          },
          inject: [ConfigService],
        },
      ],
      exports: [SentryService],
    }
  }
}