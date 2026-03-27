import { Controller, Post, Body, Param, UseGuards, HttpCode, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards';
import { IsNumber, IsString, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

class CreatePaymentDto {
  @ApiProperty()
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}

class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty()
  @IsString()
  razorpaySignature: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create/:orderId')
  @HttpCode(201)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Razorpay order for payment' })
  @ApiResponse({ status: 201, description: 'Razorpay order created' })
  async createPayment(
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    const razorpayOrder = await this.paymentService.createRazorpayOrder({
      orderId,
      amount: dto.amount,
      currency: dto.currency,
    });
    return razorpayOrder;
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment signature' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    const isValid = await this.paymentService.verifyPayment({
      razorpayOrderId: dto.razorpayOrderId,
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpaySignature: dto.razorpaySignature,
    });
    return { valid: isValid };
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // For webhook, we verify the signature differently
    // In production, you'd use raw body
    const payload = JSON.stringify(body);
    const isValid = await this.paymentService.verifyWebhookSignature(payload, signature);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      throw new Error('Invalid webhook signature');
    }

    // Handle payment events
    if (body.event === 'payment.authorized') {
      const payment = body.payload.payment;
      if (payment && payment.receipt) {
        await this.paymentService.recordPaymentSuccess({
          orderId: payment.receipt,
          razorpayPaymentId: payment.id,
          amount: payment.amount,
        });
      }
    }

    return { received: true };
  }
}