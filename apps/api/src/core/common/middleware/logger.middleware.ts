import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = req
    const userAgent = req.get('User-Agent') || ''

    res.on('close', () => {
      const { statusCode } = res
      const contentLength = res.get('Content-Length')

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`
      )
    })

    next()
  }
}
