import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { SentryConfig } from './sentry.config'
import { SentryInterceptor } from './sentry.interceptor'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SentryConfig,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
  exports: [SentryConfig],
})
export class SentryModule {
  constructor(private sentryConfig: SentryConfig) {
    // Initialize Sentry on module instantiation
    this.sentryConfig.initialize()
  }
}
