import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async findAll(): Promise<Users[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<Users> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Users>): Promise<Users> {
    const entity = this.usersRepository.create(data);
    return this.usersRepository.save(entity);
  }

  async update(id: string, data: Partial<Users>): Promise<Users> {
    await this.usersRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
