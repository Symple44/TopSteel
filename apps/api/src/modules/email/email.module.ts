import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EmailService } from './services/email.service'
import { EmailController } from './controllers/email.controller'
import { OAuthCallbackController } from './controllers/oauth-callback.controller'
import { GoogleEmailProvider } from './providers/google-email.provider'
import { MicrosoftEmailProvider } from './providers/microsoft-email.provider'
import { SmtpEmailProvider } from './providers/smtp-email.provider'
import { EmailTemplateService } from './services/email-template.service'
import { EmailQueueService } from './services/email-queue.service'
import { BullModule } from '@nestjs/bull'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EmailLog } from './entities/email-log.entity'
import { EmailTemplate } from './entities/email-template.entity'
import { EmailConfiguration } from './entities/email-configuration.entity'

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EmailLog, EmailTemplate, EmailConfiguration]),
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  controllers: [EmailController, OAuthCallbackController],
  providers: [
    EmailService,
    EmailTemplateService,
    EmailQueueService,
    GoogleEmailProvider,
    MicrosoftEmailProvider,
    SmtpEmailProvider,
    {
      provide: 'EmailService',
      useClass: EmailService,
    },
    {
      provide: 'EmailQueueService',
      useClass: EmailQueueService,
    },
  ],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}