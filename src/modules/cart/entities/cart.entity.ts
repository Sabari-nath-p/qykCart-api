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
import { CartItem } from './cart-item.entity';

export enum CartStatus {
    ACTIVE = 'active',
    ABANDONED = 'abandoned',
    CHECKED_OUT = 'checked_out',
}

@Entity('carts')
@Index(['userId'])
@Index(['shopId'])
@Index(['status'])
@Index(['userId', 'shopId'], { unique: true, where: 'status = \'active\'' })
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // User who owns this cart
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ name: 'userId' })
    userId: string;

    // Shop this cart belongs to (one cart per shop per user)
    @ManyToOne(() => Shop, { eager: true })
    @JoinColumn({ name: 'shopId' })
    shop: Shop;

    @Column({ name: 'shopId' })
    shopId: string;

    // Cart items
    @OneToMany(() => CartItem, cartItem => cartItem.cart, {
        cascade: true,
        eager: true
    })
    items: CartItem[];

    @Column({
        type: 'enum',
        enum: CartStatus,
        default: CartStatus.ACTIVE,
    })
    status: CartStatus;

    // Cart metadata
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalDiscount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    deliveryFee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total: number;

    @Column({ default: 0 })
    totalItems: number;

    @Column({ default: 0 })
    totalQuantity: number;

    // Session and tracking
    @Column({ nullable: true })
    sessionId: string;

    @Column({ type: 'json', nullable: true })
    notes: Record<string, any>;

    @Column({ type: 'timestamp', nullable: true })
    lastActivityAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual properties
    get isActive(): boolean {
        return this.status === CartStatus.ACTIVE;
    }

    get isEmpty(): boolean {
        return this.totalItems === 0 || !this.items || this.items.length === 0;
    }

    get hasDiscount(): boolean {
        return this.totalDiscount > 0;
    }

    get finalTotal(): number {
        return Math.max(0, this.subtotal - this.totalDiscount + this.deliveryFee + this.tax);
    }

    // Business methods
    calculateTotals(): void {
        if (!this.items || this.items.length === 0) {
            this.subtotal = 0;
            this.totalDiscount = 0;
            this.totalItems = 0;
            this.totalQuantity = 0;
            this.total = this.deliveryFee + this.tax;
            return;
        }

        this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
        this.totalDiscount = this.items.reduce((sum, item) => sum + item.discountAmount, 0);
        this.totalItems = this.items.length;
        this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
        this.total = this.finalTotal;
    }

    updateActivity(): void {
        this.lastActivityAt = new Date();
    }
}