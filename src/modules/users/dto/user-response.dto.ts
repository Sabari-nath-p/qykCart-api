import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  profilePicture?: string;

  @Exclude()
  password: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @ApiProperty()
  get isSuperAdmin(): boolean {
    return this.role === UserRole.SUPER_ADMIN;
  }

  @Expose()
  @ApiProperty()
  get isShopOwner(): boolean {
    return this.role === UserRole.SHOP_OWNER;
  }

  @Expose()
  @ApiProperty()
  get isUser(): boolean {
    return this.role === UserRole.USER;
  }

  @Expose()
  @ApiProperty()
  get isDeliveryPartner(): boolean {
    return this.role === UserRole.DELIVERY_PARTNER;
  }

  @Expose()
  @ApiProperty()
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  constructor(user?: any) {
    if (user) {
      this.id = user.id;
      this.name = user.name;
      this.email = user.email;
      this.phone = user.phone;
      this.profilePicture = user.profilePicture;
      this.role = user.role;
      this.status = user.status;
      this.createdAt = user.createdAt;
      this.updatedAt = user.updatedAt;
    }
  }
}