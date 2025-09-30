import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Product, ProductStatus, ProductUnit } from '../entities/product.entity';
import { ShopResponseDto } from '../../shops/dto/shop-response.dto';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class ProductResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    productName: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ required: false })
    image?: string;

    @ApiProperty()
    salePrice: number;

    @ApiProperty({ required: false })
    discountPrice?: number;

    @ApiProperty()
    hasStock: boolean;

    @ApiProperty({ enum: ProductUnit })
    unit: ProductUnit;

    @ApiProperty()
    quantity: number;

    @ApiProperty({ enum: ProductStatus })
    status: ProductStatus;

    @ApiProperty({ required: false })
    sku?: string;

    @ApiProperty({ required: false })
    weight?: number;

    @ApiProperty({ required: false, isArray: true })
    images?: string[];

    @ApiProperty({ required: false })
    specifications?: Record<string, any>;

    @ApiProperty()
    rating: number;

    @ApiProperty()
    totalReviews: number;

    @ApiProperty()
    stockQuantity: number;

    @ApiProperty()
    minStockLevel: number;

    @ApiProperty({ required: false })
    costPrice?: number;

    @ApiProperty()
    viewCount: number;

    @ApiProperty()
    orderCount: number;

    @ApiProperty({ type: ShopResponseDto })
    shop: ShopResponseDto;

    @ApiProperty()
    shopId: string;

    @ApiProperty({ type: CategoryResponseDto, required: false })
    category?: CategoryResponseDto;

    @ApiProperty({ required: false })
    categoryId?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @Expose()
    @ApiProperty()
    get isActive(): boolean {
        return this.status === ProductStatus.ACTIVE && this.hasStock;
    }

    @Expose()
    @ApiProperty()
    get isOnSale(): boolean {
        return this.discountPrice !== undefined && this.discountPrice !== null && this.discountPrice < this.salePrice;
    }

    @Expose()
    @ApiProperty()
    get discountPercentage(): number {
        if (!this.isOnSale || !this.discountPrice) return 0;
        return Math.round(((this.salePrice - this.discountPrice) / this.salePrice) * 100);
    }

    @Expose()
    @ApiProperty()
    get finalPrice(): number {
        return this.isOnSale && this.discountPrice ? this.discountPrice : this.salePrice;
    }

    @Expose()
    @ApiProperty()
    get isLowStock(): boolean {
        return this.stockQuantity <= this.minStockLevel;
    }

    @Expose()
    @ApiProperty()
    get profit(): number {
        if (!this.costPrice) return 0;
        return this.finalPrice - this.costPrice;
    }

    @Expose()
    @ApiProperty()
    get profitMargin(): number {
        if (!this.costPrice || this.costPrice === 0) return 0;
        return Math.round((this.profit / this.costPrice) * 100);
    }

    constructor(product: Product) {
        this.id = product.id;
        this.productName = product.productName;
        this.description = product.description;
        this.image = product.image;
        this.salePrice = product.salePrice;
        this.discountPrice = product.discountPrice;
        this.hasStock = product.hasStock;
        this.unit = product.unit;
        this.quantity = product.quantity;
        this.status = product.status;
        this.sku = product.sku;
        this.weight = product.weight;
        this.images = product.images;
        this.specifications = product.specifications;
        this.rating = product.rating;
        this.totalReviews = product.totalReviews;
        this.stockQuantity = product.stockQuantity;
        this.minStockLevel = product.minStockLevel;
        this.costPrice = product.costPrice;
        this.viewCount = product.viewCount;
        this.orderCount = product.orderCount;
        this.shopId = product.shopId;
        this.categoryId = product.categoryId;
        this.createdAt = product.createdAt;
        this.updatedAt = product.updatedAt;

        // Include shop if loaded
        if (product.shop) {
            this.shop = new ShopResponseDto(product.shop);
        }

        // Include category if loaded
        if (product.category) {
            this.category = new CategoryResponseDto(product.category);
        }
    }
}