import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '../entities/order.entity';
import { OrderItemStatus } from '../entities/order-item.entity';
import { Type } from 'class-transformer';

export class OrderItemResponseDto {
    @ApiProperty({
        description: 'Order item ID'
    })
    id: string;

    @ApiPropertyOptional({
        description: 'Product ID'
    })
    productId?: string;

    @ApiProperty({
        description: 'Product name'
    })
    productName: string;

    @ApiProperty({
        description: 'Product image URL'
    })
    productImage?: string;

    @ApiProperty({
        description: 'Quantity ordered',
        example: 2.5
    })
    quantity: number;

    @ApiProperty({
        description: 'Unit price at time of order',
        example: 100.00
    })
    unitPrice: number;

    @ApiProperty({
        description: 'Discount price at time of order',
        example: 10.00
    })
    discountPrice: number;

    @ApiProperty({
        description: 'Total price for this item',
        example: 225.00
    })
    totalPrice: number;

    @ApiProperty({
        enum: OrderItemStatus,
        description: 'Status of this order item'
    })
    status: OrderItemStatus;

    @ApiPropertyOptional({
        description: 'Reason if item is unavailable'
    })
    unavailableReason?: string;

    @ApiPropertyOptional({
        description: 'Shop modification notes'
    })
    shopNotes?: string;

    @ApiProperty({
        description: 'Whether item was added by shop after order placement'
    })
    isShopAddition: boolean;

    @ApiProperty({
        description: 'Order item creation date'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Order item last update date'
    })
    updatedAt: Date;

    constructor(partial: Partial<OrderItemResponseDto>) {
        Object.assign(this, partial);
    }
}

export class OrderModificationHistoryDto {
    @ApiProperty({
        description: 'Modification timestamp'
    })
    timestamp: Date;

    @ApiProperty({
        description: 'Type of modification'
    })
    type: string;

    @ApiProperty({
        description: 'Field that was modified'
    })
    field: string;

    @ApiProperty({
        description: 'Previous value'
    })
    oldValue: any;

    @ApiProperty({
        description: 'New value'
    })
    newValue: any;

    @ApiProperty({
        description: 'Reason for modification'
    })
    reason?: string;

    @ApiProperty({
        description: 'Modified by (shop owner, admin, etc.)'
    })
    modifiedBy: string;

    constructor(partial: Partial<OrderModificationHistoryDto>) {
        Object.assign(this, partial);
    }
}

export class ShopDetailsDto {
    @ApiProperty({
        description: 'Shop ID'
    })
    id: string;

    @ApiProperty({
        description: 'Shop name'
    })
    name: string;

    @ApiProperty({
        description: 'Shop address'
    })
    address: string;

    @ApiProperty({
        description: 'Shop contact number'
    })
    contactNumber: string;

    @ApiPropertyOptional({
        description: 'Shop email'
    })
    email?: string;

    @ApiProperty({
        description: 'Whether shop supports delivery'
    })
    hasDelivery: boolean;

    constructor(partial: Partial<ShopDetailsDto>) {
        Object.assign(this, partial);
    }
}

export class UserDetailsDto {
    @ApiProperty({
        description: 'User ID'
    })
    id: string;

    @ApiProperty({
        description: 'User name'
    })
    name: string;

    @ApiProperty({
        description: 'User email'
    })
    email: string;

    @ApiProperty({
        description: 'User phone number'
    })
    phoneNumber: string;

    constructor(partial: Partial<UserDetailsDto>) {
        Object.assign(this, partial);
    }
}

export class OrderResponseDto {
    @ApiProperty({
        description: 'Order ID'
    })
    id: string;

    @ApiProperty({
        description: 'Unique order number'
    })
    orderNumber: string;

    @ApiProperty({
        description: 'User details',
        type: UserDetailsDto
    })
    @Type(() => UserDetailsDto)
    user: UserDetailsDto;

    @ApiProperty({
        description: 'Shop details',
        type: ShopDetailsDto
    })
    @Type(() => ShopDetailsDto)
    shop: ShopDetailsDto;

    @ApiProperty({
        description: 'Order items',
        type: [OrderItemResponseDto]
    })
    @Type(() => OrderItemResponseDto)
    orderItems: OrderItemResponseDto[];

    @ApiProperty({
        enum: OrderStatus,
        description: 'Current order status'
    })
    status: OrderStatus;

