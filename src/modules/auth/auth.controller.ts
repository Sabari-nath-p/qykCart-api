import {
    Controller,
    Post,
    Put,
    Get,
    Body,
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
    ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('send-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send OTP to phone number' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'OTP sent successfully',
        type: OtpResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid phone number format',
    })
    async sendOtp(@Body() sendOtpDto: SendOtpDto): Promise<OtpResponseDto> {
        return this.authService.sendOtp(sendOtpDto);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP and login/register user' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'OTP verified successfully, user logged in',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid or expired OTP',
    })
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<AuthResponseDto> {
        return this.authService.verifyOtp(verifyOtpDto);
    }

    @Put('profile')
    // @UseGuards(JwtAuthGuard) // Uncomment when implementing JWT guard
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user profile (for new users)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Profile updated successfully',
        type: AuthUserDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email already exists',
    })
    async updateProfile(
        @Body() updateProfileDto: UpdateProfileDto,
        @Request() req: any, // TODO: Replace with proper request type when auth guard is implemented
    ): Promise<AuthUserDto> {
        // TODO: Get userId from JWT token when auth guard is implemented
        const userId = req.user?.id || req.body.userId; // Temporary workaround
        return this.authService.updateProfile(userId, updateProfileDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh JWT tokens' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                refreshToken: { type: 'string' },
            },
            required: ['refreshToken'],
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tokens refreshed successfully',
        schema: {
            type: 'object',
            properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid refresh token',
    })
    async refreshTokens(
        @Body('refreshToken') refreshToken: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        return this.authService.refreshTokens(refreshToken);
    }

    @Put('fcm-token')
    // @UseGuards(JwtAuthGuard) // Uncomment when implementing JWT guard
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update FCM token for push notifications' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'FCM token updated successfully',
        type: FcmTokenResponseDto,
    })
    async updateFcmToken(
        @Body() updateFcmTokenDto: UpdateFcmTokenDto,
        @Request() req: any, // TODO: Replace with proper request type when auth guard is implemented
    ): Promise<FcmTokenResponseDto> {
        // TODO: Get userId from JWT token when auth guard is implemented
        const userId = req.user?.id || req.body.userId; // Temporary workaround
        return this.authService.updateFcmToken(userId, updateFcmTokenDto);
    }

    @Get('profile')
    // @UseGuards(JwtAuthGuard) // Uncomment when implementing JWT guard
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user profile' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile retrieved successfully',
        type: AuthUserDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    async getProfile(
        @Request() req: any, // TODO: Replace with proper request type when auth guard is implemented
    ): Promise<AuthUserDto> {
        // TODO: Get userId from JWT token when auth guard is implemented
        const userId = req.user?.id || req.query.userId; // Temporary workaround
        return this.authService.getProfile(userId);
    }

    @Post('logout')
    // @UseGuards(JwtAuthGuard) // Uncomment when implementing JWT guard
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user (deactivate FCM tokens)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                deviceId: { type: 'string', description: 'Optional device ID to logout specific device' },
            },
        },
        required: false,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Logged out successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
            },
        },
    })
    async logout(
        @Body('deviceId') deviceId: string,
        @Request() req: any, // TODO: Replace with proper request type when auth guard is implemented
    ): Promise<{ message: string }> {
        // TODO: Get userId from JWT token when auth guard is implemented
        const userId = req.user?.id || req.body.userId; // Temporary workaround
        return this.authService.logout(userId, deviceId);
    }

    @Get('fcm-tokens')
    // @UseGuards(JwtAuthGuard) // Uncomment when implementing JWT guard
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user FCM tokens' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'FCM tokens retrieved successfully',
        type: [FcmTokenResponseDto],
    })
    async getUserFcmTokens(
        @Request() req: any, // TODO: Replace with proper request type when auth guard is implemented
    ): Promise<FcmTokenResponseDto[]> {
        // TODO: Get userId from JWT token when auth guard is implemented
        const userId = req.user?.id || req.query.userId; // Temporary workaround
        return this.authService.getUserFcmTokens(userId);
    }
}