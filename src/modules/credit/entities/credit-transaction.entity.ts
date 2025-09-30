import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { CreditAccount } from './credit-account.entity';
import { Order } from '../../orders/entities/order.entity';

export enum TransactionType {
    CREDIT = 'credit', // Amount given on credit
    PAYMENT = 'payment', // Amount paid by customer
}

export enum TransactionSource {
    ORDER = 'order', // From an order
    MANUAL = 'manual', // Manual entry by shop owner
}

@Entity('credit_transactions')
@Index(['creditAccountId'])
@Index(['transactionType'])
@Index(['transactionSource'])
@Index(['orderId'])
@Index(['createdAt'])
export class CreditTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Credit account this transaction belongs to
    @ManyToOne(() => CreditAccount, creditAccount => creditAccount.transactions)
    @JoinColumn({ name: 'creditAccountId' })
    creditAccount: CreditAccount;

    @Column({ name: 'creditAccountId' })
    creditAccountId: string;

    // Transaction details
    @Column({
        type: 'enum',
        enum: TransactionType,
    })
    transactionType: TransactionType;

    @Column({
        type: 'enum',
        enum: TransactionSource,
    })
    transactionSource: TransactionSource;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'text', nullable: true })
    remarks: string; // Optional remarks from shop owner

    // Order reference (optional - only for order-based transactions)
    @ManyToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column({ name: 'orderId', nullable: true })
    orderId: string;

    // Balance after this transaction
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    balanceAfterTransaction: number;

    // Timestamp
    @CreateDateColumn()
    createdAt: Date;

    // Additional metadata
    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>; // For future extensibility
}