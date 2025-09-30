import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../entities/order.entity';

export class UpdatePaymentMethodDto {
    @ApiProperty({
        enum: PaymentMethod,
        description: 'New payment method for the order',
        example: PaymentMethod.CREDIT
    })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional({
        description: 'Reason for changing payment method',
        example: 'Customer requested to switch from cash to credit'
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'Additional notes about the payment method change',
        example: 'Customer will pay via shop credit balance'
    })
    @IsOptional()
    @IsString()
    notes?: string;
}