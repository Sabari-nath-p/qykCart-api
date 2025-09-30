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
import { Shop } from '../../shops/entities/shop.entity';
import { Category } from '../../categories/entities/category.entity';

export enum ProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    OUT_OF_STOCK = 'out-of-stock',
    DISCONTINUED = 'discontinued',
}

export enum ProductUnit {
    PIECE = 'piece',
    KG = 'kg',
    GRAM = 'gram',
    LITER = 'liter',
    ML = 'ml',
    PACK = 'pack',
    BOX = 'box',
    DOZEN = 'dozen',
}

@Entity('products')
@Index(['productName'])
@Index(['shopId'])
@Index(['categoryId'])
@Index(['status'])
@Index(['hasStock'])
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    productName: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    image: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    salePrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    discountPrice: number;

    @Column({ default: true })
    hasStock: boolean;

    @Column({
        type: 'enum',
        enum: ProductUnit,
        default: ProductUnit.PIECE,
    })
    unit: ProductUnit;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.0 })
    quantity: number;

    @Column({
        type: 'enum',
        enum: ProductStatus,
        default: ProductStatus.ACTIVE,
    })
    status: ProductStatus;

    // Additional useful fields
    @Column({ length: 255, nullable: true })
    sku: string; // Stock Keeping Unit

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    weight: number;

    @Column({ type: 'json', nullable: true })
    images: string[]; // Multiple product images

    @Column({ type: 'json', nullable: true })
    specifications: Record<string, any>;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
    rating: number;

    @Column({ default: 0 })
    totalReviews: number;

    @Column({ default: 0 })
    stockQuantity: number;

    @Column({ default: 0 })
    minStockLevel: number; // Minimum stock alert level

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    costPrice: number; // Cost price for profit calculation

    @Column({ default: 0 })
    viewCount: number;

    @Column({ default: 0 })
    orderCount: number;

    // Relationships
    @ManyToOne(() => Shop, { eager: true })
    @JoinColumn({ name: 'shopId' })
    shop: Shop;

    @Column({ name: 'shopId' })
    shopId: string;

    @ManyToOne(() => Category, { eager: true, nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @Column({ name: 'categoryId', nullable: true })
    categoryId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual fields
    get isActive(): boolean {
        return this.status === ProductStatus.ACTIVE && this.hasStock;
    }

    get isOnSale(): boolean {
        return this.discountPrice !== null && this.discountPrice < this.salePrice;
    }

    get discountPercentage(): number {
        if (!this.isOnSale) return 0;
        return Math.round(((this.salePrice - this.discountPrice) / this.salePrice) * 100);
    }

    get finalPrice(): number {
        return this.isOnSale ? this.discountPrice : this.salePrice;
    }

    get isLowStock(): boolean {
        return this.stockQuantity <= this.minStockLevel;
    }

    get profit(): number {
        if (!this.costPrice) return 0;
        return this.finalPrice - this.costPrice;
    }

    get profitMargin(): number {
        if (!this.costPrice || this.costPrice === 0) return 0;
        return Math.round((this.profit / this.costPrice) * 100);
    }
}