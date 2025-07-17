import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtPayload } from './interfaces/jwt-payload.interface'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { password: _, ...result } = user
    return result
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password)

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = await this.generateAccessToken(payload)
    const refreshToken = await this.generateRefreshToken(payload)

    await this.usersService.updateRefreshToken(user.id, refreshToken)

    return {
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email)
    if (existingUser) {
      throw new ConflictException('User already exists')
    }

    try {
      const user = await this.usersService.create(registerDto)
      const { password, ...result } = user
      return result
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user')
    }
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required')
    }

    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret')
      if (!refreshSecret) {
        throw new InternalServerErrorException('JWT refresh secret not configured')
      }

      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      })

      const user = await this.usersService.findById(payload.sub)
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      }

      const newAccessToken = await this.generateAccessToken(newPayload)
      const newRefreshToken = await this.generateRefreshToken(newPayload)

      await this.usersService.updateRefreshToken(user.id, newRefreshToken)

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null)
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const { password, refreshToken, ...profile } = user
    return profile
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect')
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await this.usersService.update(userId, { password: hashedNewPassword })
  }

  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    const secret = this.configService.get<string>('jwt.secret')
    if (!secret) {
      throw new InternalServerErrorException('JWT secret not configured')
    }

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '24h',
    })
  }

  private async generateRefreshToken(payload: JwtPayload): Promise<string> {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret')
    if (!refreshSecret) {
      throw new InternalServerErrorException('JWT refresh secret not configured')
    }

    return this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
    })
  }
}
