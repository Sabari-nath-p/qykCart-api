import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Product, ProductStatus, ProductUnit } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { ShopsService } from '../shops/shops.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        private readonly shopsService: ShopsService,
        private readonly categoriesService: CategoriesService,
    ) { }

    async create(createProductDto: CreateProductDto, shopId: string): Promise<Product> {
        // Verify shop exists and user has permission
        const shop = await this.shopsService.findOne(shopId);
        if (!shop) {
            throw new NotFoundException('Shop not found');
        }

        // Verify category exists if provided
        if (createProductDto.categoryId) {
            const category = await this.categoriesService.findOne(createProductDto.categoryId);
            if (!category.isActive) {
                throw new BadRequestException('Cannot assign product to inactive category');
            }
        }

        // Check if product name already exists in this shop
        const existingProduct = await this.productRepository.findOne({
            where: { productName: createProductDto.productName, shopId },
        });

        if (existingProduct) {
            throw new ConflictException(
                'Product with this name already exists in this shop',
            );
        }

        // Validate pricing
        if (createProductDto.discountPrice && createProductDto.discountPrice >= createProductDto.salePrice) {
            throw new BadRequestException('Discount price must be less than sale price');
        }

        const product = this.productRepository.create({
            ...createProductDto,
            shopId,
        });

        return this.productRepository.save(product);
    }

    async findAll(queryDto: QueryProductsDto): Promise<Product[]> {
        const queryBuilder = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.shop', 'shop')
            .leftJoinAndSelect('product.category', 'category');

        // Filter by shop
        if (queryDto.shopId) {
            queryBuilder.andWhere('product.shopId = :shopId', { shopId: queryDto.shopId });
        }

        // Filter by category
        if (queryDto.categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: queryDto.categoryId });
        }

        // Filter by status
        if (queryDto.status) {
            queryBuilder.andWhere('product.status = :status', { status: queryDto.status });
        }

        // Filter by stock availability
        if (queryDto.hasStock !== undefined) {
            queryBuilder.andWhere('product.hasStock = :hasStock', { hasStock: queryDto.hasStock });
        }

        // Filter by unit
        if (queryDto.unit) {
            queryBuilder.andWhere('product.unit = :unit', { unit: queryDto.unit });
        }

        // Price range filtering
        if (queryDto.minPrice) {
            queryBuilder.andWhere('product.salePrice >= :minPrice', { minPrice: queryDto.minPrice });
        }

        if (queryDto.maxPrice) {
            queryBuilder.andWhere('product.salePrice <= :maxPrice', { maxPrice: queryDto.maxPrice });
        }

        // Search by name or description
        if (queryDto.search) {
            queryBuilder.andWhere(
                '(product.productName ILIKE :search OR product.description ILIKE :search)',
                { search: `%${queryDto.search}%` }
            );
        }

        // Filter by rating
        if (queryDto.minRating) {
            queryBuilder.andWhere('product.rating >= :minRating', { minRating: queryDto.minRating });
        }

        // Filter on sale products
        if (queryDto.onSale) {
            queryBuilder.andWhere('product.discountPrice IS NOT NULL AND product.discountPrice < product.salePrice');
        }

        // Filter low stock products
        if (queryDto.lowStock) {
            queryBuilder.andWhere('product.stockQuantity <= product.minStockLevel');
        }

        // Sorting
        const sortField = queryDto.sortBy || 'createdAt';
        const sortOrder = queryDto.sortOrder || 'DESC';
        queryBuilder.orderBy(`product.${sortField}`, sortOrder);

        // Pagination
        const page = queryDto.page || 1;
        const limit = queryDto.limit || 10;
        const offset = (page - 1) * limit;

        queryBuilder.skip(offset).take(limit);

        return queryBuilder.getMany();
    }

    async findByShop(shopId: string, queryDto?: QueryProductsDto): Promise<Product[]> {
        const modifiedQuery = { ...queryDto, shopId };
        return this.findAll(modifiedQuery);
    }

    async findByCategory(categoryId: string, queryDto?: QueryProductsDto): Promise<Product[]> {
        const modifiedQuery = { ...queryDto, categoryId };
        return this.findAll(modifiedQuery);
    }

    async findActive(): Promise<Product[]> {
        return this.productRepository.find({
            where: { status: ProductStatus.ACTIVE, hasStock: true },
            relations: ['shop', 'category'],
            order: { createdAt: 'DESC' },
        });
    }

    async findFeatured(): Promise<Product[]> {
        return this.productRepository.find({
            where: { status: ProductStatus.ACTIVE, hasStock: true },
            relations: ['shop', 'category'],
            order: { orderCount: 'DESC', rating: 'DESC' },
            take: 10, // Top 10 featured products
        });
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['shop', 'category'],
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Increment view count
        product.viewCount += 1;
        await this.productRepository.save(product);

        return product;
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        const product = await this.findOne(id);

        // Check if product name already exists in this shop (excluding current product)
        if (updateProductDto.productName) {
            const existingProduct = await this.productRepository.findOne({
                where: { productName: updateProductDto.productName, shopId: product.shopId },
            });

            if (existingProduct && existingProduct.id !== id) {
                throw new ConflictException(
                    'Product with this name already exists in this shop',
                );
            }
        }

        // Verify category exists if being updated
        if (updateProductDto.categoryId) {
            const category = await this.categoriesService.findOne(updateProductDto.categoryId);
            if (!category.isActive) {
                throw new BadRequestException('Cannot assign product to inactive category');
            }
        }

        // Validate pricing if being updated
        const salePrice = updateProductDto.salePrice || product.salePrice;
        const discountPrice = updateProductDto.discountPrice || product.discountPrice;

        if (discountPrice && discountPrice >= salePrice) {
            throw new BadRequestException('Discount price must be less than sale price');
        }

        Object.assign(product, updateProductDto);
        return this.productRepository.save(product);
    }

    async updateStock(id: string, stockQuantity: number, hasStock: boolean): Promise<Product> {
        const product = await this.findOne(id);
        product.stockQuantity = stockQuantity;
        product.hasStock = hasStock;
        return this.productRepository.save(product);
    }

    async updateStatus(id: string, status: ProductStatus): Promise<Product> {
        const product = await this.findOne(id);
        product.status = status;
        return this.productRepository.save(product);
    }

    async remove(id: string): Promise<void> {
        const product = await this.findOne(id);
        await this.productRepository.remove(product);
    }

    async getProductStats(shopId?: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        outOfStock: number;
        inStock: number;
        lowStock: number;
        byStatus: Record<ProductStatus, number>;
        byUnit: Record<ProductUnit, number>;
        avgPrice: number;
        totalValue: number;
        avgRating: number;
    }> {
        const where: FindOptionsWhere<Product> = {};
        if (shopId) {
            where.shopId = shopId;
        }

        const total = await this.productRepository.count({ where });
        const active = await this.productRepository.count({
            where: { ...where, status: ProductStatus.ACTIVE },
        });
        const inactive = await this.productRepository.count({
            where: { ...where, status: ProductStatus.INACTIVE },
        });
        const outOfStock = await this.productRepository.count({
            where: { ...where, hasStock: false },
        });
        const inStock = await this.productRepository.count({
            where: { ...where, hasStock: true },
        });

        // Low stock count
        const lowStockQuery = this.productRepository.createQueryBuilder('product')
            .where('product.stockQuantity <= product.minStockLevel');

        if (shopId) {
            lowStockQuery.andWhere('product.shopId = :shopId', { shopId });
        }

        const lowStock = await lowStockQuery.getCount();

        // Stats by status
        const byStatus = {} as Record<ProductStatus, number>;
        for (const status of Object.values(ProductStatus)) {
            byStatus[status] = await this.productRepository.count({
                where: { ...where, status },
            });
        }

        // Stats by unit
        const byUnit = {} as Record<ProductUnit, number>;
        for (const unit of Object.values(ProductUnit)) {
            byUnit[unit] = await this.productRepository.count({
                where: { ...where, unit },
            });
        }

        // Calculate average price, total value, and average rating
        const queryBuilder = this.productRepository.createQueryBuilder('product');
        if (shopId) {
            queryBuilder.where('product.shopId = :shopId', { shopId });
        }

        const stats = await queryBuilder
            .select([
                'AVG(product.salePrice) as "avgPrice"',
                'SUM(product.salePrice * product.stockQuantity) as "totalValue"',
                'AVG(product.rating) as "avgRating"'
            ])
            .getRawOne();

        return {
            total,
            active,
            inactive,
            outOfStock,
            inStock,
            lowStock,
            byStatus,
            byUnit,
            avgPrice: parseFloat(stats.avgPrice) || 0,
            totalValue: parseFloat(stats.totalValue) || 0,
            avgRating: parseFloat(stats.avgRating) || 0,
        };
    }

    async searchProducts(searchTerm: string, shopId?: string): Promise<Product[]> {
        const queryBuilder = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.shop', 'shop')
            .leftJoinAndSelect('product.category', 'category')
            .where('product.status = :status', { status: ProductStatus.ACTIVE })
            .andWhere(
                '(product.productName ILIKE :search OR product.description ILIKE :search OR CAST(product.specifications AS TEXT) ILIKE :search)',
                { search: `%${searchTerm}%` }
            );

        if (shopId) {
            queryBuilder.andWhere('product.shopId = :shopId', { shopId });
        }

        return queryBuilder.orderBy('product.productName', 'ASC').getMany();
    }

    async getTopSellingProducts(shopId?: string, limit: number = 10): Promise<Product[]> {
        const queryBuilder = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.shop', 'shop')
            .leftJoinAndSelect('product.category', 'category')
            .where('product.status = :status', { status: ProductStatus.ACTIVE })
            .andWhere('product.hasStock = :hasStock', { hasStock: true });

        if (shopId) {
            queryBuilder.andWhere('product.shopId = :shopId', { shopId });
        }

        return queryBuilder
            .orderBy('product.orderCount', 'DESC')
            .addOrderBy('product.rating', 'DESC')
            .limit(limit)
            .getMany();
    }

    async getLowStockProducts(shopId?: string, customThreshold?: number): Promise<Product[]> {
        const queryBuilder = this.productRepository.createQueryBuilder('product')
            .leftJoinAndSelect('product.shop', 'shop')
            .leftJoinAndSelect('product.category', 'category')
            .where('product.status = :status', { status: ProductStatus.ACTIVE });

        if (customThreshold) {
            queryBuilder.andWhere('product.stockQuantity <= :threshold', { threshold: customThreshold });
        } else {
            queryBuilder.andWhere('product.stockQuantity <= product.minStockLevel');
        }

        if (shopId) {
            queryBuilder.andWhere('product.shopId = :shopId', { shopId });
        }

        return queryBuilder.orderBy('product.stockQuantity', 'ASC').getMany();
    }

    async getProductCount(shopId?: string): Promise<number> {
        const where: FindOptionsWhere<Product> = {};
        if (shopId) {
            where.shopId = shopId;
        }
        return this.productRepository.count({ where });
    }

    async incrementOrderCount(id: string): Promise<void> {
        await this.productRepository.increment({ id }, 'orderCount', 1);
    }

    async updateRating(id: string, newRating: number, reviewCount: number): Promise<Product> {
        const product = await this.findOne(id);
        product.rating = newRating;
        product.totalReviews = reviewCount;
        return this.productRepository.save(product);
    }
}
