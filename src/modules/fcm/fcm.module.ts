import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FcmService } from './fcm.service';
import { FcmToken } from '../auth/entities/fcm-token.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([FcmToken]),
    ],
    providers: [FcmService],
    exports: [FcmService],
})
export class FcmModule { }