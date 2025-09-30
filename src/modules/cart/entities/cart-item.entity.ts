import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
@Index(['cartId'])
@Index(['productId'])
@Index(['cartId', 'productId'], { unique: true })
export class CartItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Cart this item belongs to
    @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cartId' })
    cart: Cart;

    @Column({ name: 'cartId' })
    cartId: string;

    // Product being added to cart
    @ManyToOne(() => Product, { eager: true })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ name: 'productId' })
    productId: string;

    // Quantity and pricing
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    unitDiscountPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discountAmount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    // Product snapshot at time of adding to cart
    @Column({ type: 'varchar', length: 255 })
    productName: string;

    @Column({ type: 'text', nullable: true })
    productImage: string;

    @Column({ type: 'varchar', length: 100 })
    productSku: string;

    @Column({ type: 'json', nullable: true })
    productSpecs: Record<string, any>;

    // Stock validation
    @Column({ default: true })
    isAvailable: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    unavailableReason: string | null;

    // Special instructions or notes
    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual properties
    get finalUnitPrice(): number {
        return this.unitDiscountPrice || this.unitPrice;
    }

    get totalSavings(): number {
        if (!this.unitDiscountPrice) return 0;
        return (this.unitPrice - this.unitDiscountPrice) * this.quantity;
    }

    get hasDiscount(): boolean {
        return this.unitDiscountPrice !== null && this.unitDiscountPrice < this.unitPrice;
    }

    // Business methods
    calculateSubtotal(): void {
        const effectivePrice = this.finalUnitPrice;
        this.subtotal = effectivePrice * this.quantity;
        this.discountAmount = this.totalSavings;
    }

    updateFromProduct(product: Product): void {
        this.productName = product.productName;
        this.productImage = product.image;
        this.productSku = product.sku || '';
        this.productSpecs = product.specifications;
        this.unitPrice = product.salePrice;
        this.unitDiscountPrice = product.discountPrice;
        this.isAvailable = product.hasStock;

        if (!product.hasStock) {
            this.unavailableReason = 'Out of stock';
        } else if (!product.isActive) {
            this.isAvailable = false;
            this.unavailableReason = 'Product not available';
        } else {
            this.unavailableReason = null;
        }

        this.calculateSubtotal();
    }

    validateStock(shopHasStockAvailability: boolean): boolean {
        if (!shopHasStockAvailability) {
            // Shop allows adding out-of-stock items
            return true;
        }

        // Shop requires stock availability
        return this.isAvailable && this.product.hasStock;
    }
}