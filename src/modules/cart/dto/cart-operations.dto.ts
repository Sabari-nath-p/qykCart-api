import { ApiProperty } from '@nestjs/swagger';
import {
    IsUUID,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    Max,
    IsObject,
} from 'class-validator';

export class AddToCartDto {
    @ApiProperty({ description: 'Product ID to add to cart' })
    @IsUUID()
    productId: string;

    @ApiProperty({ description: 'Shop ID where the product belongs' })
    @IsUUID()
    shopId: string;

    @ApiProperty({
        description: 'Quantity to add',
        minimum: 0.01,
        maximum: 999.99,
        example: 1
    })
    @IsNumber()
    @Min(0.01)
    @Max(999.99)
    quantity: number;

    @ApiProperty({
        description: 'Special notes or instructions for this item',
        required: false
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({
        description: 'Session ID for guest users',
        required: false
    })
    @IsOptional()
    @IsString()
    sessionId?: string;
}

export class UpdateCartItemDto {
    @ApiProperty({
        description: 'New quantity for the item',
        minimum: 0.01,
        maximum: 999.99
    })
    @IsNumber()
    @Min(0.01)
    @Max(999.99)
    quantity: number;

    @ApiProperty({
        description: 'Special notes or instructions for this item',
        required: false
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateCartDto {
    @ApiProperty({
        description: 'Additional notes for the cart',
        required: false
    })
    @IsOptional()
    @IsObject()
    notes?: Record<string, any>;

    @ApiProperty({
        description: 'Delivery fee for this cart',
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    deliveryFee?: number;

    @ApiProperty({
        description: 'Tax amount for this cart',
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    tax?: number;
}