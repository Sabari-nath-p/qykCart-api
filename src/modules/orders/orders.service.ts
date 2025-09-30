import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In, Between } from 'typeorm';
import { Order, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from './entities/order.entity';
import { OrderItem, OrderItemStatus } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { Shop } from '../shops/entities/shop.entity';
import { User } from '../users/entities/user.entity';
import { CreditService } from '../credit/credit.service';
import { FcmService } from '../fcm/fcm.service';
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
import {
    OrderResponseDto,
    OrderSummaryDto,
    OrderItemResponseDto,
    OrderModificationHistoryDto,
    ShopDetailsDto,
    UserDetailsDto,
} from './dto/order-response.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>,
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Shop)
        private shopRepository: Repository<Shop>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private creditService: CreditService, // Inject CreditService
        private fcmService: FcmService, // Inject FcmService
    ) { }

    async createOrder(
        createOrderDto: CreateOrderDto,
        userId: string,
    ): Promise<OrderResponseDto> {
        return await this.orderRepository.manager.transaction(
            async (manager: EntityManager) => {
                // Get cart with items
                const cart = await manager.findOne(Cart, {
                    where: { id: createOrderDto.cartId, userId },
                    relations: ['items', 'items.product', 'shop', 'user'],
                });

                if (!cart) {
                    throw new NotFoundException('Cart not found');
                }

                if (!cart.items || cart.items.length === 0) {
                    throw new BadRequestException('Cart is empty');
                }

                // Validate order type and delivery details
                this.validateOrderDetails(createOrderDto, cart.shop);

                // Validate credit payment requirements
                if (createOrderDto.paymentMethod === PaymentMethod.CREDIT && !createOrderDto.customerPhone) {
                    throw new BadRequestException(
                        'Customer phone number is required for credit payment method'
                    );
                }

                // Create order
                const order = new Order();
                order.userId = userId;
                order.shopId = cart.shopId;
                order.orderType = createOrderDto.orderType;
                order.paymentMethod = createOrderDto.paymentMethod || PaymentMethod.CASH_ON_DELIVERY;
                order.paymentStatus = PaymentStatus.PENDING;
                order.status = OrderStatus.ORDER_PLACED;
                order.customerPhone = createOrderDto.customerPhone; // Set customer phone for credit tracking

                // Set pickup/delivery details
                if (createOrderDto.orderType === OrderType.SHOP_PICKUP) {
                    if (createOrderDto.shopPickupDetails?.pickupNotes) {
                        order.pickupNotes = createOrderDto.shopPickupDetails.pickupNotes;
                    }
                    if (createOrderDto.shopPickupDetails?.pickupDate && createOrderDto.shopPickupDetails?.pickupTime) {
                        const pickupDate = new Date(createOrderDto.shopPickupDetails.pickupDate);
                        const [hours, minutes] = createOrderDto.shopPickupDetails.pickupTime.split(':');
                        pickupDate.setHours(parseInt(hours), parseInt(minutes));
                        order.pickupDate = pickupDate;
                        order.pickupTime = createOrderDto.shopPickupDetails.pickupTime;
                    }
                } else if (createOrderDto.homeDeliveryDetails) {
                    const delivery = createOrderDto.homeDeliveryDetails;
                    order.deliveryAddress = delivery.deliveryAddress;
                    if (delivery.deliveryLandmark) {
                        order.deliveryLandmark = delivery.deliveryLandmark;
                    }
                    order.deliveryPincode = delivery.deliveryPincode;
                    order.deliveryCity = delivery.deliveryCity;
                    order.deliveryState = delivery.deliveryState;
                    order.deliveryContactNumber = delivery.deliveryContactNumber;
                    if (delivery.deliveryNotes) {
                        order.deliveryNotes = delivery.deliveryNotes;
                    }
                }

                // Set estimated date/time
                if (createOrderDto.estimatedDate) {
                    order.estimatedDeliveryDate = new Date(createOrderDto.estimatedDate);
                }
                if (createOrderDto.estimatedTime) {
                    order.estimatedDeliveryTime = createOrderDto.estimatedTime;
                }
                if (createOrderDto.customerNotes) {
                    order.customerNotes = createOrderDto.customerNotes;
                }

                // Calculate order totals
                let subtotalAmount = 0;
                let discountAmount = 0;

                for (const cartItem of cart.items) {
                    const itemTotal = cartItem.quantity * cartItem.unitPrice;
                    const itemDiscount = cartItem.quantity * (cartItem.unitDiscountPrice || 0);
                    subtotalAmount += itemTotal;
                    discountAmount += itemDiscount;
                }

                order.subtotal = subtotalAmount;
                order.discountAmount = discountAmount;
                order.deliveryFee = createOrderDto.orderType === OrderType.HOME_DELIVERY ? cart.shop.deliveryFee || 0 : 0;
                order.total = subtotalAmount - discountAmount + (order.deliveryFee || 0);

                // Generate order number
                order.orderNumber = await this.generateOrderNumber(manager);

                const savedOrder = await manager.save(Order, order);

                // Create order items from cart items
                const orderItems: OrderItem[] = [];
                for (const cartItem of cart.items) {
                    const orderItem = new OrderItem();
                    orderItem.orderId = savedOrder.id;
                    orderItem.productId = cartItem.productId;
                    orderItem.productName = cartItem.productName;
                    orderItem.productImage = cartItem.productImage;
                    orderItem.productSku = cartItem.productSku;
                    orderItem.productSpecs = cartItem.productSpecs;
                    orderItem.quantity = cartItem.quantity;
                    orderItem.unitPrice = cartItem.unitPrice;
                    orderItem.unitDiscountPrice = cartItem.unitDiscountPrice;
                    orderItem.itemDiscountAmount = cartItem.discountAmount;
                    orderItem.subtotal = cartItem.subtotal;
                    orderItem.status = OrderItemStatus.AVAILABLE;
                    orderItem.isAddedByShop = false;
                    orderItem.originalCartItemId = cartItem.id;

                    orderItems.push(orderItem);
                }

                await manager.save(OrderItem, orderItems);

                // Handle credit payment if selected
                if (createOrderDto.paymentMethod === PaymentMethod.CREDIT) {
                    await this.handleCreditOrder(savedOrder, createOrderDto.customerPhone, manager);
                }

                // Send FCM notification to shop owner about new order
                try {
                    const shop = await manager.findOne(Shop, {
                        where: { id: savedOrder.shopId },
                        relations: ['owner'],
                    });

                    if (shop && shop.owner) {
                        await this.fcmService.sendOrderNotification(
                            shop.owner.id,
                            savedOrder.orderNumber,
                            savedOrder.user?.name || 'Customer',
                            Number(savedOrder.total),
                            orderItems.length,
                        );
                    }
                } catch (fcmError) {
                    // Don't fail the order creation if FCM fails
                    console.warn('FCM notification failed for new order:', fcmError);
                }

                // Clear cart after order creation
                await manager.delete(CartItem, { cartId: cart.id });
                await manager.delete(Cart, { id: cart.id });

                // Return order response
                return this.getOrderById(savedOrder.id, userId);
            },
        );
    }

    async getOrderById(orderId: string, userId?: string): Promise<OrderResponseDto> {
        const queryBuilder = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.shop', 'shop')
            .leftJoinAndSelect('order.orderItems', 'orderItems')
            .leftJoinAndSelect('orderItems.product', 'product')
            .where('order.id = :orderId', { orderId });

        if (userId) {
            queryBuilder.andWhere('order.userId = :userId', { userId });
        }

        const order = await queryBuilder.getOne();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return this.mapToOrderResponse(order);
    }

    async getOrders(
        queryDto: QueryOrdersDto,
        userId?: string,
        userRole?: string,
    ): Promise<{ orders: OrderSummaryDto[]; total: number; page: number; limit: number }> {
        const queryBuilder = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.shop', 'shop')
            .leftJoinAndSelect('order.orderItems', 'orderItems');

        // Apply filters based on user role
        if (userRole === 'user' && userId) {
            queryBuilder.andWhere('order.userId = :userId', { userId });
        } else if (userRole === 'shop-owner' && queryDto.shopId) {
            queryBuilder.andWhere('order.shopId = :shopId', { shopId: queryDto.shopId });
        }

        // Apply query filters
        if (queryDto.userId) {
            queryBuilder.andWhere('order.userId = :userId', { userId: queryDto.userId });
        }

        if (queryDto.shopId) {
            queryBuilder.andWhere('order.shopId = :shopId', { shopId: queryDto.shopId });
        }

        if (queryDto.status) {
            queryBuilder.andWhere('order.status = :status', { status: queryDto.status });
        }

        if (queryDto.orderType) {
            queryBuilder.andWhere('order.orderType = :orderType', { orderType: queryDto.orderType });
        }

        if (queryDto.paymentMethod) {
            queryBuilder.andWhere('order.paymentMethod = :paymentMethod', { paymentMethod: queryDto.paymentMethod });
        }

        if (queryDto.paymentStatus) {
            queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: queryDto.paymentStatus });
        }

        if (queryDto.fromDate && queryDto.toDate) {
            queryBuilder.andWhere('order.createdAt BETWEEN :fromDate AND :toDate', {
                fromDate: new Date(queryDto.fromDate),
                toDate: new Date(queryDto.toDate),
            });
        }

        if (queryDto.orderNumber) {
            queryBuilder.andWhere('order.orderNumber LIKE :orderNumber', {
                orderNumber: `%${queryDto.orderNumber}%`,
            });
        }

        if (queryDto.customerName) {
            queryBuilder.andWhere('user.name LIKE :customerName', {
                customerName: `%${queryDto.customerName}%`,
            });
        }

        if (queryDto.customerPhone) {
            queryBuilder.andWhere('user.phoneNumber LIKE :customerPhone', {
                customerPhone: `%${queryDto.customerPhone}%`,
            });
        }

        if (queryDto.minAmount) {
            queryBuilder.andWhere('order.totalAmount >= :minAmount', { minAmount: queryDto.minAmount });
        }

        if (queryDto.maxAmount) {
            queryBuilder.andWhere('order.totalAmount <= :maxAmount', { maxAmount: queryDto.maxAmount });
        }

        // Apply sorting
        queryBuilder.orderBy(`order.${queryDto.sortBy}`, queryDto.sortOrder);

        // Apply pagination
        const page = queryDto.page || 1;
        const limit = queryDto.limit || 20;
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);

        const [orders, total] = await queryBuilder.getManyAndCount();

        const orderSummaries = orders.map(order => this.mapToOrderSummary(order));

        return {
            orders: orderSummaries,
            total,
            page,
            limit,
        };
    }

    async updateOrderStatus(
        orderId: string,
        updateDto: UpdateOrderStatusDto,
        userId: string,
        userRole: string,
    ): Promise<OrderResponseDto> {
        return await this.orderRepository.manager.transaction(
            async (manager: EntityManager) => {
                const order = await manager.findOne(Order, {
                    where: { id: orderId },
                    relations: ['shop'],
                });

                if (!order) {
                    throw new NotFoundException('Order not found');
                }

                // Check permissions
                if (userRole === 'shop-owner' && order.shopId !== userId) {
                    throw new ForbiddenException('You can only update orders for your shop');
                }

                const oldStatus = order.status;
                const oldPaymentStatus = order.paymentStatus;

                // Update status
                if (updateDto.status) {
                    this.validateStatusTransition(oldStatus, updateDto.status);
                    order.status = updateDto.status;

                    if (updateDto.status === OrderStatus.DELIVERED) {
                        order.deliveredAt = new Date();
                    }
                }

                if (updateDto.paymentStatus) {
                    order.paymentStatus = updateDto.paymentStatus;
                }

                if (updateDto.estimatedDate) {
                    order.estimatedDeliveryDate = new Date(updateDto.estimatedDate);
                }

                if (updateDto.estimatedTime) {
                    order.estimatedDeliveryTime = updateDto.estimatedTime;
                }

                // Add to status history instead of modification history
                order.addStatusHistory(updateDto.status || order.status, userId, updateDto.reason);

                await manager.save(Order, order);

                // Send FCM notification to customer about status update
                if (updateDto.status && updateDto.status !== oldStatus) {
                    try {
                        const shop = await manager.findOne(Shop, {
                            where: { id: order.shopId },
                        });

                        await this.fcmService.sendOrderStatusNotification(
                            order.userId,
                            order.orderNumber,
                            updateDto.status,
                            shop?.shopName || 'Shop',
                        );
                    } catch (fcmError) {
                        // Don't fail the status update if FCM fails
                        console.warn('FCM notification failed for status update:', fcmError);
                    }
                }

                return this.getOrderById(orderId);
            },
        );
    }

    async updatePaymentMethod(
        orderId: string,
        updateDto: { paymentMethod: PaymentMethod; reason?: string; notes?: string },
        userId: string,
        userRole: string,
    ): Promise<OrderResponseDto> {
        return await this.orderRepository.manager.transaction(
            async (manager: EntityManager) => {
                const order = await manager.findOne(Order, {
                    where: { id: orderId },
                    relations: ['shop', 'user'],
                });

                if (!order) {
                    throw new NotFoundException('Order not found');
                }

                // Check permissions - only shop owners can change payment method
                if (userRole !== 'shop-owner' || order.shopId !== userId) {
                    throw new ForbiddenException('Only shop owners can update payment method for their orders');
                }

                // Can't change payment method for delivered or cancelled orders
                if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
                    throw new BadRequestException('Cannot change payment method for completed or cancelled orders');
                }

                const oldPaymentMethod = order.paymentMethod;

                // If changing from CREDIT to another method, need to check credit balance
                if (oldPaymentMethod === PaymentMethod.CREDIT && updateDto.paymentMethod !== PaymentMethod.CREDIT) {
                    // If order was paid via credit, we could add logic to reverse credit here
                    // For now, just log this transition
                    console.log(`Payment method changed from CREDIT to ${updateDto.paymentMethod} for order ${order.id}`);
                }

                // If changing to CREDIT from another method, check if customer has sufficient credit
                if (oldPaymentMethod !== PaymentMethod.CREDIT && updateDto.paymentMethod === PaymentMethod.CREDIT) {
                    const customerPhone = order.user.phone;

                    if (!customerPhone) {
                        throw new BadRequestException('Customer phone number is required for credit payment');
                    }

                    try {
                        const creditAccount = await this.creditService.getCreditAccountByPhone(customerPhone, order.shopId);

                        if (creditAccount.currentBalance < Number(order.total)) {
                            throw new BadRequestException(
                                `Insufficient credit balance. Required: ₹${order.total}, Available: ₹${creditAccount.currentBalance}`
                            );
                        }
                    } catch (error) {
                        if (error instanceof NotFoundException) {
                            throw new BadRequestException('Customer does not have a credit account with this shop');
                        }
                        throw error;
                    }
                }

                // Update payment method
                order.paymentMethod = updateDto.paymentMethod;

                // Reset payment status if changing payment method
                if (oldPaymentMethod !== updateDto.paymentMethod) {
                    order.paymentStatus = PaymentStatus.PENDING;
                    order.paymentDate = undefined;
                    order.paymentTransactionId = undefined;
                }

                // Add modification history
                const modification = {
                    field: 'paymentMethod',
                    oldValue: oldPaymentMethod,
                    newValue: updateDto.paymentMethod,
                    reason: updateDto.reason || 'Payment method changed by shop owner',
                    notes: updateDto.notes,
                    changedBy: userId,
                    changedAt: new Date(),
                };

                if (!order.modificationHistory) {
                    order.modificationHistory = [];
                }
                order.modificationHistory.push(modification);

                await manager.save(Order, order);

                // Send FCM notification to customer about payment method change
                try {
                    const paymentMethodNames = {
                        [PaymentMethod.CASH_ON_DELIVERY]: 'Cash on Delivery',
                        [PaymentMethod.CASH_ON_PICKUP]: 'Cash on Pickup',
                        [PaymentMethod.CREDIT]: 'Shop Credit',
                        [PaymentMethod.ONLINE_PAYMENT]: 'Online Payment',
                        [PaymentMethod.UPI]: 'UPI',
                        [PaymentMethod.CARD]: 'Card',
                        [PaymentMethod.WALLET]: 'Wallet',
                    };

                    await this.fcmService.sendToUser(order.userId, {
                        title: '💳 Payment Method Updated',
                        body: `Payment method for order ${order.orderNumber} changed to ${paymentMethodNames[updateDto.paymentMethod]} at ${order.shop.shopName}`,
                        data: {
                            type: 'payment_method_change',
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            oldPaymentMethod: oldPaymentMethod,
                            newPaymentMethod: updateDto.paymentMethod,
                            shopId: order.shopId,
                            shopName: order.shop.shopName,
                        },
                    });
                } catch (fcmError) {
                    // Don't fail the payment method update if FCM fails
                    console.warn('FCM notification failed for payment method update:', fcmError);
                }

                return this.getOrderById(orderId);
            },
        );
    }

    async addOrderItem(
        orderId: string,
        addItemDto: AddOrderItemDto,
        userId: string,
        userRole: string,
    ): Promise<OrderResponseDto> {
        return await this.orderRepository.manager.transaction(
            async (manager: EntityManager) => {
                const order = await manager.findOne(Order, {
                    where: { id: orderId },
                });

                if (!order) {
                    throw new NotFoundException('Order not found');
                }

                // Check permissions - only shop owners can add items
                if (userRole !== 'shop-owner' || order.shopId !== userId) {
                    throw new ForbiddenException('Only shop owners can add items to orders');
                }

                // Check if order status allows modifications
                if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
                    throw new BadRequestException('Cannot modify completed or cancelled orders');
                }

                // Get product
                const product = await manager.findOne(Product, {
                    where: { id: addItemDto.productId, shopId: order.shopId },
                });

                if (!product) {
                    throw new NotFoundException('Product not found in this shop');
                }

                // Create order item
                const orderItem = new OrderItem();
                orderItem.orderId = orderId;
                orderItem.productId = addItemDto.productId;
                orderItem.productName = product.productName;
                orderItem.productImage = product.image;
                orderItem.productSku = product.sku;
                orderItem.productSpecs = product.specifications;
                orderItem.quantity = addItemDto.quantity;
                orderItem.unitPrice = addItemDto.customUnitPrice || product.salePrice;
                orderItem.unitDiscountPrice = addItemDto.customDiscountPrice || product.discountPrice;
                orderItem.itemDiscountAmount = (addItemDto.customDiscountPrice || product.discountPrice || 0) * addItemDto.quantity;
                orderItem.subtotal = addItemDto.quantity * (orderItem.unitPrice - (orderItem.unitDiscountPrice || 0));
                orderItem.status = OrderItemStatus.ADDED_BY_SHOP;
                orderItem.isAddedByShop = true;
                if (addItemDto.shopNotes) {
                    orderItem.shopNotes = addItemDto.shopNotes;
                }

                await manager.save(OrderItem, orderItem);

                // Update order totals
                await this.recalculateOrderTotals(orderId, manager);

                // Add shop modification
                order.addShopModification(
                    'add_item',
                    {
                        productId: addItemDto.productId,
                        productName: product.productName,
                        quantity: addItemDto.quantity,
                        reason: addItemDto.reason,
                    },
                    userId,
                );

                await manager.save(Order, order);

                return this.getOrderById(orderId);
            },
        );
    }

    async updateOrderItem(
        orderId: string,
        orderItemId: string,
        updateDto: UpdateOrderItemDto,
        userId: string,
        userRole: string,
    ): Promise<OrderResponseDto> {
        return await this.orderRepository.manager.transaction(
            async (manager: EntityManager) => {
                const order = await manager.findOne(Order, {
                    where: { id: orderId },
                });

                if (!order) {
                    throw new NotFoundException('Order not found');
                }

                // Check permissions
                if (userRole !== 'shop-owner' || order.shopId !== userId) {
                    throw new ForbiddenException('Only shop owners can modify order items');
                }

                const orderItem = await manager.findOne(OrderItem, {
                    where: { id: orderItemId, orderId },
                    relations: ['product'],
                });

                if (!orderItem) {
                    throw new NotFoundException('Order item not found');
                }

                const oldValues = {
                    quantity: orderItem.quantity,
                    unitPrice: orderItem.unitPrice,
                    unitDiscountPrice: orderItem.unitDiscountPrice,
                    status: orderItem.status,
                };

                // Update fields
                if (updateDto.quantity !== undefined) {
                    orderItem.updateQuantity(updateDto.quantity, userId, updateDto.modificationReason);
                }

                if (updateDto.unitPrice !== undefined) {
                    orderItem.updatePrice(updateDto.unitPrice, userId, updateDto.modificationReason);
                }

                if (updateDto.discountPrice !== undefined) {
                    orderItem.applyDiscount(updateDto.discountPrice, userId, updateDto.modificationReason);
                }

                if (updateDto.unavailableReason) {
                    orderItem.markAsUnavailable(updateDto.unavailableReason, userId);
                }

                if (updateDto.shopNotes) {
                    orderItem.shopNotes = updateDto.shopNotes;
                }

                // Recalculate subtotal
                orderItem.calculateSubtotal();

                await manager.save(OrderItem, orderItem);

                // Update order totals
                await this.recalculateOrderTotals(orderId, manager);

                // Use shop modifications instead of modification history
                order.addShopModification(
                    'update_quantity',
                    {
                        itemId: orderItemId,
                        oldValues,
                        newValues: {
                            quantity: orderItem.quantity,
                            unitPrice: orderItem.unitPrice,
                            unitDiscountPrice: orderItem.unitDiscountPrice,
                            status: orderItem.status,
                        },
                    },
                    userId,
                );

                await manager.save(Order, order);

                return this.getOrderById(orderId);
            },
        );
    }

    async updateOrder(
        orderId: string,
        updateDto: UpdateOrderDto,
        userId: string,
        userRole: string,
    ): Promise<OrderResponseDto> {
        return await this.orderRepository.manager.transaction(
            async (manager: EntityManager) => {
                const order = await manager.findOne(Order, {
                    where: { id: orderId },
                });

                if (!order) {
                    throw new NotFoundException('Order not found');
                }

                // Check permissions
                if (userRole !== 'shop-owner' || order.shopId !== userId) {
                    throw new ForbiddenException('Only shop owners can modify orders');
                }

                const oldValues = {
                    deliveryFee: order.deliveryFee,
                    extraCharges: order.extraCharges,
                    tax: order.tax,
                };

                // Update fields
                if (updateDto.deliveryFee !== undefined) {
                    order.deliveryFee = updateDto.deliveryFee;
                }

                if (updateDto.extraCharges !== undefined) {
                    order.extraCharges = updateDto.extraCharges;
                }

                if (updateDto.tax !== undefined) {
                    order.tax = updateDto.tax;
                }

                if (updateDto.shopNotes) {
                    order.shopNotes = updateDto.shopNotes;
                }

                if (updateDto.estimatedDate) {
                    order.estimatedDeliveryDate = new Date(updateDto.estimatedDate);
                }

                if (updateDto.estimatedTime) {
                    order.estimatedDeliveryTime = updateDto.estimatedTime;
                }

                // Recalculate total
                order.total = order.subtotal - order.discountAmount +
                    (order.deliveryFee || 0) + (order.extraCharges || 0) + (order.tax || 0);

                await manager.save(Order, order);

                // Add shop modification
                order.addShopModification(
                    'change_delivery_fee',
                    {
                        oldValues,
                        newValues: {
                            deliveryFee: order.deliveryFee,
                            extraCharges: order.extraCharges,
                            tax: order.tax,
                        },
                        reason: updateDto.modificationReason,
                    },
                    userId,
                );

                await manager.save(Order, order);

                return this.getOrderById(orderId);
            },
        );
    }

    async cancelOrder(
        orderId: string,
        reason: string,
        userId: string,
        userRole: string,
    ): Promise<OrderResponseDto> {
        return await this.orderRepository.manager.transaction(
            async (manager: EntityManager) => {
                const order = await manager.findOne(Order, {
                    where: { id: orderId },
                });

                if (!order) {
                    throw new NotFoundException('Order not found');
                }

                // Check permissions
                if (userRole === 'user' && order.userId !== userId) {
                    throw new ForbiddenException('You can only cancel your own orders');
                } else if (userRole === 'shop-owner' && order.shopId !== userId) {
                    throw new ForbiddenException('You can only cancel orders for your shop');
                }

                // Check if order can be cancelled
                if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
                    throw new BadRequestException('Order cannot be cancelled');
                }

                const oldStatus = order.status;
                order.status = OrderStatus.CANCELLED;

                // Add to status history
                order.addStatusHistory(OrderStatus.CANCELLED, userId, reason);

                await manager.save(Order, order);

                return this.getOrderById(orderId);
            },
        );
    }

    // Helper methods
    private validateOrderDetails(createOrderDto: CreateOrderDto, shop: Shop): void {
        if (createOrderDto.orderType === OrderType.HOME_DELIVERY) {
            if (!shop.isDeliveryAvailable) {
                throw new BadRequestException('This shop does not offer delivery service');
            }

            if (!createOrderDto.homeDeliveryDetails) {
                throw new BadRequestException('Delivery details are required for home delivery');
            }
        }

        if (createOrderDto.orderType === OrderType.SHOP_PICKUP) {
            // Pickup validation can be added here if needed
        }
    }

    private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
        const validTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.ORDER_PLACED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
            [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
            [OrderStatus.PACKED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
            [OrderStatus.DELIVERED]: [],
            [OrderStatus.CANCELLED]: [],
            [OrderStatus.REFUNDED]: [],
        };

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            throw new BadRequestException(
                `Invalid status transition from ${currentStatus} to ${newStatus}`,
            );
        }
    }

    private async generateOrderNumber(manager: EntityManager): Promise<string> {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const prefix = `ORD${year}${month}${day}`;

        const lastOrder = await manager
            .createQueryBuilder(Order, 'order')
            .where('order.orderNumber LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('order.orderNumber', 'DESC')
            .getOne();

        let sequenceNumber = 1;
        if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
            sequenceNumber = lastSequence + 1;
        }

        return `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
    }

    private async recalculateOrderTotals(orderId: string, manager: EntityManager): Promise<void> {
        const orderItems = await manager.find(OrderItem, {
            where: { orderId },
        });

        let subtotalAmount = 0;
        let discountAmount = 0;

        for (const item of orderItems) {
            if (item.status !== OrderItemStatus.UNAVAILABLE) {
                subtotalAmount += item.quantity * item.unitPrice;
                discountAmount += item.quantity * (item.unitDiscountPrice || 0);
            }
        }

        await manager.update(Order, orderId, {
            subtotal: subtotalAmount,
            discountAmount,
        });

        // Recalculate total amount
        const order = await manager.findOne(Order, { where: { id: orderId } });
        if (order) {
            order.total = subtotalAmount - discountAmount +
                (order.deliveryFee || 0) + (order.extraCharges || 0) + (order.tax || 0);

            await manager.save(Order, order);
        }
    }

    private mapToOrderResponse(order: Order): OrderResponseDto {
        const orderItems = order.items?.map(item => new OrderItemResponseDto({
            id: item.id,
            productId: item.productId || '', // Handle null case
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPrice: item.unitDiscountPrice || 0,
            totalPrice: item.subtotal,
            status: item.status,
            unavailableReason: item.unavailableReason,
            shopNotes: item.shopNotes,
            isShopAddition: item.isAddedByShop,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        })) || [];

        const modificationHistory = order.shopModifications?.map(mod => new OrderModificationHistoryDto({
            timestamp: mod.timestamp,
            type: mod.type,
            field: 'shopModification',
            oldValue: null,
            newValue: mod.details,
            reason: mod.details.reason,
            modifiedBy: mod.modifiedBy,
        })) || [];

        return new OrderResponseDto({
            id: order.id,
            orderNumber: order.orderNumber,
            user: new UserDetailsDto({
                id: order.user?.id,
                name: order.user?.name,
                email: order.user?.email,
                phoneNumber: order.user?.phone,
            }),
            shop: new ShopDetailsDto({
                id: order.shop?.id,
                name: order.shop?.shopName,
                address: order.shop?.address,
                contactNumber: order.shop?.contactPhone,
                email: order.shop?.contactEmail,
                hasDelivery: order.shop?.isDeliveryAvailable,
            }),
            orderItems,
            status: order.status,
            orderType: order.orderType,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            subtotalAmount: order.subtotal,
            discountAmount: order.discountAmount,
            deliveryFee: order.deliveryFee,
            additionalDiscount: 0, // Not available in current Order entity
            extraCharges: order.extraCharges,
            tax: order.tax,
            totalAmount: order.total,
            pickupDateTime: order.pickupDate,
            pickupNotes: order.pickupNotes,
            deliveryAddress: order.deliveryAddress,
            deliveryLandmark: order.deliveryLandmark,
            deliveryPincode: order.deliveryPincode,
            deliveryCity: order.deliveryCity,
            deliveryState: order.deliveryState,
            deliveryContactNumber: order.deliveryContactNumber,
            deliveryNotes: order.deliveryNotes,
            estimatedDate: order.estimatedDeliveryDate,
            estimatedTime: order.estimatedDeliveryTime,
            customerNotes: order.customerNotes,
            shopNotes: order.shopNotes,
            modificationHistory,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            completedAt: order.deliveredAt, // Use deliveredAt as completion date
        });
    }

    private mapToOrderSummary(order: Order): OrderSummaryDto {
        return new OrderSummaryDto({
            id: order.id,
            orderNumber: order.orderNumber,
            shopName: order.shop?.shopName,
            customerName: order.user?.name,
            status: order.status,
            orderType: order.orderType,
            totalAmount: order.total,
            itemCount: order.items?.length || 0,
            createdAt: order.createdAt,
            estimatedDate: order.estimatedDeliveryDate,
        });
    }

    /**
     * Handle credit order integration
     * Automatically adds order amount to customer's credit account
     */
    private async handleCreditOrder(
        order: Order,
        customerPhone?: string,
        manager?: EntityManager
    ): Promise<void> {
        // Validate required data for credit order
        if (!customerPhone) {
            throw new BadRequestException(
                'Customer phone number is required for credit payments'
            );
        }

        try {
            // Try to get existing credit account
            let creditAccount;
            try {
                creditAccount = await this.creditService.getCreditAccountByPhone(
                    order.shopId,
                    customerPhone
                );
            } catch (error) {
                // If account doesn't exist, create one automatically
                if (error instanceof NotFoundException) {
                    creditAccount = await this.creditService.createCreditAccount(
                        order.shopId,
                        {
                            customerPhone,
                            customerNickname: order.user?.name || `Customer-${customerPhone}`,
                            customerName: order.user?.name,
                            notes: `Auto-created for order ${order.orderNumber}`,
                        }
                    );
                } else {
                    throw error;
                }
            }

            // Add credit for the order amount
            await this.creditService.addCredit(
                order.shopId,
                creditAccount.id,
                {
                    amount: Number(order.total),
                    remarks: `Order ${order.orderNumber} - ${order.items?.length || 0} items`,
                    orderId: order.id,
                }
            );

            // Update order payment status to paid since it's on credit
            if (manager) {
                await manager.update(Order, order.id, {
                    paymentStatus: PaymentStatus.PAID,
                    paymentDate: new Date(),
                });
            } else {
                await this.orderRepository.update(order.id, {
                    paymentStatus: PaymentStatus.PAID,
                    paymentDate: new Date(),
                });
            }

        } catch (error) {
            // If credit processing fails, we should handle it gracefully
            console.error('Credit processing failed for order:', order.id, error);
            throw new BadRequestException(
                `Failed to process credit for this order: ${error.message}`
            );
        }
    }
}