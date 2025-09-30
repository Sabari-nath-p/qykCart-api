import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { ShopsModule } from './modules/shops/shops.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CreditModule } from './modules/credit/credit.module';
import { AuthModule } from './modules/auth/auth.module';
import { FcmModule } from './modules/fcm/fcm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    FcmModule,
    UsersModule,
    HealthModule,
    ShopsModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    CreditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
