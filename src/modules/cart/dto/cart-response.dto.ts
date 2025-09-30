import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Cart, CartStatus } from '../entities/cart.entity';
import { CartItemResponseDto } from './cart-item-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ShopResponseDto } from '../../shops/dto/shop-response.dto';

export class CartResponseDto {
    @ApiProperty({ description: 'Cart ID' })
    id: string;

    @ApiProperty({ description: 'User ID who owns this cart' })
    userId: string;

    @ApiPropertyOptional({ description: 'User details' })
    user?: UserResponseDto;

    @ApiProperty({ description: 'Shop ID this cart belongs to' })
    shopId: string;

    @ApiProperty({ description: 'Shop details' })
    shop: ShopResponseDto;

    @ApiProperty({ description: 'Cart items', type: [CartItemResponseDto] })
    items: CartItemResponseDto[];

    @ApiProperty({ enum: CartStatus, description: 'Cart status' })
    status: CartStatus;

    @ApiProperty({ description: 'Cart subtotal before discounts' })
    subtotal: number;

    @ApiProperty({ description: 'Total discount amount' })
    totalDiscount: number;

    @ApiProperty({ description: 'Delivery fee' })
    deliveryFee: number;

    @ApiProperty({ description: 'Tax amount' })
    tax: number;

    @ApiProperty({ description: 'Final total amount' })
    total: number;

    @ApiProperty({ description: 'Number of unique items' })
    totalItems: number;

    @ApiProperty({ description: 'Total quantity of all items' })
    totalQuantity: number;

    @ApiPropertyOptional({ description: 'Session ID for guest users' })
    sessionId?: string;

    @ApiPropertyOptional({ description: 'Additional cart notes' })
    notes?: Record<string, any>;

    @ApiProperty({ description: 'Last activity timestamp' })
    lastActivityAt: Date;

    @ApiProperty({ description: 'Cart creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Cart last update timestamp' })
    updatedAt: Date;

    @Expose()
    @ApiProperty({ description: 'Is cart currently active' })
    get isActive(): boolean {
        return this.status === CartStatus.ACTIVE;
    }

    @Expose()
    @ApiProperty({ description: 'Is cart empty' })
    get isEmpty(): boolean {
        return this.totalItems === 0 || !this.items || this.items.length === 0;
    }

    @Expose()
    @ApiProperty({ description: 'Does cart have any discounts' })
    get hasDiscount(): boolean {
        return this.totalDiscount > 0;
    }

    @Expose()
    @ApiProperty({ description: 'Final calculated total' })
    get finalTotal(): number {
        return Math.max(0, this.subtotal - this.totalDiscount + this.deliveryFee + this.tax);
    }

    @Expose()
    @ApiProperty({ description: 'Items that are currently unavailable' })
    get unavailableItems(): CartItemResponseDto[] {
        return this.items.filter(item => !item.isAvailable);
    }

    @Expose()
    @ApiProperty({ description: 'Items that are currently available' })
    get availableItems(): CartItemResponseDto[] {
        return this.items.filter(item => item.isAvailable);
    }

    @Expose()
    @ApiProperty({ description: 'Total savings from discounts' })
    get totalSavings(): number {
        return this.items.reduce((sum, item) => sum + item.totalSavings, 0);
    }

    constructor(cart: Cart) {
        this.id = cart.id;
        this.userId = cart.userId;
        this.shopId = cart.shopId;
        this.status = cart.status;
        this.subtotal = cart.subtotal;
        this.totalDiscount = cart.totalDiscount;
        this.deliveryFee = cart.deliveryFee;
        this.tax = cart.tax;
        this.total = cart.total;
        this.totalItems = cart.totalItems;
        this.totalQuantity = cart.totalQuantity;
        this.sessionId = cart.sessionId;
        this.notes = cart.notes;
        this.lastActivityAt = cart.lastActivityAt;
        this.createdAt = cart.createdAt;
        this.updatedAt = cart.updatedAt;

        // Include user details if loaded
        if (cart.user) {
            this.user = new UserResponseDto(cart.user);
        }

        // Include shop details if loaded
        if (cart.shop) {
            this.shop = new ShopResponseDto(cart.shop);
        }

        // Include cart items if loaded
        if (cart.items) {
            this.items = cart.items.map(item => new CartItemResponseDto(item));
        } else {
            this.items = [];
        }
    }
}