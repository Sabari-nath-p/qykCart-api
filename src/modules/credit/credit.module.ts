import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { CreditAccount } from './entities/credit-account.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { Order } from '../orders/entities/order.entity';
import { Shop } from '../shops/entities/shop.entity';
import { User } from '../users/entities/user.entity';
import { FcmModule } from '../fcm/fcm.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CreditAccount,
            CreditTransaction,
            Order,
            Shop,
            User,
        ]),
        FcmModule,
    ],
    controllers: [CreditController],
    providers: [CreditService],
    exports: [CreditService],
})
export class CreditModule { }