import {
    IsString,
    IsOptional,
    IsEnum,
    IsNumber,
    IsPositive,
    IsUUID,
    Min,
    Max,
    Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, TransactionSource } from '../entities/credit-transaction.entity';

export class AddCreditDto {
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    @IsPositive()
    @Max(99999.99)
    amount: number;

    @IsOptional()
    @IsString()
    @Length(1, 500)
    remarks?: string;

    @IsOptional()
    @IsUUID()
    orderId?: string; // Optional order reference
}

export class AddPaymentDto {
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    @IsPositive()
    @Max(99999.99)
    amount: number;

    @IsOptional()
    @IsString()
    @Length(1, 500)
    remarks?: string;
}

export class CreateTransactionDto {
    @IsEnum(TransactionType)
    transactionType: TransactionType;

    @IsEnum(TransactionSource)
    transactionSource: TransactionSource;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    @IsPositive()
    @Max(99999.99)
    amount: number;

    @IsOptional()
    @IsString()
    @Length(1, 500)
    remarks?: string;

    @IsOptional()
    @IsUUID()
    orderId?: string;
}