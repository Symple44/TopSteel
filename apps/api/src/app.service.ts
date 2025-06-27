import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'TopSteel ERP API v1.0 - Running!';
  }
}