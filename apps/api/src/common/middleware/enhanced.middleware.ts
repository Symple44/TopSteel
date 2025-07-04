import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { performance } from 'perf_hooks'

interface ExtendedRequest extends Request {
  startTime?: number
  requestId?: string
}

@Injectable()
export class EnhancedMiddleware implements NestMiddleware {
  use(req: ExtendedRequest, res: Response, next: NextFunction) {
    const start = performance.now()
    
    req.startTime = start
    req.requestId = this.generateRequestId()
    
    res.setHeader('X-Request-ID', req.requestId)
    res.setHeader('X-Response-Time', '0ms')
    
    res.on('finish', () => {
      const duration = performance.now() - start
      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`)
      
      if (duration > 1000) {
        console.warn(`Slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`)
      }
    })
    
    next()
  }
  
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
