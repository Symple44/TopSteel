import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Response } from 'express'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error'

    // Log de l'erreur
    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)}`,
      exception?.stack || 'No stack trace'
    )

    // Réponse d'erreur sécurisée
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: typeof message === 'object' ? message : { message },
    }

    // Ajout du stack uniquement en développement
    if (process.env.NODE_ENV === 'development' && exception?.stack) {
      errorResponse.stack = exception.stack
    }

    response.status(status).json(errorResponse)
  }
}
