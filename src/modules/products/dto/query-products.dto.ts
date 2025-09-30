import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min, Max, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductStatus, ProductUnit } from '../entities/product.entity';

export class QueryProductsDto {
    @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 10, minimum: 1, maximum: 100 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Search term for product name or description' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: ProductStatus, description: 'Filter by product status' })
    @IsOptional()
    @IsEnum(ProductStatus)
    status?: ProductStatus;

    @ApiPropertyOptional({ description: 'Filter by shop ID' })
    @IsOptional()
    @IsUUID()
    shopId?: string;

    @ApiPropertyOptional({ description: 'Filter by category ID' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Filter products with stock' })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    hasStock?: boolean;

    @ApiPropertyOptional({ description: 'Filter products on sale' })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    onSale?: boolean;

    @ApiPropertyOptional({ description: 'Filter low stock products' })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    lowStock?: boolean;

    @ApiPropertyOptional({ enum: ProductUnit, description: 'Filter by unit type' })
    @IsOptional()
    @IsEnum(ProductUnit)
    unit?: ProductUnit;

    @ApiPropertyOptional({ description: 'Minimum price filter' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ description: 'Maximum price filter' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({ description: 'Minimum rating filter' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0)
    @Max(5)
    minRating?: number;

    @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}