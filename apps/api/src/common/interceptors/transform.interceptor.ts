// apps/api/src/common/interceptors/transform.interceptor.ts
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
  
  export interface Response<T> {
    data: T;
    statusCode: number;
    message?: string;
    timestamp: string;
  }
  
  @Injectable()
  export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>>
  {
    intercept(
      context: ExecutionContext,
      next: CallHandler
    ): Observable<Response<T>> {
      const response = context.switchToHttp().getResponse();
      
      return next.handle().pipe(
        map((data) => ({
          data,
          statusCode: response.statusCode,
          message: "Success",
          timestamp: new Date().toISOString(),
        }))
      );
    }
  }