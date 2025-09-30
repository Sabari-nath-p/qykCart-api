import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

export enum OtpType {
    LOGIN = 'login',
    REGISTRATION = 'registration',
    PASSWORD_RESET = 'password_reset',
}

export enum OtpStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    EXPIRED = 'expired',
    USED = 'used',
}

@Entity('otps')
@Index(['phone', 'type', 'status'])
@Index(['otp', 'phone'])
export class Otp {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 20 })
    phone: string;

    @Column({ length: 6 })
    otp: string;

    @Column({
        type: 'enum',
        enum: OtpType,
        default: OtpType.LOGIN,
    })
    type: OtpType;

    @Column({
        type: 'enum',
        enum: OtpStatus,
        default: OtpStatus.PENDING,
    })
    status: OtpStatus;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ default: 0 })
    attempts: number;

    @Column({ nullable: true })
    verifiedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    // Helper methods
    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    isValid(): boolean {
        return (
            this.status === OtpStatus.PENDING &&
            !this.isExpired() &&
            this.attempts < 3
        );
    }

    markAsVerified(): void {
        this.status = OtpStatus.VERIFIED;
        this.verifiedAt = new Date();
    }

    incrementAttempts(): void {
        this.attempts += 1;
        if (this.attempts >= 3) {
            this.status = OtpStatus.EXPIRED;
        }
    }
}