import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FcmToken, TokenStatus } from '../auth/entities/fcm-token.entity';

export interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, any>;
    imageUrl?: string;
}

export interface NotificationOptions {
    priority?: 'high' | 'normal';
    sound?: string;
    badge?: number;
    clickAction?: string;
}

@Injectable()
export class FcmService {
    private readonly logger = new Logger(FcmService.name);

    constructor(
        @InjectRepository(FcmToken)
        private fcmTokenRepository: Repository<FcmToken>,
    ) { }

    /**
     * Send notification to a specific user
     */
    async sendToUser(
        userId: string,
        payload: NotificationPayload,
        options?: NotificationOptions,
    ): Promise<boolean> {
        try {
            const tokens = await this.fcmTokenRepository.find({
                where: { userId, status: TokenStatus.ACTIVE },
            });

            if (tokens.length === 0) {
                this.logger.warn(`No active FCM tokens found for user: ${userId}`);
                return false;
            }

            const results = await Promise.allSettled(
                tokens.map(token => this.sendToToken(token.token, payload, options))
            );

            // Update last used timestamp for successful sends
            const successfulTokens = tokens.filter((_, index) =>
                results[index].status === 'fulfilled' &&
                (results[index] as PromiseFulfilledResult<boolean>).value
            );

            if (successfulTokens.length > 0) {
                await this.fcmTokenRepository.update(
                    { id: { $in: successfulTokens.map(t => t.id) } as any },
                    { lastUsedAt: new Date() }
                );
            }

            return successfulTokens.length > 0;
        } catch (error) {
            this.logger.error('Error sending notification to user:', error);
            return false;
        }
    }

    /**
     * Send notification to multiple users
     */
    async sendToUsers(
        userIds: string[],
        payload: NotificationPayload,
        options?: NotificationOptions,
    ): Promise<{ success: number; failed: number }> {
        const results = await Promise.allSettled(
            userIds.map(userId => this.sendToUser(userId, payload, options))
        );

        const success = results.filter(
            result => result.status === 'fulfilled' && result.value
        ).length;
        const failed = results.length - success;

        return { success, failed };
    }

    /**
     * Send notification to a specific FCM token
     */
    private async sendToToken(
        token: string,
        payload: NotificationPayload,
        options?: NotificationOptions,
    ): Promise<boolean> {
        try {
            // For now, we'll simulate sending FCM notification
            // In production, you would use Firebase Admin SDK here
            this.logger.log(`Simulating FCM notification to token: ${token.substring(0, 20)}...`);
            this.logger.log(`Title: ${payload.title}`);
            this.logger.log(`Body: ${payload.body}`);
            this.logger.log(`Data: ${JSON.stringify(payload.data || {})}`);

            // Simulate success/failure (in real implementation, this would be Firebase's response)
            const success = Math.random() > 0.1; // 90% success rate for simulation

            if (!success) {
                this.logger.warn(`Failed to send notification to token: ${token.substring(0, 20)}...`);
            }

            return success;
        } catch (error) {
            this.logger.error('Error sending notification to token:', error);
            return false;
        }
    }

    /**
     * Send notification about new order to shop owner
     */
    async sendOrderNotification(
        shopOwnerId: string,
        orderNumber: string,
        customerName: string,
        totalAmount: number,
        itemCount: number,
    ): Promise<boolean> {
        const payload: NotificationPayload = {
            title: '🛒 New Order Received!',
            body: `Order ${orderNumber} from ${customerName} - ₹${totalAmount} (${itemCount} items)`,
            data: {
                type: 'order',
                orderNumber,
                customerName,
                totalAmount: totalAmount.toString(),
                itemCount: itemCount.toString(),
            },
        };

        return this.sendToUser(shopOwnerId, payload, { priority: 'high' });
    }

    /**
     * Send credit-related notifications
     */
    async sendCreditNotification(
        customerId: string,
        shopName: string,
        amount: number,
        type: 'credit_added' | 'payment_received',
        currentBalance: number,
    ): Promise<boolean> {
        let payload: NotificationPayload;

        if (type === 'credit_added') {
            payload = {
                title: '💳 Credit Added',
                body: `₹${amount} credit added at ${shopName}. Balance: ₹${currentBalance}`,
                data: {
                    type: 'credit_added',
                    shopName,
                    amount: amount.toString(),
                    currentBalance: currentBalance.toString(),
                },
            };
        } else {
            payload = {
                title: '💰 Payment Recorded',
                body: `₹${amount} payment recorded at ${shopName}. Balance: ₹${currentBalance}`,
                data: {
                    type: 'payment_received',
                    shopName,
                    amount: amount.toString(),
                    currentBalance: currentBalance.toString(),
                },
            };
        }

        return this.sendToUser(customerId, payload);
    }

    /**
     * Send order status update notification
     */
    async sendOrderStatusNotification(
        userId: string,
        orderNumber: string,
        status: string,
        shopName: string,
    ): Promise<boolean> {
        const statusMessages = {
            'processing': '🔄 Your order is being processed',
            'packed': '📦 Your order has been packed',
            'delivered': '✅ Your order has been delivered',
            'cancelled': '❌ Your order has been cancelled',
        };

        const payload: NotificationPayload = {
            title: statusMessages[status] || '📋 Order Status Update',
            body: `Order ${orderNumber} at ${shopName}`,
            data: {
                type: 'order_status',
                orderNumber,
                status,
                shopName,
            },
        };

        return this.sendToUser(userId, payload);
    }

    /**
     * Clean up expired or invalid tokens
     */
    async cleanupInvalidTokens(): Promise<number> {
        try {
            // Mark tokens as expired if they haven't been used in 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await this.fcmTokenRepository.update(
                {
                    lastUsedAt: { $lt: thirtyDaysAgo } as any,
                    status: TokenStatus.ACTIVE,
                },
                { status: TokenStatus.EXPIRED }
            );

            const affectedRows = (result as any).affected || 0;
            this.logger.log(`Cleaned up ${affectedRows} expired FCM tokens`);
            return affectedRows;
        } catch (error) {
            this.logger.error('Error cleaning up FCM tokens:', error);
            return 0;
        }
    }
}