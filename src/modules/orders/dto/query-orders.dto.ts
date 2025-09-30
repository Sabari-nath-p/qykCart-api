import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsUUID,
    IsEnum,
    IsString,
    IsDateString,
    IsNumber,
    Min,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '../entities/order.entity';
import { OrderItemStatus } from '../entities/order-item.entity';

export class QueryOrdersDto {
    @ApiPropertyOptional({
        description: 'Filter by user ID'
    })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({
        description: 'Filter by shop ID'
    })
    @IsOptional()
    @IsUUID()
    shopId?: string;

    @ApiPropertyOptional({
        enum: OrderStatus,
        description: 'Filter by order status'
    })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @ApiPropertyOptional({
        enum: OrderType,
        description: 'Filter by order type'
    })
    @IsOptional()
    @IsEnum(OrderType)
    orderType?: OrderType;

    @ApiPropertyOptional({
        enum: PaymentMethod,
        description: 'Filter by payment method'
    })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({
        enum: PaymentStatus,
        description: 'Filter by payment status'
    })
    @IsOptional()
    @IsEnum(PaymentStatus)
    paymentStatus?: PaymentStatus;

    @ApiPropertyOptional({
        description: 'Filter orders from this date (YYYY-MM-DD)'
    })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({
        description: 'Filter orders until this date (YYYY-MM-DD)'
    })
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional({
        description: 'Search by order number'
    })
    @IsOptional()
    @IsString()
    orderNumber?: string;

    @ApiPropertyOptional({
        description: 'Search by customer name'
    })
    @IsOptional()
    @IsString()
    customerName?: string;

    @ApiPropertyOptional({
        description: 'Search by customer phone'
    })
    @IsOptional()
    @IsString()
    customerPhone?: string;

    @ApiPropertyOptional({
        description: 'Minimum order amount'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minAmount?: number;

    @ApiPropertyOptional({
        description: 'Maximum order amount'
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxAmount?: number;

    @ApiPropertyOptional({
        description: 'Page number for pagination',
        default: 1
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        default: 20
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Sort by field',
        enum: ['createdAt', 'updatedAt', 'totalAmount', 'orderNumber'],
        default: 'createdAt'
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort direction',
        enum: ['ASC', 'DESC'],
        default: 'DESC'
    })
    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
        description: 'Include order items in response',
        default: false
    })
    @IsOptional()
    includeItems?: boolean = false;

    @ApiPropertyOptional({
        description: 'Include modification history',
        default: false
    })
    @IsOptional()
    includeHistory?: boolean = false;
}

export class UpdateOrderStatusDto {
    @ApiPropertyOptional({
        enum: OrderStatus,
        description: 'New order status'
    })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @ApiPropertyOptional({
        enum: PaymentStatus,
        description: 'New payment status'
    })
    @IsOptional()
    @IsEnum(PaymentStatus)
    paymentStatus?: PaymentStatus;

    @ApiPropertyOptional({
        description: 'Reason for status change'
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'Notes for status change'
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({
        description: 'Estimated completion date'
    })
    @IsOptional()
    @IsDateString()
    estimatedDate?: string;

    @ApiPropertyOptional({
        description: 'Estimated completion time'
    })
    @IsOptional()
    @IsString()
    estimatedTime?: string;
}

export class UpdateOrderItemStatusDto {
    @ApiPropertyOptional({
        enum: OrderItemStatus,
        description: 'New order item status'
    })
    @IsOptional()
    @IsEnum(OrderItemStatus)
    status?: OrderItemStatus;

    @ApiPropertyOptional({
        description: 'Reason for item unavailability'
    })
    @IsOptional()
    @IsString()
    unavailableReason?: string;

    @ApiPropertyOptional({
        description: 'Reason for status change'
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'Shop notes for this change'
    })
    @IsOptional()
    @IsString()
    shopNotes?: string;
}

export class OrderAnalyticsDto {
    @ApiPropertyOptional({
        description: 'Filter by shop ID for analytics'
    })
    @IsOptional()
    @IsUUID()
    shopId?: string;

    @ApiPropertyOptional({
        description: 'Analytics from this date'
    })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({
        description: 'Analytics until this date'
    })
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional({
        description: 'Group analytics by period',
        enum: ['day', 'week', 'month', 'year'],
        default: 'day'
    })
    @IsOptional()
    @IsString()
    groupBy?: string = 'day';
}

export class BulkOrderActionDto {
    @ApiPropertyOptional({
        description: 'Array of order IDs to perform action on'
    })
    @IsArray()
    @IsUUID(4, { each: true })
    orderIds: string[];

    @ApiPropertyOptional({
        enum: OrderStatus,
        description: 'New status for all orders'
    })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @ApiPropertyOptional({
        description: 'Reason for bulk action'
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'Notes for bulk action'
    })
    @IsOptional()
    @IsString()
    notes?: string;
}