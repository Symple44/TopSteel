import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

/**
 * DTO pour login avec Prisma (POC Phase 1.4)
 */
export class LoginPrismaDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  password: string
}

/**
 * DTO pour réponse login Prisma
 */
export class LoginPrismaResponseDto {
  user: {
    id: string
    email: string
    nom: string | null
    prenom: string | null
    role: string
    isActive: boolean
  }

  accessToken: string
  refreshToken: string
  sessionId: string
  expiresIn: number
}
