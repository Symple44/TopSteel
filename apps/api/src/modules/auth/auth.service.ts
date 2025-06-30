// apps/api/src/modules/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto/login.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<User, 'password' | 'refreshToken'>;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Valide les credentials d'un utilisateur
   */
  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Connexion utilisateur
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Valider l'utilisateur
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer les tokens
    const tokens = await this.generateTokens(user);

    // Sauvegarder le refresh token hashé
    await this.updaterefreshTokenHash(user.id, tokens.refreshToken);

    const { refreshToken: _, ...userWithoutrefreshToken } = user;
    
    return {
      ...tokens,
      user: userWithoutrefreshToken,
    };
  }

  /**
   * Inscription utilisateur
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, nom, prenom } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Valider la force du mot de passe
    this.validatePasswordStrength(password);

    // Hasher le mot de passe
    const hashedPassword = await this.hashPassword(password);

    // Créer l'utilisateur
    const newUser = await this.usersService.create({
      email,
      password: hashedPassword,
      nom,
      prenom,
    });

    // Générer les tokens
    const tokens = await this.generateTokens(newUser);

    // Sauvegarder le refresh token hashé
    await this.updaterefreshTokenHash(newUser.id, tokens.refreshToken);

    const { password: _, refreshToken: __, ...userWithoutSensitiveData } = newUser;

    return {
      ...tokens,
      user: userWithoutSensitiveData,
    };
  }

  /**
   * Rafraîchir les tokens
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken' | 'expiresIn'>> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Vérifier le refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      // Récupérer l'utilisateur
      const user = await this.usersService.findOne(payload.sub);
      if (!user?.refreshToken) {
        throw new UnauthorizedException('Token invalide');
      }

      // Vérifier si le refresh token correspond
      const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Token invalide');
      }

      // Générer de nouveaux tokens
      const tokens = await this.generateTokens(user);

      // Mettre à jour le refresh token en base
      await this.updaterefreshTokenHash(user.id, tokens.refreshToken);

      return tokens;
    } catch (_error) {
      // Log the error for debugging purposes
      console.error('Error during token refresh:', _error);
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  /**
   * Déconnexion utilisateur
   */
  async logout(userId: number): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Récupérer le profil utilisateur depuis le token
   */
  async getProfile(userId: number): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const { password: _password, refreshToken: _refreshToken, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    // Valider le nouveau mot de passe
    this.validatePasswordStrength(newPassword);

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Mettre à jour en base
    await this.usersService.update(userId, { password: hashedNewPassword });

    // Invalider tous les refresh tokens
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * MÉTHODES PRIVÉES
   */

  /**
   * Générer access token et refresh token
   */
  private async generateTokens(user: Omit<User, 'password'>): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken' | 'expiresIn'>> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access Token (courte durée)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.accessTokenExpiry,
      }),
      // Refresh Token (longue durée)
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.refreshTokenExpiry,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes en secondes
    };
  }

  /**
   * Hasher le mot de passe
   */
  private async hashPassword(_password: string): Promise<string> {
    return bcrypt.hash(_password, this.saltRounds);
  }

  /**
   * Mettre à jour le refresh token hashé en base
   */
  private async updaterefreshTokenHash(userId: number, refreshToken: string): Promise<void> {
    const hashedrefreshToken = await bcrypt.hash(refreshToken, this.saltRounds);
    await this.usersService.updateRefreshToken(userId, hashedrefreshToken);
  }

  /**
   * Valider la force du mot de passe
   */
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException(`Le mot de passe doit contenir au moins ${minLength} caractères`);
    }

    if (!hasUpperCase) {
      throw new BadRequestException('Le mot de passe doit contenir au moins une lettre majuscule');
    }

    if (!hasLowerCase) {
      throw new BadRequestException('Le mot de passe doit contenir au moins une lettre minuscule');
    }

    if (!hasNumbers) {
      throw new BadRequestException('Le mot de passe doit contenir au moins un chiffre');
    }

    if (!hasSpecialChar) {
      throw new BadRequestException('Le mot de passe doit contenir au moins un caractère spécial');
    }
  }
}


