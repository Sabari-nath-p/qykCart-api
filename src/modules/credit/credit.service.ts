import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreditAccount, CreditAccountStatus } from './entities/credit-account.entity';
import { CreditTransaction, TransactionType, TransactionSource } from './entities/credit-transaction.entity';
import { Order } from '../orders/entities/order.entity';
import { Shop } from '../shops/entities/shop.entity';
import { User } from '../users/entities/user.entity';
import { FcmService } from '../fcm/fcm.service';
import {
    CreateCreditAccountDto,
    UpdateCreditAccountDto,
} from './dto/credit-account.dto';
import {
    AddCreditDto,
    AddPaymentDto,
    CreateTransactionDto,
} from './dto/credit-transaction.dto';
import {
    QueryCreditAccountsDto,
    QueryCreditTransactionsDto,
} from './dto/query-credit.dto';

@Injectable()
export class CreditService {
    constructor(
        @InjectRepository(CreditAccount)
        private creditAccountRepository: Repository<CreditAccount>,
        @InjectRepository(CreditTransaction)
        private creditTransactionRepository: Repository<CreditTransaction>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Shop)
        private shopRepository: Repository<Shop>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private dataSource: DataSource,
        private fcmService: FcmService,
    ) { }

    // Credit Account Management

    async createCreditAccount(
        shopId: string,
        createCreditAccountDto: CreateCreditAccountDto,
    ): Promise<CreditAccount> {
        // Check if shop exists
        const shop = await this.shopRepository.findOne({ where: { id: shopId } });
        if (!shop) {
            throw new NotFoundException('Shop not found');
        }

        // Check if credit account already exists for this customer in this shop
        const existingAccount = await this.creditAccountRepository.findOne({
            where: {
                shopId,
                customerPhone: createCreditAccountDto.customerPhone,
            },
        });

        if (existingAccount) {
            throw new ConflictException(
                'Credit account already exists for this customer in this shop',
            );
        }

        const creditAccount = this.creditAccountRepository.create({
            shopId,
            ...createCreditAccountDto,
        });

        return await this.creditAccountRepository.save(creditAccount);
    }

    async getCreditAccount(
        shopId: string,
        accountId: string,
    ): Promise<CreditAccount> {
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { id: accountId, shopId },
            relations: ['shop'],
        });

        if (!creditAccount) {
            throw new NotFoundException('Credit account not found');
        }

        return creditAccount;
    }

    async getCreditAccountByPhone(
        shopId: string,
        customerPhone: string,
    ): Promise<CreditAccount> {
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { shopId, customerPhone },
            relations: ['shop'],
        });

        if (!creditAccount) {
            throw new NotFoundException('Credit account not found for this customer');
        }

        return creditAccount;
    }

    async getCreditAccounts(
        shopId: string,
        queryDto: QueryCreditAccountsDto,
    ): Promise<{ accounts: CreditAccount[]; total: number }> {
        const queryBuilder = this.creditAccountRepository
            .createQueryBuilder('account')
            .leftJoinAndSelect('account.shop', 'shop')
            .where('account.shopId = :shopId', { shopId });

        if (queryDto.customerPhone) {
            queryBuilder.andWhere('account.customerPhone LIKE :phone', {
                phone: `%${queryDto.customerPhone}%`,
            });
        }

        if (queryDto.customerNickname) {
            queryBuilder.andWhere('account.customerNickname LIKE :nickname', {
                nickname: `%${queryDto.customerNickname}%`,
            });
        }

        if (queryDto.status) {
            queryBuilder.andWhere('account.status = :status', {
                status: queryDto.status,
            });
        }

        queryBuilder
            .orderBy(`account.${queryDto.sortBy}`, queryDto.sortOrder)
            .limit(queryDto.limit)
            .offset(queryDto.offset);

        const [accounts, total] = await queryBuilder.getManyAndCount();

        return { accounts, total };
    }

    async updateCreditAccount(
        shopId: string,
        accountId: string,
        updateDto: UpdateCreditAccountDto,
    ): Promise<CreditAccount> {
        const creditAccount = await this.getCreditAccount(shopId, accountId);

        Object.assign(creditAccount, updateDto);
        return await this.creditAccountRepository.save(creditAccount);
    }

    // Transaction Management

    async addCredit(
        shopId: string,
        accountId: string,
        addCreditDto: AddCreditDto,
    ): Promise<CreditTransaction> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const creditAccount = await queryRunner.manager.findOne(CreditAccount, {
                where: { id: accountId, shopId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!creditAccount) {
                throw new NotFoundException('Credit account not found');
            }

            if (creditAccount.status !== CreditAccountStatus.ACTIVE) {
                throw new BadRequestException('Credit account is not active');
            }

            // Check if order ID is provided and validate
            let order: Order | null = null;
            if (addCreditDto.orderId) {
                order = await queryRunner.manager.findOne(Order, {
                    where: { id: addCreditDto.orderId, shopId },
                });

                if (!order) {
                    throw new NotFoundException('Order not found');
                }

                // Check if order is already used in credit system
                const existingTransaction = await queryRunner.manager.findOne(
                    CreditTransaction,
                    {
                        where: { orderId: addCreditDto.orderId },
                    },
                );

                if (existingTransaction) {
                    throw new ConflictException(
                        'This order has already been added to credit system',
                    );
                }
            }

            // Check credit limit
            if (!creditAccount.canGiveCredit(addCreditDto.amount)) {
                throw new BadRequestException(
                    'Credit amount exceeds the credit limit for this customer',
                );
            }

            // Create transaction
            const transaction = queryRunner.manager.create(CreditTransaction, {
                creditAccountId: accountId,
                transactionType: TransactionType.CREDIT,
                transactionSource: addCreditDto.orderId
                    ? TransactionSource.ORDER
                    : TransactionSource.MANUAL,
                amount: addCreditDto.amount,
                remarks: addCreditDto.remarks,
                orderId: addCreditDto.orderId,
                balanceAfterTransaction: 0, // Will be calculated after updating account
            });

            // Update credit account
            creditAccount.addCredit(addCreditDto.amount);
            transaction.balanceAfterTransaction = creditAccount.currentBalance;

            await queryRunner.manager.save(CreditAccount, creditAccount);
            const savedTransaction = await queryRunner.manager.save(
                CreditTransaction,
                transaction,
            );

            await queryRunner.commitTransaction();

            // Load the complete transaction with relations
            const completeTransaction = await this.creditTransactionRepository.findOne({
                where: { id: savedTransaction.id },
                relations: ['creditAccount', 'order'],
            });

            if (!completeTransaction) {
                throw new NotFoundException('Transaction not found after creation');
            }

            // Send FCM notification to customer about credit addition
            try {
                const customer = await this.userRepository.findOne({
                    where: { phone: creditAccount.customerPhone },
                });

                if (customer) {
                    const shop = await this.shopRepository.findOne({
                        where: { id: shopId },
                    });

                    await this.fcmService.sendCreditNotification(
                        customer.id,
                        shop?.shopName || 'Shop',
                        addCreditDto.amount,
                        'credit_added',
                        creditAccount.currentBalance,
                    );
                }
            } catch (fcmError) {
                // Don't fail the credit operation if FCM fails
                console.warn('FCM notification failed for credit addition:', fcmError);
            }

            return completeTransaction;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async addPayment(
        shopId: string,
        accountId: string,
        addPaymentDto: AddPaymentDto,
    ): Promise<CreditTransaction> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const creditAccount = await queryRunner.manager.findOne(CreditAccount, {
                where: { id: accountId, shopId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!creditAccount) {
                throw new NotFoundException('Credit account not found');
            }

            if (addPaymentDto.amount > creditAccount.currentBalance) {
                throw new BadRequestException(
                    'Payment amount cannot exceed current balance',
                );
            }

            // Create transaction
            const transaction = queryRunner.manager.create(CreditTransaction, {
                creditAccountId: accountId,
                transactionType: TransactionType.PAYMENT,
                transactionSource: TransactionSource.MANUAL,
                amount: addPaymentDto.amount,
                remarks: addPaymentDto.remarks,
                balanceAfterTransaction: 0, // Will be calculated after updating account
            });

            // Update credit account
            creditAccount.addPayment(addPaymentDto.amount);
            transaction.balanceAfterTransaction = creditAccount.currentBalance;

            await queryRunner.manager.save(CreditAccount, creditAccount);
            const savedTransaction = await queryRunner.manager.save(
                CreditTransaction,
                transaction,
            );

            await queryRunner.commitTransaction();

            // Load the complete transaction with relations
            const completeTransaction = await this.creditTransactionRepository.findOne({
                where: { id: savedTransaction.id },
                relations: ['creditAccount'],
            });

            if (!completeTransaction) {
                throw new NotFoundException('Transaction not found after creation');
            }

            // Send FCM notification to customer about payment received
            try {
                const customer = await this.userRepository.findOne({
                    where: { phone: creditAccount.customerPhone },
                });

                if (customer) {
                    const shop = await this.shopRepository.findOne({
                        where: { id: shopId },
                    });

                    await this.fcmService.sendCreditNotification(
                        customer.id,
                        shop?.shopName || 'Shop',
                        addPaymentDto.amount,
                        'payment_received',
                        creditAccount.currentBalance,
                    );
                }
            } catch (fcmError) {
                // Don't fail the payment operation if FCM fails
                console.warn('FCM notification failed for payment:', fcmError);
            }

            return completeTransaction;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getTransactions(
        shopId: string,
        queryDto: QueryCreditTransactionsDto,
    ): Promise<{ transactions: CreditTransaction[]; total: number }> {
        const queryBuilder = this.creditTransactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.creditAccount', 'account')
            .leftJoinAndSelect('account.shop', 'shop')
            .leftJoinAndSelect('transaction.order', 'order')
            .where('account.shopId = :shopId', { shopId });

        if (queryDto.transactionType) {
            queryBuilder.andWhere('transaction.transactionType = :type', {
                type: queryDto.transactionType,
            });
        }

        if (queryDto.transactionSource) {
            queryBuilder.andWhere('transaction.transactionSource = :source', {
                source: queryDto.transactionSource,
            });
        }

        if (queryDto.customerPhone) {
            queryBuilder.andWhere('account.customerPhone LIKE :phone', {
                phone: `%${queryDto.customerPhone}%`,
            });
        }

        queryBuilder
            .orderBy(`transaction.${queryDto.sortBy}`, queryDto.sortOrder)
            .limit(queryDto.limit)
            .offset(queryDto.offset);

        const [transactions, total] = await queryBuilder.getManyAndCount();

        return { transactions, total };
    }

    async getAccountTransactions(
        shopId: string,
        accountId: string,
        queryDto: QueryCreditTransactionsDto,
    ): Promise<{ transactions: CreditTransaction[]; total: number }> {
        // Verify account belongs to shop
        await this.getCreditAccount(shopId, accountId);

        const queryBuilder = this.creditTransactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.order', 'order')
            .where('transaction.creditAccountId = :accountId', { accountId });

        if (queryDto.transactionType) {
            queryBuilder.andWhere('transaction.transactionType = :type', {
                type: queryDto.transactionType,
            });
        }

        if (queryDto.transactionSource) {
            queryBuilder.andWhere('transaction.transactionSource = :source', {
                source: queryDto.transactionSource,
            });
        }

        queryBuilder
            .orderBy(`transaction.${queryDto.sortBy}`, queryDto.sortOrder)
            .limit(queryDto.limit)
            .offset(queryDto.offset);

        const [transactions, total] = await queryBuilder.getManyAndCount();

        return { transactions, total };
    }

    // Customer APIs (for mobile app)

    async getCustomerCreditAccounts(
        customerPhone: string,
    ): Promise<CreditAccount[]> {
        return await this.creditAccountRepository.find({
            where: { customerPhone },
            relations: ['shop'],
            order: { updatedAt: 'DESC' },
        });
    }

    async getCustomerTransactions(
        customerPhone: string,
        shopId?: string,
    ): Promise<CreditTransaction[]> {
        const queryBuilder = this.creditTransactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.creditAccount', 'account')
            .leftJoinAndSelect('account.shop', 'shop')
            .leftJoinAndSelect('transaction.order', 'order')
            .where('account.customerPhone = :customerPhone', { customerPhone });

        if (shopId) {
            queryBuilder.andWhere('account.shopId = :shopId', { shopId });
        }

        queryBuilder.orderBy('transaction.createdAt', 'DESC');

        return await queryBuilder.getMany();
    }

    // Analytics and Summary

    async getCreditSummary(shopId: string): Promise<{
        totalAccounts: number;
        activeAccounts: number;
        totalCreditGiven: number;
        totalPaymentsReceived: number;
        totalOutstandingBalance: number;
        recentTransactions: CreditTransaction[];
    }> {
        // Get account statistics
        const accountStats = await this.creditAccountRepository
            .createQueryBuilder('account')
            .select([
                'COUNT(*) as totalAccounts',
                'SUM(CASE WHEN account.status = :activeStatus THEN 1 ELSE 0 END) as activeAccounts',
                'SUM(account.totalCreditAmount) as totalCreditGiven',
                'SUM(account.totalPaidAmount) as totalPaymentsReceived',
                'SUM(account.currentBalance) as totalOutstandingBalance',
            ])
            .where('account.shopId = :shopId', { shopId })
            .setParameter('activeStatus', CreditAccountStatus.ACTIVE)
            .getRawOne();

        // Get recent transactions
        const recentTransactions = await this.creditTransactionRepository.find({
            where: {
                creditAccount: {
                    shopId,
                },
            },
            relations: ['creditAccount', 'order'],
            order: { createdAt: 'DESC' },
            take: 10,
        });

        return {
            totalAccounts: parseInt(accountStats.totalAccounts) || 0,
            activeAccounts: parseInt(accountStats.activeAccounts) || 0,
            totalCreditGiven: parseFloat(accountStats.totalCreditGiven) || 0,
            totalPaymentsReceived: parseFloat(accountStats.totalPaymentsReceived) || 0,
            totalOutstandingBalance: parseFloat(accountStats.totalOutstandingBalance) || 0,
            recentTransactions,
        };
    }
}