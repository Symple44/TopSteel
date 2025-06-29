// apps/api/src/common/filters/http-exception.filter.ts
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
  
  @Catch(HttpException)
  export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);
  
    catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();
  
      const errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: exception.message || null,
        error: exception.getResponse(),
      };
  
      // Log error for server errors (5xx)
      if (_status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `${request.method} ${request.url}`,
          exception.stack,
          "HttpExceptionFilter"
        );
      }
  
      // Log warning for client errors (4xx)
      if (_status >= HttpStatus.BAD_REQUEST && status < HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.warn(
          `${request.method} ${request.url} - ${status} ${exception.message}`,
          "HttpExceptionFilter"
        );
      }
  
      response.status(_status).json(errorResponse);
    }
  }