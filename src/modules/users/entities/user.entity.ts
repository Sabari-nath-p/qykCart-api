import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
    SUPER_ADMIN = 'super-admin',
    SHOP_OWNER = 'shop-owner',
    USER = 'user',
    DELIVERY_PARTNER = 'delivery-partner',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    PENDING_VERIFICATION = 'pending-verification',
}

@Entity('users')
@Index(['phone'], { unique: true })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ unique: true, length: 255, nullable: true })
    email?: string;

    @Column({ length: 20, nullable: true })
    phone: string;

    @Column({ nullable: true })
    profilePicture: string;

    @Column({ nullable: true })
    @Exclude()
    password?: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    status: UserStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // FCM tokens relationship (lazy loading to avoid circular dependency)
    @OneToMany('FcmToken', 'user', { lazy: true })
    fcmTokens: Promise<any[]>;

    // Virtual fields for role checking
    get isSuperAdmin(): boolean {
        return this.role === UserRole.SUPER_ADMIN;
    }

    get isShopOwner(): boolean {
        return this.role === UserRole.SHOP_OWNER;
    }

    get isUser(): boolean {
        return this.role === UserRole.USER;
    }

    get isDeliveryPartner(): boolean {
        return this.role === UserRole.DELIVERY_PARTNER;
    }

    get isActive(): boolean {
        return this.status === UserStatus.ACTIVE;
    }
}