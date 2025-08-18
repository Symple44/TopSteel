import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import {
  MarketplacePermission,
  RequireMarketplacePermissions,
} from '../auth/decorators/marketplace-permissions.decorator'
import { MarketplacePermissionsGuard } from '../auth/guards/marketplace-permissions.guard'
import type {
  CreatePaymentIntentDto,
  RefundResult,
  StripePaymentService,
} from './stripe-payment.service'

export class CreateRefundDto {
  paymentIntentId: string
  amount?: number // Optional for partial refunds
  reason?: string
}

export class ConfirmPaymentDto {
  paymentIntentId: string
  paymentMethodId?: string
}

@Controller('api/marketplace/payments')
@UseGuards(JwtAuthGuard)
export class MarketplacePaymentController {
  private readonly logger = new Logger(MarketplacePaymentController.name)

  constructor(private readonly stripePaymentService: StripePaymentService) {}

  @Post('intents')
  @HttpCode(HttpStatus.CREATED)
  async createPaymentIntent(@Body() createPaymentDto: CreatePaymentIntentDto) {
    if (!createPaymentDto.orderId || !createPaymentDto.customerId || !createPaymentDto.amount) {
      throw new BadRequestException('Missing required fields: orderId, customerId, amount')
    }

    if (createPaymentDto.amount < 50) {
      throw new BadRequestException('Amount must be at least 50 cents')
    }

    return this.stripePaymentService.createPaymentIntent(createPaymentDto)
  }

  @Post('intents/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPayment(@Body() confirmPaymentDto: ConfirmPaymentDto) {
    if (!confirmPaymentDto.paymentIntentId) {
      throw new BadRequestException('Payment intent ID is required')
    }

    return this.stripePaymentService.confirmPayment(
      confirmPaymentDto.paymentIntentId,
      confirmPaymentDto.paymentMethodId
    )
  }

  @Post('refunds')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(MarketplacePermissionsGuard)
  @RequireMarketplacePermissions(MarketplacePermission.PROCESS_REFUNDS)
  async createRefund(
    @Body() createRefundDto: CreateRefundDto,
    @Req() request: Request
  ): Promise<RefundResult> {
    if (!createRefundDto.paymentIntentId) {
      throw new BadRequestException('Payment intent ID is required')
    }

    // Log refund attempt for audit purposes
    this.logger.log(
      `Refund requested by user ${request.user?.id} for payment ${createRefundDto.paymentIntentId.substring(0, 8)}...`,
      {
        userId: request.user?.id,
        paymentIntentId: createRefundDto.paymentIntentId,
        amount: createRefundDto.amount,
        reason: createRefundDto.reason,
      }
    )

    const result = await this.stripePaymentService.createRefund(
      createRefundDto.paymentIntentId,
      createRefundDto.amount,
      createRefundDto.reason
    )

    // Log refund result
    if (result.success) {
      this.logger.log(`Refund processed successfully: ${result.refundId}`, {
        userId: request.user?.id,
        refundId: result.refundId,
        amount: result.amount,
      })
    } else {
      this.logger.error(`Refund failed: ${result.error}`, {
        userId: request.user?.id,
        paymentIntentId: createRefundDto.paymentIntentId,
        error: result.error,
      })
    }

    return result
  }
}
