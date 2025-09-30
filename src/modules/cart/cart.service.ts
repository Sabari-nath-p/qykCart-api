import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThan } from 'typeorm';
import { Cart, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto, UpdateCartItemDto, UpdateCartDto } from './dto/cart-operations.dto';
import { QueryCartsDto } from './dto/query-carts.dto';
import { ProductsService } from '../products/products.service';
import { ShopsService } from '../shops/shops.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private readonly cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private readonly cartItemRepository: Repository<CartItem>,
        private readonly productsService: ProductsService,
        private readonly shopsService: ShopsService,
        private readonly usersService: UsersService,
    ) { }

    async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
        // Validate product exists and is from the specified shop
        const product = await this.productsService.findOne(addToCartDto.productId);
        if (product.shopId !== addToCartDto.shopId) {
            throw new BadRequestException('Product does not belong to the specified shop');
        }

        // Get shop to check stock availability policy
        const shop = await this.shopsService.findOne(addToCartDto.shopId);

        // Validate stock if shop requires it
        if (shop.hasStockAvailability && !product.hasStock) {
            throw new BadRequestException('This item is currently out of stock and cannot be added to cart');
        }

        // Get or create cart for this user and shop
        let cart = await this.findOrCreateCart(userId, addToCartDto.shopId, addToCartDto.sessionId);

        // Check if item already exists in cart
        let cartItem = await this.cartItemRepository.findOne({
            where: { cartId: cart.id, productId: addToCartDto.productId },
        });

        if (cartItem) {
            // Update existing item quantity
            cartItem.quantity += addToCartDto.quantity;
            if (addToCartDto.notes) {
                cartItem.notes = addToCartDto.notes;
            }
            cartItem.updateFromProduct(product);

            // Validate stock again for updated quantity
            if (!cartItem.validateStock(shop.hasStockAvailability)) {
                throw new BadRequestException('Insufficient stock for the requested quantity');
            }

            await this.cartItemRepository.save(cartItem);
        } else {
            // Create new cart item
            cartItem = this.cartItemRepository.create({
                cartId: cart.id,
                productId: addToCartDto.productId,
                quantity: addToCartDto.quantity,
                notes: addToCartDto.notes,
            });

            cartItem.updateFromProduct(product);

            // Validate stock
            if (!cartItem.validateStock(shop.hasStockAvailability)) {
                throw new BadRequestException('This item cannot be added to cart due to stock constraints');
            }

            await this.cartItemRepository.save(cartItem);
        }

        // Refresh cart with updated items and recalculate
        cart = await this.findCartWithItems(cart.id);
        cart.calculateTotals();
        cart.updateActivity();

        return this.cartRepository.save(cart);
    }

    async removeFromCart(userId: string, cartItemId: string): Promise<Cart> {
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: cartItemId },
            relations: ['cart'],
        });

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        // Verify ownership
        if (cartItem.cart.userId !== userId) {
            throw new ForbiddenException('You can only modify your own cart items');
        }

        await this.cartItemRepository.remove(cartItem);

        // Refresh cart and recalculate
        const cart = await this.findCartWithItems(cartItem.cartId);
        cart.calculateTotals();
        cart.updateActivity();

        return this.cartRepository.save(cart);
    }

    async updateCartItem(userId: string, cartItemId: string, updateDto: UpdateCartItemDto): Promise<Cart> {
        const cartItem = await this.cartItemRepository.findOne({
            where: { id: cartItemId },
            relations: ['cart', 'product'],
        });

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        // Verify ownership
        if (cartItem.cart.userId !== userId) {
            throw new ForbiddenException('You can only modify your own cart items');
        }

        // Get shop to check stock policy
        const shop = await this.shopsService.findOne(cartItem.cart.shopId);

        // Update quantity and validate stock
        cartItem.quantity = updateDto.quantity;
        if (updateDto.notes !== undefined) {
            cartItem.notes = updateDto.notes;
        }

        cartItem.updateFromProduct(cartItem.product);

        if (!cartItem.validateStock(shop.hasStockAvailability)) {
            throw new BadRequestException('Insufficient stock for the requested quantity');
        }

        await this.cartItemRepository.save(cartItem);

        // Refresh cart and recalculate
        const cart = await this.findCartWithItems(cartItem.cartId);
        cart.calculateTotals();
        cart.updateActivity();

        return this.cartRepository.save(cart);
    }

    async updateCart(userId: string, cartId: string, updateDto: UpdateCartDto): Promise<Cart> {
        const cart = await this.findCartWithItems(cartId);

        if (cart.userId !== userId) {
            throw new ForbiddenException('You can only modify your own cart');
        }

        // Update cart properties
        if (updateDto.notes !== undefined) {
            cart.notes = updateDto.notes;
        }
        if (updateDto.deliveryFee !== undefined) {
            cart.deliveryFee = updateDto.deliveryFee;
        }
        if (updateDto.tax !== undefined) {
            cart.tax = updateDto.tax;
        }

        cart.calculateTotals();
        cart.updateActivity();

        return this.cartRepository.save(cart);
    }

    async clearCart(userId: string, cartId: string): Promise<Cart> {
        const cart = await this.findCartWithItems(cartId);

        if (cart.userId !== userId) {
            throw new ForbiddenException('You can only modify your own cart');
        }

        // Remove all items
        await this.cartItemRepository.delete({ cartId: cart.id });

        // Refresh and recalculate
        cart.items = [];
        cart.calculateTotals();
        cart.updateActivity();

        return this.cartRepository.save(cart);
    }

    async getUserCarts(userId: string, query?: QueryCartsDto): Promise<Cart[]> {
        const queryBuilder = this.cartRepository.createQueryBuilder('cart')
            .leftJoinAndSelect('cart.shop', 'shop')
            .leftJoinAndSelect('cart.user', 'user')
            .leftJoinAndSelect('cart.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .where('cart.userId = :userId', { userId });

        // Apply filters
        if (query?.status) {
            queryBuilder.andWhere('cart.status = :status', { status: query.status });
        }

        if (query?.shopId) {
            queryBuilder.andWhere('cart.shopId = :shopId', { shopId: query.shopId });
        }

        if (!query?.includeEmpty) {
            queryBuilder.andWhere('cart.totalItems > 0');
        }

        // Sorting
        const sortField = query?.sortBy || 'lastActivityAt';
        const sortOrder = query?.sortOrder || 'DESC';
        queryBuilder.orderBy(`cart.${sortField}`, sortOrder);

        return queryBuilder.getMany();
    }

    async getCartById(userId: string, cartId: string): Promise<Cart> {
        const cart = await this.findCartWithItems(cartId);

        if (cart.userId !== userId) {
            throw new ForbiddenException('You can only access your own cart');
        }

        return cart;
    }

    async getActiveCartByShop(userId: string, shopId: string): Promise<Cart | null> {
        const cart = await this.cartRepository.findOne({
            where: {
                userId,
                shopId,
                status: CartStatus.ACTIVE
            },
            relations: ['shop', 'user', 'items', 'items.product'],
        });

        return cart;
    }

    async refreshCartItems(cartId: string): Promise<Cart> {
        const cart = await this.findCartWithItems(cartId);
        const shop = await this.shopsService.findOne(cart.shopId);

        // Update each cart item with latest product info
        for (const item of cart.items) {
            try {
                const product = await this.productsService.findOne(item.productId);
                item.updateFromProduct(product);

                // Validate stock
                if (!item.validateStock(shop.hasStockAvailability)) {
                    item.isAvailable = false;
                    item.unavailableReason = shop.hasStockAvailability ? 'Out of stock' : null;
                }

                await this.cartItemRepository.save(item);
            } catch (error) {
                // Product might be deleted
                item.isAvailable = false;
                item.unavailableReason = 'Product no longer available';
                await this.cartItemRepository.save(item);
            }
        }

        // Recalculate totals
        cart.calculateTotals();
        return this.cartRepository.save(cart);
    }

    async abandonCart(cartId: string): Promise<Cart> {
        const cart = await this.findCartWithItems(cartId);
        cart.status = CartStatus.ABANDONED;
        return this.cartRepository.save(cart);
    }

    async checkoutCart(cartId: string): Promise<Cart> {
        const cart = await this.findCartWithItems(cartId);
        cart.status = CartStatus.CHECKED_OUT;
        return this.cartRepository.save(cart);
    }

    async getCartStats(userId?: string): Promise<{
        totalCarts: number;
        activeCarts: number;
        abandonedCarts: number;
        totalItems: number;
        totalValue: number;
        byStatus: Record<CartStatus, number>;
    }> {
        const where: FindOptionsWhere<Cart> = {};
        if (userId) {
            where.userId = userId;
        }

        const totalCarts = await this.cartRepository.count({ where });
        const activeCarts = await this.cartRepository.count({
            where: { ...where, status: CartStatus.ACTIVE }
        });
        const abandonedCarts = await this.cartRepository.count({
            where: { ...where, status: CartStatus.ABANDONED }
        });

        // Calculate total items and value
        const queryBuilder = this.cartRepository.createQueryBuilder('cart');
        if (userId) {
            queryBuilder.where('cart.userId = :userId', { userId });
        }

        const { totalItems, totalValue } = await queryBuilder
            .select([
                'SUM(cart.totalItems) as "totalItems"',
                'SUM(cart.total) as "totalValue"'
            ])
            .getRawOne();

        // Stats by status
        const byStatus = {} as Record<CartStatus, number>;
        for (const status of Object.values(CartStatus)) {
            byStatus[status] = await this.cartRepository.count({
                where: { ...where, status },
            });
        }

        return {
            totalCarts,
            activeCarts,
            abandonedCarts,
            totalItems: parseInt(totalItems) || 0,
            totalValue: parseFloat(totalValue) || 0,
            byStatus,
        };
    }

    private async findOrCreateCart(userId: string, shopId: string, sessionId?: string): Promise<Cart> {
        // Try to find existing active cart
        let cart = await this.cartRepository.findOne({
            where: {
                userId,
                shopId,
                status: CartStatus.ACTIVE
            },
            relations: ['shop', 'user'],
        });

        if (!cart) {
            // Create new cart
            cart = this.cartRepository.create({
                userId,
                shopId,
                sessionId,
                status: CartStatus.ACTIVE,
                subtotal: 0,
                totalDiscount: 0,
                deliveryFee: 0,
                tax: 0,
                total: 0,
                totalItems: 0,
                totalQuantity: 0,
                lastActivityAt: new Date(),
            });

            cart = await this.cartRepository.save(cart);

            // Load relations
            const cartWithRelations = await this.cartRepository.findOne({
                where: { id: cart.id },
                relations: ['shop', 'user'],
            });

            if (!cartWithRelations) {
                throw new NotFoundException('Failed to load cart relations');
            }

            return cartWithRelations;
        }

        return cart;
    }

    private async findCartWithItems(cartId: string): Promise<Cart> {
        const cart = await this.cartRepository.findOne({
            where: { id: cartId },
            relations: ['shop', 'user', 'items', 'items.product'],
        });

        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        return cart;
    }
}