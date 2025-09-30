import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { CreditTransaction } from './credit-transaction.entity';

export enum CreditAccountStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    CLOSED = 'closed',
}

@Entity('credit_accounts')
@Index(['customerPhone'])
@Index(['shopId'])
@Index(['status'])
@Index(['shopId', 'customerPhone'], { unique: true }) // One credit account per customer per shop
export class CreditAccount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Shop that owns this credit account
    @ManyToOne(() => Shop, { eager: true })
    @JoinColumn({ name: 'shopId' })
    shop: Shop;

    @Column({ name: 'shopId' })
    shopId: string;

    // Customer details
    @Column({ length: 20 })
    customerPhone: string; // Primary identifier for credit account

    @Column({ length: 255, nullable: true })
    customerNickname: string; // Shop owner can assign a nickname

    @Column({ length: 255, nullable: true })
    customerName: string; // Optional full name

    // Credit details
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalCreditAmount: number; // Total amount given on credit

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalPaidAmount: number; // Total amount paid by customer

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    currentBalance: number; // Remaining balance (totalCreditAmount - totalPaidAmount)

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    creditLimit: number; // Maximum credit limit set by shop owner

    @Column({
        type: 'enum',
        enum: CreditAccountStatus,
        default: CreditAccountStatus.ACTIVE,
    })
    status: CreditAccountStatus;

    @Column({ type: 'text', nullable: true })
    notes: string; // Shop owner's notes about the customer

    // Timestamps
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastCreditDate: Date; // Last time credit was given

    @Column({ type: 'timestamp', nullable: true })
    lastPaymentDate: Date; // Last time payment was received

    // Related transactions
    @OneToMany(() => CreditTransaction, transaction => transaction.creditAccount, {
        cascade: true,
    })
    transactions: CreditTransaction[];

    // Helper methods
    updateBalance(): void {
        this.currentBalance = Number(this.totalCreditAmount) - Number(this.totalPaidAmount);
    }

    canGiveCredit(amount: number): boolean {
        if (this.status !== CreditAccountStatus.ACTIVE) {
            return false;
        }

        if (this.creditLimit > 0) {
            const newBalance = this.currentBalance + amount;
            return newBalance <= this.creditLimit;
        }

        return true; // No limit set
    }

    addCredit(amount: number): void {
        this.totalCreditAmount = Number(this.totalCreditAmount) + Number(amount);
        this.lastCreditDate = new Date();
        this.updateBalance();
    }

    addPayment(amount: number): void {
        this.totalPaidAmount = Number(this.totalPaidAmount) + Number(amount);
        this.lastPaymentDate = new Date();
        this.updateBalance();
    }
}