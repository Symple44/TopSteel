// apps/api/src/modules/auth/dto/login.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "admin@topsteel.fr" })
  @IsEmail({}, { message: "Email invalide" })
  email: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6, {
    message: "Le mot de passe doit contenir au moins 6 caractères",
  })
  password: string;
}
