import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsNumber,
    IsArray,
    IsEmail,
    IsPhoneNumber,
    IsUUID,
    MaxLength,
    Min,
    Max,
    Matches,
    IsDecimal,
} from 'class-validator';
import { ShopStatus, WorkingDay } from '../entities/shop.entity';

export class CreateShopDto {
    @ApiProperty({ example: 'Super Mart Store' })
    @IsString()
    @MaxLength(255)
    shopName: string;

    @ApiProperty({ example: '123 Main Street, Block A' })
    @IsString()
    address: string;

    @ApiProperty({ example: '12345' })
    @IsString()
    @MaxLength(20)
    zipCode: string;

    @ApiProperty({ example: 'New York' })
    @IsString()
    @MaxLength(100)
    city: string;

    @ApiProperty({ example: 'NY' })
    @IsString()
    @MaxLength(100)
    state: string;

    @ApiProperty({ example: 'Manhattan' })
    @IsString()
    @MaxLength(100)
    district: string;

    @ApiPropertyOptional({ example: true, default: false })
    @IsOptional()
    @IsBoolean()
    hasOwnDeliveryPartner?: boolean;

    @ApiPropertyOptional({ example: 40.7128 })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @ApiPropertyOptional({ example: -74.0060 })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @ApiPropertyOptional({ enum: ShopStatus, default: ShopStatus.PENDING_APPROVAL })
    @IsOptional()
    @IsEnum(ShopStatus)
    status?: ShopStatus;

    @ApiProperty({ example: '09:00', description: 'Opening time in HH:MM format' })
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Opening time must be in HH:MM format',
    })
    openingTime: string;

    @ApiProperty({ example: '22:00', description: 'Closing time in HH:MM format' })
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Closing time must be in HH:MM format',
    })
    closingTime: string;

    @ApiPropertyOptional({
        example: [WorkingDay.MONDAY, WorkingDay.TUESDAY, WorkingDay.WEDNESDAY],
        enum: WorkingDay,
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    @IsEnum(WorkingDay, { each: true })
    workingDays?: WorkingDay[];

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsPhoneNumber()
    contactPhone?: string;

    @ApiPropertyOptional({ example: 'shop@example.com' })
    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @ApiPropertyOptional({ example: 'Best grocery store in the area' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'https://example.com/shop-image.jpg' })
    @IsOptional()
    @IsString()
    shopImage?: string;

    @ApiPropertyOptional({ example: ['parking', 'wifi', 'ac'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    amenities?: string[];

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isDeliveryAvailable?: boolean;

    @ApiPropertyOptional({ example: 5.0, description: 'Delivery radius in kilometers' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    deliveryRadius?: number;

    @ApiPropertyOptional({ example: true, default: false, description: 'Show stock availability to customers' })
    @IsOptional()
    @IsBoolean()
    hasStockAvailability?: boolean;

    @ApiPropertyOptional({ example: 3.50, description: 'Delivery fee' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    deliveryFee?: number;

    @ApiProperty({ example: 'uuid-of-shop-owner' })
    @IsUUID()
    ownerId: string;
}