    @ApiProperty({
        enum: OrderType,
        description: 'Order type - pickup or delivery'
    })
    orderType: OrderType;

    @ApiProperty({
        enum: PaymentMethod,
        description: 'Payment method'
    })
    paymentMethod: PaymentMethod;

    @ApiProperty({
        enum: PaymentStatus,
        description: 'Payment status'
    })
    paymentStatus: PaymentStatus;

    @ApiProperty({
        description: 'Subtotal amount',
        example: 500.00
    })
    subtotalAmount: number;

    @ApiProperty({
        description: 'Total discount amount',
        example: 50.00
    })
    discountAmount: number;

    @ApiPropertyOptional({
        description: 'Delivery fee',
        example: 25.00
    })
    deliveryFee?: number;

    @ApiPropertyOptional({
        description: 'Additional discount by shop',
        example: 10.00
    })
    additionalDiscount?: number;

    @ApiPropertyOptional({
        description: 'Extra charges (packaging, etc.)',
        example: 5.00
    })
    extraCharges?: number;

    @ApiPropertyOptional({
        description: 'Tax amount',
        example: 30.00
    })
    tax?: number;

    @ApiProperty({
        description: 'Final total amount',
        example: 500.00
    })
    totalAmount: number;

    // Pickup Details
    @ApiPropertyOptional({
        description: 'Pickup date and time'
    })
    pickupDateTime?: Date;

    @ApiPropertyOptional({
        description: 'Pickup notes'
    })
    pickupNotes?: string;

    // Delivery Details
    @ApiPropertyOptional({
        description: 'Delivery address'
    })
    deliveryAddress?: string;

    @ApiPropertyOptional({
        description: 'Delivery landmark'
    })
    deliveryLandmark?: string;

    @ApiPropertyOptional({
        description: 'Delivery pincode'
    })
    deliveryPincode?: string;

    @ApiPropertyOptional({
        description: 'Delivery city'
    })
    deliveryCity?: string;

    @ApiPropertyOptional({
        description: 'Delivery state'
    })
    deliveryState?: string;

    @ApiPropertyOptional({
        description: 'Delivery contact number'
    })
    deliveryContactNumber?: string;

    @ApiPropertyOptional({
        description: 'Delivery notes'
    })
    deliveryNotes?: string;

    @ApiPropertyOptional({
        description: 'Estimated delivery/pickup date'
    })
    estimatedDate?: Date;

    @ApiPropertyOptional({
        description: 'Estimated delivery/pickup time'
    })
    estimatedTime?: string;

    @ApiPropertyOptional({
        description: 'Customer notes'
    })
    customerNotes?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Shop notes'
    })
    shopNotes?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Order modification history',
        type: [OrderModificationHistoryDto]
    })
    @Type(() => OrderModificationHistoryDto)
    modificationHistory?: OrderModificationHistoryDto[];

    @ApiProperty({
        description: 'Order creation date'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Order last update date'
    })
    updatedAt: Date;

    @ApiPropertyOptional({
        description: 'Order completion date'
    })
    completedAt?: Date;

    constructor(partial: Partial<OrderResponseDto>) {
        Object.assign(this, partial);
    }
}

export class OrderSummaryDto {
    @ApiProperty({
        description: 'Order ID'
    })
    id: string;

    @ApiProperty({
        description: 'Unique order number'
    })
    orderNumber: string;

    @ApiProperty({
        description: 'Shop name'
    })
    shopName: string;

    @ApiProperty({
        description: 'Customer name'
    })
    customerName: string;

    @ApiProperty({
        enum: OrderStatus,
        description: 'Current order status'
    })
    status: OrderStatus;

    @ApiProperty({
        enum: OrderType,
        description: 'Order type'
    })
    orderType: OrderType;

    @ApiProperty({
        description: 'Total order amount'
    })
    totalAmount: number;

    @ApiProperty({
        description: 'Number of items in order'
    })
    itemCount: number;

    @ApiProperty({
        description: 'Order creation date'
    })
    createdAt: Date;

    @ApiPropertyOptional({
        description: 'Estimated delivery/pickup date'
    })
    estimatedDate?: Date;

    constructor(partial: Partial<OrderSummaryDto>) {
        Object.assign(this, partial);
    }
}