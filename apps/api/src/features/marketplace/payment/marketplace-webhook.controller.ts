import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common'
import type { Request } from 'express'
import { getErrorMessage, hasStack } from '../../../core/common/utils'
import { SkipCsrf } from '../../../infrastructure/security/csrf'
import { StripePaymentService } from './stripe-payment.service'

@Controller('webhooks/stripe/marketplace')
export class MarketplaceWebhookController {
  private readonly logger = new Logger(MarketplaceWebhookController.name)

  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @SkipCsrf()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() body: unknown,
    @Headers('stripe-signature') signature: string,
    @Req() request: Request
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature')
    }

    try {
      // Get origin from request headers for security validation
      const origin =
        request.headers.origin ||
        request.headers.referer ||
        (request.headers['x-forwarded-for'] as string)

      // Log webhook attempt
      this.logger.log('Stripe webhook received', {
        origin,
        signature: `${signature.substring(0, 20)}...`,
        userAgent: request.headers['user-agent'],
      })

      // Convert body to raw string (needed for Stripe signature verification)
      const rawBody = JSON.stringify(body)

      await this.stripePaymentService.handleWebhook(rawBody, signature, origin)

      this.logger.log('Stripe webhook processed successfully')

      return { received: true }
    } catch (error) {
      this.logger.error(`Stripe webhook processing failed: ${getErrorMessage(error)}`, {
        signature: `${signature?.substring(0, 20)}...`,
        error: getErrorMessage(error),
        stack: hasStack(error) ? error.stack : undefined,
      })

      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException('Webhook processing failed')
    }
  }
}
