// apps/api/src/redis/redis.module.ts
import { type DynamicModule, Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'

@Global()
@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    // Vérifier si Redis est activé
    const redisEnabled = process.env.REDIS_ENABLED === 'true'

    if (!redisEnabled) {
      return {
        module: RedisModule,
        providers: [
          // Provider null pour REDIS_CLIENT quand désactivé
          {
            provide: 'REDIS_CLIENT',
            useValue: null,
          },
        ],
        exports: ['REDIS_CLIENT'],
      }
    }
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'REDIS_CLIENT',
          useFactory: (configService: ConfigService) => {
            const redisConfig = configService.get('redis')
            return new Redis(redisConfig)
          },
          inject: [ConfigService],
        },
      ],
      exports: ['REDIS_CLIENT'],
    }
  }
}
