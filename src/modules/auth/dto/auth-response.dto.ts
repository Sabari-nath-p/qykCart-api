import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../users/entities/user.entity';

export class AuthUserDto {
    @Expose()
    @ApiProperty()
    id: string;

    @Expose()
    @ApiProperty()
    name: string;

    @Expose()
    @ApiProperty()
    email: string;

    @Expose()
    @ApiProperty()
    phone: string;

    @Expose()
    @ApiProperty()
    profilePicture: string;

    @Expose()
    @ApiProperty({ enum: UserRole })
    role: UserRole;

    @Expose()
    @ApiProperty({ enum: UserStatus })
    status: UserStatus;

    @Expose()
    @ApiProperty()
    createdAt: Date;

    @Expose()
    @ApiProperty()
    updatedAt: Date;
}

export class AuthResponseDto {
    @Expose()
    @ApiProperty()
    accessToken: string;

    @Expose()
    @ApiProperty()
    refreshToken: string;

    @Expose()
    @ApiProperty()
    isNewUser: boolean;

    @Expose()
    @Type(() => AuthUserDto)
    @ApiProperty({ type: AuthUserDto })
    user: AuthUserDto;
}

export class OtpResponseDto {
    @Expose()
    @ApiProperty()
    success: boolean;

    @Expose()
    @ApiProperty()
    message: string;

    @Expose()
    @ApiProperty()
    expiresAt: Date;
}

export class FcmTokenResponseDto {
    @Expose()
    @ApiProperty()
    id: string;

    @Expose()
    @ApiProperty()
    token: string;

    @Expose()
    @ApiProperty()
    deviceId: string;

    @Expose()
    @ApiProperty()
    deviceType: string;

    @Expose()
    @ApiProperty()
    deviceName: string;

    @Expose()
    @ApiProperty()
    status: string;

    @Expose()
    @ApiProperty()
    createdAt: Date;
}