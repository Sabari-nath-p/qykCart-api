import {
    IsString,
    IsPhoneNumber,
    IsEnum,
    IsOptional,
    Length,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType } from '../entities/fcm-token.entity';

export class SendOtpDto {
    @ApiProperty({
        description: 'Phone number in international format',
        example: '+919876543210'
    })
    @IsString()
    @Matches(/^\+[1-9]\d{10,14}$/, {
        message: 'Phone number must be in international format (+country_code followed by number)'
    })
    phone: string;
}

export class VerifyOtpDto {
    @ApiProperty({
        description: 'Phone number in international format',
        example: '+919876543210'
    })
    @IsString()
    @Matches(/^\+[1-9]\d{10,14}$/, {
        message: 'Phone number must be in international format (+country_code followed by number)'
    })
    phone: string;

    @ApiProperty({
        description: 'OTP code',
        example: '759409'
    })
    @IsString()
    @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
    @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
    otp: string;

    @ApiPropertyOptional({
        description: 'FCM token for push notifications',
        example: 'fcm_token_string_here'
    })
    @IsOptional()
    @IsString()
    fcmToken?: string;

    @ApiPropertyOptional({
        description: 'Device ID for FCM token management',
        example: 'device_unique_id'
    })
    @IsOptional()
    @IsString()
    deviceId?: string;

    @ApiPropertyOptional({
        enum: DeviceType,
        description: 'Device type',
        default: DeviceType.ANDROID
    })
    @IsOptional()
    @IsEnum(DeviceType)
    deviceType?: DeviceType;

    @ApiPropertyOptional({
        description: 'Device name',
        example: 'Samsung Galaxy S21'
    })
    @IsOptional()
    @IsString()
    deviceName?: string;

    @ApiPropertyOptional({
        description: 'App version',
        example: '1.0.0'
    })
    @IsOptional()
    @IsString()
    appVersion?: string;
}

export class UpdateProfileDto {
    @ApiProperty({
        description: 'User full name',
        example: 'John Doe'
    })
    @IsString()
    @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
    name: string;

    @ApiPropertyOptional({
        description: 'User email address',
        example: 'john.doe@example.com'
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({
        description: 'Profile picture URL',
        example: 'https://example.com/profile.jpg'
    })
    @IsOptional()
    @IsString()
    profilePicture?: string;
}

export class UpdateFcmTokenDto {
    @ApiProperty({
        description: 'FCM token for push notifications',
        example: 'fcm_token_string_here'
    })
    @IsString()
    fcmToken: string;

    @ApiPropertyOptional({
        description: 'Device ID for FCM token management',
        example: 'device_unique_id'
    })
    @IsOptional()
    @IsString()
    deviceId?: string;

    @ApiPropertyOptional({
        enum: DeviceType,
        description: 'Device type',
        default: DeviceType.ANDROID
    })
    @IsOptional()
    @IsEnum(DeviceType)
    deviceType?: DeviceType;

    @ApiPropertyOptional({
        description: 'Device name',
        example: 'Samsung Galaxy S21'
    })
    @IsOptional()
    @IsString()
    deviceName?: string;

    @ApiPropertyOptional({
        description: 'App version',
        example: '1.0.0'
    })
    @IsOptional()
    @IsString()
    appVersion?: string;
}