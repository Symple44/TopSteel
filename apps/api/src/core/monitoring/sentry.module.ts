import { type DynamicModule, Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { initSentry, type SentryConfig } from './sentry.config'
import { SentryExceptionFilter } from './sentry.filter'
import { SentryInterceptor } from './sentry.interceptor'
import { SentryService } from './sentry.service'

export function createSentryModule(): DynamicModule {
  @Global()
  @Module({})
  class SentryModule {}

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
