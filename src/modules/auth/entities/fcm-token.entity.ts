import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DeviceType {
    ANDROID = 'android',
    IOS = 'ios',
    WEB = 'web',
}

export enum TokenStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    EXPIRED = 'expired',
}

@Entity('fcm_tokens')
@Index(['userId'])
@Index(['token'], { unique: true })
@Index(['deviceId', 'userId'])
export class FcmToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ name: 'userId' })
    userId: string;

    @Column({ type: 'varchar', length: 500 })
    token: string;

    @Column({ nullable: true })
    deviceId: string;

    @Column({
        type: 'enum',
        enum: DeviceType,
        default: DeviceType.ANDROID,
    })
    deviceType: DeviceType;

    @Column({ nullable: true })
    deviceName: string;

    @Column({ nullable: true })
    appVersion: string;

    @Column({
        type: 'enum',
        enum: TokenStatus,
        default: TokenStatus.ACTIVE,
    })
    status: TokenStatus;

    @Column({ type: 'timestamp', nullable: true })
    lastUsedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Helper methods
    markAsUsed(): void {
        this.lastUsedAt = new Date();
    }

    isActive(): boolean {
        return this.status === TokenStatus.ACTIVE;
    }

    deactivate(): void {
        this.status = TokenStatus.INACTIVE;
    }
}