import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, UpdateCartDto } from './dto/cart-operations.dto';
import { QueryCartsDto } from './dto/query-carts.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@ApiTags('Cart')
@Controller('cart')
// @UseGuards(JwtAuthGuard) // Uncomment when authentication is implemented
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Post('add')
    @ApiOperation({ summary: 'Add product to cart' })
    @ApiResponse({
        status: 201,
        description: 'Product added to cart successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad Request - Invalid product or stock issues' })
    @ApiResponse({ status: 404, description: 'Product or Shop not found' })
    // @ApiBearerAuth()
    async addToCart(
        @Body() addToCartDto: AddToCartDto,
        @Request() req?: any, // This will be replaced with proper auth user
    ): Promise<CartResponseDto> {
        // For now, using a mock user ID - replace with req.user.id when auth is implemented
        const userId = req?.user?.id || 'mock-user-id';

        const cart = await this.cartService.addToCart(userId, addToCartDto);
        return new CartResponseDto(cart);
    }

    @Get('my-carts')
    @ApiOperation({ summary: 'Get all user carts' })
    @ApiResponse({
        status: 200,
        description: 'User carts retrieved successfully',
        type: [CartResponseDto],
    })
    // @ApiBearerAuth()
    async getUserCarts(
        @Query() query: QueryCartsDto,
        @Request() req?: any,
    ): Promise<CartResponseDto[]> {
        const userId = req?.user?.id || 'mock-user-id';

        const carts = await this.cartService.getUserCarts(userId, query);
        return carts.map(cart => new CartResponseDto(cart));
    }

    @Get('shop/:shopId')
    @ApiOperation({ summary: 'Get active cart for a specific shop' })
    @ApiResponse({
        status: 200,
        description: 'Shop cart retrieved successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    // @ApiBearerAuth()
    async getCartByShop(
        @Param('shopId') shopId: string,
        @Request() req?: any,
    ): Promise<CartResponseDto | null> {
        const userId = req?.user?.id || 'mock-user-id';

        const cart = await this.cartService.getActiveCartByShop(userId, shopId);
        return cart ? new CartResponseDto(cart) : null;
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get cart statistics' })
    @ApiResponse({
        status: 200,
        description: 'Cart statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalCarts: { type: 'number' },
                activeCarts: { type: 'number' },
                abandonedCarts: { type: 'number' },
                totalItems: { type: 'number' },
                totalValue: { type: 'number' },
                byStatus: { type: 'object' },
            },
        },
    })
    // @ApiBearerAuth()
    async getCartStats(@Request() req?: any) {
        const userId = req?.user?.id || 'mock-user-id';
        return this.cartService.getCartStats(userId);
    }

    @Get(':cartId')
    @ApiOperation({ summary: 'Get cart by ID' })
    @ApiResponse({
        status: 200,
        description: 'Cart retrieved successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiParam({ name: 'cartId', description: 'Cart ID' })
    // @ApiBearerAuth()
    async getCart(
        @Param('cartId') cartId: string,
        @Request() req?: any,
    ): Promise<CartResponseDto> {
        const userId = req?.user?.id || 'mock-user-id';

        const cart = await this.cartService.getCartById(userId, cartId);
        return new CartResponseDto(cart);
    }

    @Patch(':cartId')
    @ApiOperation({ summary: 'Update cart details' })
    @ApiResponse({
        status: 200,
        description: 'Cart updated successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiParam({ name: 'cartId', description: 'Cart ID' })
    // @ApiBearerAuth()
    async updateCart(
        @Param('cartId') cartId: string,
        @Body() updateCartDto: UpdateCartDto,
        @Request() req?: any,
    ): Promise<CartResponseDto> {
        const userId = req?.user?.id || 'mock-user-id';

        const cart = await this.cartService.updateCart(userId, cartId, updateCartDto);
        return new CartResponseDto(cart);
    }

    @Patch(':cartId/refresh')
    @ApiOperation({ summary: 'Refresh cart items with latest product info' })
    @ApiResponse({
        status: 200,
        description: 'Cart refreshed successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    @ApiParam({ name: 'cartId', description: 'Cart ID' })
    // @ApiBearerAuth()
    async refreshCart(@Param('cartId') cartId: string): Promise<CartResponseDto> {
        const cart = await this.cartService.refreshCartItems(cartId);
        return new CartResponseDto(cart);
    }

    @Patch('item/:itemId')
    @ApiOperation({ summary: 'Update cart item quantity or notes' })
    @ApiResponse({
        status: 200,
        description: 'Cart item updated successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiParam({ name: 'itemId', description: 'Cart Item ID' })
    // @ApiBearerAuth()
    async updateCartItem(
        @Param('itemId') itemId: string,
        @Body() updateCartItemDto: UpdateCartItemDto,
        @Request() req?: any,
    ): Promise<CartResponseDto> {
        const userId = req?.user?.id || 'mock-user-id';

        const cart = await this.cartService.updateCartItem(userId, itemId, updateCartItemDto);
        return new CartResponseDto(cart);
    }

    @Delete('item/:itemId')
    @ApiOperation({ summary: 'Remove item from cart' })
    @ApiResponse({
        status: 200,
        description: 'Item removed from cart successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiParam({ name: 'itemId', description: 'Cart Item ID' })
    // @ApiBearerAuth()
    async removeFromCart(
        @Param('itemId') itemId: string,
        @Request() req?: any,
    ): Promise<CartResponseDto> {
        const userId = req?.user?.id || 'mock-user-id';

        const cart = await this.cartService.removeFromCart(userId, itemId);
        return new CartResponseDto(cart);
    }

    @Delete(':cartId/clear')
    @ApiOperation({ summary: 'Clear all items from cart' })
    @ApiResponse({
        status: 200,
        description: 'Cart cleared successfully',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiParam({ name: 'cartId', description: 'Cart ID' })
    // @ApiBearerAuth()
    async clearCart(
        @Param('cartId') cartId: string,
        @Request() req?: any,
    ): Promise<CartResponseDto> {
        const userId = req?.user?.id || 'mock-user-id';

        const cart = await this.cartService.clearCart(userId, cartId);
        return new CartResponseDto(cart);
    }

    @Patch(':cartId/abandon')
    @ApiOperation({ summary: 'Mark cart as abandoned' })
    @ApiResponse({
        status: 200,
        description: 'Cart marked as abandoned',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    @ApiParam({ name: 'cartId', description: 'Cart ID' })
    // @ApiBearerAuth()
    async abandonCart(@Param('cartId') cartId: string): Promise<CartResponseDto> {
        const cart = await this.cartService.abandonCart(cartId);
        return new CartResponseDto(cart);
    }

    @Patch(':cartId/checkout')
    @ApiOperation({ summary: 'Mark cart as checked out' })
    @ApiResponse({
        status: 200,
        description: 'Cart marked as checked out',
        type: CartResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Cart not found' })
    @ApiParam({ name: 'cartId', description: 'Cart ID' })
    // @ApiBearerAuth()
    async checkoutCart(@Param('cartId') cartId: string): Promise<CartResponseDto> {
        const cart = await this.cartService.checkoutCart(cartId);
        return new CartResponseDto(cart);
    }
}