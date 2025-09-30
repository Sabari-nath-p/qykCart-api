import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    @ApiOperation({ summary: 'Check application health' })
    @ApiResponse({
        status: 200,
        description: 'Application is healthy',
    })
    getHealth() {
        return this.healthService.getHealth();
    }
}
