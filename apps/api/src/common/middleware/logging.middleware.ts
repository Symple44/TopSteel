// apps/api/src/common/middleware/logger.middleware.ts
import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP')

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, baseUrl: url } = request
    const userAgent = request.get('User-Agent') || ''

    response.on('close', () => {
      const { statusCode } = response
      const contentLength = response.get('content-length')

      this.logger.log(`${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip}`)
    })

    next()
  }
}
