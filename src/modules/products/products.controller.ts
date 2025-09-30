import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductStatus } from './entities/product.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post('shop/:shopId')
    @ApiOperation({ summary: 'Create a new product for a shop' })
    @ApiResponse({
        status: 201,
        description: 'Product created successfully',
        type: ProductResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 404, description: 'Shop or Category not found' })
    @ApiResponse({ status: 409, description: 'Product with this name already exists in this shop' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    async create(
        @Param('shopId') shopId: string,
        @Body() createProductDto: CreateProductDto,
    ): Promise<ProductResponseDto> {
        const product = await this.productsService.create(createProductDto, shopId);
        return new ProductResponseDto(product);
    }

    @Get()
    @ApiOperation({ summary: 'Get all products with filtering and pagination' })
    @ApiResponse({
        status: 200,
        description: 'Products retrieved successfully',
        type: [ProductResponseDto],
    })
    async findAll(@Query() query: QueryProductsDto): Promise<ProductResponseDto[]> {
        const products = await this.productsService.findAll(query);
        return products.map(product => new ProductResponseDto(product));
    }

    @Get('search')
    @ApiOperation({ summary: 'Search products by name, description, or specifications' })
    @ApiResponse({
        status: 200,
        description: 'Search results retrieved successfully',
        type: [ProductResponseDto],
    })
    @ApiQuery({ name: 'q', description: 'Search term' })
    @ApiQuery({ name: 'shopId', description: 'Shop ID to limit search', required: false })
    async search(
        @Query('q') searchTerm: string,
        @Query('shopId') shopId?: string,
    ): Promise<ProductResponseDto[]> {
        if (!searchTerm) {
            throw new NotFoundException('Search term is required');
        }
        const products = await this.productsService.searchProducts(searchTerm, shopId);
        return products.map(product => new ProductResponseDto(product));
    }

    @Get('featured')
    @ApiOperation({ summary: 'Get featured products' })
    @ApiResponse({
        status: 200,
        description: 'Featured products retrieved successfully',
        type: [ProductResponseDto],
    })
    async getFeatured(): Promise<ProductResponseDto[]> {
        const products = await this.productsService.findFeatured();
        return products.map(product => new ProductResponseDto(product));
    }

    @Get('active')
    @ApiOperation({ summary: 'Get all active products with stock' })
    @ApiResponse({
        status: 200,
        description: 'Active products retrieved successfully',
        type: [ProductResponseDto],
    })
    async getActive(): Promise<ProductResponseDto[]> {
        const products = await this.productsService.findActive();
        return products.map(product => new ProductResponseDto(product));
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get product statistics' })
    @ApiResponse({
        status: 200,
        description: 'Product statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number' },
                active: { type: 'number' },
                inactive: { type: 'number' },
                outOfStock: { type: 'number' },
                inStock: { type: 'number' },
                lowStock: { type: 'number' },
                avgPrice: { type: 'number' },
                totalValue: { type: 'number' },
                avgRating: { type: 'number' },
            },
        },
    })
    @ApiQuery({ name: 'shopId', description: 'Shop ID to filter stats', required: false })
    async getStats(@Query('shopId') shopId?: string) {
        return this.productsService.getProductStats(shopId);
    }

    @Get('shop/:shopId')
    @ApiOperation({ summary: 'Get all products for a specific shop' })
    @ApiResponse({
        status: 200,
        description: 'Shop products retrieved successfully',
        type: [ProductResponseDto],
    })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    async findByShop(
        @Param('shopId') shopId: string,
        @Query() query: QueryProductsDto,
    ): Promise<ProductResponseDto[]> {
        const products = await this.productsService.findByShop(shopId, query);
        return products.map(product => new ProductResponseDto(product));
    }

    @Get('shop/:shopId/top-selling')
    @ApiOperation({ summary: 'Get top selling products for a shop' })
    @ApiResponse({
        status: 200,
        description: 'Top selling products retrieved successfully',
        type: [ProductResponseDto],
    })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiQuery({ name: 'limit', description: 'Number of products to return', required: false })
    async getTopSelling(
        @Param('shopId') shopId: string,
        @Query('limit') limit?: number,
    ): Promise<ProductResponseDto[]> {
        const products = await this.productsService.getTopSellingProducts(shopId, limit);
        return products.map(product => new ProductResponseDto(product));
    }

    @Get('shop/:shopId/low-stock')
    @ApiOperation({ summary: 'Get low stock products for a shop' })
    @ApiResponse({
        status: 200,
        description: 'Low stock products retrieved successfully',
        type: [ProductResponseDto],
    })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiQuery({ name: 'threshold', description: 'Stock threshold', required: false })
    async getLowStock(
        @Param('shopId') shopId: string,
        @Query('threshold') threshold?: number,
    ): Promise<ProductResponseDto[]> {
        const products = await this.productsService.getLowStockProducts(shopId, threshold);
        return products.map(product => new ProductResponseDto(product));
    }

    @Get('category/:categoryId')
    @ApiOperation({ summary: 'Get all products for a specific category' })
    @ApiResponse({
        status: 200,
        description: 'Category products retrieved successfully',
        type: [ProductResponseDto],
    })
    @ApiParam({ name: 'categoryId', description: 'Category ID' })
    async findByCategory(
        @Param('categoryId') categoryId: string,
        @Query() query: QueryProductsDto,
    ): Promise<ProductResponseDto[]> {
        const products = await this.productsService.findByCategory(categoryId, query);
        return products.map(product => new ProductResponseDto(product));
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID' })
    @ApiResponse({
        status: 200,
        description: 'Product retrieved successfully',
        type: ProductResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
        const product = await this.productsService.findOne(id);
        return new ProductResponseDto(product);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update product' })
    @ApiResponse({
        status: 200,
        description: 'Product updated successfully',
        type: ProductResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({ status: 409, description: 'Product with this name already exists in this shop' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
    ): Promise<ProductResponseDto> {
        const product = await this.productsService.update(id, updateProductDto);
        return new ProductResponseDto(product);
    }

    @Patch(':id/stock')
    @ApiOperation({ summary: 'Update product stock' })
    @ApiResponse({
        status: 200,
        description: 'Product stock updated successfully',
        type: ProductResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    async updateStock(
        @Param('id') id: string,
        @Body() body: { stockQuantity: number; hasStock: boolean },
    ): Promise<ProductResponseDto> {
        const product = await this.productsService.updateStock(id, body.stockQuantity, body.hasStock);
        return new ProductResponseDto(product);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update product status' })
    @ApiResponse({
        status: 200,
        description: 'Product status updated successfully',
        type: ProductResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: ProductStatus,
    ): Promise<ProductResponseDto> {
        const product = await this.productsService.updateStatus(id, status);
        return new ProductResponseDto(product);
    }

    @Patch(':id/rating')
    @ApiOperation({ summary: 'Update product rating' })
    @ApiResponse({
        status: 200,
        description: 'Product rating updated successfully',
        type: ProductResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    async updateRating(
        @Param('id') id: string,
        @Body() body: { rating: number; reviewCount: number },
    ): Promise<ProductResponseDto> {
        const product = await this.productsService.updateRating(id, body.rating, body.reviewCount);
        return new ProductResponseDto(product);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete product' })
    @ApiResponse({ status: 200, description: 'Product deleted successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    async remove(@Param('id') id: string): Promise<{ message: string }> {
        await this.productsService.remove(id);
        return { message: 'Product deleted successfully' };
    }
}
