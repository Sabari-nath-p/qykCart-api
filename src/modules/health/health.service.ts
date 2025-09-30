import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            message: 'QYKCart API is running successfully',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };
    }
}
