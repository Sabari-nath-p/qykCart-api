import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '../entities/category.entity';

export class QueryCategoriesDto {
    @ApiPropertyOptional({
        enum: CategoryStatus,
        description: 'Filter categories by status',
    })
    @IsOptional()
    @IsEnum(CategoryStatus)
    status?: CategoryStatus;

    @ApiPropertyOptional({
        description: 'Filter categories by parent ID',
    })
    @IsOptional()
    @IsString()
    parentId?: string;

    @ApiPropertyOptional({
        description: 'Return only root categories (no parent)',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    rootOnly?: boolean;

    @ApiPropertyOptional({
        description: 'Return only active categories',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    activeOnly?: boolean;
}