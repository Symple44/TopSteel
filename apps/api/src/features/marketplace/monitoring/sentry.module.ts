import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryConfig } from './sentry.config';
import { SentryInterceptor } from './sentry.interceptor';

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
    this.sentryConfig.initialize();
  }
}