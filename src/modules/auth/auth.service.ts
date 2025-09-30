import {
    Injectable,
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { Otp, OtpType, OtpStatus } from './entities/otp.entity';
import { FcmToken, TokenStatus } from './entities/fcm-token.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import {
    SendOtpDto,
    VerifyOtpDto,
    UpdateProfileDto,
    UpdateFcmTokenDto,
} from './dto/auth.dto';
import {
    AuthResponseDto,
    OtpResponseDto,
    AuthUserDto,
    FcmTokenResponseDto,
} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
    private readonly DEFAULT_OTP = '759409'; // Default OTP for testing
    private readonly OTP_EXPIRY_MINUTES = 5;

    constructor(
        @InjectRepository(Otp)
        private otpRepository: Repository<Otp>,
        @InjectRepository(FcmToken)
        private fcmTokenRepository: Repository<FcmToken>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    /**
     * Send OTP to phone number
     */
    async sendOtp(sendOtpDto: SendOtpDto): Promise<OtpResponseDto> {
        const { phone } = sendOtpDto;

        // Invalidate any existing pending OTPs for this phone
        await this.otpRepository.update(
            { phone, status: OtpStatus.PENDING },
            { status: OtpStatus.EXPIRED }
        );

        // Generate OTP (use default OTP for testing)
        const otpCode = this.DEFAULT_OTP;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

        // Create new OTP record
        const otp = this.otpRepository.create({
            phone,
            otp: otpCode,
            type: OtpType.LOGIN,
            status: OtpStatus.PENDING,
            expiresAt,
        });

        await this.otpRepository.save(otp);

        // In production, you would send SMS here
        // For now, we'll just log it
        console.log(`OTP for ${phone}: ${otpCode} (expires at ${expiresAt})`);

        return plainToClass(OtpResponseDto, {
            success: true,
            message: 'OTP sent successfully',
            expiresAt,
        });
    }

    /**
     * Verify OTP and login/register user
     */
    async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<AuthResponseDto> {
        const { phone, otp, fcmToken, deviceId, deviceType, deviceName, appVersion } = verifyOtpDto;

        // Find valid OTP
        const otpRecord = await this.otpRepository.findOne({
            where: {
                phone,
                otp,
                status: OtpStatus.PENDING,
                expiresAt: MoreThan(new Date()),
            },
        });

        if (!otpRecord) {
            // If OTP not found, check if there's an OTP record and increment attempts
            const existingOtp = await this.otpRepository.findOne({
                where: { phone, status: OtpStatus.PENDING },
                order: { createdAt: 'DESC' },
            });

            if (existingOtp) {
                existingOtp.incrementAttempts();
                await this.otpRepository.save(existingOtp);
            }

            throw new UnauthorizedException('Invalid or expired OTP');
        }

        // Mark OTP as verified
        otpRecord.markAsVerified();
        await this.otpRepository.save(otpRecord);

        // Find or create user
        let user = await this.userRepository.findOne({ where: { phone } });
        let isNewUser = false;

        if (!user) {
            // Create new user
            const newUser = new User();
            newUser.phone = phone;
            newUser.name = `User ${phone}`; // Temporary name, will be updated in profile
            newUser.role = UserRole.USER;
            newUser.status = UserStatus.ACTIVE;

            user = await this.userRepository.save(newUser);
            isNewUser = true;
        }

        // Handle FCM token if provided
        if (fcmToken) {
            await this.saveFcmToken(user.id, {
                fcmToken,
                deviceId,
                deviceType,
                deviceName,
                appVersion,
            });
        }

        // Generate JWT tokens
        const tokens = await this.generateTokens(user);

        return plainToClass(AuthResponseDto, {
            ...tokens,
            isNewUser,
            user: plainToClass(AuthUserDto, user),
        });
    }

    /**
     * Update user profile (for new users)
     */
    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<AuthUserDto> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if email already exists (if provided)
        if (updateProfileDto.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: updateProfileDto.email },
            });

            if (existingUser && existingUser.id !== userId) {
                throw new ConflictException('Email already exists');
            }
        }

        // Update user fields
        Object.assign(user, updateProfileDto);
        const updatedUser = await this.userRepository.save(user);

        return plainToClass(AuthUserDto, updatedUser);
    }

    /**
     * Refresh JWT tokens
     */
    async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
            const user = await this.userRepository.findOne({ where: { id: payload.sub } });

            if (!user || user.status !== UserStatus.ACTIVE) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            return this.generateTokens(user);
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Update FCM token
     */
    async updateFcmToken(userId: string, updateFcmTokenDto: UpdateFcmTokenDto): Promise<FcmTokenResponseDto> {
        return this.saveFcmToken(userId, updateFcmTokenDto);
    }

    /**
     * Get user profile
     */
    async getProfile(userId: string): Promise<AuthUserDto> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return plainToClass(AuthUserDto, user);
    }

    /**
     * Logout user (deactivate FCM tokens)
     */
    async logout(userId: string, deviceId?: string): Promise<{ message: string }> {
        if (deviceId) {
            // Deactivate specific device token
            await this.fcmTokenRepository.update(
                { userId, deviceId, status: TokenStatus.ACTIVE },
                { status: TokenStatus.INACTIVE }
            );
        } else {
            // Deactivate all user tokens
            await this.fcmTokenRepository.update(
                { userId, status: TokenStatus.ACTIVE },
                { status: TokenStatus.INACTIVE }
            );
        }

        return { message: 'Logged out successfully' };
    }

    /**
     * Get user FCM tokens
     */
    async getUserFcmTokens(userId: string): Promise<FcmTokenResponseDto[]> {
        const tokens = await this.fcmTokenRepository.find({
            where: { userId, status: TokenStatus.ACTIVE },
            order: { createdAt: 'DESC' },
        });

        return tokens.map(token => plainToClass(FcmTokenResponseDto, token));
    }

    // Private helper methods

    private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = {
            sub: user.id,
            phone: user.phone,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET || 'default-secret',
            expiresIn: '1d', // 1 day
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
            expiresIn: '7d', // 7 days
        });

        return { accessToken, refreshToken };
    }

    private async saveFcmToken(userId: string, tokenData: UpdateFcmTokenDto): Promise<FcmTokenResponseDto> {
        // Check if token already exists
        const existingToken = await this.fcmTokenRepository.findOne({
            where: { token: tokenData.fcmToken },
        });

        if (existingToken) {
            // Update existing token
            Object.assign(existingToken, {
                userId,
                deviceId: tokenData.deviceId,
                deviceType: tokenData.deviceType,
                deviceName: tokenData.deviceName,
                appVersion: tokenData.appVersion,
                status: TokenStatus.ACTIVE,
                lastUsedAt: new Date(),
            });

            const updatedToken = await this.fcmTokenRepository.save(existingToken);
            return plainToClass(FcmTokenResponseDto, updatedToken);
        } else {
            // Create new token
            const newToken = this.fcmTokenRepository.create({
                userId,
                token: tokenData.fcmToken,
                deviceId: tokenData.deviceId,
                deviceType: tokenData.deviceType,
                deviceName: tokenData.deviceName,
                appVersion: tokenData.appVersion,
                status: TokenStatus.ACTIVE,
                lastUsedAt: new Date(),
            });

            const savedToken = await this.fcmTokenRepository.save(newToken);
            return plainToClass(FcmTokenResponseDto, savedToken);
        }
    }
}