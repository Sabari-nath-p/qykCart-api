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

export enum ShopStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    PENDING_APPROVAL = 'pending-approval',
    UNDER_MAINTENANCE = 'under-maintenance',
}

export enum WorkingDay {
    MONDAY = 'monday',
    TUESDAY = 'tuesday',
    WEDNESDAY = 'wednesday',
    THURSDAY = 'thursday',
    FRIDAY = 'friday',
    SATURDAY = 'saturday',
    SUNDAY = 'sunday',
}

@Entity('shops')
@Index(['shopName'])
@Index(['city', 'state'])
@Index(['zipCode'])
@Index(['status'])
export class Shop {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    shopName: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ length: 20 })
    zipCode: string;

    @Column({ length: 100 })
    city: string;

    @Column({ length: 100 })
    state: string;

    @Column({ length: 100 })
    district: string;

    @Column({ default: false })
    hasOwnDeliveryPartner: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude: number;

    @Column({
        type: 'enum',
        enum: ShopStatus,
        default: ShopStatus.PENDING_APPROVAL,
    })
    status: ShopStatus;

    @Column({ type: 'time' })
    openingTime: string;

    @Column({ type: 'time' })
    closingTime: string;

    @Column({
        type: 'simple-array',
    })
    workingDays: WorkingDay[];

    // Additional useful fields
    @Column({ length: 20, nullable: true })
    contactPhone: string;

    @Column({ length: 255, nullable: true })
    contactEmail: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    shopImage: string;

    @Column({ type: 'json', nullable: true })
    amenities: string[];

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
    rating: number;

    @Column({ default: 0 })
    totalReviews: number;

    @Column({ default: true })
    isDeliveryAvailable: boolean;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    deliveryRadius: number; // in kilometers

    @Column({ default: false })
    hasStockAvailability: boolean;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    deliveryFee: number;

    // Shop owner relationship
    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @Column({ name: 'ownerId' })
    ownerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual fields
    get isOpen(): boolean {
        const now = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = dayNames[now.getDay()] as WorkingDay;
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

        return (
            this.status === ShopStatus.ACTIVE &&
            this.workingDays.includes(currentDay) &&
            currentTime >= this.openingTime &&
            currentTime <= this.closingTime
        );
    }

    get isActive(): boolean {
        return this.status === ShopStatus.ACTIVE;
    }

    get fullAddress(): string {
        return `${this.address}, ${this.city}, ${this.district}, ${this.state} - ${this.zipCode}`;
    }

    constructor() {
        // Set default working days if not provided
        if (!this.workingDays || this.workingDays.length === 0) {
            this.workingDays = Object.values(WorkingDay);
        }
    }
}