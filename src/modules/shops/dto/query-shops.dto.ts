import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ShopStatus, WorkingDay } from '../entities/shop.entity';

export class QueryShopsDto {
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

    @ApiPropertyOptional({ description: 'Search term for shop name, city, or district' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: ShopStatus, description: 'Filter by shop status' })
    @IsOptional()
    @IsEnum(ShopStatus)
    status?: ShopStatus;

    @ApiPropertyOptional({ description: 'Filter by city' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'Filter by state' })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({ description: 'Filter by district' })
    @IsOptional()
    @IsString()
    district?: string;

    @ApiPropertyOptional({ description: 'Filter by zip code' })
    @IsOptional()
    @IsString()
    zipCode?: string;

    @ApiPropertyOptional({ description: 'Filter shops with own delivery partner' })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    hasOwnDeliveryPartner?: boolean;

    @ApiPropertyOptional({ description: 'Filter shops with delivery available' })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isDeliveryAvailable?: boolean;

    @ApiPropertyOptional({ description: 'Filter by minimum rating' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0)
    @Max(5)
    minRating?: number;

    @ApiPropertyOptional({ description: 'Filter shops open on specific day', enum: WorkingDay })
    @IsOptional()
    @IsEnum(WorkingDay)
    workingDay?: WorkingDay;

    @ApiPropertyOptional({ description: 'Show only currently open shops' })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isCurrentlyOpen?: boolean;

    @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';

    // Location-based search
    @ApiPropertyOptional({ description: 'Latitude for location-based search' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat?: number;

    @ApiPropertyOptional({ description: 'Longitude for location-based search' })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(-180)
    @Max(180)
    lng?: number;

    @ApiPropertyOptional({ description: 'Search radius in kilometers', default: 10 })
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0.1)
    @Max(100)
    radius?: number = 10;
}