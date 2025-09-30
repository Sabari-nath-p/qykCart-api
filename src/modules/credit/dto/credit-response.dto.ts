import { Expose, Type } from 'class-transformer';
import { CreditAccountStatus } from '../entities/credit-account.entity';
import { TransactionType, TransactionSource } from '../entities/credit-transaction.entity';

export class ShopResponseDto {
    @Expose()
    id: string;

    @Expose()
    shopName: string;

    @Expose()
    city: string;

    @Expose()
    state: string;
}

export class CreditAccountResponseDto {
    @Expose()
    id: string;

    @Expose()
    customerPhone: string;

    @Expose()
    customerNickname: string;

    @Expose()
    customerName: string;

    @Expose()
    totalCreditAmount: number;

    @Expose()
    totalPaidAmount: number;

    @Expose()
    currentBalance: number;

    @Expose()
    creditLimit: number;

    @Expose()
    status: CreditAccountStatus;

    @Expose()
    notes: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;

    @Expose()
    lastCreditDate: Date;

    @Expose()
    lastPaymentDate: Date;

    @Expose()
    @Type(() => ShopResponseDto)
    shop: ShopResponseDto;
}

export class OrderSummaryDto {
    @Expose()
    id: string;

    @Expose()
    orderNumber: string;

    @Expose()
    total: number;

    @Expose()
    status: string;

    @Expose()
    createdAt: Date;
}

export class CreditTransactionResponseDto {
    @Expose()
    id: string;

    @Expose()
    transactionType: TransactionType;

    @Expose()
    transactionSource: TransactionSource;

    @Expose()
    amount: number;

    @Expose()
    remarks: string;

    @Expose()
    balanceAfterTransaction: number;

    @Expose()
    createdAt: Date;

    @Expose()
    @Type(() => OrderSummaryDto)
    order: OrderSummaryDto;

    @Expose()
    @Type(() => CreditAccountResponseDto)
    creditAccount: CreditAccountResponseDto;
}

export class CreditAccountWithTransactionsDto extends CreditAccountResponseDto {
    @Expose()
    @Type(() => CreditTransactionResponseDto)
    transactions: CreditTransactionResponseDto[];
}

export class CreditSummaryDto {
    @Expose()
    totalAccounts: number;

    @Expose()
    activeAccounts: number;

    @Expose()
    totalCreditGiven: number;

    @Expose()
    totalPaymentsReceived: number;

    @Expose()
    totalOutstandingBalance: number;

    @Expose()
    recentTransactions: CreditTransactionResponseDto[];
}