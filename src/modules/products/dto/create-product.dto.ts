import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsNumber,
    IsUUID,
    IsArray,
    IsObject,
    MaxLength,
    Min,
    Max,
} from 'class-validator';
import { ProductStatus, ProductUnit } from '../entities/product.entity';

export class CreateProductDto {
    @ApiProperty({ example: 'Fresh Apples' })
    @IsString()
    @MaxLength(255)
    productName: string;

    @ApiPropertyOptional({ example: 'Fresh red apples from local farms' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'https://example.com/product-image.jpg' })
    @IsOptional()
    @IsString()
    image?: string;

    @ApiProperty({ example: 5.99, description: 'Regular sale price' })
    @IsNumber()
    @Min(0)
    salePrice: number;

    @ApiPropertyOptional({ example: 4.99, description: 'Discounted price if on sale' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    discountPrice?: number;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    hasStock?: boolean;

    @ApiPropertyOptional({ enum: ProductUnit, default: ProductUnit.PIECE })
    @IsOptional()
    @IsEnum(ProductUnit)
    unit?: ProductUnit;

    @ApiPropertyOptional({ example: 1.0, default: 1.0, description: 'Quantity per unit' })
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    quantity?: number;

    @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;

    @ApiPropertyOptional({ example: 'APPLE001', description: 'Stock Keeping Unit' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    sku?: string;

    @ApiPropertyOptional({ example: 0.5, description: 'Weight in kg' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;

    @ApiPropertyOptional({
        example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        description: 'Multiple product images'
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @ApiPropertyOptional({
        example: { color: 'red', origin: 'local', organic: true },
        description: 'Product specifications'
    })
    @IsOptional()
    @IsObject()
    specifications?: Record<string, any>;

    @ApiPropertyOptional({ example: 100, description: 'Available stock quantity' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number;

    @ApiPropertyOptional({ example: 10, description: 'Minimum stock level for alerts' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minStockLevel?: number;

    @ApiPropertyOptional({ example: 3.99, description: 'Cost price for profit calculation' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    costPrice?: number;

    @ApiProperty({ example: 'uuid-of-shop' })
    @IsUUID()
    shopId: string;

    @ApiPropertyOptional({ example: 'uuid-of-category' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;
}