import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
    ORDER_PLACED = 'order_placed',
    PROCESSING = 'processing',
    PACKED = 'packed',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
}

export enum OrderType {
    SHOP_PICKUP = 'shop_pickup',
    HOME_DELIVERY = 'home_delivery',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
    CASH_ON_DELIVERY = 'cash_on_delivery',
    CASH_ON_PICKUP = 'cash_on_pickup',
    ONLINE_PAYMENT = 'online_payment',
    UPI = 'upi',
    CARD = 'card',
    WALLET = 'wallet',
    CREDIT = 'credit', // Shop credit payment
}

@Entity('orders')
@Index(['userId'])
@Index(['shopId'])
@Index(['status'])
@Index(['orderType'])
@Index(['orderNumber'], { unique: true })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderNumber: string;

    // User who placed the order
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ name: 'userId' })
    userId: string;

    // Shop this order belongs to
    @ManyToOne(() => Shop, { eager: true })
    @JoinColumn({ name: 'shopId' })
    shop: Shop;

    @Column({ name: 'shopId' })
    shopId: string;

    // Original cart reference
    @ManyToOne(() => Cart, { nullable: true })
    @JoinColumn({ name: 'cartId' })
    cart: Cart;

    @Column({ name: 'cartId', nullable: true })
    cartId: string;

    // Order items
    @OneToMany(() => OrderItem, (orderItem: OrderItem) => orderItem.order, {
        cascade: true,
        eager: true
    })
    items: OrderItem[];

    // Order details
    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.ORDER_PLACED,
    })
    status: OrderStatus;

    @Column({
        type: 'enum',
        enum: OrderType,
    })
    orderType: OrderType;

    // Pricing details
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discountAmount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    extraCharges: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    deliveryFee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;

    // Shop pickup details
    @Column({ type: 'timestamp', nullable: true })
    pickupDate: Date;

    @Column({ nullable: true })
    pickupTime: string; // Format: "HH:MM"

    @Column({ type: 'text', nullable: true })
    pickupNotes: string;

    // Home delivery details
    @Column({ type: 'text', nullable: true })
    deliveryAddress: string;

    @Column({ nullable: true })
    deliveryLandmark: string;

    @Column({ nullable: true })
    deliveryPincode: string;

    @Column({ nullable: true })
    deliveryCity: string;

    @Column({ nullable: true })
    deliveryState: string;

    @Column({ nullable: true })
    deliveryContactNumber: string;

    @Column({ type: 'text', nullable: true })
    deliveryNotes: string;

    // Customer details for credit tracking
    @Column({ nullable: true, length: 20 })
    customerPhone?: string; // For credit system integration

    // Payment details
    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    paymentStatus: PaymentStatus;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CASH_ON_DELIVERY,
    })
    paymentMethod: PaymentMethod;

    @Column({ nullable: true })
    paymentTransactionId?: string;

    @Column({ type: 'timestamp', nullable: true })
    paymentDate?: Date;

    // Order lifecycle timestamps
    @Column({ type: 'timestamp', nullable: true })
    confirmedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    processingStartedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    packedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deliveredAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    cancelledAt: Date;

    // Order metadata
    @Column({ type: 'json', nullable: true })
    statusHistory: Array<{
        status: OrderStatus;
        timestamp: Date;
        updatedBy: string;
        notes?: string;
    }>;

    @Column({ type: 'json', nullable: true })
    customerNotes: Record<string, any>;

    @Column({ type: 'json', nullable: true })
    shopNotes: Record<string, any>;

    @Column({ default: 0 })
    totalItems: number;

    @Column({ default: 0 })
    totalQuantity: number;

    // Estimated delivery/pickup
    @Column({ type: 'timestamp', nullable: true })
    estimatedDeliveryDate: Date;

    @Column({ nullable: true })
    estimatedDeliveryTime: string;

    // Shop modifications tracking
    @Column({ default: false })
    hasShopModifications: boolean;

    @Column({ type: 'json', nullable: true })
    shopModifications: Array<{
        type: 'add_item' | 'remove_item' | 'update_quantity' | 'apply_discount' | 'change_delivery_fee';
        timestamp: Date;
        details: Record<string, any>;
        modifiedBy: string;
    }>;

    // General order modifications (payment method changes, etc.)
    @Column({ type: 'json', nullable: true })
    modificationHistory: Array<{
        field: string;
        oldValue: any;
        newValue: any;
        reason?: string;
        notes?: string;
        changedBy: string;
        changedAt: Date;
    }>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual properties
    get isShopPickup(): boolean {
        return this.orderType === OrderType.SHOP_PICKUP;
    }

    get isHomeDelivery(): boolean {
        return this.orderType === OrderType.HOME_DELIVERY;
    }

    get isPending(): boolean {
        return this.status === OrderStatus.ORDER_PLACED;
    }

    get isProcessing(): boolean {
        return this.status === OrderStatus.PROCESSING;
    }

    get isCompleted(): boolean {
        return this.status === OrderStatus.DELIVERED;
    }

    get isCancelled(): boolean {
        return this.status === OrderStatus.CANCELLED;
    }

    get canBeModified(): boolean {
        return this.status === OrderStatus.PROCESSING;
    }

    get finalAmount(): number {
        return Math.max(0, this.subtotal - this.discountAmount + this.extraCharges + this.deliveryFee + this.tax);
    }

    // Business methods
    calculateTotals(): void {
        if (!this.items || this.items.length === 0) {
            this.subtotal = 0;
            this.totalItems = 0;
            this.totalQuantity = 0;
        } else {
            this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
            this.totalItems = this.items.length;
            this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
        }

        this.total = this.finalAmount;
    }

    addStatusHistory(status: OrderStatus, updatedBy: string, notes?: string): void {
        if (!this.statusHistory) {
            this.statusHistory = [];
        }

        this.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy,
            notes,
        });

        // Update timestamp fields based on status
        const now = new Date();
        switch (status) {
            case OrderStatus.ORDER_PLACED:
                this.confirmedAt = now;
                break;
            case OrderStatus.PROCESSING:
                this.processingStartedAt = now;
                break;
            case OrderStatus.PACKED:
                this.packedAt = now;
                break;
            case OrderStatus.DELIVERED:
                this.deliveredAt = now;
                break;
            case OrderStatus.CANCELLED:
                this.cancelledAt = now;
                break;
        }
    }

    addShopModification(
        type: 'add_item' | 'remove_item' | 'update_quantity' | 'apply_discount' | 'change_delivery_fee',
        details: Record<string, any>,
        modifiedBy: string
    ): void {
        if (!this.shopModifications) {
            this.shopModifications = [];
        }

        this.shopModifications.push({
            type,
            timestamp: new Date(),
            details,
            modifiedBy,
        });

        this.hasShopModifications = true;
    }

    generateOrderNumber(): string {
        const prefix = 'ORD';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }
}