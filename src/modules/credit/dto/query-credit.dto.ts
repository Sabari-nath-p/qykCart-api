import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CreditAccountStatus } from '../entities/credit-account.entity';
import { TransactionType, TransactionSource } from '../entities/credit-transaction.entity';

export class QueryCreditAccountsDto {
    @IsOptional()
    @IsString()
    customerPhone?: string;

    @IsOptional()
    @IsString()
    customerNickname?: string;

    @IsOptional()
    @IsEnum(CreditAccountStatus)
    status?: CreditAccountStatus;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    offset?: number = 0;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class QueryCreditTransactionsDto {
    @IsOptional()
    @IsEnum(TransactionType)
    transactionType?: TransactionType;

    @IsOptional()
    @IsEnum(TransactionSource)
    transactionSource?: TransactionSource;

    @IsOptional()
    @IsString()
    customerPhone?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 50;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    offset?: number = 0;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}