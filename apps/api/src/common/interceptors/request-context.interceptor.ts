// apps/api/src/common/interceptors/request-context.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Génération ID de requête unique si absent
    if (!request.headers['x-request-id']) {
      request.headers['x-request-id'] = uuidv4();
    }

    // Ajout métadonnées contexte
    request.context = {
      requestId: request.headers['x-request-id'],
      timestamp: new Date().toISOString(),
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    return next.handle();
  }
}
