import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsUUID,
    IsNumber,
    MaxLength,
    Min,
} from 'class-validator';
import { CategoryStatus } from '../entities/category.entity';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Electronics' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiProperty({ example: 'electronics' })
    @IsString()
    @MaxLength(255)
    slug: string;

    @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'https://example.com/category-image.jpg' })
    @IsOptional()
    @IsString()
    image?: string;

    @ApiPropertyOptional({ enum: CategoryStatus, default: CategoryStatus.ACTIVE })
    @IsOptional()
    @IsEnum(CategoryStatus)
    status?: CategoryStatus;

    @ApiPropertyOptional({ example: 0, description: 'Sort order for display' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({ example: 'uuid-of-parent-category', description: 'Parent category ID for hierarchical structure' })
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @ApiProperty({ example: 'uuid-of-super-admin' })
    @IsUUID()
    createdById: string;
}