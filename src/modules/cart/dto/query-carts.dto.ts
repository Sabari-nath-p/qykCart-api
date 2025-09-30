import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { CartStatus } from '../entities/cart.entity';

export class QueryCartsDto {
    @ApiPropertyOptional({
        description: 'Filter carts by user ID',
        example: 'uuid-string'
    })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({
        description: 'Filter carts by shop ID',
        example: 'uuid-string'
    })
    @IsOptional()
    @IsUUID()
    shopId?: string;

    @ApiPropertyOptional({
        enum: CartStatus,
        description: 'Filter carts by status'
    })
    @IsOptional()
    @IsEnum(CartStatus)
    status?: CartStatus;

    @ApiPropertyOptional({
        description: 'Filter by session ID for guest users'
    })
    @IsOptional()
    @IsString()
    sessionId?: string;

    @ApiPropertyOptional({
        description: 'Include empty carts',
        default: false
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    includeEmpty?: boolean;

    @ApiPropertyOptional({
        description: 'Sort field',
        default: 'lastActivityAt'
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'lastActivityAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
        default: 'DESC'
    })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}