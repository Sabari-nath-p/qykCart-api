import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    IsOptional,
    IsEnum,
    IsPhoneNumber,
    MinLength,
    MaxLength,
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsPhoneNumber()
    phone?: string;

    @ApiPropertyOptional({ example: 'https://example.com/profile.jpg' })
    @IsOptional()
    @IsString()
    profilePicture?: string;

    @ApiProperty({ example: 'password123', minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({ enum: UserRole, default: UserRole.USER })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;
}