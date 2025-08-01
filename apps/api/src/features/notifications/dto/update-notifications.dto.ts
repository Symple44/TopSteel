import { PartialType } from '@nestjs/swagger'
import { CreateNotificationsDto } from './create-notifications.dto'

export class UpdateNotificationsDto extends PartialType(CreateNotificationsDto) {}
