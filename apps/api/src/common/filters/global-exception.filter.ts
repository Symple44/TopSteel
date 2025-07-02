// apps/api/src/common/filters/global-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | object;
  requestId: string;
  userId?: string;
  stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Erreur interne du serveur';

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      requestId: request.headers['x-request-id'] as string || `req_${Date.now()}`,
      userId: (request as any).user?.id,
    };

    // Stack trace pour erreurs 500
    if (status >= 500 && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Logging structuré
    const logContext = {
      ...errorResponse,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      body: status >= 500 ? request.body : undefined,
    };

    if (status >= 500) {
      this.logger.error('Erreur serveur', logContext);
    } else if (status >= 400) {
      this.logger.warn('Erreur client', logContext);
    }

    // Réponse nettoyée en production
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      delete errorResponse.stack;
      errorResponse.message = 'Erreur interne du serveur';
    }

    response.status(status).json(errorResponse);
  }
}
