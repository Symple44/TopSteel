import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  RawBodyRequest,
  Req,
  BadRequestException,
  ParseUUIDPipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiHeader,
  ApiParam
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { StripePaymentService, CreatePaymentIntentDto, PaymentResult, RefundResult } from './stripe-payment.service';
import { MarketplaceAuthGuard } from '../auth/guards/marketplace-auth.guard';
import { CurrentMarketplaceCustomer } from '../auth/decorators/current-customer.decorator';
import { IsString, IsNumber, IsOptional, IsUUID, IsPositive, Min, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreatePaymentDto {
  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Order UUID' 
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({ 
    example: 2599,
    description: 'Amount in cents (minimum 50 cents)' 
  })
  @IsNumber()
  @IsPositive()
  @Min(50)
  amount: number;

  @ApiProperty({ 
    example: 'EUR',
    description: 'Currency code' 
  })
  @IsString()
  @IsIn(['EUR', 'USD', 'GBP'])
  currency: string;

  @ApiPropertyOptional({ 
    example: 'pm_1234567890',
    description: 'Stripe payment method ID' 
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({ 
    example: false,
    description: 'Save payment method for future use' 
  })
  @IsOptional()
  savePaymentMethod?: boolean;

  @ApiPropertyOptional({ 
    example: 'https://marketplace.topsteel.fr/payment/return',
    description: 'Return URL for 3D Secure' 
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

class ConfirmPaymentDto {
  @ApiProperty({ 
    example: 'pi_1234567890',
    description: 'Stripe payment intent ID' 
  })
  @IsString()
  paymentIntentId: string;

  @ApiPropertyOptional({ 
    example: 'pm_1234567890',
    description: 'Payment method ID if not already attached' 
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

class RefundPaymentDto {
  @ApiPropertyOptional({ 
    example: 1000,
    description: 'Refund amount in cents (leave empty for full refund)' 
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ 
    example: 'requested_by_customer',
    description: 'Refund reason' 
  })
  @IsOptional()
  @IsString()
  @IsIn(['duplicate', 'fraudulent', 'requested_by_customer'])
  reason?: string;
}

class SavePaymentMethodDto {
  @ApiProperty({ 
    example: 'pm_1234567890',
    description: 'Stripe payment method ID' 
  })
  @IsString()
  paymentMethodId: string;
}

@ApiTags('Marketplace Payment')
@Controller('marketplace/payment')
@UseGuards(ThrottlerGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: StripePaymentService
  ) {}

  @Post('intent')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({ 
    summary: 'Create payment intent',
    description: 'Create a Stripe payment intent for order payment'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Payment intent created successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid order or payment data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Not authenticated' 
  })
  async createPaymentIntent(
    @Body() dto: CreatePaymentDto,
    @CurrentMarketplaceCustomer() customer: any
  ): Promise<PaymentResult> {
    const paymentData: CreatePaymentIntentDto = {
      ...dto,
      customerId: customer.sub || customer.id
    };

    return await this.paymentService.createPaymentIntent(paymentData);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({ 
    summary: 'Confirm payment',
    description: 'Confirm payment intent to process payment'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Payment confirmed successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Payment confirmation failed' 
  })
  async confirmPayment(
    @Body() dto: ConfirmPaymentDto,
    @CurrentMarketplaceCustomer() customer: any
  ): Promise<PaymentResult> {
    return await this.paymentService.confirmPayment(
      dto.paymentIntentId,
      dto.paymentMethodId
    );
  }

  @Post('refund/:paymentIntentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({ 
    summary: 'Create refund',
    description: 'Create refund for a successful payment (Customer service only)'
  })
  @ApiParam({ 
    name: 'paymentIntentId', 
    description: 'Stripe payment intent ID' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Refund created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Refund creation failed' 
  })
  async createRefund(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body() dto: RefundPaymentDto,
    @CurrentMarketplaceCustomer() customer: any
  ): Promise<RefundResult> {
    // Note: In production, add role-based authorization for refunds
    // Only customer service or admin should be able to create refunds
    
    return await this.paymentService.createRefund(
      paymentIntentId,
      dto.amount,
      dto.reason
    );
  }

  @Post('payment-methods')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({ 
    summary: 'Save payment method',
    description: 'Save payment method for future use'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Payment method saved successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Failed to save payment method' 
  })
  async savePaymentMethod(
    @Body() dto: SavePaymentMethodDto,
    @CurrentMarketplaceCustomer() customer: any
  ) {
    const result = await this.paymentService.savePaymentMethod(
      customer.sub || customer.id,
      dto.paymentMethodId
    );

    return {
      success: result.success,
      message: result.success 
        ? 'Payment method saved successfully' 
        : result.error || 'Failed to save payment method'
    };
  }

  @Get('payment-methods')
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({ 
    summary: 'Get saved payment methods',
    description: 'Get customer\'s saved payment methods'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Payment methods retrieved successfully' 
  })
  async getPaymentMethods(
    @CurrentMarketplaceCustomer() customer: any
  ) {
    const paymentMethods = await this.paymentService.getPaymentMethods(
      customer.sub || customer.id
    );

    // Sanitize payment method data for client
    const sanitized = paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
        country: pm.card.country
      } : null,
      created: pm.created
    }));

    return {
      paymentMethods: sanitized,
      count: sanitized.length
    };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Stripe webhook',
    description: 'Handle Stripe webhook events (Internal use only)'
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature',
    required: true
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Webhook processed successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Webhook verification failed' 
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const body = req.rawBody;
    if (!body) {
      throw new BadRequestException('Missing request body');
    }

    await this.paymentService.handleWebhook(body.toString(), signature);

    return { received: true };
  }

  @Get('status/:orderId')
  @UseGuards(MarketplaceAuthGuard)
  @ApiBearerAuth('marketplace-jwt')
  @ApiOperation({ 
    summary: 'Get payment status',
    description: 'Get payment status for an order'
  })
  @ApiParam({ 
    name: 'orderId', 
    description: 'Order UUID' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Payment status retrieved successfully' 
  })
  async getPaymentStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentMarketplaceCustomer() customer: any
  ) {
    // This would typically fetch from the order and return payment status
    // For now, return a placeholder response
    
    return {
      orderId,
      status: 'pending',
      paymentMethod: null,
      amount: null,
      currency: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}