import { IsOptional, IsBoolean, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BaseQueryDto } from "../../../common/dto/base.dto";
import { UserRole } from "../entities/user.entity";

export class UserQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  actif?: boolean;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
