import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Otp } from './entities/otp.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { User } from '../users/entities/user.entity';
import { FcmModule } from '../fcm/fcm.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Otp, FcmToken, User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET', 'default-secret'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
                },
            }),
            inject: [ConfigService],
        }),
        FcmModule,
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }