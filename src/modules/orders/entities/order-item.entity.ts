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
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

export enum OrderItemStatus {
    AVAILABLE = 'available',
    UNAVAILABLE = 'unavailable',
    ADDED_BY_SHOP = 'added_by_shop',
    REMOVED_BY_SHOP = 'removed_by_shop',
    MODIFIED_BY_SHOP = 'modified_by_shop',
}

@Entity('order_items')
@Index(['orderId'])
@Index(['productId'])
@Index(['status'])
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Order this item belongs to
    @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column({ name: 'orderId' })
    orderId: string;

    // Product reference (may be null if product was deleted)
    @ManyToOne(() => Product, { nullable: true })
    @JoinColumn({ name: 'productId' })
    product: Product | null;

    @Column({ name: 'productId', nullable: true })
    productId: string | null;

    // Item details at time of order
    @Column()
    productName: string;

    @Column({ nullable: true })
    productImage: string;

    @Column({ nullable: true })
    productSku: string;

    @Column({ type: 'json', nullable: true })
    productSpecs: Record<string, any>;

    // Quantity and pricing
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    unitDiscountPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    itemDiscountAmount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    // Item status and modifications
    @Column({
        type: 'enum',
        enum: OrderItemStatus,
        default: OrderItemStatus.AVAILABLE,
    })
    status: OrderItemStatus;

    @Column({ type: 'text', nullable: true })
    unavailableReason: string;

    @Column({ default: false })
    isAddedByShop: boolean;

    @Column({ default: false })
    isModifiedByShop: boolean;

    // Original cart item reference
    @Column({ nullable: true })
    originalCartItemId: string;

    // Shop modifications
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    originalQuantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    originalUnitPrice: number;

    @Column({ type: 'json', nullable: true })
    modificationHistory: Array<{
        type: 'quantity_change' | 'price_change' | 'discount_applied' | 'status_change';
        oldValue: any;
        newValue: any;
        timestamp: Date;
        modifiedBy: string;
        reason?: string;
    }>;

    // Customer and shop notes
    @Column({ type: 'text', nullable: true })
    customerNotes: string;

    @Column({ type: 'text', nullable: true })
    shopNotes: string;

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

    get isAvailable(): boolean {
        return this.status === OrderItemStatus.AVAILABLE;
    }

    get isUnavailable(): boolean {
        return this.status === OrderItemStatus.UNAVAILABLE;
    }

    get wasAddedByShop(): boolean {
        return this.isAddedByShop || this.status === OrderItemStatus.ADDED_BY_SHOP;
    }

    get wasModifiedByShop(): boolean {
        return this.isModifiedByShop || this.modificationHistory?.length > 0;
    }

    // Business methods
    calculateSubtotal(): void {
        const effectivePrice = this.finalUnitPrice;
        this.subtotal = effectivePrice * this.quantity;
    }

    markAsUnavailable(reason: string, modifiedBy: string): void {
        this.addModificationHistory('status_change', this.status, OrderItemStatus.UNAVAILABLE, modifiedBy, reason);
        this.status = OrderItemStatus.UNAVAILABLE;
        this.unavailableReason = reason;
        this.isModifiedByShop = true;
    }

    updateQuantity(newQuantity: number, modifiedBy: string, reason?: string): void {
        if (!this.originalQuantity) {
            this.originalQuantity = this.quantity;
        }

        this.addModificationHistory('quantity_change', this.quantity, newQuantity, modifiedBy, reason);
        this.quantity = newQuantity;
        this.calculateSubtotal();
        this.isModifiedByShop = true;
    }

    applyDiscount(discountPrice: number, modifiedBy: string, reason?: string): void {
        this.addModificationHistory('discount_applied', this.unitDiscountPrice, discountPrice, modifiedBy, reason);
        this.unitDiscountPrice = discountPrice;
        this.calculateSubtotal();
        this.isModifiedByShop = true;
    }

    updatePrice(newPrice: number, modifiedBy: string, reason?: string): void {
        if (!this.originalUnitPrice) {
            this.originalUnitPrice = this.unitPrice;
        }

        this.addModificationHistory('price_change', this.unitPrice, newPrice, modifiedBy, reason);
        this.unitPrice = newPrice;
        this.calculateSubtotal();
        this.isModifiedByShop = true;
    }

    private addModificationHistory(
        type: 'quantity_change' | 'price_change' | 'discount_applied' | 'status_change',
        oldValue: any,
        newValue: any,
        modifiedBy: string,
        reason?: string
    ): void {
        if (!this.modificationHistory) {
            this.modificationHistory = [];
        }

        this.modificationHistory.push({
            type,
            oldValue,
            newValue,
            timestamp: new Date(),
            modifiedBy,
            reason,
        });
    }

    static createFromCartItem(cartItem: any, orderId: string): Partial<OrderItem> {
        return {
            orderId,
            productId: cartItem.productId,
            productName: cartItem.productName,
            productImage: cartItem.productImage,
            productSku: cartItem.productSku,
            productSpecs: cartItem.productSpecs,
            quantity: cartItem.quantity,
            unitPrice: cartItem.unitPrice,
            unitDiscountPrice: cartItem.unitDiscountPrice,
            itemDiscountAmount: cartItem.discountAmount,
            subtotal: cartItem.subtotal,
            status: cartItem.isAvailable ? OrderItemStatus.AVAILABLE : OrderItemStatus.UNAVAILABLE,
            unavailableReason: cartItem.unavailableReason,
            originalCartItemId: cartItem.id,
            customerNotes: cartItem.notes,
        };
    }

    static createShopAddedItem(
        productId: string,
        productDetails: any,
        quantity: number,
        unitPrice: number,
        orderId: string,
        addedBy: string
    ): Partial<OrderItem> {
        const item: Partial<OrderItem> = {
            orderId,
            productId,
            productName: productDetails.productName,
            productImage: productDetails.image,
            productSku: productDetails.sku,
            productSpecs: productDetails.specifications,
            quantity,
            unitPrice,
            unitDiscountPrice: productDetails.discountPrice,
            subtotal: (productDetails.discountPrice || unitPrice) * quantity,
            status: OrderItemStatus.ADDED_BY_SHOP,
            isAddedByShop: true,
            isModifiedByShop: true,
        };

        return item;
    }
}