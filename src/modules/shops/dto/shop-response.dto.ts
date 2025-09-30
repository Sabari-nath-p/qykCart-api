import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ShopStatus, WorkingDay } from '../entities/shop.entity';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class ShopResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    shopName: string;

    @ApiProperty()
    address: string;

    @ApiProperty()
    zipCode: string;

    @ApiProperty()
    city: string;

    @ApiProperty()
    state: string;

    @ApiProperty()
    district: string;

    @ApiProperty()
    hasOwnDeliveryPartner: boolean;

    @ApiProperty({ required: false })
    latitude?: number;

    @ApiProperty({ required: false })
    longitude?: number;

    @ApiProperty({ enum: ShopStatus })
    status: ShopStatus;

    @ApiProperty()
    openingTime: string;

    @ApiProperty()
    closingTime: string;

    @ApiProperty({ enum: WorkingDay, isArray: true })
    workingDays: WorkingDay[];

    @ApiProperty({ required: false })
    contactPhone?: string;

    @ApiProperty({ required: false })
    contactEmail?: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ required: false })
    shopImage?: string;

    @ApiProperty({ required: false, isArray: true })
    amenities?: string[];

    @ApiProperty()
    rating: number;

    @ApiProperty()
    totalReviews: number;

    @ApiProperty()
    isDeliveryAvailable: boolean;

    @ApiProperty({ required: false })
    deliveryRadius?: number;

    @ApiProperty()
    hasStockAvailability: boolean;

    @ApiProperty({ required: false })
    deliveryFee?: number;

    @ApiProperty({ type: UserResponseDto })
    owner: UserResponseDto;

    @ApiProperty()
    ownerId: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @Expose()
    @ApiProperty()
    get isOpen(): boolean {
        const now = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = dayNames[now.getDay()] as WorkingDay;
        const currentTime = now.toTimeString().slice(0, 5);

        return (
            this.status === ShopStatus.ACTIVE &&
            this.workingDays.includes(currentDay) &&
            currentTime >= this.openingTime &&
            currentTime <= this.closingTime
        );
    }

    @Expose()
    @ApiProperty()
    get isActive(): boolean {
        return this.status === ShopStatus.ACTIVE;
    }

    @Expose()
    @ApiProperty()
    get fullAddress(): string {
        return `${this.address}, ${this.city}, ${this.district}, ${this.state} - ${this.zipCode}`;
    }

    constructor(shop?: any) {
        if (shop) {
            this.id = shop.id;
            this.shopName = shop.shopName;
            this.address = shop.address;
            this.zipCode = shop.zipCode;
            this.city = shop.city;
            this.state = shop.state;
            this.district = shop.district;
            this.hasOwnDeliveryPartner = shop.hasOwnDeliveryPartner;
            this.latitude = shop.latitude;
            this.longitude = shop.longitude;
            this.status = shop.status;
            this.openingTime = shop.openingTime;
            this.closingTime = shop.closingTime;
            this.workingDays = shop.workingDays;
            this.hasStockAvailability = shop.hasStockAvailability;
            this.ownerId = shop.ownerId;
            this.createdAt = shop.createdAt;
            this.updatedAt = shop.updatedAt;

            // Include owner if loaded
            if (shop.owner) {
                this.owner = new UserResponseDto(shop.owner);
            }
        }
    }
}