import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EmailService } from './email.service'
import { EmailLog } from './entities/email-log.entity'

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([EmailLog], 'marketplace')],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
