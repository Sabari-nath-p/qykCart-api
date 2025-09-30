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
    HttpStatus,
    ParseUUIDPipe,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
    CreateOrderDto,
    AddOrderItemDto,
    UpdateOrderItemDto,
    UpdateOrderDto,
} from './dto/create-order.dto';
import {
    QueryOrdersDto,
    UpdateOrderStatusDto,
    UpdateOrderItemStatusDto,
    BulkOrderActionDto,
} from './dto/query-orders.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import {
    OrderResponseDto,
    OrderSummaryDto,
} from './dto/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new order from cart',
        description: 'Creates a new order from an existing cart. The cart will be cleared after order creation.'
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Order created successfully',
        type: OrderResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid order data or cart not found',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'User not authenticated',
    })
    async createOrder(
        @Body() createOrderDto: CreateOrderDto,
        @Request() req: any,
    ): Promise<OrderResponseDto> {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestException('User not authenticated');
        }

        return this.ordersService.createOrder(createOrderDto, userId);
    }

    @Get()
    @ApiOperation({
        summary: 'Get orders with filtering and pagination',
        description: 'Retrieves orders based on user role and query parameters. Users see only their orders, shop owners see orders for their shops.'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Orders retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                orders: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/OrderSummaryDto' },
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
            },
        },
    })
    async getOrders(
        @Query() queryDto: QueryOrdersDto,
        @Request() req: any,
    ): Promise<{ orders: OrderSummaryDto[]; total: number; page: number; limit: number }> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        return this.ordersService.getOrders(queryDto, userId, userRole);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get order by ID',
        description: 'Retrieves a specific order by its ID. Users can only view their own orders, shop owners can view orders for their shops.'
    })
    @ApiParam({
        name: 'id',
        description: 'Order ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Order retrieved successfully',
        type: OrderResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Order not found',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Access denied to this order',
    })
    async getOrderById(
        @Param('id', ParseUUIDPipe) orderId: string,
        @Request() req: any,
    ): Promise<OrderResponseDto> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Super admin can see all orders, others are filtered by service
        const filterUserId = userRole === 'super-admin' ? undefined : userId;

        return this.ordersService.getOrderById(orderId, filterUserId);
    }

    @Patch(':id/status')
    @ApiOperation({
        summary: 'Update order status',
        description: 'Updates the status of an order. Only shop owners can update status for their shop orders.'
    })
    @ApiParam({
        name: 'id',
        description: 'Order ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Order status updated successfully',
        type: OrderResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid status transition',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Access denied to update this order',
    })
    async updateOrderStatus(
        @Param('id', ParseUUIDPipe) orderId: string,
        @Body() updateDto: UpdateOrderStatusDto,
        @Request() req: any,
    ): Promise<OrderResponseDto> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        return this.ordersService.updateOrderStatus(orderId, updateDto, userId, userRole);
    }

    @Patch(':id/payment-method')
    @ApiOperation({
        summary: 'Update order payment method',
        description: 'Allows shop owners to change the payment method of an order before delivery. Useful when customers want to switch from cash to credit or vice versa.'
    })
    @ApiParam({
        name: 'id',
        description: 'Order ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Payment method updated successfully',
        type: OrderResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Cannot change payment method or insufficient credit balance',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Only shop owners can update payment method for their orders',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Order not found',
    })
    async updatePaymentMethod(
        @Param('id', ParseUUIDPipe) orderId: string,
        @Body() updateDto: UpdatePaymentMethodDto,
        @Request() req: any,
    ): Promise<OrderResponseDto> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        return this.ordersService.updatePaymentMethod(orderId, updateDto, userId, userRole);
    }

    @Post(':id/items')
    @ApiOperation({
        summary: 'Add item to order',
        description: 'Adds a new item to an existing order. Only shop owners can add items to orders for their shops.'
    })
    @ApiParam({
        name: 'id',
        description: 'Order ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Item added to order successfully',
        type: OrderResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Cannot add item to this order or product not found',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Only shop owners can add items to orders',
    })
    async addOrderItem(
        @Param('id', ParseUUIDPipe) orderId: string,
        @Body() addItemDto: AddOrderItemDto,
        @Request() req: any,
    ): Promise<OrderResponseDto> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        return this.ordersService.addOrderItem(orderId, addItemDto, userId, userRole);
    }

    @Patch(':id/items/:itemId')
    @ApiOperation({
        summary: 'Update order item',
        description: 'Updates an existing order item (quantity, price, etc.). Only shop owners can modify order items.'
    })
    @ApiParam({
        name: 'id',
        description: 'Order ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiParam({
        name: 'itemId',
        description: 'Order Item ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Order item updated successfully',
        type: OrderResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Cannot modify this order item',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Only shop owners can modify order items',
    })
    async updateOrderItem(
        @Param('id', ParseUUIDPipe) orderId: string,
        @Param('itemId', ParseUUIDPipe) orderItemId: string,
        @Body() updateDto: UpdateOrderItemDto,
        @Request() req: any,
    ): Promise<OrderResponseDto> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        return this.ordersService.updateOrderItem(orderId, orderItemId, updateDto, userId, userRole);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update order details',
        description: 'Updates order details like delivery fee, taxes, etc. Only shop owners can modify orders.'
    })
    @ApiParam({
        name: 'id',
        description: 'Order ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Order updated successfully',
        type: OrderResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Cannot modify this order',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Only shop owners can modify orders',
    })
    async updateOrder(
        @Param('id', ParseUUIDPipe) orderId: string,
        @Body() updateDto: UpdateOrderDto,
        @Request() req: any,
    ): Promise<OrderResponseDto> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        return this.ordersService.updateOrder(orderId, updateDto, userId, userRole);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Cancel order',
        description: 'Cancels an order. Users can cancel their own orders, shop owners can cancel orders for their shops.'
    })
    @ApiParam({
        name: 'id',
        description: 'Order ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiQuery({
        name: 'reason',
        description: 'Reason for cancellation',
        required: false,
        type: 'string',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Order cancelled successfully',
        type: OrderResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Order cannot be cancelled',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Access denied to cancel this order',
    })
    async cancelOrder(
        @Param('id', ParseUUIDPipe) orderId: string,
        @Query('reason') reason: string = 'Cancelled by user',
        @Request() req: any,
    ): Promise<OrderResponseDto> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        return this.ordersService.cancelOrder(orderId, reason, userId, userRole);
    }

    // Shop Owner specific endpoints
    @Get('shop/:shopId')
    @ApiOperation({
        summary: 'Get orders for a specific shop',
        description: 'Retrieves all orders for a specific shop. Only accessible by shop owners and super admins.'
    })
    @ApiParam({
        name: 'shopId',
        description: 'Shop ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Shop orders retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                orders: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/OrderSummaryDto' },
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Access denied to this shop',
    })
    async getShopOrders(
        @Param('shopId', ParseUUIDPipe) shopId: string,
        @Query() queryDto: QueryOrdersDto,
        @Request() req: any,
    ): Promise<{ orders: OrderSummaryDto[]; total: number; page: number; limit: number }> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Set shopId in query
        queryDto.shopId = shopId;

        return this.ordersService.getOrders(queryDto, userId, userRole);
    }

    @Get('user/:userId')
    @ApiOperation({
        summary: 'Get orders for a specific user',
        description: 'Retrieves all orders for a specific user. Only accessible by the user themselves or super admins.'
    })
    @ApiParam({
        name: 'userId',
        description: 'User ID',
        type: 'string',
        format: 'uuid',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User orders retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                orders: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/OrderSummaryDto' },
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Access denied to this user\'s orders',
    })
    async getUserOrders(
        @Param('userId', ParseUUIDPipe) targetUserId: string,
        @Query() queryDto: QueryOrdersDto,
        @Request() req: any,
    ): Promise<{ orders: OrderSummaryDto[]; total: number; page: number; limit: number }> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Check permissions - user can only see their own orders, super admin can see all
        if (userRole !== 'super-admin' && userId !== targetUserId) {
            throw new BadRequestException('Access denied to this user\'s orders');
        }

        // Set userId in query
        queryDto.userId = targetUserId;

        return this.ordersService.getOrders(queryDto, userId, userRole);
    }

    // Analytics endpoints
    @Get('analytics/summary')
    @ApiOperation({
        summary: 'Get order analytics summary',
        description: 'Retrieves order analytics and statistics. Accessible by shop owners (for their shop) and super admins.'
    })
    @ApiQuery({
        name: 'shopId',
        description: 'Filter analytics by shop ID',
        required: false,
        type: 'string',
        format: 'uuid',
    })
    @ApiQuery({
        name: 'fromDate',
        description: 'Start date for analytics (YYYY-MM-DD)',
        required: false,
        type: 'string',
        format: 'date',
    })
    @ApiQuery({
        name: 'toDate',
        description: 'End date for analytics (YYYY-MM-DD)',
        required: false,
        type: 'string',
        format: 'date',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Analytics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalOrders: { type: 'number' },
                totalRevenue: { type: 'number' },
                averageOrderValue: { type: 'number' },
                ordersByStatus: {
                    type: 'object',
                    additionalProperties: { type: 'number' },
                },
                ordersByType: {
                    type: 'object',
                    additionalProperties: { type: 'number' },
                },
                recentOrders: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/OrderSummaryDto' },
                },
            },
        },
    })
    async getOrderAnalytics(
        @Query('shopId') shopId?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Request() req?: any,
    ): Promise<any> {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // For now, return basic analytics using existing query method
        const queryDto = new QueryOrdersDto();
        queryDto.shopId = shopId;
        queryDto.fromDate = fromDate;
        queryDto.toDate = toDate;
        queryDto.limit = 100; // Get more data for analytics

        const result = await this.ordersService.getOrders(queryDto, userId, userRole);

        // Calculate basic analytics
        const totalOrders = result.total;
        const totalRevenue = result.orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const ordersByStatus = result.orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const ordersByType = result.orders.reduce((acc, order) => {
            acc[order.orderType] = (acc[order.orderType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalOrders,
            totalRevenue,
            averageOrderValue,
            ordersByStatus,
            ordersByType,
            recentOrders: result.orders.slice(0, 10), // Most recent 10 orders
        };
    }
}