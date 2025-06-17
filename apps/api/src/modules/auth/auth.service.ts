// apps/api/src/modules/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get("jwt.refreshExpiresIn", "7d"),
    });

    // Sauvegarder le refresh token en base
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: this.configService.get("jwt.expiresIn", "24h"),
    };
  }

  async register(registerDto: RegisterDto) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException("Cet email est déjà utilisé");
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Créer l'utilisateur
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Retourner les tokens
    return this.login(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException("Token invalide");
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException("Token invalide ou expiré");
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: "Déconnexion réussie" };
  }
}
