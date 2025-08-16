import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  BadRequestException
} from '@nestjs/common';
import { Request } from 'express';
import { StripePaymentService } from './stripe-payment.service';

@Controller('webhooks/stripe/marketplace')
export class MarketplaceWebhookController {
  private readonly logger = new Logger(MarketplaceWebhookController.name);

  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
    @Req() request: Request
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    try {
      // Get origin from request headers for security validation
      const origin = request.headers.origin || 
                    request.headers.referer ||
                    request.headers['x-forwarded-for'] as string;

      // Log webhook attempt
      this.logger.log('Stripe webhook received', {
        origin,
        signature: signature.substring(0, 20) + '...',
        userAgent: request.headers['user-agent']
      });

      // Convert body to raw string (needed for Stripe signature verification)
      const rawBody = JSON.stringify(body);

      await this.stripePaymentService.handleWebhook(rawBody, signature, origin);

      this.logger.log('Stripe webhook processed successfully');
      
      return { received: true };

    } catch (error) {
      this.logger.error(`Stripe webhook processing failed: ${error.message}`, {
        signature: signature?.substring(0, 20) + '...',
        error: error.message,
        stack: error.stack
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Webhook processing failed');
    }
  }
}