import { PartialType } from '@nestjs/swagger'
import { CreateStocksDto } from './create-stocks.dto'

export class UpdateStocksDto extends PartialType(CreateStocksDto) {}
