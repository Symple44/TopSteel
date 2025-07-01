import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'TopSteel ERP API v1.0.0 - Système de gestion métallurgique';
  }

  getVersion(): unknown {
    return {
      name: 'TopSteel ERP API',
      version: '1.0.0',
      description: 'API de gestion ERP pour l\'industrie métallurgique',
      timestamp: new Date().toISOString()
    };
  }
}
