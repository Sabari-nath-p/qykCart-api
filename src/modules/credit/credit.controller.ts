import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { CreditService } from './credit.service';
import {
    CreateCreditAccountDto,
    UpdateCreditAccountDto,
} from './dto/credit-account.dto';
import {
    AddCreditDto,
    AddPaymentDto,
} from './dto/credit-transaction.dto';
import {
    QueryCreditAccountsDto,
    QueryCreditTransactionsDto,
} from './dto/query-credit.dto';
import {
    CreditAccountResponseDto,
    CreditTransactionResponseDto,
    CreditSummaryDto,
    CreditAccountWithTransactionsDto,
} from './dto/credit-response.dto';
import { plainToClass } from 'class-transformer';

@ApiTags('Credit Management')
@Controller('credit')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is implemented
export class CreditController {
    constructor(private readonly creditService: CreditService) { }

    // Shop Owner APIs

    @Post('shops/:shopId/accounts')
    @ApiOperation({ summary: 'Create a new credit account for a customer' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Credit account created successfully',
        type: CreditAccountResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Credit account already exists for this customer',
    })
    async createCreditAccount(
        @Param('shopId') shopId: string,
        @Body() createCreditAccountDto: CreateCreditAccountDto,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditAccountResponseDto> {
        // TODO: Verify that the requesting user owns the shop
        const creditAccount = await this.creditService.createCreditAccount(
            shopId,
            createCreditAccountDto,
        );
        return plainToClass(CreditAccountResponseDto, creditAccount);
    }

    @Get('shops/:shopId/accounts')
    @ApiOperation({ summary: 'Get all credit accounts for a shop' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Credit accounts retrieved successfully',
        type: [CreditAccountResponseDto],
    })
    async getCreditAccounts(
        @Param('shopId') shopId: string,
        @Query() queryDto: QueryCreditAccountsDto,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<{
        accounts: CreditAccountResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        // TODO: Verify that the requesting user owns the shop
        const { accounts, total } = await this.creditService.getCreditAccounts(
            shopId,
            queryDto,
        );

        return {
            accounts: plainToClass(CreditAccountResponseDto, accounts),
            total,
            page: Math.floor((queryDto.offset || 0) / (queryDto.limit || 20)) + 1,
            limit: queryDto.limit || 20,
        };
    }

    @Get('shops/:shopId/accounts/:accountId')
    @ApiOperation({ summary: 'Get a specific credit account' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiParam({ name: 'accountId', description: 'Credit Account ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Credit account retrieved successfully',
        type: CreditAccountResponseDto,
    })
    async getCreditAccount(
        @Param('shopId') shopId: string,
        @Param('accountId') accountId: string,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditAccountResponseDto> {
        // TODO: Verify that the requesting user owns the shop
        const creditAccount = await this.creditService.getCreditAccount(
            shopId,
            accountId,
        );
        return plainToClass(CreditAccountResponseDto, creditAccount);
    }

    @Get('shops/:shopId/accounts/phone/:phone')
    @ApiOperation({ summary: 'Get credit account by customer phone number' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiParam({ name: 'phone', description: 'Customer phone number' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Credit account retrieved successfully',
        type: CreditAccountResponseDto,
    })
    async getCreditAccountByPhone(
        @Param('shopId') shopId: string,
        @Param('phone') phone: string,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditAccountResponseDto> {
        // TODO: Verify that the requesting user owns the shop
        const creditAccount = await this.creditService.getCreditAccountByPhone(
            shopId,
            phone,
        );
        return plainToClass(CreditAccountResponseDto, creditAccount);
    }

    @Put('shops/:shopId/accounts/:accountId')
    @ApiOperation({ summary: 'Update a credit account' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiParam({ name: 'accountId', description: 'Credit Account ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Credit account updated successfully',
        type: CreditAccountResponseDto,
    })
    async updateCreditAccount(
        @Param('shopId') shopId: string,
        @Param('accountId') accountId: string,
        @Body() updateDto: UpdateCreditAccountDto,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditAccountResponseDto> {
        // TODO: Verify that the requesting user owns the shop
        const creditAccount = await this.creditService.updateCreditAccount(
            shopId,
            accountId,
            updateDto,
        );
        return plainToClass(CreditAccountResponseDto, creditAccount);
    }

    @Post('shops/:shopId/accounts/:accountId/credit')
    @ApiOperation({ summary: 'Add credit amount to customer account' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiParam({ name: 'accountId', description: 'Credit Account ID' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Credit added successfully',
        type: CreditTransactionResponseDto,
    })
    async addCredit(
        @Param('shopId') shopId: string,
        @Param('accountId') accountId: string,
        @Body() addCreditDto: AddCreditDto,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditTransactionResponseDto> {
        // TODO: Verify that the requesting user owns the shop
        const transaction = await this.creditService.addCredit(
            shopId,
            accountId,
            addCreditDto,
        );
        return plainToClass(CreditTransactionResponseDto, transaction);
    }

    @Post('shops/:shopId/accounts/:accountId/payment')
    @ApiOperation({ summary: 'Record a payment from customer' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiParam({ name: 'accountId', description: 'Credit Account ID' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Payment recorded successfully',
        type: CreditTransactionResponseDto,
    })
    async addPayment(
        @Param('shopId') shopId: string,
        @Param('accountId') accountId: string,
        @Body() addPaymentDto: AddPaymentDto,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditTransactionResponseDto> {
        // TODO: Verify that the requesting user owns the shop
        const transaction = await this.creditService.addPayment(
            shopId,
            accountId,
            addPaymentDto,
        );
        return plainToClass(CreditTransactionResponseDto, transaction);
    }

    @Get('shops/:shopId/transactions')
    @ApiOperation({ summary: 'Get all credit transactions for a shop' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Transactions retrieved successfully',
        type: [CreditTransactionResponseDto],
    })
    async getShopTransactions(
        @Param('shopId') shopId: string,
        @Query() queryDto: QueryCreditTransactionsDto,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<{
        transactions: CreditTransactionResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        // TODO: Verify that the requesting user owns the shop
        const { transactions, total } = await this.creditService.getTransactions(
            shopId,
            queryDto,
        );

        return {
            transactions: plainToClass(CreditTransactionResponseDto, transactions),
            total,
            page: Math.floor((queryDto.offset || 0) / (queryDto.limit || 50)) + 1,
            limit: queryDto.limit || 50,
        };
    }

    @Get('shops/:shopId/accounts/:accountId/transactions')
    @ApiOperation({ summary: 'Get transactions for a specific credit account' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiParam({ name: 'accountId', description: 'Credit Account ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Account transactions retrieved successfully',
        type: [CreditTransactionResponseDto],
    })
    async getAccountTransactions(
        @Param('shopId') shopId: string,
        @Param('accountId') accountId: string,
        @Query() queryDto: QueryCreditTransactionsDto,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<{
        transactions: CreditTransactionResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        // TODO: Verify that the requesting user owns the shop
        const { transactions, total } = await this.creditService.getAccountTransactions(
            shopId,
            accountId,
            queryDto,
        );

        return {
            transactions: plainToClass(CreditTransactionResponseDto, transactions),
            total,
            page: Math.floor((queryDto.offset || 0) / (queryDto.limit || 50)) + 1,
            limit: queryDto.limit || 50,
        };
    }

    @Get('shops/:shopId/summary')
    @ApiOperation({ summary: 'Get credit summary for a shop' })
    @ApiParam({ name: 'shopId', description: 'Shop ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Credit summary retrieved successfully',
        type: CreditSummaryDto,
    })
    async getCreditSummary(
        @Param('shopId') shopId: string,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditSummaryDto> {
        // TODO: Verify that the requesting user owns the shop
        const summary = await this.creditService.getCreditSummary(shopId);
        return plainToClass(CreditSummaryDto, summary);
    }

    // Customer APIs (for mobile app)

    @Get('customers/:phone/accounts')
    @ApiOperation({ summary: 'Get all credit accounts for a customer' })
    @ApiParam({ name: 'phone', description: 'Customer phone number' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Customer credit accounts retrieved successfully',
        type: [CreditAccountResponseDto],
    })
    async getCustomerCreditAccounts(
        @Param('phone') phone: string,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditAccountResponseDto[]> {
        // TODO: Verify that the requesting user is the customer or has access
        const accounts = await this.creditService.getCustomerCreditAccounts(phone);
        return plainToClass(CreditAccountResponseDto, accounts);
    }

    @Get('customers/:phone/transactions')
    @ApiOperation({ summary: 'Get all credit transactions for a customer' })
    @ApiParam({ name: 'phone', description: 'Customer phone number' })
    @ApiQuery({ name: 'shopId', required: false, description: 'Filter by shop ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Customer credit transactions retrieved successfully',
        type: [CreditTransactionResponseDto],
    })
    async getCustomerTransactions(
        @Param('phone') phone: string,
        @Query('shopId') shopId?: string,
        // @Request() req: any, // Uncomment when auth is implemented
    ): Promise<CreditTransactionResponseDto[]> {
        // TODO: Verify that the requesting user is the customer or has access
        const transactions = await this.creditService.getCustomerTransactions(
            phone,
            shopId,
        );
        return plainToClass(CreditTransactionResponseDto, transactions);
    }
}