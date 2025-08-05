import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello(): string {
    return 'TopSteel Marketplace API is running!'
  }

  getVersion() {
    return {
      name: 'TopSteel Marketplace API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    }
  }
}
