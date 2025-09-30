import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CartItem } from '../entities/cart-item.entity';
import { ProductResponseDto } from '../../products/dto/product-response.dto';

export class CartItemResponseDto {
    @ApiProperty({ description: 'Cart item ID' })
    id: string;

    @ApiProperty({ description: 'Cart ID this item belongs to' })
    cartId: string;

    @ApiProperty({ description: 'Product ID' })
    productId: string;

    @ApiProperty({ description: 'Product details' })
    product: ProductResponseDto;

    @ApiProperty({ description: 'Quantity of this item' })
    quantity: number;

    @ApiProperty({ description: 'Unit price at time of adding' })
    unitPrice: number;

    @ApiPropertyOptional({ description: 'Unit discount price if applicable' })
    unitDiscountPrice?: number;

    @ApiProperty({ description: 'Total discount amount for this item' })
    discountAmount: number;

    @ApiProperty({ description: 'Subtotal for this item' })
    subtotal: number;

    @ApiProperty({ description: 'Product name snapshot' })
    productName: string;

    @ApiPropertyOptional({ description: 'Product image snapshot' })
    productImage?: string;

    @ApiProperty({ description: 'Product SKU snapshot' })
    productSku: string;

    @ApiPropertyOptional({ description: 'Product specifications snapshot' })
    productSpecs?: Record<string, any>;

    @ApiProperty({ description: 'Is this item currently available' })
    isAvailable: boolean;

    @ApiPropertyOptional({ description: 'Reason if unavailable' })
    unavailableReason?: string | null;

    @ApiPropertyOptional({ description: 'Special notes for this item' })
    notes?: string;

    @ApiProperty({ description: 'When this item was added to cart' })
    createdAt: Date;

    @ApiProperty({ description: 'When this item was last updated' })
    updatedAt: Date;

    @Expose()
    @ApiProperty({ description: 'Final unit price after discounts' })
    get finalUnitPrice(): number {
        return this.unitDiscountPrice || this.unitPrice;
    }

    @Expose()
    @ApiProperty({ description: 'Total savings for this item' })
    get totalSavings(): number {
        if (!this.unitDiscountPrice) return 0;
        return (this.unitPrice - this.unitDiscountPrice) * this.quantity;
    }

    @Expose()
    @ApiProperty({ description: 'Whether this item has a discount' })
    get hasDiscount(): boolean {
        return this.unitDiscountPrice !== null && this.unitDiscountPrice !== undefined && this.unitDiscountPrice < this.unitPrice;
    }

    constructor(cartItem: CartItem) {
        this.id = cartItem.id;
        this.cartId = cartItem.cartId;
        this.productId = cartItem.productId;
        this.quantity = cartItem.quantity;
        this.unitPrice = cartItem.unitPrice;
        this.unitDiscountPrice = cartItem.unitDiscountPrice;
        this.discountAmount = cartItem.discountAmount;
        this.subtotal = cartItem.subtotal;
        this.productName = cartItem.productName;
        this.productImage = cartItem.productImage;
        this.productSku = cartItem.productSku;
        this.productSpecs = cartItem.productSpecs;
        this.isAvailable = cartItem.isAvailable;
        this.unavailableReason = cartItem.unavailableReason;
        this.notes = cartItem.notes;
        this.createdAt = cartItem.createdAt;
        this.updatedAt = cartItem.updatedAt;

        // Include product details if loaded
        if (cartItem.product) {
            this.product = new ProductResponseDto(cartItem.product);
        }
    }
}