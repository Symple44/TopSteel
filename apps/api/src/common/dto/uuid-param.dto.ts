import { IsUUID } from 'class-validator'

export class UUIDParamDto {
  @IsUUID('4', { message: 'Invalid UUID format' })
  id: string
}
