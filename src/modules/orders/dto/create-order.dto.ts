import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsUUID,
    IsEnum,
    IsOptional,
    IsString,
    IsDateString,
    IsPhoneNumber,
    IsPostalCode,
    ValidateNested,
    IsArray,
    IsNumber,
    Min,
    IsObject,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, PaymentMethod } from '../entities/order.entity';

export class ShopPickupDetailsDto {
    @ApiPropertyOptional({
        description: 'Preferred pickup date',
        example: '2024-01-15T10:00:00Z'
    })
    @IsOptional()
    @IsDateString()
    pickupDate?: string;

    @ApiPropertyOptional({
        description: 'Preferred pickup time (HH:MM format)',
        example: '14:30'
    })
    @IsOptional()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Pickup time must be in HH:MM format'
    })
    pickupTime?: string;

    @ApiPropertyOptional({
        description: 'Special pickup instructions',
        example: 'Please call when ready for pickup'
    })
    @IsOptional()
    @IsString()
    pickupNotes?: string;
}

export class HomeDeliveryDetailsDto {
    @ApiProperty({
        description: 'Complete delivery address',
        example: '123 Main Street, Apartment 4B'
    })
    @IsString()
    deliveryAddress: string;

    @ApiPropertyOptional({
        description: 'Nearby landmark for easy location',
        example: 'Near Central Mall'
    })
    @IsOptional()
    @IsString()
    deliveryLandmark?: string;

    @ApiProperty({
        description: 'Postal/ZIP code',
        example: '12345'
    })
    @IsString()
    @IsPostalCode('any')
    deliveryPincode: string;

    @ApiProperty({
        description: 'City name',
        example: 'New York'
    })
    @IsString()
    deliveryCity: string;

    @ApiProperty({
        description: 'State/Province name',
        example: 'NY'
    })
    @IsString()
    deliveryState: string;

    @ApiProperty({
        description: 'Contact number for delivery',
        example: '+1234567890'
    })
    @IsString()
    deliveryContactNumber: string;

    @ApiPropertyOptional({
        description: 'Special delivery instructions',
        example: 'Ring the doorbell twice'
    })
    @IsOptional()
    @IsString()
    deliveryNotes?: string;
}

export class CreateOrderDto {
    @ApiProperty({
        description: 'Cart ID to create order from'
    })
    @IsUUID()
    cartId: string;

    @ApiProperty({
        enum: OrderType,
        description: 'Type of order - pickup or delivery'
    })
    @IsEnum(OrderType)
    orderType: OrderType;

    @ApiPropertyOptional({
        enum: PaymentMethod,
        description: 'Payment method',
        default: PaymentMethod.CASH_ON_DELIVERY
    })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({
        description: 'Customer phone number (required for CREDIT payment method)',
        example: '+1234567890'
    })
    @IsOptional()
    @IsString()
    customerPhone?: string;

    @ApiPropertyOptional({
        description: 'Shop pickup details (required if orderType is SHOP_PICKUP)',
        type: ShopPickupDetailsDto
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => ShopPickupDetailsDto)
    shopPickupDetails?: ShopPickupDetailsDto;

    @ApiPropertyOptional({
        description: 'Home delivery details (required if orderType is HOME_DELIVERY)',
        type: HomeDeliveryDetailsDto
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => HomeDeliveryDetailsDto)
    homeDeliveryDetails?: HomeDeliveryDetailsDto;

    @ApiPropertyOptional({
        description: 'Customer notes for the order'
    })
    @IsOptional()
    @IsObject()
    customerNotes?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Estimated delivery/pickup date'
    })
    @IsOptional()
    @IsDateString()
    estimatedDate?: string;

    @ApiPropertyOptional({
        description: 'Estimated delivery/pickup time'
    })
    @IsOptional()
    @IsString()
    estimatedTime?: string;
}

export class AddOrderItemDto {
    @ApiProperty({
        description: 'Product ID to add to order'
    })
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Quantity to add',
        minimum: 0.01
    })
    @IsNumber()
    @Min(0.01)
    quantity: number;

    @ApiPropertyOptional({
        description: 'Custom unit price (if different from product price)'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customUnitPrice?: number;

    @ApiPropertyOptional({
        description: 'Custom discount price'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    customDiscountPrice?: number;

    @ApiPropertyOptional({
        description: 'Reason for adding this item'
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'Shop notes for this item'
    })
    @IsOptional()
    @IsString()
    shopNotes?: string;
}

export class UpdateOrderItemDto {
    @ApiPropertyOptional({
        description: 'New quantity for the item'
    })
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    quantity?: number;

    @ApiPropertyOptional({
        description: 'New unit price'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    unitPrice?: number;

    @ApiPropertyOptional({
        description: 'New discount price'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    discountPrice?: number;

    @ApiPropertyOptional({
        description: 'Mark item as unavailable with reason'
    })
    @IsOptional()
    @IsString()
    unavailableReason?: string;

    @ApiPropertyOptional({
        description: 'Reason for modification'
    })
    @IsOptional()
    @IsString()
    modificationReason?: string;

    @ApiPropertyOptional({
        description: 'Shop notes for this modification'
    })
    @IsOptional()
    @IsString()
    shopNotes?: string;
}

export class UpdateOrderDto {
    @ApiPropertyOptional({
        description: 'New delivery fee'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    deliveryFee?: number;

    @ApiPropertyOptional({
        description: 'Additional discount amount'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    additionalDiscount?: number;

    @ApiPropertyOptional({
        description: 'Extra charges (packaging, etc.)'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    extraCharges?: number;

    @ApiPropertyOptional({
        description: 'Tax amount'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    tax?: number;

    @ApiPropertyOptional({
        description: 'Shop notes for the order'
    })
    @IsOptional()
    @IsObject()
    shopNotes?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Estimated delivery/pickup date'
    })
    @IsOptional()
    @IsDateString()
    estimatedDate?: string;

    @ApiPropertyOptional({
        description: 'Estimated delivery/pickup time'
    })
    @IsOptional()
    @IsString()
    estimatedTime?: string;

    @ApiPropertyOptional({
        description: 'Reason for order modification'
    })
    @IsOptional()
    @IsString()
    modificationReason?: string;
}