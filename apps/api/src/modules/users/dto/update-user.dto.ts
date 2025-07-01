import { PartialType, OmitType } from "@nestjs/swagger";
import { IsString, IsOptional, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ["password"]),
) {
  @ApiPropertyOptional({ example: "nouveaumotdepasse123", minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
