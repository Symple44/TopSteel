import { Injectable } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto/login.dto';

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class AuthService {
  async validateUser(email: string, password: string): Promise<any> {
    // TODO: Valider l'utilisateur avec la base de données
    // Pour l'instant, simulation
    if (email === 'test@test.com' && password === 'password') {
      const user: Partial<User> = {
        id: 1,
        email: email,
        nom: 'Test',
        prenom: 'User',
        role: 'user'
      };
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    // Valider d'abord l'utilisateur
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    return {
      access_token: 'fake-jwt-token', // TODO: Générer un vrai JWT
      user
    };
  }

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User> }> {
    // TODO: Créer l'utilisateur en base
    const user: Partial<User> = {
      id: 2,
      email: registerDto.email,
      nom: registerDto.nom,
      prenom: registerDto.prenom,
      role: 'user'
    };
    
    return { user };
  }
}