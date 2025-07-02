// apps/api/src/common/interceptors/logging.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers, body } = request;
    const startTime = Date.now();
    const requestId = headers['x-request-id'] || `req_${Date.now()}`;

    const logData = {
      requestId,
      method,
      url,
      userAgent: headers['user-agent'],
      ip: request.ip,
      userId: request.user?.id,
      timestamp: new Date().toISOString(),
    };

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        this.logger.log({
          ...logData,
          responseTime,
          status: 'success',
          responseSize: JSON.stringify(data).length,
        });
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        this.logger.error({
          ...logData,
          responseTime,
          status: 'error',
          error: error.message,
          errorType: error.constructor.name,
        });
        throw error;
      }),
    );
  }
}
