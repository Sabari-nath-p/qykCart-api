import {
    IsString,
    IsOptional,
    IsPhoneNumber,
    IsEnum,
    IsNumber,
    IsPositive,
    Min,
    Max,
    Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreditAccountStatus } from '../entities/credit-account.entity';

export class CreateCreditAccountDto {
    @IsString()
    @Length(10, 20)
    customerPhone: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    customerNickname?: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    customerName?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    @Min(0)
    @Max(999999.99)
    creditLimit?: number;

    @IsOptional()
    @IsString()
    @Length(1, 1000)
    notes?: string;
}

export class UpdateCreditAccountDto {
    @IsOptional()
    @IsString()
    @Length(1, 255)
    customerNickname?: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    customerName?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    @Min(0)
    @Max(999999.99)
    creditLimit?: number;

    @IsOptional()
    @IsEnum(CreditAccountStatus)
    status?: CreditAccountStatus;

    @IsOptional()
    @IsString()
    @Length(1, 1000)
    notes?: string;
}