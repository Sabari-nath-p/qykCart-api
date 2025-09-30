import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { Shop } from '../shops/entities/shop.entity';
import { User } from '../users/entities/user.entity';
import { CreditModule } from '../credit/credit.module';
import { FcmModule } from '../fcm/fcm.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            Cart,
            CartItem,
            Product,
            Shop,
            User,
        ]),
        CreditModule, // Import CreditModule to use CreditService
        FcmModule, // Import FcmModule to use FcmService
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }