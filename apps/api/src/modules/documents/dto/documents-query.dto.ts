import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base.dto';

export class DocumentsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 'pdf' })
  @IsOptional()
  @IsString()
  type?: string;
}
